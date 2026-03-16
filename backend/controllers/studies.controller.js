import { z } from 'zod';
import Study from '../models/study.js';
import Patient from '../models/patient.js';
import ImagingRequest from '../models/imagingRequest.js';
import ImagingRoom from '../models/imagingRoom.js';
import httpError from '../utils/httpError.js';
import audit from '../utils/audit.js';
import { WorkflowOrchestrator } from '../services/workflow.service.js';

const createStudySchema = z.object({
  patientId: z.string().min(1),
  imagingRequestId: z.string().optional(),
  accessionNumber: z.string().min(1),
  modality: z.enum(['CT', 'MRI', 'X-Ray', 'Ultrasound', 'Mammography', 'Fluoroscopy']),
  bodyPart: z.string().optional(),
  priority: z.enum(['Routine', 'Urgent', 'STAT']),
  clinicalIndication: z.string().optional(),
  referringPhysicianId: z.string().optional(),
  scheduledStartAt: z.coerce.date(),
  roomId: z.string().optional(),
  studyId: z.string().optional(),
});

const updateStudySchema = z
  .object({
    scheduledStartAt: z.coerce.date().optional(),
    roomId: z.string().optional(),
    priority: z.enum(['Routine', 'Urgent', 'STAT']).optional(),
  })
  .strict();

const statusSchema = z
  .object({
    status: z.enum(['Scheduled', 'Checked In', 'In Progress', 'Completed', 'Canceled', 'No Show', 'Delayed', 'Requires Re-scan']),
    identityMethod: z
      .enum(['Government ID', 'Insurance Card', 'Facility Bracelet', 'Biometric', 'Other'])
      .optional(),
    consentSigned: z.coerce.boolean().optional(),
    safetyScreeningCompleted: z.coerce.boolean().optional(),
    safetyScreeningNotes: z.string().optional(),
    delayReason: z.string().optional(),
    cancelReason: z.string().optional(),
    noShowReason: z.string().optional(),
    radiologistFeedback: z.string().optional(),
  })
  .strict();

export const rejectStudyImages = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'Radiologist') {
      throw httpError(403, 'Only radiologists can reject study images');
    }

    const { feedback } = req.body;
    if (!feedback || !feedback.trim()) {
      throw httpError(400, 'Feedback is required when rejecting images');
    }

    const study = await Study.findById(req.params.id);
    if (!study) {
      throw httpError(404, 'Study not found');
    }

    if (study.status !== 'Completed') {
      throw httpError(409, 'Only completed studies can be rejected for re-scan');
    }

    study.status = 'Requires Re-scan';
    study.radiologistFeedback = feedback.trim();
    study.radiologistRejectedAt = new Date();
    study.radiologistRejectedBy = req.user.id;

    await study.save();

    // Trigger workflow orchestration (will notify technicians)
    await WorkflowOrchestrator.onStudyStatusChange(study._id, 'Requires Re-scan');

    await audit({
      actorId: req.user.id,
      action: 'Rejected study images',
      targetType: 'Study',
      targetId: String(study._id),
      ipAddress: req.ip,
      metadata: {
        studyId: study.studyId,
        feedback: study.radiologistFeedback,
      },
    });

    const populated = await Study.findById(study._id)
      .populate('patient', 'mrn fullName')
      .populate('room', 'name modality status');

    res.status(200).json({ study: populated });
  } catch (err) {
    next(err);
  }
};

const generateStudyId = async () => {
  const count = await Study.estimatedDocumentCount();
  return `STU-${String(count + 1).padStart(4, '0')}`;
};

