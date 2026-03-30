import express from 'express';
const router = express.Router();
import { protect, admin } from '../middlewares/auth.js';
import { cache } from '../middlewares/cache.js';
import {
  getExperiences,
  getAllExperiences,
  getExperienceById,
  getSimilarExperiences,
  createExperience,
  updateExperience,
  deleteExperience
} from '../controllers/experienceController.js';

// Route pubbliche (CACHE: 5 minuti per liste, 10 minuti per dettagli)
router.get('/', cache(300), getExperiences);
router.get('/:id/similar', cache(600), getSimilarExperiences); // ⚡ Cache 10 minuti - PRIMA di /:id
router.get('/:id', cache(600), getExperienceById);

// Route admin
router.get('/admin/all', protect, admin, getAllExperiences);
router.post('/', protect, admin, createExperience);
router.put('/:id', protect, admin, updateExperience);
router.delete('/:id', protect, admin, deleteExperience);

export default router;
