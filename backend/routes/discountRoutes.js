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

const router = express.Router();

// Route pubbliche
router.get('/active-products', getActiveDiscountedProducts);

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
