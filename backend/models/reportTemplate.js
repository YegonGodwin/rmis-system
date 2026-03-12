import mongoose from 'mongoose';

const reportTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      trim: true,
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
    technique: {
      type: String,
      trim: true,
    },
    findings: {
      type: String,
      trim: true,
    },
    impression: {
      type: String,
      trim: true,
    },
    recommendations: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

reportTemplateSchema.index({ category: 1, modality: 1, bodyPart: 1 });

const ReportTemplate = mongoose.model('ReportTemplate', reportTemplateSchema);

export default ReportTemplate;
