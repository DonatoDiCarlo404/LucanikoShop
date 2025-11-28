import express from 'express';
const router = express.Router();

import { getMyOrders, getOrderById, filterOrders } from '../controllers/orderController.js';
import { protect } from '../middlewares/auth.js';
import Order from '../models/Order.js';

// Route per verificare se l'utente ha acquistato un prodotto
router.get('/check-purchased/:productId', protect, async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.user._id;

    const order = await Order.findOne({
      buyer: userId,
      isPaid: true,
      'items.product': productId
    });

    res.json({ purchased: !!order });
  } catch (error) {
    console.error('[checkPurchased] Errore:', error);
    res.status(500).json({ message: 'Errore server' });
  }
});

// Filtra ordini per query string (productId, buyer, isPaid)
router.get('/', protect, filterOrders);

// Ottieni tutti gli ordini dell'utente loggato
router.get('/my-orders', protect, getMyOrders);

// Ottieni dettagli di un singolo ordine
router.get('/:id', protect, getOrderById);

export default router;
