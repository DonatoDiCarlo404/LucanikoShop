import express from 'express';
import {
  getShopSettings,
  updateShopSettings,
  updateShippingSettings,
  updateProductSettings,
  getPublicShopSettings,
  calculateShipping
} from '../controllers/shopSettingsController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Route pubbliche
router.get('/public/:sellerId', getPublicShopSettings);
router.post('/calculate-shipping', calculateShipping);

// Route protette (solo seller)
router.use(protect);

router
  .route('/')
  .get(authorize('seller', 'admin'), getShopSettings)
  .put(authorize('seller', 'admin'), updateShopSettings);

router.put('/shipping', authorize('seller', 'admin'), updateShippingSettings);
router.put('/products', authorize('seller', 'admin'), updateProductSettings);

export default router;
