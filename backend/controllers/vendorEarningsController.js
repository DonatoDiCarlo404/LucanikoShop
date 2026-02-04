import User from '../models/User.js';
import VendorPayout from '../models/VendorPayout.js';

// @desc    Ottieni riepilogo earnings venditore
// @route   GET /api/vendor/earnings-summary
// @access  Private (solo venditori)
export const getEarningsSummary = async (req, res) => {
  try {
    const vendorId = req.user._id;

    // Verifica che l'utente sia un venditore
    if (!['vendor', 'seller', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Accesso negato: solo venditori possono accedere' });
    }

    // Ottieni dati venditore
    const vendor = await User.findById(vendorId).select('totalEarnings pendingEarnings paidEarnings debtBalance');

    if (!vendor) {
      return res.status(404).json({ message: 'Venditore non trovato' });
    }

    res.json({
      totalEarnings: vendor.totalEarnings || 0,
      pendingEarnings: vendor.pendingEarnings || 0,
      paidEarnings: vendor.paidEarnings || 0,
      debtBalance: vendor.debtBalance || 0 // Debiti attivi da rimborsi post-pagamento
    });

  } catch (error) {
    console.error('Errore getEarningsSummary:', error);
    res.status(500).json({ 
      message: 'Errore nel recupero del riepilogo earnings',
      error: error.message 
    });
  }
};

// @desc    Ottieni storico payouts venditore
// @route   GET /api/vendor/payouts
// @access  Private (solo venditori)
export const getVendorPayouts = async (req, res) => {
  try {
    const vendorId = req.user._id;

    // Verifica che l'utente sia un venditore
    if (!['vendor', 'seller', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Accesso negato: solo venditori possono accedere' });
    }

    // Parametri di paginazione
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtri opzionali
    const filters = { vendorId };

    // Filtro per status
    if (req.query.status) {
      filters.status = req.query.status;
    }

    // Filtro per date range
    if (req.query.startDate || req.query.endDate) {
      filters.saleDate = {};
      if (req.query.startDate) {
        filters.saleDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filters.saleDate.$lte = new Date(req.query.endDate);
      }
    }

    // Query con paginazione
    const payouts = await VendorPayout.find(filters)
      .populate('orderId', 'orderNumber totalAmount')
      .sort('-saleDate')
      .skip(skip)
      .limit(limit);

    // Conta totale per paginazione
    const total = await VendorPayout.countDocuments(filters);

    res.json({
      payouts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPayouts: total,
      hasMore: skip + payouts.length < total
    });

  } catch (error) {
    console.error('Errore getVendorPayouts:', error);
    res.status(500).json({ 
      message: 'Errore nel recupero dello storico payouts',
      error: error.message 
    });
  }
};

// @desc    Ottieni vendite in attesa di pagamento (< 14 giorni)
// @route   GET /api/vendor/sales-pending
// @access  Private (solo venditori)
export const getSalesPending = async (req, res) => {
  try {
    const vendorId = req.user._id;

    // Verifica che l'utente sia un venditore
    if (!['vendor', 'seller', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Accesso negato: solo venditori possono accedere' });
    }

    // Calcola la data limite (14 giorni fa)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Trova payouts pending con meno di 14 giorni
    // ESCLUDE i debiti (isRefundDebt: true) che non sono vendite reali
    const pendingPayouts = await VendorPayout.find({
      vendorId,
      status: 'pending',
      saleDate: { $gt: fourteenDaysAgo }, // Solo vendite con meno di 14 giorni
      $or: [
        { isRefundDebt: { $exists: false } }, // Payouts vecchi senza il campo
        { isRefundDebt: false } // Payouts nuovi esplicitamente non-debiti
      ]
    })
      .populate('orderId', '_id orderNumber totalAmount items')
      .sort('-saleDate');

    // Aggiungi informazioni countdown per ogni payout
    const payoutsWithCountdown = pendingPayouts.map(payout => {
      const daysSinceSale = Math.floor((new Date() - payout.saleDate) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, 14 - daysSinceSale);
      const estimatedPaymentDate = new Date(payout.saleDate);
      estimatedPaymentDate.setDate(estimatedPaymentDate.getDate() + 14);

      // Ottieni ID ordine: usa orderNumber se esiste, altrimenti primi 8 caratteri di _id
      const orderDisplayId = payout.orderId?.orderNumber || 
                            (payout.orderId?._id ? payout.orderId._id.toString().substring(0, 8) : 'N/A');

      return {
        _id: payout._id,
        orderId: payout.orderId?._id,
        orderNumber: orderDisplayId,
        amount: payout.amount,
        stripeFee: payout.stripeFee,
        transferFee: payout.transferFee,
        saleDate: payout.saleDate,
        status: payout.status,
        daysSinceSale,
        daysRemaining,
        estimatedPaymentDate,
        progressPercentage: Math.round((daysSinceSale / 14) * 100)
      };
    });

    // Calcola totale in attesa
    const totalPending = payoutsWithCountdown.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      pendingSales: payoutsWithCountdown,
      totalPendingAmount: totalPending,
      count: payoutsWithCountdown.length
    });

  } catch (error) {
    console.error('Errore getSalesPending:', error);
    res.status(500).json({ 
      message: 'Errore nel recupero delle vendite in attesa',
      error: error.message 
    });
  }
};
