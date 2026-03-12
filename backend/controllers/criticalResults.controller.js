import { z } from 'zod';
import CriticalResult from '../models/criticalResult.js';
import RadiologyReport from '../models/radiologyReport.js';
import Study from '../models/study.js';
import Patient from '../models/patient.js';
import httpError from '../utils/httpError.js';
import audit from '../utils/audit.js';

const createCriticalResultSchema = z.object({
  criticalResultId: z.string().optional(),
  reportId: z.string().optional(),
  studyId: z.string().optional(),
  patientId: z.string().min(1),
  studyType: z.string().min(1),
  finding: z.string().min(1),
  severity: z.enum(['Critical', 'Urgent']),
  notifiedToUserId: z.string().min(1),
  notificationMethod: z.enum(['Phone', 'SMS', 'Email', 'In-Person']),
});

const acknowledgeSchema = z.object({
  acknowledgedAt: z.coerce.date().optional(),
});

const generateCriticalResultId = async () => {
  const count = await CriticalResult.estimatedDocumentCount();
  return `CR-${String(count + 1000)}`;
};

const populateCriticalResult = (query) =>
  query
    .populate('patient', 'mrn fullName')
    .populate('radiologist', 'username fullName role')
    .populate('notifiedTo', 'username fullName role')
    .populate('study', 'studyId accessionNumber modality bodyPart priority status scheduledStartAt')
    .populate('report', 'reportId status isCritical finalizedAt accessionNumber');

export const listCriticalResults = async (req, res, next) => {
  try {
    const { status, severity, patientId, notifiedTo, radiologist, limit = '50', page = '1' } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (patientId) filter.patient = patientId;
    if (notifiedTo) filter.notifiedTo = notifiedTo;
    if (radiologist) filter.radiologist = radiologist;

    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [results, total] = await Promise.all([
      populateCriticalResult(
        CriticalResult.find(filter)
          .sort({ notifiedAt: -1 })
          .skip(skip)
          .limit(safeLimit),
      ),
      CriticalResult.countDocuments(filter),
    ]);

    res.status(200).json({
      results,
      page: safePage,
      limit: safeLimit,
      total,
    });
  } catch (err) {
    next(err);
  }
};

export const getCriticalResultById = async (req, res, next) => {
  try {
    const result = await populateCriticalResult(CriticalResult.findById(req.params.id));
    if (!result) {
      throw httpError(404, 'Critical result not found');
    }

    res.status(200).json({ result });
  } catch (err) {
    next(err);
  }
};

export const createCriticalResult = async (req, res, next) => {
  try {
    if (!req.user) {
      throw httpError(401, 'Unauthorized');
    }

    const parsed = createCriticalResultSchema.safeParse(req.body);
    if (!parsed.success) {
      throw httpError(400, parsed.error.issues[0]?.message || 'Invalid request body');
    }

    const data = parsed.data;

    const patient = await Patient.findById(data.patientId);
    if (!patient) {
      throw httpError(404, 'Patient not found');
    }

    let report = null;
    if (data.reportId) {
      report = await RadiologyReport.findById(data.reportId);
      if (!report) {
        throw httpError(404, 'Report not found');
      }
    }

    let study = null;
    if (data.studyId) {
      study = await Study.findById(data.studyId);
      if (!study) {
        throw httpError(404, 'Study not found');
      }
    }

    const criticalResultId = (data.criticalResultId || (await generateCriticalResultId())).toUpperCase().trim();

    const created = await CriticalResult.create({
      criticalResultId,
      report: report?._id,
      study: study?._id,
      patient: patient._id,
      studyType: data.studyType,
      finding: data.finding,
      severity: data.severity,
      radiologist: req.user.id,
      notifiedTo: data.notifiedToUserId,
      notificationMethod: data.notificationMethod,
      status: 'Pending',
      notifiedAt: new Date(),
    });

    const populated = await populateCriticalResult(CriticalResult.findById(created._id));

    await audit({
      actorId: req.user.id,
      action: 'Created critical result',
      targetType: 'CriticalResult',
      targetId: String(created._id),
      ipAddress: req.ip,
      metadata: {
        criticalResultId: created.criticalResultId,
        patientId: String(created.patient),
        reportId: created.report ? String(created.report) : null,
        studyId: created.study ? String(created.study) : null,
        severity: created.severity,
        status: created.status,
      },
    });

    res.status(201).json({ result: populated });
  } catch (err) {
    if (err?.code === 11000) {
      next(httpError(409, 'Duplicate criticalResultId'));
      return;
    }
    next(err);
  }
};

export const acknowledgeCriticalResult = async (req, res, next) => {
  try {
    const parsed = acknowledgeSchema.safeParse(req.body || {});
    if (!parsed.success) {
      throw httpError(400, parsed.error.issues[0]?.message || 'Invalid request body');
    }

    const result = await CriticalResult.findById(req.params.id);
    if (!result) {
      throw httpError(404, 'Critical result not found');
    }

    result.status = 'Acknowledged';
    result.acknowledgedAt = parsed.data.acknowledgedAt || new Date();

    await result.save();

    await audit({
      actorId: req.user?.id,
      action: 'Acknowledged critical result',
      targetType: 'CriticalResult',
      targetId: String(result._id),
      ipAddress: req.ip,
      metadata: {
        criticalResultId: result.criticalResultId,
        status: result.status,
        acknowledgedAt: result.acknowledgedAt,
      },
    });

    const populated = await populateCriticalResult(CriticalResult.findById(result._id));

    res.status(200).json({ result: populated });
  } catch (err) {
    next(err);
  }
};

export const escalateCriticalResult = async (req, res, next) => {
  try {
    const result = await CriticalResult.findById(req.params.id);
    if (!result) {
      throw httpError(404, 'Critical result not found');
    }

    result.status = 'Escalated';
    result.escalatedAt = new Date();

    await result.save();

    await audit({
      actorId: req.user?.id,
      action: 'Escalated critical result',
      targetType: 'CriticalResult',
      targetId: String(result._id),
      ipAddress: req.ip,
      metadata: {
        criticalResultId: result.criticalResultId,
        status: result.status,
        escalatedAt: result.escalatedAt,
      },
    });

    const populated = await populateCriticalResult(CriticalResult.findById(result._id));

    res.status(200).json({ result: populated });
  } catch (err) {
    next(err);
  }
};
