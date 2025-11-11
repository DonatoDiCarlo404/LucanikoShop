import express from 'express';
import { createCheckoutSession } from '../controllers/checkoutController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// Crea sessione Stripe Checkout (protetta - solo utenti autenticati)
router.post('/create-session', protect, createCheckoutSession);

export default router;