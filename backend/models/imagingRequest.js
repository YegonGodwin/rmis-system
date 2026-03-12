import mongoose from 'mongoose';

const imagingRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    modality: {
      type: String,
      enum: ['CT', 'MRI', 'X-Ray', 'Ultrasound', 'Mammography', 'Fluoroscopy'],
      required: true,
    },
    bodyPart: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Routine', 'Urgent', 'STAT'],
      required: true,
      index: true,
    },
    clinicalIndication: {
      type: String,
      required: true,
      trim: true,
    },
    specialInstructions: {
      type: String,
      trim: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Scheduled', 'Completed'],
      default: 'Pending',
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: {
      type: Date,
    },
    scheduledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

imagingRequestSchema.index({ patient: 1, createdAt: -1 });

const ImagingRequest = mongoose.model('ImagingRequest', imagingRequestSchema);

export default ImagingRequest;
