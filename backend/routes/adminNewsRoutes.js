import express from 'express';
import {
  getAllActiveNews,
  getAllNews,
  createNews,
  updateNews,
  deleteNews
} from '../controllers/adminNewsController.js';
import { protect, admin } from '../middlewares/auth.js';

const router = express.Router();

// Route pubblica per ottenere news attive
router.get('/', getAllActiveNews);

// Route protette admin
router.get('/all', protect, admin, getAllNews);
router.post('/', protect, admin, createNews);
router.put('/:id', protect, admin, updateNews);
router.delete('/:id', protect, admin, deleteNews);

export default router;
