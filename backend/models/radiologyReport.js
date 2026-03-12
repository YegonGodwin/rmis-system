import mongoose from 'mongoose';

const radiologyReportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    study: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Study',
      required: true,
      unique: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    accessionNumber: {
      type: String,
      required: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    radiologist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Preliminary', 'Final'],
      default: 'Draft',
      index: true,
    },
    studyType: {
      type: String,
      required: true,
      trim: true,
    },
    technique: {
      type: String,
      trim: true,
    },
    findings: {
      type: String,
      required: true,
      trim: true,
    },
    impression: {
      type: String,
      required: true,
      trim: true,
    },
    recommendations: {
      type: String,
      trim: true,
    },
    isCritical: {
      type: Boolean,
      default: false,
      index: true,
    },
    finalizedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

radiologyReportSchema.index({ patient: 1, createdAt: -1 });
radiologyReportSchema.index({ radiologist: 1, createdAt: -1 });

const RadiologyReport = mongoose.model('RadiologyReport', radiologyReportSchema);

export default RadiologyReport;
