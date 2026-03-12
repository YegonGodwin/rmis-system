import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import httpError from '../utils/httpError.js';

const getTokenFromHeader = (req) => {
  const header = req.headers.authorization;
  if (!header) return null;
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) return null;
  return token;
};

const requireAuth = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      throw httpError(401, 'Missing Bearer token');
    }

    if (!process.env.JWT_SECRET) {
      throw httpError(500, 'JWT_SECRET is not configured');
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = payload?.sub;
    if (!userId) {
      throw httpError(401, 'Invalid token');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw httpError(401, 'Invalid token');
    }

    if (user.status !== 'Active') {
      throw httpError(403, 'User is inactive');
    }

    req.user = {
      id: String(user._id),
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (err) {
    if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
      next(httpError(401, 'Invalid token'));
      return;
    }
    next(err);
  }
};

export default requireAuth;
