import { z } from 'zod';
import Study from '../models/study.js';
import StudyImage from '../models/studyImage.js';
import httpError from '../utils/httpError.js';
import audit from '../utils/audit.js';
import { WorkflowOrchestrator } from '../services/workflow.service.js';

const MAX_IMAGES_PER_UPLOAD = 20;
const MAX_BASE64_SIZE = 5 * 1024 * 1024; // ~5MB per image (base64 string length)

const imageSchema = z.object({
  imageData: z.string().min(1, 'imageData is required'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']).optional(),
  seriesDescription: z.string().optional(),
  seriesNumber: z.coerce.number().int().positive().optional(),
  instanceNumber: z.coerce.number().int().positive().optional(),
  notes: z.string().optional(),
});

const uploadSchema = z.object({
  images: z.array(imageSchema).min(1, 'At least one image is required').max(MAX_IMAGES_PER_UPLOAD),
  completeStudy: z.boolean().optional().default(true),
});

/**
 * POST /studies/:id/images
 * Upload images for a study. Optionally marks the study as Completed.
 */
export const uploadStudyImages = async (req, res, next) => {
  try {
    const parsed = uploadSchema.safeParse(req.body);
    if (!parsed.success) {
      throw httpError(400, parsed.error.issues[0]?.message || 'Invalid request body');
    }

    const study = await Study.findById(req.params.id);
    if (!study) throw httpError(404, 'Study not found');

    if (!['In Progress', 'Checked In'].includes(study.status)) {
      throw httpError(409, `Cannot upload images for a study with status "${study.status}"`);
    }

    const { images, completeStudy } = parsed.data;

    // Validate base64 sizes
    for (const img of images) {
      if (img.imageData.length > MAX_BASE64_SIZE) {
        throw httpError(413, 'One or more images exceed the 5MB size limit');
      }
      if (!img.imageData.startsWith('data:image/')) {
        throw httpError(400, 'imageData must be a valid base64 data URI (data:image/...)');
      }
    }

    const docs = images.map((img, idx) => ({
      study: study._id,
      imageData: img.imageData,
      mimeType: img.mimeType || 'image/jpeg',
      seriesDescription: img.seriesDescription || 'Series 1',
      seriesNumber: img.seriesNumber || 1,
      instanceNumber: img.instanceNumber || idx + 1,
      notes: img.notes,
      fileSizeBytes: Math.round((img.imageData.length * 3) / 4),
      uploadedBy: req.user?.id,
    }));

    const inserted = await StudyImage.insertMany(docs);

    await audit({
      actorId: req.user?.id,
      action: 'Uploaded study images',
      targetType: 'Study',
      targetId: String(study._id),
      ipAddress: req.ip,
      metadata: { studyId: study.studyId, imageCount: inserted.length },
    });

    // Optionally complete the study
    if (completeStudy) {
      if (!study.performedStartAt) study.performedStartAt = new Date();
      study.performedEndAt = new Date();
      study.status = 'Completed';
      await study.save();
      await WorkflowOrchestrator.onStudyStatusChange(study._id, 'Completed');
    }

    res.status(201).json({
      uploaded: inserted.length,
      studyStatus: study.status,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /studies/:id/images
 * Returns image metadata + data for a study.
 * Pass ?metaOnly=true to skip imageData (for thumbnails list).
 */
export const getStudyImages = async (req, res, next) => {
  try {
    const study = await Study.findById(req.params.id);
    if (!study) throw httpError(404, 'Study not found');

    const metaOnly = req.query.metaOnly === 'true';

    const projection = metaOnly
      ? { imageData: 0 }
      : {};

    const images = await StudyImage.find({ study: study._id }, projection)
      .sort({ seriesNumber: 1, instanceNumber: 1 });

    res.status(200).json({ images, total: images.length });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /studies/:id/images/:imageId
 * Remove a single image (technician/admin only, study must not be Completed).
 */
export const deleteStudyImage = async (req, res, next) => {
  try {
    const study = await Study.findById(req.params.id);
    if (!study) throw httpError(404, 'Study not found');

    if (study.status === 'Completed') {
      throw httpError(409, 'Cannot delete images from a completed study');
    }

    const image = await StudyImage.findOneAndDelete({
      _id: req.params.imageId,
      study: study._id,
    });

    if (!image) throw httpError(404, 'Image not found');

    res.status(200).json({ message: 'Image deleted' });
  } catch (err) {
    next(err);
  }
};
