import express from 'express';
import { createCheckoutSession } from '../controllers/checkoutController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// Crea sessione Stripe Checkout (supporta guest checkout)
// Il middleware protect è stato rimosso per permettere acquisti senza registrazione
router.post('/create-session', createCheckoutSession);

export default router;