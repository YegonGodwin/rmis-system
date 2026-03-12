import mongoose from 'mongoose';

const qcLogSchema = new mongoose.Schema(
  {
    qcLogId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ImagingRoom',
      required: true,
      index: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    testType: {
      type: String,
      required: true,
      trim: true,
    },
    result: {
      type: String,
      enum: ['Pass', 'Fail', 'Warning'],
      required: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    performedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

qcLogSchema.index({ room: 1, performedAt: -1 });

const QcLog = mongoose.model('QcLog', qcLogSchema);

export default QcLog;
