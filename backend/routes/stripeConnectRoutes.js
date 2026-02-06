import express from 'express';
import { protect, seller } from '../middlewares/auth.js';
import {
  createConnectAccount,
  getAccountStatus,
  refreshOnboardingLink,
  createDashboardLink
} from '../controllers/stripeConnectController.js';

const router = express.Router();

// NOTA: Il webhook Connect è montato direttamente in server.js PRIMA di express.json()
// per garantire che riceva il raw body necessario alla verifica Stripe

// Routes protette per venditori
router.post('/create-account', protect, seller, createConnectAccount);
router.get('/account-status', protect, seller, getAccountStatus);
router.post('/refresh-onboarding', protect, seller, refreshOnboardingLink);
router.post('/dashboard-link', protect, seller, createDashboardLink);

export default router;
