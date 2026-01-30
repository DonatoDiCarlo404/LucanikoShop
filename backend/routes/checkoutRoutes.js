import express from 'express';
import { createCheckoutSession } from '../controllers/checkoutController.js';
import { handleCheckoutSuccess } from '../controllers/checkoutSuccessController.js';
import { optionalAuth } from '../middlewares/auth.js';

const router = express.Router();

// Crea sessione Stripe Checkout (supporta guest checkout)
// Usa optionalAuth per autenticare l'utente se il token è presente, altrimenti procede come guest
router.post('/create-session', optionalAuth, createCheckoutSession);

// Gestisce il success redirect dopo il pagamento
// Crea l'ordine se il webhook non è arrivato
router.get('/success', handleCheckoutSuccess);

export default router;