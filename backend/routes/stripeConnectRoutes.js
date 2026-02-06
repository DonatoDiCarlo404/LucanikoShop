import express from 'express';
import { protect, seller } from '../middlewares/auth.js';
import {
  createConnectAccount,
  getAccountStatus,
  refreshOnboardingLink,
  createDashboardLink,
  handleConnectWebhook
} from '../controllers/stripeConnectController.js';

const router = express.Router();

// Webhook pubblico (verificato con Stripe signature)
// IMPORTANTE: Deve essere raw body, non JSON parsed
router.post('/webhook', express.raw({ type: 'application/json' }), handleConnectWebhook);

// Routes protette per venditori
router.post('/create-account', protect, seller, createConnectAccount);
router.get('/account-status', protect, seller, getAccountStatus);
router.post('/refresh-onboarding', protect, seller, refreshOnboardingLink);
router.post('/dashboard-link', protect, seller, createDashboardLink);

export default router;
