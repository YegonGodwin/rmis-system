import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
  {
    mrn: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true,
    },
    contact: {
      phone: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      address: { type: String, trim: true },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastVisitAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

const Patient = mongoose.model('Patient', patientSchema);

export default Patient;
