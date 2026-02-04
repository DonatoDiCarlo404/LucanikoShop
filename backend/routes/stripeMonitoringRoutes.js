import express from 'express';
import { protect } from '../middlewares/auth.js';
import { apiLimiter } from '../middlewares/rateLimiter.js';
import {
  getStripeBalance,
  getStripeTransactions,
  getStripeStats
} from '../controllers/stripeMonitoringController.js';

const router = express.Router();

// Tutti gli endpoint richiedono auth admin
router.use(protect);

// @route   GET /api/admin/stripe/balance
// @desc    Ottieni saldo Stripe account principale (con alert se basso)
// @access  Private/Admin
router.get('/balance', apiLimiter, getStripeBalance);

// @route   GET /api/admin/stripe/transactions
// @desc    Ottieni transazioni Stripe recenti
// @access  Private/Admin
router.get('/transactions', apiLimiter, getStripeTransactions);

// @route   GET /api/admin/stripe/stats
// @desc    Ottieni statistiche Stripe ultimi 30 giorni
// @access  Private/Admin
router.get('/stats', apiLimiter, getStripeStats);

export default router;
