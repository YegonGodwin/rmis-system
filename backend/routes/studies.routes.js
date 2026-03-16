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
  assignStudy,
  rejectStudyImages,
} from '../controllers/studies.controller.js';
import {
  uploadStudyImages,
  getStudyImages,
  deleteStudyImage,
} from '../controllers/studyImages.controller.js';

const router = express.Router();

router.get('/', requireAuth, listStudies);
router.get('/queue', requireAuth, requireRole(['Technician', 'Admin']), technicianQueue);
router.get('/:id', requireAuth, getStudyById);
router.get('/:id/images', requireAuth, getStudyImages);

router.post('/', requireAuth, requireRole(['Technician', 'Admin']), createStudy);
router.post('/:id/images', requireAuth, requireRole(['Technician', 'Admin']), uploadStudyImages);
router.post('/:id/reject-images', requireAuth, requireRole('Radiologist'), rejectStudyImages);
router.patch('/:id/status', requireAuth, requireRole(['Technician', 'Admin']), updateStudyStatus);
router.patch('/:id/assign', requireAuth, requireRole(['Admin', 'Radiologist']), assignStudy);
router.patch('/:id', requireAuth, requireRole(['Technician', 'Admin']), updateStudy);
router.delete('/:id/images/:imageId', requireAuth, requireRole(['Technician', 'Admin']), deleteStudyImage);

export default router;
