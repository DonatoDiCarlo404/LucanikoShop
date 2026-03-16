import express from 'express';
import { 
  getAdminDashboardData, 
  getShopPageData,
  getBatchReviews 
} from '../controllers/aggregateController.js';
import { protect, admin } from '../middlewares/auth.js';
import { cache } from '../middlewares/cache.js';

const router = express.Router();

/**
 * ⚡ PERFORMANCE: Route aggregate per ridurre chiamate HTTP multiple
 * Queste route combinano più query in una sola risposta
 */

// @desc    Get dati completi dashboard admin (stats + sellers + docs)
// @route   GET /api/aggregate/admin-dashboard
// @access  Private/Admin
router.get('/admin-dashboard', protect, admin, getAdminDashboardData);

// @desc    Get dati completi shop (vendor + products)
// @route   GET /api/aggregate/shop/:idOrSlug
// @access  Public
// Cache 5 minuti per dati vendor + prodotti
router.get('/shop/:idOrSlug', cache(300), getShopPageData);

// @desc    Get reviews per batch di prodotti
// @route   POST /api/aggregate/reviews-batch
// @access  Public
router.post('/reviews-batch', getBatchReviews);

export default router;
