import AuditLog from '../models/auditLog.js';

export const listAuditLogs = async (req, res, next) => {
  try {
    const { actorId, targetType, targetId, limit = '50', page = '1' } = req.query;

    const filter = {};
    if (actorId) filter.actor = actorId;
    if (targetType) filter.targetType = targetType;
    if (targetId) filter.targetId = targetId;

    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actor', 'username fullName role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      logs,
      page: safePage,
      limit: safeLimit,
      total,
    });
  } catch (err) {
    next(err);
  }
};
