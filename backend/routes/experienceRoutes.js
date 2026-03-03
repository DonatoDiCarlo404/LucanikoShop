import express from 'express';
const router = express.Router();
import { protect, admin } from '../middlewares/auth.js';
import {
  getExperiences,
  getAllExperiences,
  getExperienceById,
  createExperience,
  updateExperience,
  deleteExperience
} from '../controllers/experienceController.js';

// Route pubbliche
router.get('/', getExperiences);
router.get('/:id', getExperienceById);

// Route admin
router.get('/admin/all', protect, admin, getAllExperiences);
router.post('/', protect, admin, createExperience);
router.put('/:id', protect, admin, updateExperience);
router.delete('/:id', protect, admin, deleteExperience);

export default router;
