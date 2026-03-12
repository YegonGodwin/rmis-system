import AuditLog from '../models/auditLog.js';

const audit = async ({ actorId, action, targetType, targetId, ipAddress, metadata }) => {
  try {
    if (!action) return;

    const auditLogId = `LOG-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();

    await AuditLog.create({
      auditLogId,
      actor: actorId,
      action,
      targetType,
      targetId,
      ipAddress,
      metadata,
    });
  } catch {
    return;
  }
};

export default audit;
