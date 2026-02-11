import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
  getMyProducts,
  getPendingProductsCount,
  getSuggestedProducts,
} from '../controllers/productController.js';
import { protect, seller, admin } from '../middlewares/auth.js';
import { cache } from '../middlewares/cache.js';

const router = express.Router();

// Rotte pubbliche (CACHE: 5 minuti per liste, 10 minuti per singolo prodotto)
router.get('/', cache(300), getProducts);
router.get('/:id', cache(600), getProductById);
router.post('/suggested', cache(300), getSuggestedProducts); // Nuova route per prodotti suggeriti

// Rotta per contare prodotti in attesa (admin)
router.get('/pending/count', protect, admin, getPendingProductsCount);

// Rotte protette (seller/admin)
router.post('/', protect, seller, createProduct);
router.put('/:id', protect, seller, updateProduct);
router.delete('/:id', protect, seller, deleteProduct);
router.post('/:id/images', protect, seller, addProductImage);

// Rotta per ottenere i prodotti del seller loggato
router.get('/seller/my-products', protect, seller, getMyProducts);

export default router;