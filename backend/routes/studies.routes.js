import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import requireRole from '../middleware/requireRole.js';
import {
  createStudy,
  getStudyById,
  listStudies,
  technicianQueue,
  updateStudy,
  updateStudyStatus,
} from '../controllers/studies.controller.js';

const router = express.Router();

router.get('/', requireAuth, listStudies);
router.get('/queue', requireAuth, requireRole(['Technician', 'Admin']), technicianQueue);
router.get('/:id', requireAuth, getStudyById);

router.post('/', requireAuth, requireRole(['Technician', 'Admin']), createStudy);
router.patch('/:id', requireAuth, requireRole(['Technician', 'Admin']), updateStudy);
router.patch('/:id/status', requireAuth, requireRole(['Technician', 'Admin']), updateStudyStatus);

export default router;
