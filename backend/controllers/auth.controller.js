import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import httpError from '../utils/httpError.js';

const signToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw httpError(500, 'JWT_SECRET is not configured');
  }

  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
      username: user.username,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
  );
};

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw httpError(400, 'username and password are required');
    }

    const user = await User.findOne({ username: String(username).toLowerCase().trim() }).select('+passwordHash');

    if (!user) {
      throw httpError(401, 'Invalid credentials');
    }

    if (user.status !== 'Active') {
      throw httpError(403, 'User is inactive');
    }

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) {
      throw httpError(401, 'Invalid credentials');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user);

    res.status(200).json({
      token,
      user: {
        id: String(user._id),
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    res.status(200).json({
      user: req.user,
    });
  } catch (err) {
    next(err);
  }
};
