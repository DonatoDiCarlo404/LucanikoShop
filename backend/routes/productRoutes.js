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
  getOtherCategoriesProducts,
  toggleProductVisibility,
} from '../controllers/productController.js';
import { protect, seller, admin } from '../middlewares/auth.js';
import { cache } from '../middlewares/cache.js';

const router = express.Router();

// Rotte pubbliche (CACHE: 5 minuti per liste, 10 minuti per singolo prodotto)
router.get('/', cache(300), getProducts);
router.get('/other-categories', cache(300), getOtherCategoriesProducts); // Prodotti di altre categorie
router.get('/:id', cache(600), getProductById);
router.post('/suggested', cache(300, (req) => {
  // Genera chiave cache includendo sameVendor, sellerId e productId dal body
  const { sameVendor, cartItems } = req.body;
  const sellerIds = cartItems?.map(item => 
    item.seller?._id || item.seller
  ).filter(Boolean).sort().join(',') || 'none';
  const productId = cartItems?.[0]?._id || 'none';
  return `cache:/api/products/suggested:sv=${sameVendor}:s=${sellerIds.substring(0, 20)}:p=${productId}`;
}), getSuggestedProducts); // Nuova route per prodotti suggeriti

// Rotta per contare prodotti in attesa (admin)
router.get('/pending/count', protect, admin, getPendingProductsCount);

// Rotte protette (seller/admin)
router.post('/', protect, seller, createProduct);
router.patch('/:id/toggle-visibility', protect, seller, toggleProductVisibility);
router.put('/:id', protect, seller, updateProduct);
router.delete('/:id', protect, seller, deleteProduct);
router.post('/:id/images', protect, seller, addProductImage);

// Rotta per ottenere i prodotti del seller loggato
router.get('/seller/my-products', protect, seller, getMyProducts);

export default router;