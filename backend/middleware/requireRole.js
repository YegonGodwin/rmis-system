import httpError from '../utils/httpError.js';

const requireRole = (roles = []) => {
  const allowed = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      next(httpError(401, 'Unauthorized'));
      return;
    }

    if (allowed.length > 0 && !allowed.includes(req.user.role)) {
      next(httpError(403, 'Forbidden'));
      return;
    }

    next();
  };
};

export default requireRole;
