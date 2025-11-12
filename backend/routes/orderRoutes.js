import express from 'express';
import { getMyOrders, getOrderById } from '../controllers/orderController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// Ottieni tutti gli ordini dell'utente loggato
router.get('/my-orders', protect, getMyOrders);

// Ottieni dettagli di un singolo ordine
router.get('/:id', protect, getOrderById);

export default router;