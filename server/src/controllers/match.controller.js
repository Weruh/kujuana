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

const isValidAudioDataUrl = (value) => typeof value === 'string' && value.startsWith('data:audio');
const isValidImageDataUrl = (value) => typeof value === 'string' && value.startsWith('data:image');

const estimateBase64Size = (dataUrl) => {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return 0;
  const [, base64Part = ''] = dataUrl.split(',');
  if (!base64Part) return 0;
  const cleaned = base64Part.replace(/\s/g, '');
  if (!cleaned) return 0;
  return Math.ceil((cleaned.length * 3) / 4);
};

const isValidDocumentDataUrl = (value) =>
  typeof value === 'string' && (value.startsWith('data:application/') || value.startsWith('data:text/'));

const normalizeExtension = (name = '') => {
  const match = /\.([a-z0-9]+)$/i.exec(name.trim().toLowerCase());
  return match ? match[1] : '';
};

const isDocumentMimeType = (mimeType = '') => DOCUMENT_MIME_TYPES.includes(mimeType.trim().toLowerCase());

const inferDocumentMimeTypeFromName = (name = '') => DOCUMENT_EXTENSION_MIME_MAP[normalizeExtension(name)] || '';

const resolveDocumentMimeType = (attachment = {}) => {
  const mimeType = typeof attachment.mimeType === 'string' ? attachment.mimeType : '';
  if (isDocumentMimeType(mimeType)) {
    return mimeType;
  }
  if (typeof attachment.name === 'string') {
    const inferred = inferDocumentMimeTypeFromName(attachment.name);
    if (inferred) {
      return inferred;
    }
  }
  return '';
};

const MAX_ATTACHMENTS = 6;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const MAX_VOICE_NOTE_BYTES = 5 * 1024 * 1024;

const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/rtf',
  'text/rtf',
];

const DOCUMENT_EXTENSION_MIME_MAP = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  rtf: 'application/rtf',
};

