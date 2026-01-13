import express from 'express';
import { protect, admin } from '../middlewares/auth.js';
import {
  createCategoryAttribute,
  updateCategoryAttribute,
  deleteCategoryAttribute,
  getAllCategoryAttributes
} from '../controllers/categoryAttributeController.js';

const router = express.Router();

// Tutte le route richiedono autenticazione admin
router.use(protect, admin);

// GET /api/category-attributes - Lista tutti gli attributi
router.get('/', getAllCategoryAttributes);

// POST /api/category-attributes - Crea nuovo attributo
router.post('/', createCategoryAttribute);

// PUT /api/category-attributes/:id - Aggiorna attributo
router.put('/:id', updateCategoryAttribute);

// DELETE /api/category-attributes/:id - Elimina attributo
router.delete('/:id', deleteCategoryAttribute);

export default router;
