import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import requireRole from '../middleware/requireRole.js';
import { listAuditLogs } from '../controllers/auditLogs.controller.js';

const router = express.Router();

router.get('/', requireAuth, requireRole(['Admin']), listAuditLogs);

export default router;
