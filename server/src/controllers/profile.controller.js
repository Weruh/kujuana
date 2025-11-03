import { getDb, persistDb } from '../utils/database.js';

const sanitizeUser = (user) => {
  const {
    passwordHash,
    ...safe
  } = user;
  return safe;
};

export const getCurrentProfile = async (req, res, next) => {
  try {
    const db = await getDb();
    const user = db.data.users.find((u) => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    return res.json({ status: 'success', data: sanitizeUser(user) });
  } catch (error) {
    return next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const updates = req.body;
    const db = await getDb();
    const user = db.data.users.find((u) => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const allowedFields = [
      'firstName',
      'lastName',
      'age',
      'gender',
      'location',
      'occupation',
      'interests',
      'bio',
      'goals',
      'preferences',
      'photoUrls',
    ];

    allowedFields.forEach((field) => {
      if (typeof updates[field] !== 'undefined') {
        user[field] = updates[field];
      }
    });

    user.updatedAt = new Date().toISOString();
    await persistDb();

    return res.json({ status: 'success', data: sanitizeUser(user) });
  } catch (error) {
    return next(error);
  }
};

export const getOnboardingChecklist = async (req, res, next) => {
  try {
    const db = await getDb();
    const user = db.data.users.find((u) => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const checklist = [
      { key: 'bio', label: 'Share a short bio', completed: Boolean(user.bio) },
      { key: 'photoUrls', label: 'Add at least one photo', completed: user.photoUrls?.length > 0 },
      { key: 'interests', label: 'Select three or more interests', completed: user.interests?.length >= 3 },
      { key: 'goals', label: 'Share your relationship goals', completed: user.goals?.length > 0 },
      { key: 'preferences', label: 'Set your match preferences', completed: Boolean(user.preferences) },
    ];

    return res.json({
      status: 'success',
      data: {
        checklist,
        completionRate: Math.round((checklist.filter((item) => item.completed).length / checklist.length) * 100),
      },
    });
  } catch (error) {
    return next(error);
  }
};
