import express from 'express';
import {
  createDiscount,
  getMyDiscounts,
  getDiscount,
  updateDiscount,
  deleteDiscount,
  toggleDiscount,
  validateCoupon,
  getActiveDiscountedProducts
} from '../controllers/discountController.js';
import { protect, authorize, optionalAuth } from '../middlewares/auth.js';
import { cache } from '../middlewares/cache.js';

const router = express.Router();

// Route pubbliche
// ⚡ PERFORMANCE: Cache 3 minuti per prodotti in offerta (chiave dinamica per paginazione/filtri)
router.get('/active-products', cache(180, (req) => {
  const { page, limit, sortBy, category, subcategory, minDiscount, maxDiscount, search } = req.query;
  return `cache:/api/discounts/active-products:p=${page || 1}:l=${limit || 12}:s=${sortBy || 'random'}:c=${category || ''}:sc=${subcategory || ''}:min=${minDiscount || ''}:max=${maxDiscount || ''}:q=${search || ''}`;
}), getActiveDiscountedProducts);

// Route con autenticazione opzionale (anche per guest)
router.post('/validate-coupon', optionalAuth, validateCoupon);

// Route protette (solo seller e admin)
router.use(protect); // Tutte le route successive richiedono autenticazione

router
  .route('/')
  .get(authorize('seller', 'admin'), getMyDiscounts)
  .post(authorize('seller', 'admin'), createDiscount);

router
  .route('/:id')
  .get(authorize('seller', 'admin'), getDiscount)
  .put(authorize('seller', 'admin'), updateDiscount)
  .delete(authorize('seller', 'admin'), deleteDiscount);

router.patch('/:id/toggle', authorize('seller', 'admin'), toggleDiscount);

export default router;
