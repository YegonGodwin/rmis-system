import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import requireRole from '../middleware/requireRole.js';
import {
  approveImagingRequest,
  createImagingRequest,
  listImagingRequests,
  rejectImagingRequest,
  updateImagingRequestStatus,
} from '../controllers/imagingRequests.controller.js';

const router = express.Router();

router.get('/', requireAuth, listImagingRequests);

router.post('/', requireAuth, requireRole(['Physician', 'Admin']), createImagingRequest);

router.post('/:id/approve', requireAuth, requireRole(['Admin']), approveImagingRequest);
router.post('/:id/reject', requireAuth, requireRole(['Admin']), rejectImagingRequest);

router.patch('/:id/status', requireAuth, requireRole(['Admin']), updateImagingRequestStatus);

export default router;
