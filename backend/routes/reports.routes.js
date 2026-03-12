import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import requireRole from '../middleware/requireRole.js';
import {
  createReport,
  getReportById,
  listReports,
  updateReport,
} from '../controllers/reports.controller.js';

const router = express.Router();

router.get('/', requireAuth, listReports);
router.get('/:id', requireAuth, getReportById);

router.post('/', requireAuth, requireRole(['Radiologist', 'Admin']), createReport);
router.patch('/:id', requireAuth, requireRole(['Radiologist', 'Admin']), updateReport);

export default router;
