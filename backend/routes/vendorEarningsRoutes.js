import express from 'express';
import { 
  getEarningsSummary, 
  getVendorPayouts, 
  getSalesPending 
} from '../controllers/vendorEarningsController.js';
import { protect } from '../middlewares/auth.js';
import { apiLimiter } from '../middlewares/rateLimiter.js';
import { validateVendorEarningsFilters } from '../middlewares/validators.js';

const router = express.Router();

// Tutte le route sono protette e richiedono autenticazione
router.use(protect);

// @route   GET /api/vendor/earnings/summary
// @desc    Ottieni riepilogo earnings (totalEarnings, pendingEarnings, paidEarnings)
// @access  Private (vendor)
router.get('/summary', apiLimiter, getEarningsSummary);

// @route   GET /api/vendor/earnings/payouts
// @desc    Ottieni storico payouts con filtri e paginazione
// @access  Private (vendor)
// @query   ?page=1&limit=10&status=paid&startDate=2026-01-01&endDate=2026-12-31
router.get('/payouts', apiLimiter, validateVendorEarningsFilters, getVendorPayouts);

// @route   GET /api/vendor/earnings/sales-pending
// @desc    Ottieni vendite in attesa di pagamento (<14 giorni) con countdown
// @access  Private (vendor)
router.get('/sales-pending', apiLimiter, getSalesPending);

export default router;
