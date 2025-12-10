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
} from '../controllers/productController.js';
import { protect, seller, admin } from '../middlewares/auth.js';

const router = express.Router();

// Rotte pubbliche
router.get('/', getProducts);
router.get('/:id', getProductById);

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