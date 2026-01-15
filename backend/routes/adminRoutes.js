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
} from '../controllers/adminController.js';
import { protect, admin } from '../middlewares/auth.js';

const router = express.Router();

// Tutte le route sono protette da protect + admin
router.use(protect, admin);

// Get statistiche
router.get('/stats', getAdminStats);

// Get venditori
router.get('/pending-sellers', getPendingSellers);
router.get('/sellers', getAllSellers);
router.get('/sellers/:id', getSellerProfile);
router.put('/sellers/:id/profile', updateSellerProfile);

// Get prodotti
router.get('/products', getAllProducts);

// Approva/Rifiuta venditore
router.put('/approve-seller/:id', approveSeller);
router.delete('/reject-seller/:id', rejectSeller);

// Sospendi/Riattiva abbonamento venditore
router.put('/sellers/:id/subscription', toggleSubscriptionStatus);

export default router;
