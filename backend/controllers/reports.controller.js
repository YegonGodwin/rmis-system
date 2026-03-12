import { z } from 'zod';
import RadiologyReport from '../models/radiologyReport.js';
import Study from '../models/study.js';
import Patient from '../models/patient.js';
import CriticalResult from '../models/criticalResult.js';
import httpError from '../utils/httpError.js';
import audit from '../utils/audit.js';
import { WorkflowOrchestrator } from '../services/workflow.service.js';

const createReportSchema = z.object({
  reportId: z.string().optional(),
  studyId: z.string().min(1),
  studyType: z.string().min(1),
  technique: z.string().optional(),
  findings: z.string().min(1),
  impression: z.string().min(1),
  recommendations: z.string().optional(),
  isCritical: z.boolean().optional(),
  status: z.enum(['Draft', 'Preliminary', 'Final']).optional(),
});

const updateReportSchema = z
  .object({
    studyType: z.string().min(1).optional(),
    technique: z.string().optional(),
    findings: z.string().min(1).optional(),
    impression: z.string().min(1).optional(),
    recommendations: z.string().optional(),
    isCritical: z.boolean().optional(),
    status: z.enum(['Draft', 'Preliminary', 'Final']).optional(),
  })
  .strict();

const generateReportId = async () => {
  const count = await RadiologyReport.estimatedDocumentCount();
  return `R-${String(count + 1).padStart(4, '0')}`;
};

const maybeCreateCriticalResultForReport = async ({ report, study, patient, userId }) => {
  if (!report?.isCritical) return;

  const existing = await CriticalResult.findOne({ report: report._id });
  if (existing) return;

  const count = await CriticalResult.estimatedDocumentCount();
  const criticalResultId = `CR-${String(count + 1000)}`;

  await CriticalResult.create({
    criticalResultId,
    report: report._id,
    study: study?._id,
    patient: patient._id,
    studyType: report.studyType,
    finding: report.impression,
    severity: 'Critical',
    radiologist: userId,
    notifiedTo: userId,
    notificationMethod: 'Phone',
    status: 'Pending',
    notifiedAt: new Date(),
  });
};

const populateReport = (query) =>
  query
    .populate('patient', 'mrn fullName')
    .populate('study', 'studyId accessionNumber modality bodyPart priority status scheduledStartAt')
    .populate('radiologist', 'username fullName role');

export const listReports = async (req, res, next) => {
  try {
    const { status, patientId, radiologistId, studyId, isCritical, limit = '50', page = '1' } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (patientId) filter.patient = patientId;
    if (radiologistId) filter.radiologist = radiologistId;
    if (studyId) filter.study = studyId;
    if (typeof isCritical !== 'undefined') filter.isCritical = String(isCritical) === 'true';

    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [reports, total] = await Promise.all([
      populateReport(
        RadiologyReport.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(safeLimit),
      ),
      RadiologyReport.countDocuments(filter),
    ]);

    res.status(200).json({
      reports,
      page: safePage,
      limit: safeLimit,
      total,
    });
  } catch (err) {
    next(err);
  }
};

export const getReportById = async (req, res, next) => {
  try {
    const report = await populateReport(RadiologyReport.findById(req.params.id));
    if (!report) {
      throw httpError(404, 'Report not found');
    }

    res.status(200).json({ report });
  } catch (err) {
    next(err);
  }
};

export const createReport = async (req, res, next) => {
  try {
    if (!req.user) {
      throw httpError(401, 'Unauthorized');
    }

    const parsed = createReportSchema.safeParse(req.body);
    if (!parsed.success) {
      throw httpError(400, parsed.error.issues[0]?.message || 'Invalid request body');
    }

    const data = parsed.data;

    const study = await Study.findById(data.studyId);
    if (!study) {
      throw httpError(404, 'Study not found');
    }

    const patient = await Patient.findById(study.patient);
    if (!patient) {
      throw httpError(404, 'Patient not found');
    }

    const existingForStudy = await RadiologyReport.findOne({ study: study._id });
    if (existingForStudy) {
      throw httpError(409, 'Report already exists for this study');
    }

    const reportId = (data.reportId || (await generateReportId())).toUpperCase().trim();

    const report = await RadiologyReport.create({
      reportId,
      study: study._id,
      patient: patient._id,
      accessionNumber: study.accessionNumber,
      radiologist: req.user.id,
      status: data.status || 'Draft',
      studyType: data.studyType,
      technique: data.technique,
      findings: data.findings,
      impression: data.impression,
      recommendations: data.recommendations,
      isCritical: data.isCritical || false,
      finalizedAt: data.status === 'Final' ? new Date() : undefined,
    });

    await maybeCreateCriticalResultForReport({ report, study, patient, userId: req.user.id });

    // Trigger workflow orchestration
    await WorkflowOrchestrator.onReportStatusChange(report._id, report.status);

    await audit({
      actorId: req.user.id,
      action: 'Created radiology report',
      targetType: 'RadiologyReport',
      targetId: String(report._id),
      ipAddress: req.ip,
      metadata: {
        reportId: report.reportId,
        studyId: String(report.study),
        patientId: String(report.patient),
        status: report.status,
        isCritical: report.isCritical,
      },
    });

    const populated = await populateReport(RadiologyReport.findById(report._id));

    res.status(201).json({ report: populated });
  } catch (err) {
    if (err?.code === 11000) {
      next(httpError(409, 'Duplicate reportId/accessionNumber or report already exists'));
      return;
    }
    next(err);
  }
};

export const updateReport = async (req, res, next) => {
  try {
    if (!req.user) {
      throw httpError(401, 'Unauthorized');
    }

    const parsed = updateReportSchema.safeParse(req.body);
    if (!parsed.success) {
      throw httpError(400, parsed.error.issues[0]?.message || 'Invalid request body');
    }

    const report = await RadiologyReport.findById(req.params.id);
    if (!report) {
      throw httpError(404, 'Report not found');
    }

    if (String(report.radiologist) !== String(req.user.id) && req.user.role !== 'Admin') {
      throw httpError(403, 'Forbidden');
    }

    if (report.status === 'Final') {
      throw httpError(409, 'Final reports cannot be edited');
    }

    Object.assign(report, parsed.data);

    if (parsed.data.status === 'Final') {
      report.finalizedAt = new Date();
    }

    await report.save();

    const study = await Study.findById(report.study);
    const patient = await Patient.findById(report.patient);
    if (study && patient) {
      await maybeCreateCriticalResultForReport({ report, study, patient, userId: req.user.id });
    }

    await audit({
      actorId: req.user.id,
      action: 'Updated radiology report',
      targetType: 'RadiologyReport',
      targetId: String(report._id),
      ipAddress: req.ip,
      metadata: {
        reportId: report.reportId,
        status: report.status,
        isCritical: report.isCritical,
        changes: parsed.data,
      },
    });

    const populated = await populateReport(RadiologyReport.findById(report._id));

    res.status(200).json({ report: populated });
  } catch (err) {
    next(err);
  }
};
