import express from 'express';
import {
  getPendingSellers,
  getAllSellers,
  approveSeller,
  rejectSeller,
  getAdminStats,
  toggleSubscriptionStatus,
  getSellerProfile,
  updateSellerProfile,
  getAllProducts,
  getAllOrders,
  registerVendor,
} from '../controllers/adminController.js';
import { protect, admin } from '../middlewares/auth.js';
import { adminLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Tutte le route sono protette da protect + admin
router.use(protect, admin);

// Registra venditore (admin)
router.post('/register-vendor', adminLimiter, registerVendor);

// Get statistiche
router.get('/stats', getAdminStats);

// Get venditori
router.get('/pending-sellers', getPendingSellers);
router.get('/sellers', getAllSellers);
router.get('/sellers/:id', getSellerProfile);
router.put('/sellers/:id/profile', updateSellerProfile);

// Get prodotti
router.get('/products', getAllProducts);

// Get ordini
router.get('/orders', getAllOrders);

// Approva/Rifiuta venditore
router.put('/approve-seller/:id', approveSeller);
router.delete('/reject-seller/:id', rejectSeller);

// Sospendi/Riattiva abbonamento venditore
router.put('/sellers/:id/subscription', toggleSubscriptionStatus);

export default router;
