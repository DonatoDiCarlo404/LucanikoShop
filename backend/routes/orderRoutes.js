import express from 'express';
const router = express.Router();

import { 
  getMyOrders, 
  getOrderById, 
  filterOrders,
  getVendorOrders,
  getVendorStats,
  updateOrderStatus,
  applyDiscountToOrder,
  calculateShippingCost,
  refundOrder
} from '../controllers/orderController.js';
import { protect, optionalAuth } from '../middlewares/auth.js';
import { apiLimiter } from '../middlewares/rateLimiter.js';
import { validateOrderId, validatePagination } from '../middlewares/validators.js';
import Order from '../models/Order.js';

// 🔧 DEBUG ENDPOINT - Rimuovere in produzione
router.get('/debug/all', protect, async (req, res) => {
  try {
    console.log('🔍 [DEBUG] Richiesta debug ordini');
    console.log('🔍 [DEBUG] User ID richiedente:', req.user._id);
    
    // Prendi tutti gli ordini (ultimi 10)
    const allOrders = await Order.find().limit(10).sort({ createdAt: -1 });
    console.log('🔍 [DEBUG] Totale ordini nel DB (ultimi 10):', allOrders.length);
    
    // Cerca ordini per questo specifico user
    const userOrders = await Order.find({ buyer: req.user._id });
    console.log('🔍 [DEBUG] Ordini per questo user:', userOrders.length);
    
    res.json({
      userOrders: userOrders,
      allOrdersSample: allOrders.map(o => ({
        id: o._id,
        buyer: o.buyer,
        buyerType: typeof o.buyer,
        buyerString: o.buyer.toString(),
        userIdString: req.user._id.toString(),
        match: o.buyer.toString() === req.user._id.toString(),
        isPaid: o.isPaid,
        total: o.totalPrice,
        createdAt: o.createdAt
      })),
      requestingUserId: req.user._id.toString()
    });
  } catch (error) {
    console.error('❌ [DEBUG] Errore:', error);
    res.status(500).json({ message: error.message });
  }
});

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
router.get('/', protect, apiLimiter, validatePagination, filterOrders);

// Route specifiche per venditore (devono venire prima di /:id)
router.get('/vendor/received', protect, apiLimiter, validatePagination, getVendorOrders);
router.get('/vendor/stats', protect, apiLimiter, getVendorStats);
router.put('/:id/status', protect, apiLimiter, validateOrderId, updateOrderStatus);

// Calcola costo spedizione per il carrello (accessibile anche a guest)
router.post('/calculate-shipping', optionalAuth, apiLimiter, calculateShippingCost);

// Ottieni tutti gli ordini dell'utente loggato
router.get('/my-orders', protect, apiLimiter, validatePagination, getMyOrders);

// Applica coupon/sconto a un ordine
router.post('/:id/apply-discount', protect, apiLimiter, validateOrderId, applyDiscountToOrder);

// Rimborsa un ordine (solo admin)
router.post('/:id/refund', protect, apiLimiter, validateOrderId, refundOrder);

// Ottieni dettagli di un singolo ordine
router.get('/:id', protect, validateOrderId, getOrderById);

export default router;
