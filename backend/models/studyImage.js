import mongoose from 'mongoose';

const studyImageSchema = new mongoose.Schema(
  {
    study: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Study',
      required: true,
      index: true,
    },
    seriesDescription: {
      type: String,
      trim: true,
      default: 'Series 1',
    },
    seriesNumber: {
      type: Number,
      default: 1,
    },
    instanceNumber: {
      type: Number,
      default: 1,
    },
    // Base64-encoded image data with data URI prefix (e.g. "data:image/jpeg;base64,...")
    imageData: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      enum: ['image/jpeg', 'image/png', 'image/webp'],
      default: 'image/jpeg',
    },
    fileSizeBytes: {
      type: Number,
    },
    notes: {
      type: String,
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
  },
  { timestamps: true },
);

studyImageSchema.index({ study: 1, seriesNumber: 1, instanceNumber: 1 });

const StudyImage = mongoose.model('StudyImage', studyImageSchema);

export default StudyImage;
