import { z } from 'zod';
import Patient from '../models/patient.js';
import ImagingRequest from '../models/imagingRequest.js';
import Study from '../models/study.js';
import RadiologyReport from '../models/radiologyReport.js';
import httpError from '../utils/httpError.js';

export const getPatientTimeline = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(id);
    if (!patient) {
      throw httpError(404, 'Patient not found');
    }

    const [requests, studies, reports] = await Promise.all([
      ImagingRequest.find({ patient: id }).populate('requestedBy', 'fullName role'),
      Study.find({ patient: id }).populate('room', 'name modality'),
      RadiologyReport.find({ patient: id }).populate('radiologist', 'fullName'),
    ]);

    const events = [
      ...requests.map((r) => ({
        id: r._id,
        type: 'Request',
        date: r.createdAt,
        title: `${r.modality} Requested`,
        subtitle: `By ${r.requestedBy?.fullName || 'Physician'}`,
        status: r.status,
        priority: r.priority,
        details: r.clinicalIndication,
      })),
      ...studies.map((s) => ({
        id: s._id,
        type: 'Study',
        date: s.scheduledStartAt || s.createdAt,
        title: `${s.modality} Study ${s.status}`,
        subtitle: s.room ? `In ${s.room.name}` : 'Room unassigned',
        status: s.status,
        priority: s.priority,
        details: s.bodyPart ? `Region: ${s.bodyPart}` : '',
      })),
      ...reports.map((rep) => ({
        id: rep._id,
        type: 'Report',
        date: rep.finalizedAt || rep.createdAt,
        title: `Radiology Report ${rep.status}`,
        subtitle: `By Dr. ${rep.radiologist?.fullName || 'Radiologist'}`,
        status: rep.status,
        isCritical: rep.isCritical,
        details: rep.impression,
      })),
    ];

    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.status(200).json({
      patient,
      timeline: events,
    });
  } catch (err) {
    next(err);
  }
};

const createPatientSchema = z.object({
  mrn: z.string().min(1),
  fullName: z.string().min(1),
  dob: z.coerce.date(),
  gender: z.enum(['Male', 'Female', 'Other']),
  contact: z
    .object({
      phone: z.string().optional(),
      email: z.string().email().optional(),
      address: z.string().optional(),
    })
    .optional(),
});

const updatePatientSchema = z
  .object({
    fullName: z.string().min(1).optional(),
    dob: z.coerce.date().optional(),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    contact: z
      .object({
        phone: z.string().optional(),
        email: z.string().email().optional(),
        address: z.string().optional(),
      })
      .optional(),
    isActive: z.boolean().optional(),
    lastVisitAt: z.coerce.date().optional(),
  })
  .strict();

export const listPatients = async (req, res, next) => {
  try {
    const { q, mrn, isActive, limit = '50', page = '1' } = req.query;

    const filter = {};

    if (typeof isActive !== 'undefined') {
      filter.isActive = String(isActive) === 'true';
    }

    if (mrn) {
      filter.mrn = String(mrn).toUpperCase().trim();
    }

    if (q) {
      const term = String(q).trim();
      filter.$or = [
        { fullName: { $regex: term, $options: 'i' } },
        { mrn: { $regex: term, $options: 'i' } },
      ];
    }

    if (req.user?.role === 'Physician') {
      const [requestPatientIds, studyPatientIds] = await Promise.all([
        ImagingRequest.find({ requestedBy: req.user.id }).distinct('patient'),
        Study.find({ referringPhysician: req.user.id }).distinct('patient'),
      ]);
      const patientIds = Array.from(new Set([...requestPatientIds, ...studyPatientIds].map(String)));
      if (patientIds.length === 0) {
        res.status(200).json({ patients: [], page: 1, limit: Math.min(Math.max(Number(limit) || 50, 1), 200), total: 0 });
        return;
      }
      filter._id = { $in: patientIds };
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [patients, total] = await Promise.all([
      Patient.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
      Patient.countDocuments(filter),
    ]);

    res.status(200).json({
      patients,
      page: safePage,
      limit: safeLimit,
      total,
    });
  } catch (err) {
    next(err);
  }
};

export const getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      throw httpError(404, 'Patient not found');
    }

    res.status(200).json({ patient });
  } catch (err) {
    next(err);
  }
};

export const createPatient = async (req, res, next) => {
  try {
    const parsed = createPatientSchema.safeParse(req.body);
    if (!parsed.success) {
      throw httpError(400, parsed.error.issues[0]?.message || 'Invalid request body');
    }

    const data = parsed.data;

    const normalizedMrn = data.mrn.toUpperCase().trim();

    const existing = await Patient.findOne({ mrn: normalizedMrn });
    if (existing) {
      throw httpError(409, 'Patient with same MRN already exists');
    }

    const patient = await Patient.create({
      mrn: normalizedMrn,
      fullName: data.fullName.trim(),
      dob: data.dob,
      gender: data.gender,
      contact: data.contact,
    });

    res.status(201).json({ patient });
  } catch (err) {
    next(err);
  }
};

export const updatePatient = async (req, res, next) => {
  try {
    const parsed = updatePatientSchema.safeParse(req.body);
    if (!parsed.success) {
      throw httpError(400, parsed.error.issues[0]?.message || 'Invalid request body');
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      throw httpError(404, 'Patient not found');
    }

    Object.assign(patient, parsed.data);
    await patient.save();

    res.status(200).json({ patient });
  } catch (err) {
    next(err);
  }
};

export const setPatientActive = async (req, res, next) => {
  try {
    const bodySchema = z.object({ isActive: z.boolean() });
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw httpError(400, 'isActive must be boolean');
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      throw httpError(404, 'Patient not found');
    }

    patient.isActive = parsed.data.isActive;
    await patient.save();

    res.status(200).json({ patient });
  } catch (err) {
    next(err);
  }
};
