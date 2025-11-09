import express from 'express';
import {
  getPendingSellers,
  getAllSellers,
  approveSeller,
  rejectSeller,
  getAdminStats,
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

// Approva/Rifiuta venditore
router.put('/approve-seller/:id', approveSeller);
router.delete('/reject-seller/:id', rejectSeller);

export default router;
