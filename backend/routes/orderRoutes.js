import express from 'express';
const router = express.Router();

import { 
  getMyOrders, 
  getOrderById, 
  filterOrders,
  getVendorOrders,
  getVendorStats,
  updateOrderStatus,
  applyDiscountToOrder
} from '../controllers/orderController.js';
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

// Route specifiche per venditore (devono venire prima di /:id)
router.get('/vendor/received', protect, getVendorOrders);
router.get('/vendor/stats', protect, getVendorStats);
router.put('/:id/status', protect, updateOrderStatus);

// Ottieni tutti gli ordini dell'utente loggato
router.get('/my-orders', protect, getMyOrders);

// Applica coupon/sconto a un ordine
router.post('/:id/apply-discount', protect, applyDiscountToOrder);

// Ottieni dettagli di un singolo ordine
router.get('/:id', protect, getOrderById);

export default router;
