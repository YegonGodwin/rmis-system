import { z } from 'zod';
import QcLog from '../models/qcLog.js';
import ImagingRoom from '../models/imagingRoom.js';
import httpError from '../utils/httpError.js';
import audit from '../utils/audit.js';

const createQcLogSchema = z.object({
  qcLogId: z.string().optional(),
  roomId: z.string().min(1),
  testType: z.string().min(1),
  result: z.enum(['Pass', 'Fail', 'Warning']),
  notes: z.string().optional(),
  performedAt: z.coerce.date().optional(),
});

const updateQcLogSchema = z
  .object({
    testType: z.string().min(1).optional(),
    result: z.enum(['Pass', 'Fail', 'Warning']).optional(),
    notes: z.string().optional(),
    performedAt: z.coerce.date().optional(),
  })
  .strict();

const generateQcLogId = async () => {
  const count = await QcLog.estimatedDocumentCount();
  return `QC-${String(count + 1000)}`;
};

const populateQcLog = (query) =>
  query
    .populate('room', 'name modality status')
    .populate('performedBy', 'username fullName role');

export const listQcLogs = async (req, res, next) => {
  try {
    const { roomId, result, from, to, limit = '50', page = '1' } = req.query;

    const filter = {};
    if (roomId) filter.room = roomId;
    if (result) filter.result = result;

    if (from || to) {
      filter.performedAt = {};
      if (from) filter.performedAt.$gte = new Date(String(from));
      if (to) filter.performedAt.$lte = new Date(String(to));
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [logs, total] = await Promise.all([
      populateQcLog(
        QcLog.find(filter)
          .sort({ performedAt: -1 })
          .skip(skip)
          .limit(safeLimit),
      ),
      QcLog.countDocuments(filter),
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

export const getQcLogById = async (req, res, next) => {
  try {
    const log = await populateQcLog(QcLog.findById(req.params.id));
    if (!log) {
      throw httpError(404, 'QC log not found');
    }

    res.status(200).json({ log });
  } catch (err) {
    next(err);
  }
};

export const createQcLog = async (req, res, next) => {
  try {
    if (!req.user) {
      throw httpError(401, 'Unauthorized');
    }

    const parsed = createQcLogSchema.safeParse(req.body);
    if (!parsed.success) {
      throw httpError(400, parsed.error.issues[0]?.message || 'Invalid request body');
    }

    const data = parsed.data;

    const room = await ImagingRoom.findById(data.roomId);
    if (!room) {
      throw httpError(404, 'Room not found');
    }

    const qcLogId = (data.qcLogId || (await generateQcLogId())).toUpperCase().trim();

    const created = await QcLog.create({
      qcLogId,
      room: room._id,
      performedBy: req.user.id,
      testType: data.testType,
      result: data.result,
      notes: data.notes,
      performedAt: data.performedAt || new Date(),
    });

    const populated = await populateQcLog(QcLog.findById(created._id));

    await audit({
      actorId: req.user.id,
      action: 'Created QC log',
      targetType: 'QcLog',
      targetId: String(created._id),
      ipAddress: req.ip,
      metadata: {
        qcLogId: created.qcLogId,
        roomId: String(created.room),
        result: created.result,
        performedAt: created.performedAt,
      },
    });

    res.status(201).json({ log: populated });
  } catch (err) {
    if (err?.code === 11000) {
      next(httpError(409, 'Duplicate qcLogId'));
      return;
    }
    next(err);
  }
};

export const updateQcLog = async (req, res, next) => {
  try {
    const parsed = updateQcLogSchema.safeParse(req.body);
    if (!parsed.success) {
      throw httpError(400, parsed.error.issues[0]?.message || 'Invalid request body');
    }

    const log = await QcLog.findById(req.params.id);
    if (!log) {
      throw httpError(404, 'QC log not found');
    }

    Object.assign(log, parsed.data);
    await log.save();

    const populated = await populateQcLog(QcLog.findById(log._id));

    res.status(200).json({ log: populated });
  } catch (err) {
    next(err);
  }
};

export const deleteQcLog = async (req, res, next) => {
  try {
    const log = await QcLog.findByIdAndDelete(req.params.id);
    if (!log) {
      throw httpError(404, 'QC log not found');
    }

    res.status(200).json({ log });
  } catch (err) {
    next(err);
  }
};