export const sendMessage = async (req, res, next) => {
  try {
    const { text, voiceNote, attachments } = req.body;

    const sanitizedText = typeof text === 'string' ? text.trim() : '';
    const hasVoiceNote =
      voiceNote &&
      typeof voiceNote === 'object' &&
      isValidAudioDataUrl(voiceNote.dataUrl || voiceNote.dataUri || voiceNote.data);

    let sanitizedAttachments = [];
    if (Array.isArray(attachments) && attachments.length) {
      if (attachments.length > MAX_ATTACHMENTS) {
        return res.status(400).json({
          status: 'error',
          message: `You can attach up to ${MAX_ATTACHMENTS} attachments per message.`,
        });
      }

      for (let index = 0; index < attachments.length; index += 1) {
        const attachment = attachments[index];
        if (!attachment || typeof attachment !== 'object') {
          continue;
        }

        const declaredKind = typeof attachment.kind === 'string' ? attachment.kind.toLowerCase() : '';
        const lat = Number(attachment.lat ?? attachment.latitude);
        const lng = Number(attachment.lng ?? attachment.longitude);
        const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);
        const inferredKind = declaredKind || (hasCoordinates ? 'location' : '');

        if (inferredKind === 'location') {
          if (!hasCoordinates) {
            return res.status(400).json({
              status: 'error',
              message: 'Shared locations must include valid latitude and longitude.',
            });
          }
          const sanitized = {
            id: attachment.id || `location-${Date.now()}-${index}`,
            kind: 'location',
            lat,
            lng,
          };
          if (typeof attachment.label === 'string' && attachment.label.trim()) {
            sanitized.label = attachment.label.trim();
          }
          if (typeof attachment.mapUrl === 'string' && attachment.mapUrl.startsWith('http')) {
            sanitized.mapUrl = attachment.mapUrl;
          }
          const accuracyValue = Number(attachment.accuracy);
          if (Number.isFinite(accuracyValue) && accuracyValue > 0) {
            sanitized.accuracy = Math.round(accuracyValue);
          }
          sanitizedAttachments.push(sanitized);
          continue;
        }

        const payload = attachment.dataUrl || attachment.dataUri || attachment.data;
        if (typeof payload !== 'string' || !payload) {
          continue;
        }

        const resolvedDocumentMime = resolveDocumentMimeType(attachment);
        const isDocumentAttachment =
          declaredKind === 'document' ||
          Boolean(resolvedDocumentMime) ||
          (typeof attachment.mimeType === 'string' && isDocumentMimeType(attachment.mimeType));

        if (isDocumentAttachment) {
          if (!isValidDocumentDataUrl(payload)) {
            return res.status(400).json({
              status: 'error',
              message: 'Only PDF, Word, Excel, PowerPoint, TXT, or RTF documents are supported.',
            });
          }
          const approxBytes = estimateBase64Size(payload);
          if (approxBytes > MAX_ATTACHMENT_BYTES) {
            return res.status(400).json({
              status: 'error',
              message: 'Attachments must be smaller than 5MB.',
            });
          }
          const sanitized = {
            id: attachment.id || `document-${Date.now()}-${index}`,
            kind: 'document',
            dataUrl: payload,
            mimeType: resolvedDocumentMime || 'application/octet-stream',
          };
          if (typeof attachment.name === 'string' && attachment.name.trim()) {
            sanitized.name = attachment.name.trim();
          }
          const parsedSize = Number(attachment.size);
          if (Number.isFinite(parsedSize) && parsedSize > 0) {
            sanitized.size = Math.round(parsedSize);
          } else if (approxBytes > 0) {
            sanitized.size = approxBytes;
          }
          sanitizedAttachments.push(sanitized);
          continue;
        }

        if (!isValidImageDataUrl(payload)) {
          return res.status(400).json({
            status: 'error',
            message: 'Unsupported attachment type. Try sending images, documents, or locations.',
          });
        }

        const approxBytes = estimateBase64Size(payload);
        if (approxBytes > MAX_ATTACHMENT_BYTES) {
          return res.status(400).json({
            status: 'error',
            message: 'Attachments must be smaller than 5MB.',
          });
        }

        const sanitized = {
          id: attachment.id || `attachment-${Date.now()}-${index}`,
          kind: 'image',
          dataUrl: payload,
          mimeType: typeof attachment.mimeType === 'string' ? attachment.mimeType : 'image/*',
        };

        if (typeof attachment.name === 'string' && attachment.name.trim()) {
          sanitized.name = attachment.name.trim();
        }

        const parsedSize = Number(attachment.size);
        if (Number.isFinite(parsedSize) && parsedSize > 0) {
          sanitized.size = Math.round(parsedSize);
        } else if (approxBytes > 0) {
          sanitized.size = approxBytes;
        }

        const parsedWidth = Number(attachment.width);
        if (Number.isFinite(parsedWidth) && parsedWidth > 0) {
          sanitized.width = Math.round(parsedWidth);
        }

        const parsedHeight = Number(attachment.height);
        if (Number.isFinite(parsedHeight) && parsedHeight > 0) {
          sanitized.height = Math.round(parsedHeight);
        }

        sanitizedAttachments.push(sanitized);
      }
    }

    const hasAttachments = sanitizedAttachments.length > 0;

    if (!sanitizedText && !hasVoiceNote && !hasAttachments) {
      return res.status(400).json({
        status: 'error',
        message: 'Add a message, a voice note, or at least one attachment before sending.',
      });
    }

    if (hasVoiceNote) {
      const payload = voiceNote.dataUrl || voiceNote.dataUri || voiceNote.data;
      const approxBytes = estimateBase64Size(payload);
      if (approxBytes > MAX_VOICE_NOTE_BYTES) {
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
      createdAt: new Date().toISOString(),
    };

    if (sanitizedText) {
      message.text = sanitizedText;
    }

    if (hasAttachments) {
      message.attachments = sanitizedAttachments;
    }

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






