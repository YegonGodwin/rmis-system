import { z } from 'zod';
import ImagingRoom from '../models/imagingRoom.js';
import httpError from '../utils/httpError.js';
import { emitToUser } from '../utils/socket.js';

const createRoomSchema = z.object({
  name: z.string().min(1),
  modality: z.enum(['CT', 'MRI', 'X-Ray', 'Ultrasound', 'Mammography', 'Fluoroscopy']),
  status: z.enum(['Active', 'Idle', 'Maintenance', 'Offline']).optional(),
  utilizationPercent: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  assignedTechnician: z.string().optional(),
});

const updateRoomSchema = z
  .object({
    name: z.string().min(1).optional(),
    modality: z.enum(['CT', 'MRI', 'X-Ray', 'Ultrasound', 'Mammography', 'Fluoroscopy']).optional(),
    status: z.enum(['Active', 'Idle', 'Maintenance', 'Offline']).optional(),
    utilizationPercent: z.number().min(0).max(100).optional(),
    notes: z.string().optional(),
    assignedTechnician: z.string().nullable().optional(),
  })
  .strict();

export const listRooms = async (req, res, next) => {
  try {
    const { modality, status, q } = req.query;

    const filter = {};
    if (modality) filter.modality = modality;
    if (status) filter.status = status;
    if (q) {
      filter.name = { $regex: String(q).trim(), $options: 'i' };
    }

    const rooms = await ImagingRoom.find(filter)
      .populate('assignedTechnician', 'fullName username role')
      .sort({ name: 1 });
    res.status(200).json({ rooms });
  } catch (err) {
    next(err);
  }
};

export const getRoomById = async (req, res, next) => {
  try {
    const room = await ImagingRoom.findById(req.params.id)
      .populate('assignedTechnician', 'fullName username role');
    if (!room) {
      throw httpError(404, 'Room not found');
    }

    res.status(200).json({ room });
  } catch (err) {
    next(err);
  }
};

export const createRoom = async (req, res, next) => {
  try {
    const parsed = createRoomSchema.safeParse(req.body);
    if (!parsed.success) {
      throw httpError(400, parsed.error.issues[0]?.message || 'Invalid request body');
    }

    const data = parsed.data;

    const existing = await ImagingRoom.findOne({ name: data.name.trim() });
    if (existing) {
      throw httpError(409, 'Room with same name already exists');
    }

    const room = await ImagingRoom.create({
      name: data.name.trim(),
      modality: data.modality,
      status: data.status,
      utilizationPercent: data.utilizationPercent,
      notes: data.notes,
      assignedTechnician: data.assignedTechnician,
    });

    if (data.assignedTechnician) {
      emitToUser(data.assignedTechnician, 'NOTIFICATION', {
        title: 'Room Assignment',
        message: `You have been assigned to ${room.name} (${room.modality}).`,
        type: 'info',
      });
    }

    const populated = await ImagingRoom.findById(room._id)
      .populate('assignedTechnician', 'fullName username role');

    res.status(201).json({ room: populated });
  } catch (err) {
    if (err?.code === 11000) {
      next(httpError(409, 'Duplicate room name'));
      return;
    }
    next(err);
  }
};

export const updateRoom = async (req, res, next) => {
  try {
    const parsed = updateRoomSchema.safeParse(req.body);
    if (!parsed.success) {
      throw httpError(400, parsed.error.issues[0]?.message || 'Invalid request body');
    }

    const room = await ImagingRoom.findById(req.params.id);
    if (!room) {
      throw httpError(404, 'Room not found');
    }

    if (parsed.data.name) room.name = parsed.data.name.trim();
    if (parsed.data.modality) room.modality = parsed.data.modality;
    if (parsed.data.status) room.status = parsed.data.status;
    if (typeof parsed.data.utilizationPercent !== 'undefined') room.utilizationPercent = parsed.data.utilizationPercent;
    if (typeof parsed.data.notes !== 'undefined') room.notes = parsed.data.notes;
    
    // Explicitly handle assignedTechnician (can be null or undefined)
    if (parsed.data.assignedTechnician !== undefined) {
      room.assignedTechnician = parsed.data.assignedTechnician;
      
      if (parsed.data.assignedTechnician) {
        emitToUser(parsed.data.assignedTechnician, 'NOTIFICATION', {
          title: 'Room Assignment Updated',
          message: `You are now assigned to ${room.name}.`,
          type: 'info',
        });
      }
    }

    await room.save();

    const populated = await ImagingRoom.findById(room._id)
      .populate('assignedTechnician', 'fullName username role');

    res.status(200).json({ room: populated });
  } catch (err) {
    if (err?.code === 11000) {
      next(httpError(409, 'Duplicate room name'));
      return;
    }
    next(err);
  }
};

export const deleteRoom = async (req, res, next) => {
  try {
    const room = await ImagingRoom.findByIdAndDelete(req.params.id);
    if (!room) {
      throw httpError(404, 'Room not found');
    }

    res.status(200).json({ room });
  } catch (err) {
    next(err);
  }
};
