import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import requireRole from '../middleware/requireRole.js';
import {
  createRoom,
  deleteRoom,
  getRoomById,
  listRooms,
  updateRoom,
} from '../controllers/rooms.controller.js';

const router = express.Router();

router.get('/', requireAuth, listRooms);
router.get('/:id', requireAuth, getRoomById);

router.post('/', requireAuth, requireRole(['Admin']), createRoom);
router.patch('/:id', requireAuth, requireRole(['Admin']), updateRoom);
router.delete('/:id', requireAuth, requireRole(['Admin']), deleteRoom);

export default router;
