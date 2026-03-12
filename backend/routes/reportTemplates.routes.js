import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import requireRole from '../middleware/requireRole.js';
import {
  createTemplate,
  deleteTemplate,
  getTemplateById,
  listTemplates,
  updateTemplate,
} from '../controllers/reportTemplates.controller.js';

const router = express.Router();

router.get('/', requireAuth, listTemplates);
router.get('/:id', requireAuth, getTemplateById);

router.post('/', requireAuth, requireRole(['Radiologist', 'Admin']), createTemplate);
router.patch('/:id', requireAuth, requireRole(['Radiologist', 'Admin']), updateTemplate);
router.delete('/:id', requireAuth, requireRole(['Admin']), deleteTemplate);

export default router;
