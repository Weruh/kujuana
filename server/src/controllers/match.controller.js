import { getDb, persistDb } from '../utils/database.js';
import { findSuggestions, registerSwipe, detectMatch } from '../services/match.service.js';

const scrubCandidate = (candidate) => {
  const { passwordHash, email, ...safe } = candidate;
  return safe;
};

const decorateMatch = (db, match) => {
  if (!match) return null;

  const status = match.status || 'matched';
  const members = match.members
    .map((memberId) => {
      const profile = db.data.users.find((u) => u.id === memberId);
      return profile ? scrubCandidate(profile) : null;
    })
    .filter(Boolean);

  const awaitingMemberId = status === 'pending'
    ? match.members.find((memberId) => memberId !== match.initiatedBy) || null
    : null;

  return {
    ...match,
    status,
    members,
    awaitingMemberId,
    updatedAt: match.updatedAt || match.createdAt,
  };
};

export const getSuggestions = async (req, res, next) => {
  try {
    const db = await getDb();
    const suggestions = findSuggestions({ db, userId: req.user.id, limit: Number(req.query.limit) || 16 })
      .map((candidate) => scrubCandidate(candidate));
    return res.json({ status: 'success', data: suggestions });
  } catch (error) {
    return next(error);
  }
};

export const swipe = async (req, res, next) => {
  try {
    const { targetId, decision } = req.body;
    if (!targetId || !['like', 'pass'].includes(decision)) {
      return res.status(400).json({ status: 'error', message: 'targetId and decision are required' });
    }

    const db = await getDb();
    const target = db.data.users.find((u) => u.id === targetId);
    if (!target) {
      return res.status(404).json({ status: 'error', message: 'Profile not found' });
    }

    registerSwipe({ db, swiperId: req.user.id, targetId, decision });
    const match = decision === 'like' ? detectMatch({ db, swiperId: req.user.id, targetId }) : null;
    await persistDb();

    const decoratedMatch = decorateMatch(db, match);

    return res.json({
      status: 'success',
      data: {
        decision,
        match: decoratedMatch,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const listMatches = async (req, res, next) => {
  try {
    const db = await getDb();
    const matches = db.data.matches
      .filter((match) => match.members.includes(req.user.id))
      .sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.matchedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.updatedAt || b.matchedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      })
      .map((match) => decorateMatch(db, match));
    return res.json({ status: 'success', data: matches });
  } catch (error) {
    return next(error);
  }
};

export const stats = async (req, res, next) => {
  try {
    const db = await getDb();
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const swipesToday = db.data.swipes.filter(
      (swipe) => swipe.swiperId === req.user.id && new Date(swipe.createdAt).getTime() >= dayAgo,
    );
    const likesToday = swipesToday.filter((swipe) => swipe.decision === 'like');
    const matchesToday = db.data.matches.filter((match) => {
      if (!match.members.includes(req.user.id)) {
        return false;
      }
      const status = match.status || 'matched';
      if (status !== 'matched') {
        return false;
      }
      const matchedOn = match.matchedAt || match.updatedAt || match.createdAt;
      if (!matchedOn) {
        return false;
      }
      return new Date(matchedOn).getTime() >= dayAgo;
    });

    return res.json({
      status: 'success',
      data: {
        swipesToday: swipesToday.length,
        likesToday: likesToday.length,
        matchesToday: matchesToday.length,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const isValidDataUrl = (value) => typeof value === 'string' && value.startsWith('data:audio');

const estimateBase64Size = (dataUrl) => {
  if (!isValidDataUrl(dataUrl)) return 0;
  const [, base64Part = ''] = dataUrl.split(',');
  if (!base64Part) return 0;
  return Math.ceil((base64Part.length * 3) / 4);
};

export const sendMessage = async (req, res, next) => {
  try {
    const { text, voiceNote } = req.body;

    const sanitizedText = typeof text === 'string' ? text.trim() : '';
    const hasVoiceNote =
      voiceNote &&
      typeof voiceNote === 'object' &&
      isValidDataUrl(voiceNote.dataUrl || voiceNote.dataUri || voiceNote.data);

    if (!sanitizedText && !hasVoiceNote) {
      return res.status(400).json({
        status: 'error',
        message: 'Either message text or a voice note is required.',
      });
    }

    if (hasVoiceNote) {
      const payload = voiceNote.dataUrl || voiceNote.dataUri || voiceNote.data;
      const approxBytes = estimateBase64Size(payload);
      const fiveMb = 5 * 1024 * 1024;
      if (approxBytes > fiveMb) {
        return res.status(400).json({
          status: 'error',
          message: 'Voice notes must be smaller than 5MB.',
        });
      }
    }

    const db = await getDb();
    const match = db.data.matches.find((item) => item.id === req.params.matchId);
    if (!match) {
      return res.status(404).json({ status: 'error', message: 'Match not found.' });
    }
    if (!match.members.includes(req.user.id)) {
      return res.status(403).json({ status: 'error', message: 'You are not part of this match.' });
    }

    match.conversation ||= [];
    const message = {
      id: `msg-${Date.now()}`,
      senderId: req.user.id,
      text: sanitizedText,
      createdAt: new Date().toISOString(),
    };

    if (hasVoiceNote) {
      const payload = voiceNote.dataUrl || voiceNote.dataUri || voiceNote.data;
      const durationNumber = Number(voiceNote.duration);
      const voiceNoteEntry = {
        id: voiceNote.id || `voice-${Date.now()}`,
        dataUrl: payload,
        mimeType: typeof voiceNote.mimeType === 'string' ? voiceNote.mimeType : 'audio/webm',
      };
      if (Number.isFinite(durationNumber) && durationNumber > 0) {
        voiceNoteEntry.duration = Math.round(durationNumber);
      }
      if (Array.isArray(voiceNote.waveform) && voiceNote.waveform.length) {
        voiceNoteEntry.waveform = voiceNote.waveform
          .map((point) => Number(point) || 0)
          .slice(0, 120);
      }
      message.voiceNote = voiceNoteEntry;
    }

    match.conversation.push(message);
    match.updatedAt = new Date().toISOString();
    await persistDb();

    const decoratedMatch = decorateMatch(db, match);

    return res.json({
      status: 'success',
      data: {
        match: decoratedMatch,
        message,
      },
    });
  } catch (error) {
    return next(error);
  }
};





