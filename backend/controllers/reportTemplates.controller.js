import { z } from 'zod';
import ReportTemplate from '../models/reportTemplate.js';
import httpError from '../utils/httpError.js';

const createTemplateSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  modality: z.enum(['CT', 'MRI', 'X-Ray', 'Ultrasound', 'Mammography', 'Fluoroscopy']),
  bodyPart: z.string().optional(),
  technique: z.string().optional(),
  findings: z.string().optional(),
  impression: z.string().optional(),
  recommendations: z.string().optional(),
  isActive: z.boolean().optional(),
});

const updateTemplateSchema = z
  .object({
    name: z.string().min(1).optional(),
    category: z.string().optional(),
    modality: z.enum(['CT', 'MRI', 'X-Ray', 'Ultrasound', 'Mammography', 'Fluoroscopy']).optional(),
    bodyPart: z.string().optional(),
    technique: z.string().optional(),
    findings: z.string().optional(),
    impression: z.string().optional(),
    recommendations: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const listTemplates = async (req, res, next) => {
  try {
    const { category, modality, bodyPart, isActive, q, limit = '50', page = '1' } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (modality) filter.modality = modality;
    if (bodyPart) filter.bodyPart = bodyPart;
    if (typeof isActive !== 'undefined') filter.isActive = String(isActive) === 'true';

    if (q) {
      const term = String(q).trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { category: { $regex: term, $options: 'i' } },
        { bodyPart: { $regex: term, $options: 'i' } },
      ];
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [templates, total] = await Promise.all([
      ReportTemplate.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(safeLimit),
      ReportTemplate.countDocuments(filter),
    ]);

    res.status(200).json({
      templates,
      page: safePage,
      limit: safeLimit,
      total,
    });
  } catch (err) {
    next(err);
  }
};

export const getTemplateById = async (req, res, next) => {
  try {
    const template = await ReportTemplate.findById(req.params.id);
    if (!template) {
      throw httpError(404, 'Template not found');
    }

    res.status(200).json({ template });
  } catch (err) {
    next(err);
  }
};

export const createTemplate = async (req, res, next) => {
  try {
    if (!req.user) {
      throw httpError(401, 'Unauthorized');
    }

    const parsed = createTemplateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw httpError(400, parsed.error.issues[0]?.message || 'Invalid request body');
    }

    const data = parsed.data;

    const template = await ReportTemplate.create({
      name: data.name,
      category: data.category,
      modality: data.modality,
      bodyPart: data.bodyPart,
      technique: data.technique,
      findings: data.findings,
      impression: data.impression,
      recommendations: data.recommendations,
      createdBy: req.user.id,
      isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
    });

    res.status(201).json({ template });
  } catch (err) {
    next(err);
  }
};

export const updateTemplate = async (req, res, next) => {
  try {
    const parsed = updateTemplateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw httpError(400, parsed.error.issues[0]?.message || 'Invalid request body');
    }

    const template = await ReportTemplate.findById(req.params.id);
    if (!template) {
      throw httpError(404, 'Template not found');
    }

    Object.assign(template, parsed.data);
    await template.save();

    res.status(200).json({ template });
  } catch (err) {
    next(err);
  }
};

export const deleteTemplate = async (req, res, next) => {
  try {
    const template = await ReportTemplate.findByIdAndDelete(req.params.id);
    if (!template) {
      throw httpError(404, 'Template not found');
    }

    res.status(200).json({ template });
  } catch (err) {
    next(err);
  }
};
