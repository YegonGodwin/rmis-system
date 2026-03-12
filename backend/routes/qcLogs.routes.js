import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import requireRole from '../middleware/requireRole.js';
import {
  createQcLog,
  deleteQcLog,
  getQcLogById,
  listQcLogs,
  updateQcLog,
} from '../controllers/qcLogs.controller.js';

const router = express.Router();

router.get('/', requireAuth, requireRole(['Technician', 'Admin']), listQcLogs);
router.get('/:id', requireAuth, requireRole(['Technician', 'Admin']), getQcLogById);

router.post('/', requireAuth, requireRole(['Technician', 'Admin']), createQcLog);
router.patch('/:id', requireAuth, requireRole(['Technician', 'Admin']), updateQcLog);
router.delete('/:id', requireAuth, requireRole(['Admin']), deleteQcLog);

export default router;
