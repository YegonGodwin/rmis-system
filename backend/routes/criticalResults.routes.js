import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import requireRole from '../middleware/requireRole.js';
import {
  acknowledgeCriticalResult,
  createCriticalResult,
  escalateCriticalResult,
  getCriticalResultById,
  listCriticalResults,
} from '../controllers/criticalResults.controller.js';

const router = express.Router();

router.get('/', requireAuth, listCriticalResults);
router.get('/:id', requireAuth, getCriticalResultById);

router.post('/', requireAuth, requireRole(['Radiologist', 'Admin']), createCriticalResult);

router.post('/:id/acknowledge', requireAuth, requireRole(['Physician', 'Admin']), acknowledgeCriticalResult);
router.post('/:id/escalate', requireAuth, requireRole(['Admin']), escalateCriticalResult);

export default router;
