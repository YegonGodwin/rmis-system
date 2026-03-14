import { z } from 'zod';
import ImagingRequest from '../models/imagingRequest.js';
import Patient from '../models/patient.js';
import httpError from '../utils/httpError.js';
import audit from '../utils/audit.js';

const createImagingRequestSchema = z.object({
  patientId: z.string().min(1),
  modality: z.enum(['CT', 'MRI', 'X-Ray', 'Ultrasound', 'Mammography', 'Fluoroscopy']),
  bodyPart: z.string().optional(),
  priority: z.enum(['Routine', 'Urgent', 'STAT']),
  clinicalIndication: z.string().min(1),
  specialInstructions: z.string().optional(),
  requestId: z.string().optional(),
});

const statusUpdateSchema = z.object({
  status: z.enum(['Pending', 'Approved', 'Rejected', 'Scheduled']),
});

const generateRequestId = async () => {
  const count = await ImagingRequest.estimatedDocumentCount();
  return `REQ-${String(count + 1000)}`;
};

export const listImagingRequests = async (req, res, next) => {
  try {
    const { status, priority, modality, patientId, limit = '50', page = '1' } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (modality) filter.modality = modality;
    if (patientId) filter.patient = patientId;
    if (req.user?.role !== 'Admin') {
      filter.requestedBy = req.user?.id;
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [requests, total] = await Promise.all([
      ImagingRequest.find(filter)
        .populate('patient', 'mrn fullName')
        .populate('requestedBy', 'username fullName role')
        .populate('approvedBy', 'username fullName role')
        .populate('rejectedBy', 'username fullName role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit),
      ImagingRequest.countDocuments(filter),
    ]);

    res.status(200).json({
      requests,
      page: safePage,
      limit: safeLimit,
      total,
    });
  } catch (err) {
    next(err);
  }
};

export const createImagingRequest = async (req, res, next) => {
  try {
    const parsed = createImagingRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw httpError(400, parsed.error.issues[0]?.message || 'Invalid request body');
    }

    if (!req.user) {
      throw httpError(401, 'Unauthorized');
    }

    const data = parsed.data;

    const patient = await Patient.findById(data.patientId);
    if (!patient) {
      throw httpError(404, 'Patient not found');
    }

    const requestId = (data.requestId || (await generateRequestId())).toUpperCase().trim();

    const imagingRequest = await ImagingRequest.create({
      requestId,
      patient: patient._id,
      modality: data.modality,
      bodyPart: data.bodyPart,
      priority: data.priority,
      clinicalIndication: data.clinicalIndication,
      specialInstructions: data.specialInstructions,
      requestedBy: req.user.id,
      status: 'Pending',
    });

    const populated = await ImagingRequest.findById(imagingRequest._id)
      .populate('patient', 'mrn fullName')
      .populate('requestedBy', 'username fullName role');

    await audit({
      actorId: req.user.id,
      action: 'Created imaging request',
      targetType: 'ImagingRequest',
      targetId: String(imagingRequest._id),
      ipAddress: req.ip,
      metadata: {
        requestId: imagingRequest.requestId,
        patientId: String(imagingRequest.patient),
        modality: imagingRequest.modality,
        priority: imagingRequest.priority,
      },
    });

    res.status(201).json({ request: populated });
  } catch (err) {
    if (err?.code === 11000) {
      next(httpError(409, 'Duplicate requestId'));
      return;
    }
    next(err);
  }
};

export const approveImagingRequest = async (req, res, next) => {
  try {
    if (!req.user) {
      throw httpError(401, 'Unauthorized');
    }

    const imagingRequest = await ImagingRequest.findById(req.params.id);
    if (!imagingRequest) {
      throw httpError(404, 'Imaging request not found');
    }

    if (imagingRequest.status !== 'Pending') {
      throw httpError(409, 'Only Pending requests can be approved');
    }

    imagingRequest.status = 'Approved';
    imagingRequest.approvedBy = req.user.id;
    imagingRequest.approvedAt = new Date();

    await imagingRequest.save();

    const populated = await ImagingRequest.findById(imagingRequest._id)
      .populate('patient', 'mrn fullName')
      .populate('requestedBy', 'username fullName role')
      .populate('approvedBy', 'username fullName role');

    await audit({
      actorId: req.user.id,
      action: 'Approved imaging request',
      targetType: 'ImagingRequest',
      targetId: String(imagingRequest._id),
      ipAddress: req.ip,
      metadata: {
        requestId: imagingRequest.requestId,
      },
    });

    res.status(200).json({ request: populated });
  } catch (err) {
    next(err);
  }
};

export const rejectImagingRequest = async (req, res, next) => {
  try {
    if (!req.user) {
      throw httpError(401, 'Unauthorized');
    }

    const imagingRequest = await ImagingRequest.findById(req.params.id);
    if (!imagingRequest) {
      throw httpError(404, 'Imaging request not found');
    }

    if (imagingRequest.status !== 'Pending') {
      throw httpError(409, 'Only Pending requests can be rejected');
    }

    imagingRequest.status = 'Rejected';
    imagingRequest.rejectedBy = req.user.id;
    imagingRequest.rejectedAt = new Date();

    await imagingRequest.save();

    const populated = await ImagingRequest.findById(imagingRequest._id)
      .populate('patient', 'mrn fullName')
      .populate('requestedBy', 'username fullName role')
      .populate('rejectedBy', 'username fullName role');

    await audit({
      actorId: req.user.id,
      action: 'Rejected imaging request',
      targetType: 'ImagingRequest',
      targetId: String(imagingRequest._id),
      ipAddress: req.ip,
      metadata: {
        requestId: imagingRequest.requestId,
      },
    });

    res.status(200).json({ request: populated });
  } catch (err) {
    next(err);
  }
};

export const updateImagingRequestStatus = async (req, res, next) => {
  try {
    const parsed = statusUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw httpError(400, parsed.error.issues[0]?.message || 'Invalid request body');
    }

    if (!req.user) {
      throw httpError(401, 'Unauthorized');
    }

    const imagingRequest = await ImagingRequest.findById(req.params.id);
    if (!imagingRequest) {
      throw httpError(404, 'Imaging request not found');
    }

    imagingRequest.status = parsed.data.status;
    await imagingRequest.save();

    const populated = await ImagingRequest.findById(imagingRequest._id)
      .populate('patient', 'mrn fullName')
      .populate('requestedBy', 'username fullName role');

    await audit({
      actorId: req.user.id,
      action: 'Updated imaging request status',
      targetType: 'ImagingRequest',
      targetId: String(imagingRequest._id),
      ipAddress: req.ip,
      metadata: {
        requestId: imagingRequest.requestId,
        status: imagingRequest.status,
      },
    });

    res.status(200).json({ request: populated });
  } catch (err) {
    next(err);
  }
};
