import Stripe from 'stripe';
import logger from '../config/logger.js';
import { sendLowBalanceAlert } from '../utils/alertService.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Soglia minima saldo (€500) sotto cui inviare alert
const LOW_BALANCE_THRESHOLD = 50000; // centesimi (€500)

/**
 * @desc    Ottieni saldo Stripe account principale
 * @route   GET /api/admin/stripe/balance
 * @access  Private/Admin
 */
export const getStripeBalance = async (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      logger.warn('Tentativo accesso non autorizzato a saldo Stripe', {
        userId: req.user._id,
        role: req.user.role
      });
      return res.status(403).json({ message: 'Accesso negato: solo admin' });
    }

    // Recupera saldo da Stripe
    const balance = await stripe.balance.retrieve();

    logger.info('Saldo Stripe recuperato con successo', {
      adminId: req.user._id,
      availableBalance: balance.available[0]?.amount || 0,
      pendingBalance: balance.pending[0]?.amount || 0
    });

    // Check se saldo è basso
    const availableAmount = balance.available[0]?.amount || 0;
    if (availableAmount < LOW_BALANCE_THRESHOLD) {
      logger.warn('Saldo Stripe sotto soglia minima', {
        availableAmount,
        threshold: LOW_BALANCE_THRESHOLD,
        difference: LOW_BALANCE_THRESHOLD - availableAmount
      });

      // Invia alert (solo se non inviato nelle ultime 24h - implementa logica se necessario)
      try {
        await sendLowBalanceAlert(balance);
      } catch (alertError) {
        logger.error('Errore invio alert saldo basso', { error: alertError.message });
      }
    }

    res.json({
      success: true,
      balance: {
        available: balance.available.map(b => ({
          amount: b.amount / 100, // Converti in euro
          currency: b.currency
        })),
        pending: balance.pending.map(b => ({
          amount: b.amount / 100,
          currency: b.currency
        })),
        livemode: balance.livemode,
        lowBalanceAlert: availableAmount < LOW_BALANCE_THRESHOLD,
        threshold: LOW_BALANCE_THRESHOLD / 100 // In euro
      }
    });
  } catch (error) {
    logger.error('Errore recupero saldo Stripe', {
      error: error.message,
      stack: error.stack,
      adminId: req.user._id
    });

    res.status(500).json({
      message: 'Errore recupero saldo Stripe',
      error: error.message
    });
  }
};

/**
 * @desc    Ottieni transazioni Stripe recenti
 * @route   GET /api/admin/stripe/transactions
 * @access  Private/Admin
 */
export const getStripeTransactions = async (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accesso negato: solo admin' });
    }

    const limit = parseInt(req.query.limit) || 20;

    // Recupera balance transactions (include charges, refunds, transfers, etc.)
    const transactions = await stripe.balanceTransactions.list({
      limit
    });

    logger.info('Transazioni Stripe recuperate', {
      adminId: req.user._id,
      count: transactions.data.length
    });

    res.json({
      success: true,
      transactions: transactions.data.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount / 100,
        net: tx.net / 100,
        fee: tx.fee / 100,
        currency: tx.currency,
        status: tx.status,
        created: new Date(tx.created * 1000).toISOString(),
        description: tx.description,
        source: tx.source
      })),
      hasMore: transactions.has_more
    });
  } catch (error) {
    logger.error('Errore recupero transazioni Stripe', {
      error: error.message,
      adminId: req.user._id
    });

    res.status(500).json({
      message: 'Errore recupero transazioni Stripe',
      error: error.message
    });
  }
};

/**
 * @desc    Ottieni statistiche Stripe (charges, refunds, transfers ultimi 30 giorni)
 * @route   GET /api/admin/stripe/stats
 * @access  Private/Admin
 */
export const getStripeStats = async (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accesso negato: solo admin' });
    }

    // Data 30 giorni fa
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);

    // Recupera tutte le transazioni ultimi 30 giorni
    const transactions = await stripe.balanceTransactions.list({
      created: { gte: thirtyDaysAgo },
      limit: 100
    });

    // Calcola statistiche
    const stats = {
      charges: { count: 0, amount: 0 },
      refunds: { count: 0, amount: 0 },
      transfers: { count: 0, amount: 0 },
      fees: { total: 0 }
    };

    transactions.data.forEach(tx => {
      if (tx.type === 'charge') {
        stats.charges.count++;
        stats.charges.amount += tx.amount / 100;
      } else if (tx.type === 'refund') {
        stats.refunds.count++;
        stats.refunds.amount += tx.amount / 100;
      } else if (tx.type === 'transfer') {
        stats.transfers.count++;
        stats.transfers.amount += tx.amount / 100;
      }
      stats.fees.total += tx.fee / 100;
    });

    logger.info('Statistiche Stripe calcolate', {
      adminId: req.user._id,
      period: '30 giorni',
      stats
    });

    res.json({
      success: true,
      period: '30 giorni',
      stats
    });
  } catch (error) {
    logger.error('Errore calcolo statistiche Stripe', {
      error: error.message,
      adminId: req.user._id
    });

    res.status(500).json({
      message: 'Errore calcolo statistiche Stripe',
      error: error.message
    });
  }
};

export default {
  getStripeBalance,
  getStripeTransactions,
  getStripeStats
};
