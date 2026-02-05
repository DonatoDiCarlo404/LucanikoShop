import express from 'express';
import Stripe from 'stripe';
import { protect, seller } from '../middlewares/auth.js';
import User from '../models/User.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @route   POST /api/stripe-connect/create-account
// @desc    Crea un account Stripe Connect per il venditore
// @access  Private (Seller only)
router.post('/create-account', protect, seller, async (req, res) => {
  try {
    console.log('[STRIPE CONNECT] Inizio creazione account per user:', req.user._id);
    const user = await User.findById(req.user._id);
    console.log('[STRIPE CONNECT] User trovato:', { 
      id: user._id, 
      email: user.email, 
      businessName: user.businessName,
      vatNumber: user.vatNumber 
    });

    // Verifica se l'utente ha già un account Stripe Connect
    if (user.shopSettings?.paymentMethods?.stripe?.accountId) {
      console.log('[STRIPE CONNECT] Account già esistente:', user.shopSettings.paymentMethods.stripe.accountId);
      return res.status(400).json({ 
        message: 'Account Stripe già collegato',
        accountId: user.shopSettings.paymentMethods.stripe.accountId 
      });
    }

    // Determina l'URL del profilo venditore (deve essere HTTPS per live mode)
    const vendorUrl = process.env.FRONTEND_URL?.startsWith('http://localhost') 
      ? 'https://www.lucanikoshop.it' 
      : process.env.FRONTEND_URL || 'https://www.lucanikoshop.it';

    console.log('[STRIPE CONNECT] Vendor URL:', vendorUrl);

    // Crea un nuovo Stripe Connect Account (Express)
    console.log('[STRIPE CONNECT] Tentativo creazione account Stripe...');
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'IT',
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      business_type: 'company',
      company: {
        name: user.businessName || user.name,
        tax_id: user.vatNumber || undefined
      },
      business_profile: {
        mcc: '5399', // Miscellaneous general merchandise
        url: vendorUrl
      }
    });

    console.log('[STRIPE CONNECT] Account Stripe creato:', account.id);

    console.log('[STRIPE CONNECT] Account Stripe creato:', account.id);

    // Salva l'account ID nel database
    if (!user.shopSettings) {
      user.shopSettings = {};
    }
    if (!user.shopSettings.paymentMethods) {
      user.shopSettings.paymentMethods = {};
    }
    user.shopSettings.paymentMethods.stripe = {
      enabled: false,
      accountId: account.id,
      onboardingComplete: false
    };

    console.log('[STRIPE CONNECT] Salvataggio nel database...');
    await user.save();
    console.log('[STRIPE CONNECT] Account salvato nel database');

    res.json({
      message: 'Account Stripe Connect creato con successo',
      accountId: account.id
    });
  } catch (error) {
    console.error('[STRIPE CONNECT] ❌ ERRORE:', error);
    console.error('[STRIPE CONNECT] Errore dettagli:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode
    });
    res.status(500).json({ 
      message: 'Errore durante la creazione dell\'account Stripe',
      error: error.message 
    });
  }
});

// @route   POST /api/stripe-connect/create-onboarding-link
// @desc    Crea un link per l'onboarding del venditore su Stripe
// @access  Private (Seller only)
router.post('/create-onboarding-link', protect, seller, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.shopSettings?.paymentMethods?.stripe?.accountId) {
      return res.status(400).json({ 
        message: 'Devi prima creare un account Stripe Connect' 
      });
    }

    // Crea un Account Link per l'onboarding
    const accountLink = await stripe.accountLinks.create({
      account: user.shopSettings.paymentMethods.stripe.accountId,
      refresh_url: `${process.env.FRONTEND_URL}/vendor/dashboard?stripe_refresh=true`,
      return_url: `${process.env.FRONTEND_URL}/vendor/dashboard?stripe_onboarding=success`,
      type: 'account_onboarding'
    });

    res.json({
      message: 'Link di onboarding creato con successo',
      url: accountLink.url
    });
  } catch (error) {
    console.error('Errore creazione onboarding link:', error);
    res.status(500).json({ 
      message: 'Errore durante la creazione del link di onboarding',
      error: error.message 
    });
  }
});

// @route   GET /api/stripe-connect/account-status
// @desc    Verifica lo stato dell'account Stripe Connect del venditore
// @access  Private (Seller only)
router.get('/account-status', protect, seller, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.shopSettings?.paymentMethods?.stripe?.accountId) {
      return res.json({ 
        connected: false,
        message: 'Nessun account Stripe collegato' 
      });
    }

    // Recupera i dettagli dell'account da Stripe
    const account = await stripe.accounts.retrieve(user.shopSettings.paymentMethods.stripe.accountId);

    // Verifica se l'onboarding è completo
    const onboardingComplete = account.charges_enabled && account.payouts_enabled;

    // Aggiorna lo stato nel database se è cambiato
    if (onboardingComplete !== user.shopSettings.paymentMethods.stripe.onboardingComplete) {
      user.shopSettings.paymentMethods.stripe.onboardingComplete = onboardingComplete;
      user.shopSettings.paymentMethods.stripe.enabled = onboardingComplete;
      await user.save();
    }

    res.json({
      connected: true,
      accountId: account.id,
      onboardingComplete,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirementsCurrentlyDue: account.requirements?.currently_due || []
    });
  } catch (error) {
    console.error('Errore recupero stato account:', error);
    res.status(500).json({ 
      message: 'Errore durante il recupero dello stato dell\'account',
      error: error.message 
    });
  }
});

// @route   GET /api/stripe-connect/dashboard-link
// @desc    Crea un link per accedere alla dashboard Stripe Express del venditore
// @access  Private (Seller only)
router.get('/dashboard-link', protect, seller, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.shopSettings?.paymentMethods?.stripe?.accountId) {
      return res.status(400).json({ 
        message: 'Nessun account Stripe collegato' 
      });
    }

    // Crea un login link per la dashboard Express
    const loginLink = await stripe.accounts.createLoginLink(
      user.shopSettings.paymentMethods.stripe.accountId
    );

    res.json({
      message: 'Link dashboard creato con successo',
      url: loginLink.url
    });
  } catch (error) {
    console.error('Errore creazione dashboard link:', error);
    res.status(500).json({ 
      message: 'Errore durante la creazione del link dashboard',
      error: error.message 
    });
  }
});

export default router;
