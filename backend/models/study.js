import mongoose from 'mongoose';

const studySchema = new mongoose.Schema(
  {
    studyId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    accessionNumber: {
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
    imagingRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ImagingRequest',
      index: true,
    },
    modality: {
      type: String,
      enum: ['CT', 'MRI', 'X-Ray', 'Ultrasound', 'Mammography', 'Fluoroscopy'],
      required: true,
      index: true,
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
      trim: true,
    },
    referringPhysician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    scheduledStartAt: {
      type: Date,
      index: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ImagingRoom',
      index: true,
    },
    performedStartAt: {
      type: Date,
    },
    performedEndAt: {
      type: Date,
    },
    checkedInAt: {
      type: Date,
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    identityMethod: {
      type: String,
      enum: ['Government ID', 'Insurance Card', 'Facility Bracelet', 'Biometric', 'Other'],
    },
    identityVerifiedAt: {
      type: Date,
    },
    identityVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    consentSigned: {
      type: Boolean,
    },
    consentSignedAt: {
      type: Date,
    },
    consentSignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    safetyScreeningCompleted: {
      type: Boolean,
    },
    safetyScreeningAt: {
      type: Date,
    },
    safetyScreeningBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    safetyScreeningNotes: {
      type: String,
      trim: true,
    },
    delayedAt: {
      type: Date,
    },
    delayedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    delayReason: {
      type: String,
      trim: true,
    },
    canceledAt: {
      type: Date,
    },
    canceledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    cancelReason: {
      type: String,
      trim: true,
    },
    noShowAt: {
      type: Date,
    },
    noShowBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    noShowReason: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Checked In', 'In Progress', 'Completed', 'Canceled', 'No Show', 'Delayed'],
      default: 'Scheduled',
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

studySchema.index({ patient: 1, scheduledStartAt: -1 });

const Study = mongoose.model('Study', studySchema);

export default Study;
