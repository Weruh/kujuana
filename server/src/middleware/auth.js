import jwt from 'jsonwebtoken';
import { getDb } from '../utils/database.js';

export const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.replace(/^Bearer\s+/i, '');

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Missing auth token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'kujuana-demo-secret');
    const db = await getDb();
    const user = db.data.users.find((u) => u.id === payload.sub);

    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Invalid session' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
  }
};