export const listStudies = async (req, res, next) => {
  try {
    const {
      status,
      priority,
      modality,
      patientId,
      roomId,
      from,
      to,
      limit = '50',
      page = '1',
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (modality) filter.modality = modality;
    if (patientId) filter.patient = patientId;
    if (roomId) filter.room = roomId;

    if (from || to) {
      filter.scheduledStartAt = {};
      if (from) filter.scheduledStartAt.$gte = new Date(String(from));
      if (to) filter.scheduledStartAt.$lte = new Date(String(to));
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [studies, total] = await Promise.all([
      Study.find(filter)
        .populate('patient', 'mrn fullName')
        .populate('imagingRequest', 'requestId status priority modality')
        .populate('referringPhysician', 'username fullName role')
        .populate('room', 'name modality status')
        .populate('assignedRadiologist', 'fullName username')
        .sort({ scheduledStartAt: 1 })
        .skip(skip)
        .limit(safeLimit),
      Study.countDocuments(filter),
    ]);

    res.status(200).json({
      studies,
      page: safePage,
      limit: safeLimit,
      total,
    });
  } catch (err) {
    next(err);
  }
};

export const getStudyById = async (req, res, next) => {
  try {
    const study = await Study.findById(req.params.id)
      .populate('patient', 'mrn fullName')
      .populate('imagingRequest', 'requestId status priority modality')
      .populate('referringPhysician', 'username fullName role')
      .populate('room', 'name modality status');

    if (!study) {
      throw httpError(404, 'Study not found');
    }

    res.status(200).json({ study });
  } catch (err) {
    next(err);
  }
};

export const createStudy = async (req, res, next) => {
  try {
    const parsed = createStudySchema.safeParse(req.body);
    if (!parsed.success) {
      throw httpError(400, parsed.error.issues[0]?.message || 'Invalid request body');
    }

    const data = parsed.data;

    const patient = await Patient.findById(data.patientId);
    if (!patient) {
      throw httpError(404, 'Patient not found');
    }

    let imagingRequest = null;
    if (data.imagingRequestId) {
      imagingRequest = await ImagingRequest.findById(data.imagingRequestId);
      if (!imagingRequest) {
        throw httpError(404, 'Imaging request not found');
      }
      if (imagingRequest.status !== 'Approved') {
        throw httpError(409, 'Only Approved imaging requests can be scheduled into a study');
      }
    }

    let room = null;
    if (data.roomId) {
      room = await ImagingRoom.findById(data.roomId);
      if (!room) {
        throw httpError(404, 'Room not found');
      }
    }

    const studyId = (data.studyId || (await generateStudyId())).toUpperCase().trim();
    const accessionNumber = data.accessionNumber.toUpperCase().trim();

    const study = await Study.create({
      studyId,
      accessionNumber,
      patient: patient._id,
      imagingRequest: imagingRequest?._id,
      modality: data.modality,
      bodyPart: data.bodyPart,
      priority: data.priority,
      clinicalIndication: data.clinicalIndication,
      referringPhysician: data.referringPhysicianId || imagingRequest?.requestedBy,
      scheduledStartAt: data.scheduledStartAt,
      room: room?._id,
      status: 'Scheduled',
    });

    if (imagingRequest) {
      imagingRequest.status = 'Scheduled';
      imagingRequest.scheduledAt = data.scheduledStartAt;
      await imagingRequest.save();
    }

    const populated = await Study.findById(study._id)
      .populate('patient', 'mrn fullName')
      .populate('imagingRequest', 'requestId status priority modality')
      .populate('referringPhysician', 'username fullName role')
      .populate('room', 'name modality status');

    await audit({
      actorId: req.user?.id,
      action: 'Scheduled study',
      targetType: 'Study',
      targetId: String(study._id),
      ipAddress: req.ip,
      metadata: {
        studyId: study.studyId,
        accessionNumber: study.accessionNumber,
        patientId: String(study.patient),
        modality: study.modality,
        priority: study.priority,
        roomId: study.room ? String(study.room) : null,
        imagingRequestId: study.imagingRequest ? String(study.imagingRequest) : null,
      },
    });

    res.status(201).json({ study: populated });
  } catch (err) {
    if (err?.code === 11000) {
      next(httpError(409, 'Duplicate studyId or accessionNumber'));
      return;
    }
    next(err);
  }
};

export const updateStudy = async (req, res, next) => {
  try {
    const parsed = updateStudySchema.safeParse(req.body);
    if (!parsed.success) {
      throw httpError(400, parsed.error.issues[0]?.message || 'Invalid request body');
    }

    const study = await Study.findById(req.params.id);
    if (!study) {
      throw httpError(404, 'Study not found');
    }

    if (parsed.data.roomId) {
      const room = await ImagingRoom.findById(parsed.data.roomId);
      if (!room) {
        throw httpError(404, 'Room not found');
      }
      study.room = room._id;
    }

    if (parsed.data.scheduledStartAt) {
      study.scheduledStartAt = parsed.data.scheduledStartAt;
    }

    if (parsed.data.priority) {
      study.priority = parsed.data.priority;
    }

    await study.save();

    await audit({
      actorId: req.user?.id,
      action: 'Updated study',
      targetType: 'Study',
      targetId: String(study._id),
      ipAddress: req.ip,
      metadata: {
        studyId: study.studyId,
        changes: parsed.data,
      },
    });

    const populated = await Study.findById(study._id)
      .populate('patient', 'mrn fullName')
      .populate('room', 'name modality status');

    res.status(200).json({ study: populated });
  } catch (err) {
    next(err);
  }
};

export const updateStudyStatus = async (req, res, next) => {
  try {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      throw httpError(400, parsed.error.issues[0]?.message || 'Invalid request body');
    }

    const study = await Study.findById(req.params.id);
    if (!study) {
      throw httpError(404, 'Study not found');
    }

    const newStatus = parsed.data.status;
    const oldStatus = study.status;

    if (['Delayed', 'Canceled', 'No Show'].includes(newStatus)) {
      const reason =
        newStatus === 'Delayed'
          ? parsed.data.delayReason
          : newStatus === 'Canceled'
            ? parsed.data.cancelReason
            : parsed.data.noShowReason;
      if (!reason || !String(reason).trim()) {
        throw httpError(400, `Reason is required for status ${newStatus}`);
      }
    }

    if (newStatus === 'In Progress' && !study.performedStartAt) {
      study.performedStartAt = new Date();
    }

    if (newStatus === 'Checked In') {
      if (!study.checkedInAt) {
        study.checkedInAt = new Date();
      }
      if (!study.checkedInBy && req.user?.id) {
        study.checkedInBy = req.user.id;
      }
      if (parsed.data.identityMethod) {
        study.identityMethod = parsed.data.identityMethod;
        study.identityVerifiedAt = new Date();
        if (req.user?.id) {
          study.identityVerifiedBy = req.user.id;
        }
      }
      if (typeof parsed.data.consentSigned !== 'undefined') {
        study.consentSigned = parsed.data.consentSigned;
        study.consentSignedAt = parsed.data.consentSigned ? new Date() : undefined;
        if (req.user?.id && parsed.data.consentSigned) {
          study.consentSignedBy = req.user.id;
        } else if (!parsed.data.consentSigned) {
          study.consentSignedBy = undefined;
        }
      }
      if (typeof parsed.data.safetyScreeningCompleted !== 'undefined') {
        study.safetyScreeningCompleted = parsed.data.safetyScreeningCompleted;
        study.safetyScreeningAt = parsed.data.safetyScreeningCompleted ? new Date() : undefined;
        if (req.user?.id && parsed.data.safetyScreeningCompleted) {
          study.safetyScreeningBy = req.user.id;
        } else if (!parsed.data.safetyScreeningCompleted) {
          study.safetyScreeningBy = undefined;
        }
      }
      if (parsed.data.safetyScreeningNotes) {
        study.safetyScreeningNotes = parsed.data.safetyScreeningNotes;
      }
    }

    if (newStatus === 'Completed') {
      if (!study.performedStartAt) {
        study.performedStartAt = new Date();
      }
      study.performedEndAt = new Date();
    }

    if (newStatus === 'Delayed') {
      study.delayedAt = new Date();
      study.delayedBy = req.user?.id;
      study.delayReason = parsed.data.delayReason?.trim();
    }

    if (newStatus === 'Canceled') {
      study.canceledAt = new Date();
      study.canceledBy = req.user?.id;
      study.cancelReason = parsed.data.cancelReason?.trim();
    }

    if (newStatus === 'No Show') {
      study.noShowAt = new Date();
      study.noShowBy = req.user?.id;
      study.noShowReason = parsed.data.noShowReason?.trim();
    }

    study.status = newStatus;
    await study.save();

    // Trigger workflow orchestration
    await WorkflowOrchestrator.onStudyStatusChange(study._id, newStatus);

    await audit({
      actorId: req.user?.id,
      action: 'Updated study status',
      targetType: 'Study',
      targetId: String(study._id),
      ipAddress: req.ip,
      metadata: {
        studyId: study.studyId,
        from: oldStatus,
        to: newStatus,
        identityMethod: parsed.data.identityMethod,
        consentSigned: parsed.data.consentSigned,
        safetyScreeningCompleted: parsed.data.safetyScreeningCompleted,
        delayReason: parsed.data.delayReason,
        cancelReason: parsed.data.cancelReason,
        noShowReason: parsed.data.noShowReason,
      },
    });

    const populated = await Study.findById(study._id)
      .populate('patient', 'mrn fullName')
      .populate('room', 'name modality status');

    res.status(200).json({ study: populated });
  } catch (err) {
    next(err);
  }
};

export const assignStudy = async (req, res, next) => {
  try {
    const { radiologistId } = req.body;
    if (!radiologistId && radiologistId !== null) {
      throw httpError(400, 'radiologistId is required (or null to unassign)');
    }

    const study = await Study.findById(req.params.id);
    if (!study) throw httpError(404, 'Study not found');

    if (study.status !== 'Completed') {
      throw httpError(409, 'Only completed studies can be assigned for reporting');
    }

    if (radiologistId) {
      const User = (await import('../models/user.js')).default;
      const radiologist = await User.findById(radiologistId);
      if (!radiologist || radiologist.role !== 'Radiologist') {
        throw httpError(404, 'Radiologist not found');
      }
      study.assignedRadiologist = radiologistId;
      study.assignedAt = new Date();
      study.assignedBy = req.user?.id;
    } else {
      // unassign
      study.assignedRadiologist = undefined;
      study.assignedAt = undefined;
      study.assignedBy = undefined;
    }

    await study.save();

    if (radiologistId) {
      const { emitToUser } = await import('../utils/socket.js');
      const populated = await Study.findById(study._id).populate('patient', 'fullName mrn');
      emitToUser(radiologistId, 'NOTIFICATION', {
        title: 'Study Assigned',
        message: `You have been assigned a ${populated.modality} study for ${populated.patient.fullName}.`,
        type: 'info',
        studyId: String(study._id),
      });
    }

    await audit({
      actorId: req.user?.id,
      action: radiologistId ? 'Assigned study to radiologist' : 'Unassigned study from radiologist',
      targetType: 'Study',
      targetId: String(study._id),
      ipAddress: req.ip,
      metadata: { studyId: study.studyId, radiologistId },
    });

    const result = await Study.findById(study._id)
      .populate('patient', 'mrn fullName')
      .populate('assignedRadiologist', 'fullName username')
      .populate('room', 'name modality status');

    res.status(200).json({ study: result });
  } catch (err) {
    next(err);
  }
};

export const technicianQueue = async (req, res, next) => {
  try {
    const { status, roomId, priority, modality, limit = '100' } = req.query;

    const filter = {};

    filter.status = status || { $in: ['Scheduled', 'Checked In', 'In Progress'] };

    if (roomId) filter.room = roomId;
    if (priority) filter.priority = priority;
    if (modality) filter.modality = modality;

    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);

    const studies = await Study.find(filter)
      .populate('patient', 'mrn fullName')
      .populate('room', 'name modality status')
      .sort({
        priority: 1,
        scheduledStartAt: 1,
      })
      .limit(safeLimit);

    res.status(200).json({ studies });
  } catch (err) {
    next(err);
  }
};
