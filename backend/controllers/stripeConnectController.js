import Stripe from 'stripe';
import User from '../models/User.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Crea un account Stripe Connect Express per il venditore
 * Solo per aziende (business_type: 'company')
 * @route POST /api/stripe-connect/create-account
 * @access Private (Seller)
 */
export const createConnectAccount = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const vendor = await User.findById(vendorId);

    console.log('\n🔵 [STRIPE CONNECT] ============ CREAZIONE ACCOUNT ============');
    console.log('🔵 [STRIPE CONNECT] Venditore:', vendor.businessName || vendor.name);
    console.log('🔵 [STRIPE CONNECT] Email:', vendor.email);

    // Verifica che sia un venditore
    if (vendor.role !== 'seller') {
      console.log('❌ [STRIPE CONNECT] Utente non è un venditore');
      return res.status(403).json({ 
        success: false,
        message: 'Solo i venditori possono creare account Connect' 
      });
    }

    // Se esiste già un account, restituisci info e genera nuovo link onboarding
    if (vendor.stripeConnectAccountId) {
      console.log('⚠️ [STRIPE CONNECT] Account già esistente:', vendor.stripeConnectAccountId);
      
      // Recupera stato account da Stripe
      const account = await stripe.accounts.retrieve(vendor.stripeConnectAccountId);
      
      // Aggiorna lo stato nel DB
      vendor.stripeAccountStatus = account.charges_enabled ? 'active' : 'pending';
      vendor.stripeChargesEnabled = account.charges_enabled;
      vendor.stripePayoutsEnabled = account.payouts_enabled;
      vendor.stripeDetailsSubmitted = account.details_submitted;
      await vendor.save();

      // Se l'onboarding non è completo, genera nuovo link
      if (!account.details_submitted) {
        const accountLink = await stripe.accountLinks.create({
          account: vendor.stripeConnectAccountId,
          refresh_url: `${process.env.FRONTEND_URL}/vendor/profile`,
          return_url: `${process.env.FRONTEND_URL}/vendor/profile`,
          type: 'account_onboarding'
        });

        console.log('✅ [STRIPE CONNECT] Nuovo link onboarding generato');

        return res.json({
          success: true,
          accountId: vendor.stripeConnectAccountId,
          status: vendor.stripeAccountStatus,
          onboardingUrl: accountLink.url,
          needsOnboarding: true
        });
      }

      // Account già completo
      return res.json({
        success: true,
        accountId: vendor.stripeConnectAccountId,
        status: vendor.stripeAccountStatus,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        needsOnboarding: false
      });
    }

    // Crea nuovo account Stripe Connect Express (solo aziende)
    console.log('🆕 [STRIPE CONNECT] Creazione nuovo account Express...');
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'IT',
      email: vendor.email,
      business_type: 'company', // Solo aziende
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      metadata: {
        vendorId: vendorId.toString(),
        platform: 'LucanikoShop',
        businessName: vendor.businessName || vendor.name
      }
    });

    console.log('✅ [STRIPE CONNECT] Account creato:', account.id);

    // Salva l'ID nel database
    vendor.stripeConnectAccountId = account.id;
    vendor.stripeAccountStatus = 'pending';
    vendor.stripeChargesEnabled = false;
    vendor.stripePayoutsEnabled = false;
    vendor.stripeDetailsSubmitted = false;
    await vendor.save();

    // Genera link di onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL}/vendor/profile`,
      return_url: `${process.env.FRONTEND_URL}/vendor/profile`,
      type: 'account_onboarding'
    });

    console.log('✅ [STRIPE CONNECT] Link onboarding generato');
    console.log('🔵 [STRIPE CONNECT] ============================================\n');

    res.json({
      success: true,
      accountId: account.id,
      onboardingUrl: accountLink.url,
      needsOnboarding: true
    });

  } catch (error) {
    console.error('❌ [STRIPE CONNECT] Errore creazione account:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Verifica lo stato dell'account Stripe Connect
 * @route GET /api/stripe-connect/account-status
 * @access Private (Seller)
 */
export const getAccountStatus = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const vendor = await User.findById(vendorId);

    if (!vendor.stripeConnectAccountId) {
      return res.json({
        success: true,
        hasAccount: false,
        status: 'not_created'
      });
    }

    // Recupera stato account da Stripe
    const account = await stripe.accounts.retrieve(vendor.stripeConnectAccountId);

    // Aggiorna lo stato nel DB
    const wasActive = vendor.stripeAccountStatus === 'active';
    vendor.stripeAccountStatus = account.charges_enabled ? 'active' : 'pending';
    vendor.stripeChargesEnabled = account.charges_enabled;
    vendor.stripePayoutsEnabled = account.payouts_enabled;
    vendor.stripeDetailsSubmitted = account.details_submitted;
    vendor.stripeOnboardingCompleted = account.details_submitted;
    
    // Se diventa attivo, salva la data
    if (!wasActive && account.charges_enabled) {
      vendor.stripeConnectedAt = new Date();
    }

    await vendor.save();

    res.json({
      success: true,
      hasAccount: true,
      accountId: vendor.stripeConnectAccountId,
      status: vendor.stripeAccountStatus,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      onboardingCompleted: vendor.stripeOnboardingCompleted,
      connectedAt: vendor.stripeConnectedAt
    });

  } catch (error) {
    console.error('❌ [STRIPE CONNECT] Errore verifica stato:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Genera un nuovo link di onboarding se quello precedente è scaduto
 * @route POST /api/stripe-connect/refresh-onboarding
 * @access Private (Seller)
 */
export const refreshOnboardingLink = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const vendor = await User.findById(vendorId);

    if (!vendor.stripeConnectAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Nessun account Stripe Connect trovato'
      });
    }

    // Genera nuovo link
    const accountLink = await stripe.accountLinks.create({
      account: vendor.stripeConnectAccountId,
      refresh_url: `${process.env.FRONTEND_URL}/vendor/profile`,
      return_url: `${process.env.FRONTEND_URL}/vendor/profile`,
      type: 'account_onboarding'
    });

    res.json({
      success: true,
      url: accountLink.url  // Fix: frontend cerca "url" non "onboardingUrl"
    });

  } catch (error) {
    console.error('❌ [STRIPE CONNECT] Errore refresh onboarding:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Genera un link per il dashboard Stripe Express del venditore
 * Permette al venditore di gestire i propri pagamenti, payout, ecc.
 * @route POST /api/stripe-connect/dashboard-link
 * @access Private (Seller)
 */
export const createDashboardLink = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const vendor = await User.findById(vendorId);

    if (!vendor.stripeConnectAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Nessun account Stripe Connect trovato'
      });
    }

    // Crea login link per Stripe Express Dashboard
    const loginLink = await stripe.accounts.createLoginLink(vendor.stripeConnectAccountId);

    res.json({
      success: true,
      dashboardUrl: loginLink.url
    });

  } catch (error) {
    console.error('❌ [STRIPE CONNECT] Errore creazione dashboard link:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Webhook per aggiornamenti account Stripe Connect
 * @route POST /api/stripe-connect/webhook
 * @access Public (ma verificato con Stripe signature)
 */
export const handleConnectWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('⚠️ [STRIPE CONNECT WEBHOOK] Errore verifica:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('\n🔔 [STRIPE CONNECT WEBHOOK] Evento:', event.type);

  // Gestisci eventi Connect
  switch (event.type) {
    case 'account.updated':
      await handleAccountUpdated(event.data.object);
      break;
    
    case 'account.external_account.created':
    case 'account.external_account.updated':
      console.log('💳 [STRIPE CONNECT WEBHOOK] External account aggiornato');
      break;

    default:
      console.log(`⚠️ [STRIPE CONNECT WEBHOOK] Evento non gestito: ${event.type}`);
  }

  res.json({ received: true });
};

/**
 * Gestisce aggiornamenti dello stato account Connect
 */
async function handleAccountUpdated(account) {
  try {
    console.log('🔄 [STRIPE CONNECT WEBHOOK] Account aggiornato:', account.id);
    
    // Trova il venditore tramite stripeConnectAccountId
    const vendor = await User.findOne({ stripeConnectAccountId: account.id });
    
    if (!vendor) {
      console.error('❌ [STRIPE CONNECT WEBHOOK] Venditore non trovato per account:', account.id);
      return;
    }

    // Aggiorna stato
    const wasActive = vendor.stripeAccountStatus === 'active';
    vendor.stripeAccountStatus = account.charges_enabled ? 'active' : 'pending';
    vendor.stripeChargesEnabled = account.charges_enabled;
    vendor.stripePayoutsEnabled = account.payouts_enabled;
    vendor.stripeDetailsSubmitted = account.details_submitted;
    vendor.stripeOnboardingCompleted = account.details_submitted;

    // Se diventa attivo, salva la data
    if (!wasActive && account.charges_enabled) {
      vendor.stripeConnectedAt = new Date();
      console.log('✅ [STRIPE CONNECT WEBHOOK] Account attivato per:', vendor.businessName);
    }

    await vendor.save();
    console.log('✅ [STRIPE CONNECT WEBHOOK] Venditore aggiornato');

  } catch (error) {
    console.error('❌ [STRIPE CONNECT WEBHOOK] Errore aggiornamento venditore:', error);
  }
}
