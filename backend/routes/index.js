import express from 'express';
import authRouter from './auth.routes.js';
import usersRouter from './users.routes.js';
import patientsRouter from './patients.routes.js';
import imagingRequestsRouter from './imagingRequests.routes.js';
import studiesRouter from './studies.routes.js';
import roomsRouter from './rooms.routes.js';
import reportsRouter from './reports.routes.js';
import criticalResultsRouter from './criticalResults.routes.js';
import reportTemplatesRouter from './reportTemplates.routes.js';
import qcLogsRouter from './qcLogs.routes.js';
import auditLogsRouter from './auditLogs.routes.js';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/patients', patientsRouter);
router.use('/imaging-requests', imagingRequestsRouter);
router.use('/studies', studiesRouter);
router.use('/rooms', roomsRouter);
router.use('/reports', reportsRouter);
router.use('/critical-results', criticalResultsRouter);
router.use('/report-templates', reportTemplatesRouter);
router.use('/qc-logs', qcLogsRouter);
router.use('/audit-logs', auditLogsRouter);

export default router;
