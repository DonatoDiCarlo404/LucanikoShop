import express from 'express';
import { createCheckoutSession } from '../controllers/checkoutController.js';
import { optionalAuth } from '../middlewares/auth.js';

const router = express.Router();

// Crea sessione Stripe Checkout (supporta guest checkout)
// Usa optionalAuth per autenticare l'utente se il token è presente, altrimenti procede come guest
router.post('/create-session', optionalAuth, createCheckoutSession);

export default router;