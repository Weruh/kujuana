import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { getDb, persistDb } from '../utils/database.js';

const signToken = (userId) => {
  const payload = { sub: userId };
  const secret = process.env.JWT_SECRET || 'kujuana-demo-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn });
};

export const register = async (req, res, next) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      age,
      gender,
      location,
      occupation,
      interests = [],
      bio = '',
      goals = [],
      preferences = {},
    } = req.body;

    if (!email || !password || !firstName || !age || !gender) {
      return res.status(400).json({
        status: 'error',
        message: 'Email, password, first name, age, and gender are required',
      });
    }

    const db = await getDb();
    const existing = db.data.users.find((u) => u.email === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ status: 'error', message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    const user = {
      id: nanoid(),
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName: lastName || '',
      age,
      gender,
      location: location || {},
      occupation: occupation || '',
      interests,
      bio,
      goals,
      preferences: {
        ageRange: preferences.ageRange || [22, 55],
        locationRadiusKm: preferences.locationRadiusKm || 300,
        gender: preferences.gender || (gender === 'male' ? 'female' : 'male'),
      },
      badges: [],
      plan: 'free',
      boosts: 0,
      photoUrls: [],
      createdAt: now,
      updatedAt: now,
    };

    db.data.users.push(user);
    await persistDb();

    const token = signToken(user.id);
    return res.status(201).json({
      status: 'success',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          age: user.age,
          gender: user.gender,
          plan: user.plan,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required' });
    }

    const db = await getDb();
    const user = db.data.users.find((u) => u.email === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    const token = signToken(user.id);
    return res.status(200).json({
      status: 'success',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          age: user.age,
          gender: user.gender,
          plan: user.plan,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};
