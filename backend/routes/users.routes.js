import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import requireRole from '../middleware/requireRole.js';
import { createUser, listUsers, setUserStatus, changePassword } from '../controllers/users.controller.js';

const router = express.Router();

router.get('/', requireAuth, requireRole(['Admin']), listUsers);
router.post('/', requireAuth, requireRole(['Admin']), createUser);
router.patch('/:id/status', requireAuth, requireRole(['Admin']), setUserStatus);
router.post('/change-password', requireAuth, changePassword);

export default router;
