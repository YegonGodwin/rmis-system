import mongoose from 'mongoose';

const imagingRoomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    modality: {
      type: String,
      enum: ['CT', 'MRI', 'X-Ray', 'Ultrasound', 'Mammography', 'Fluoroscopy'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Idle', 'Maintenance', 'Offline'],
      default: 'Idle',
      index: true,
    },
    utilizationPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    assignedTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const ImagingRoom = mongoose.model('ImagingRoom', imagingRoomSchema);

export default ImagingRoom;
