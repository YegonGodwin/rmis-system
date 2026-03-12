import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import httpError from '../utils/httpError.js';

export const listUsers = async (req, res, next) => {
  try {
    const { role, status, q } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (q) {
      const term = String(q).trim();
      filter.$or = [
        { username: { $regex: term, $options: 'i' } },
        { fullName: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });

    res.status(200).json({ users });
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { username, fullName, email, role, password, mustChangePassword } = req.body;

    if (!username || !fullName || !email || !role || !password) {
      throw httpError(400, 'username, fullName, email, role, password are required');
    }

    // Validate password strength
    const passwordStr = String(password);
    if (passwordStr.length < 8) {
      throw httpError(400, 'Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(passwordStr)) {
      throw httpError(400, 'Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(passwordStr)) {
      throw httpError(400, 'Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(passwordStr)) {
      throw httpError(400, 'Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordStr)) {
      throw httpError(400, 'Password must contain at least one special character');
    }

    const normalizedUsername = String(username).toLowerCase().trim();
    const normalizedEmail = String(email).toLowerCase().trim();

    const existing = await User.findOne({ $or: [{ username: normalizedUsername }, { email: normalizedEmail }] });
    if (existing) {
      throw httpError(409, 'User with same username or email already exists');
    }

    const passwordHash = await bcrypt.hash(passwordStr, 10);

    const user = await User.create({
      username: normalizedUsername,
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      role,
      passwordHash,
      status: 'Active',
      mustChangePassword: mustChangePassword === true,
    });

    res.status(201).json({
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

export const setUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Active', 'Inactive'].includes(status)) {
      throw httpError(400, 'status must be Active or Inactive');
    }

    const user = await User.findById(id);
    if (!user) {
      throw httpError(404, 'User not found');
    }

    user.status = status;
    await user.save();

    res.status(200).json({
      user: {
        id: String(user._id),
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw httpError(400, 'currentPassword and newPassword are required');
    }

    // Validate new password strength
    const passwordStr = String(newPassword);
    if (passwordStr.length < 8) {
      throw httpError(400, 'Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(passwordStr)) {
      throw httpError(400, 'Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(passwordStr)) {
      throw httpError(400, 'Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(passwordStr)) {
      throw httpError(400, 'Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordStr)) {
      throw httpError(400, 'Password must contain at least one special character');
    }

    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      throw httpError(404, 'User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(String(currentPassword), user.passwordHash);
    if (!isValid) {
      throw httpError(401, 'Current password is incorrect');
    }

    // Update password
    user.passwordHash = await bcrypt.hash(passwordStr, 10);
    user.mustChangePassword = false;
    await user.save();

    res.status(200).json({
      message: 'Password changed successfully',
    });
  } catch (err) {
    next(err);
  }
};
