import express from 'express';
import { handleStripeWebhook } from '../controllers/webhookController.js';

const router = express.Router();

// Route GET per verificare che il webhook sia raggiungibile
router.get('/stripe', (req, res) => {
  res.json({ 
    message: 'Stripe webhook endpoint is active. Use POST with Stripe signature.',
    status: 'ok' 
  });
});

// ⚠️ IMPORTANTE: Questa route deve usare express.raw() per il body
// perché Stripe ha bisogno del raw body per verificare la firma
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

export default router;