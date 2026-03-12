import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import requireRole from '../middleware/requireRole.js';
import {
  createPatient,
  getPatientById,
  getPatientTimeline,
  listPatients,
  setPatientActive,
  updatePatient,
} from '../controllers/patients.controller.js';

const router = express.Router();

router.get('/', requireAuth, listPatients);
router.get('/:id', requireAuth, getPatientById);
router.get('/:id/timeline', requireAuth, getPatientTimeline);

router.post('/', requireAuth, requireRole(['Admin', 'Physician', 'Technician']), createPatient);
router.patch('/:id', requireAuth, requireRole(['Admin', 'Physician', 'Technician']), updatePatient);
router.patch('/:id/active', requireAuth, requireRole(['Admin']), setPatientActive);

export default router;
