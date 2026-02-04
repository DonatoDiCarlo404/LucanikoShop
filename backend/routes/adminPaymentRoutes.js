import express from 'express';
import { protect } from '../middlewares/auth.js';
import { paymentLimiter, exportLimiter } from '../middlewares/rateLimiter.js';
import {
  validatePayoutId,
  validateAdminPaymentFilters,
  validateMarkAsPaidBody
} from '../middlewares/validators.js';
import {
  getPendingPayouts,
  getPaymentStatistics,
  getVendorsList,
  getTransferLog,
  exportTransferLogCSV,
  payNow,
  retryTransfer,
  markAsPaid,
  getAnalytics
} from '../controllers/adminPaymentController.js';

const router = express.Router();

// @route   GET /api/admin/payments/pending-payouts
// @desc    Ottieni tutti i VendorPayout pending pronti per pagamento (>14 giorni)
// @access  Private/Admin
router.get('/pending-payouts', protect, validateAdminPaymentFilters, getPendingPayouts);

// @route   GET /api/admin/payments/statistics
// @desc    Ottieni statistiche pagamenti per admin dashboard
// @access  Private/Admin
router.get('/statistics', protect, getPaymentStatistics);

// @route   GET /api/admin/payments/vendors-list
// @desc    Ottieni lista venditori con payouts
// @access  Private/Admin
router.get('/vendors-list', protect, getVendorsList);

// @route   GET /api/admin/payments/transfer-log
// @desc    Ottieni log di tutti i transfer effettuati
// @access  Private/Admin
router.get('/transfer-log', protect, validateAdminPaymentFilters, getTransferLog);

// @route   GET /api/admin/payments/transfer-log/export
// @desc    Esporta transfer log in CSV
// @access  Private/Admin
router.get('/transfer-log/export', protect, exportLimiter, validateAdminPaymentFilters, exportTransferLogCSV);

// @route   POST /api/admin/payments/pay-now/:payoutId
// @desc    Forza pagamento immediato di un payout
// @access  Private/Admin
router.post('/pay-now/:payoutId', protect, paymentLimiter, validatePayoutId, payNow);

// @route   POST /api/admin/payments/retry/:payoutId
// @desc    Riprova transfer fallito
// @access  Private/Admin
router.post('/retry/:payoutId', protect, paymentLimiter, validatePayoutId, retryTransfer);

// @route   POST /api/admin/payments/mark-paid/:payoutId
// @desc    Segna payout come pagato manualmente
// @access  Private/Admin
router.post('/mark-paid/:payoutId', protect, paymentLimiter, validatePayoutId, validateMarkAsPaidBody, markAsPaid);

// @route   GET /api/admin/payments/analytics
// @desc    Ottieni analytics pagamenti (grafici e statistiche)
// @access  Private/Admin
router.get('/analytics', protect, getAnalytics);

export default router;
