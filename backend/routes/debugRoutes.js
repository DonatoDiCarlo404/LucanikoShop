import express from 'express';
import { createTestOrder } from '../controllers/debugController.js';

const router = express.Router();

// ⚠️ SOLO PER DEBUG IN DEVELOPMENT
// Endpoint per testare la creazione di ordini senza webhook Stripe
if (process.env.NODE_ENV !== 'production') {
  router.post('/create-test-order', createTestOrder);
}

export default router;
