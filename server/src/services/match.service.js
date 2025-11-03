import { differenceInYears, parseISO } from '../utils/date.js';

const passesAgePreference = (candidate, preferences) => {
  const [minAge, maxAge] = preferences.ageRange || [25, 60];
  return candidate.age >= minAge && candidate.age <= maxAge;
};

const passesGenderPreference = (candidate, preferences) => {
  if (!preferences.gender || preferences.gender === 'any') {
    return true;
  }
  return candidate.gender === preferences.gender;
};

const buildMatchScore = (user, candidate) => {
  let score = 0;

  const sharedInterests = user.interests?.filter((interest) => candidate.interests?.includes(interest)) || [];
  score += sharedInterests.length * 10;

  if (user.location?.country && user.location.country === candidate.location?.country) {
    score += 15;
  }

  if (user.goals?.some((goal) => candidate.goals?.includes(goal))) {
    score += 20;
  }

  const ageDiff = Math.abs(candidate.age - user.age);
  score += Math.max(0, 10 - ageDiff);

  const recencyWeight = candidate.updatedAt
    ? Math.max(0, 12 - differenceInYears(new Date(), parseISO(candidate.updatedAt)) * 2)
    : 0;
  score += recencyWeight;

  return score;
};

export const findSuggestions = ({ db, userId, limit = 16 }) => {
  const me = db.data.users.find((u) => u.id === userId);
  if (!me) return [];

  const swipedIds = db.data.swipes
    .filter((swipe) => swipe.swiperId === userId)
    .map((swipe) => swipe.targetId);

  const suggestions = db.data.users
    .filter((candidate) => candidate.id !== userId)
    .filter((candidate) => !swipedIds.includes(candidate.id))
    .filter((candidate) => passesGenderPreference(candidate, me.preferences || {}))
    .filter((candidate) => passesAgePreference(candidate, me.preferences || {}))
    .map((candidate) => ({
      candidate,
      score: buildMatchScore(me, candidate),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ candidate, score }) => ({
      ...candidate,
      score,
    }));

  return suggestions;
};

export const registerSwipe = ({ db, swiperId, targetId, decision }) => {
  db.data.swipes.push({
    id: `${swiperId}-${targetId}-${Date.now()}`,
    swiperId,
    targetId,
    decision,
    createdAt: new Date().toISOString(),
  });
};

const findConversation = ({ db, swiperId, targetId }) =>
  db.data.matches.find(
    (match) => match.members.includes(swiperId) && match.members.includes(targetId),
  );

const ensureConversation = ({ db, swiperId, targetId }) => {
  let match = findConversation({ db, swiperId, targetId });
  if (match) {
    match.status ||= 'matched';
    match.createdAt ||= new Date().toISOString();
    match.updatedAt ||= match.createdAt;
    match.initiatedBy ||= swiperId;
    return match;
  }

  const now = new Date().toISOString();
  match = {
    id: `match-${swiperId}-${targetId}`,
    members: [swiperId, targetId],
    status: 'pending',
    initiatedBy: swiperId,
    createdAt: now,
    updatedAt: now,
    conversation: [],
  };
  db.data.matches.push(match);
  return match;
};

export const detectMatch = ({ db, swiperId, targetId }) => {
  const match = ensureConversation({ db, swiperId, targetId });
  const reciprocalLike = db.data.swipes.find(
    (swipe) => swipe.swiperId === targetId && swipe.targetId === swiperId && swipe.decision === 'like',
  );

  const now = new Date().toISOString();
  if (reciprocalLike) {
    match.status = 'matched';
    match.matchedAt ||= now;
  } else if (match.status !== 'matched') {
    match.status = 'pending';
  }

  match.updatedAt = now;
  return match;
};

