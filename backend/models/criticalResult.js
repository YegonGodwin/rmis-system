import mongoose from 'mongoose';

const criticalResultSchema = new mongoose.Schema(
  {
    criticalResultId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RadiologyReport',
      index: true,
    },
    study: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Study',
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    studyType: {
      type: String,
      required: true,
      trim: true,
    },
    finding: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: String,
      enum: ['Critical', 'Urgent'],
      required: true,
      index: true,
    },
    radiologist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    notifiedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    notificationMethod: {
      type: String,
      enum: ['Phone', 'SMS', 'Email', 'In-Person'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Acknowledged', 'Escalated'],
      default: 'Pending',
      index: true,
    },
    notifiedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    acknowledgedAt: {
      type: Date,
    },
    escalatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

criticalResultSchema.index({ status: 1, notifiedAt: -1 });

const CriticalResult = mongoose.model('CriticalResult', criticalResultSchema);

export default CriticalResult;
