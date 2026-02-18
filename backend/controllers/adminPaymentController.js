import VendorPayout from '../models/VendorPayout.js';
import User from '../models/User.js';

/**
 * @desc    Ottieni tutti i VendorPayout pending pronti per pagamento (>14 giorni)
 * @route   GET /api/admin/payments/pending-payouts
 * @access  Private/Admin
 */
export const getPendingPayouts = async (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accesso negato: solo admin possono accedere' });
    }

    // Calcola la data limite (14 giorni fa)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Parametri di paginazione
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Costruisci filtri base
    const filters = {
      status: 'pending',
      saleDate: { $lte: fourteenDaysAgo },
      // Escludi debiti (non devono essere pagati manualmente)
      $or: [
        { isRefundDebt: { $exists: false } },
        { isRefundDebt: false }
      ]
    };

    // Filtro per venditore specifico
    if (req.query.vendorId) {
      filters.vendorId = req.query.vendorId;
    }

    // Filtro per range di date (saleDate)
    if (req.query.startDate || req.query.endDate) {
      filters.saleDate = {};
      if (req.query.startDate) {
        filters.saleDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filters.saleDate.$lte = new Date(req.query.endDate);
      } else {
        // Default: solo payouts con più di 14 giorni
        filters.saleDate.$lte = fourteenDaysAgo;
      }
    }

    // Query con popolazione e paginazione
    const payouts = await VendorPayout.find(filters)
      .populate('vendorId', 'name companyName businessName email stripeConnectAccountId stripeOnboardingCompleted stripeChargesEnabled stripePayoutsEnabled')
      .populate('orderId', 'orderNumber totalAmount')
      .sort('-saleDate')
      .skip(skip)
      .limit(limit);

    // Conta totale per paginazione
    const total = await VendorPayout.countDocuments(filters);

    // Calcola totale importo da pagare
    const totalAmount = await VendorPayout.aggregate([
      { $match: filters },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Arricchisci i payouts con info aggiuntive
    const payoutsWithInfo = payouts.map(payout => {
      const daysSinceSale = Math.floor((new Date() - payout.saleDate) / (1000 * 60 * 60 * 24));
      
      return {
        _id: payout._id,
        vendorId: payout.vendorId?._id,
        vendorName: payout.vendorId?.businessName || payout.vendorId?.companyName || payout.vendorId?.name || 'N/A',
        vendorEmail: payout.vendorId?.email,
        hasStripeAccount: !!payout.vendorId?.stripeConnectAccountId,
        isOnboardingComplete: payout.vendorId?.stripeOnboardingCompleted || false,
        isStripeActive: payout.vendorId?.stripeChargesEnabled && payout.vendorId?.stripePayoutsEnabled,
        orderId: payout.orderId?._id,
        orderNumber: payout.orderId?.orderNumber || 'N/A',
        amount: payout.amount,
        stripeFee: payout.stripeFee,
        transferFee: payout.transferFee,
        saleDate: payout.saleDate,
        daysSinceSale,
        status: payout.status,
        canBePaid: !!(payout.vendorId?.stripeConnectAccountId && payout.vendorId?.stripeOnboardingCompleted && payout.vendorId?.stripeChargesEnabled && payout.vendorId?.stripePayoutsEnabled)
      };
    });

    res.json({
      payouts: payoutsWithInfo,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPayouts: total,
        hasMore: skip + payouts.length < total
      },
      summary: {
        totalAmount: totalAmount[0]?.total || 0,
        readyToPay: payoutsWithInfo.filter(p => p.canBePaid).length,
        blocked: payoutsWithInfo.filter(p => !p.canBePaid).length
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Errore getPendingPayouts:', error);
    res.status(500).json({ 
      message: 'Errore nel recupero dei payouts pending',
      error: error.message 
    });
  }
};

/**
 * @desc    Ottieni statistiche pagamenti per admin dashboard
 * @route   GET /api/admin/payments/statistics
 * @access  Private/Admin
 */
export const getPaymentStatistics = async (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accesso negato: solo admin possono accedere' });
    }

    const now = new Date();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(now.getDate() - 14);

    // Inizio del mese corrente
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Totale da pagare oggi (pending > 14 giorni)
    const totalToPay = await VendorPayout.aggregate([
      {
        $match: {
          status: 'pending',
          saleDate: { $lte: fourteenDaysAgo },
          $or: [
            { isRefundDebt: { $exists: false } },
            { isRefundDebt: false }
          ]
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // 2. Totale pagato questo mese
    const totalPaidThisMonth = await VendorPayout.aggregate([
      {
        $match: {
          status: 'paid',
          paymentDate: { $gte: startOfMonth },
          $or: [
            { isRefundDebt: { $exists: false } },
            { isRefundDebt: false }
          ]
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // 3. Transfer falliti da gestire
    const failedTransfers = await VendorPayout.aggregate([
      {
        $match: {
          status: 'failed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // 4. Debiti attivi (rimborsi post-pagamento)
    const activeDebts = await VendorPayout.aggregate([
      {
        $match: {
          isRefundDebt: true,
          status: 'pending'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }, // Negativi
          count: { $sum: 1 }
        }
      }
    ]);

    // 5. Totale venditori con Stripe Connect attivo (account funzionante e payments/payouts abilitati)
    const vendorsWithStripe = await User.countDocuments({
      role: 'seller',
      stripeConnectAccountId: { $exists: true, $ne: null },
      stripeOnboardingCompleted: true,
      stripeChargesEnabled: true,
      stripePayoutsEnabled: true
    });

    // 6. Totale venditori in attesa di onboarding
    const vendorsPendingOnboarding = await User.countDocuments({
      role: 'seller',
      $or: [
        { stripeConnectAccountId: { $exists: false } },
        { stripeConnectAccountId: null },
        { stripeOnboardingCompleted: false },
        { stripeChargesEnabled: false },
        { stripePayoutsEnabled: false }
      ]
    });

    // 7. Statistiche fee (questo mese)
    const feeStats = await VendorPayout.aggregate([
      {
        $match: {
          status: 'paid',
          paymentDate: { $gte: startOfMonth },
          $or: [
            { isRefundDebt: { $exists: false } },
            { isRefundDebt: false }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalStripeFees: { $sum: '$stripeFee' },
          totalTransferFees: { $sum: '$transferFee' }
        }
      }
    ]);

    res.json({
      toPay: {
        amount: totalToPay[0]?.total || 0,
        count: totalToPay[0]?.count || 0
      },
      paidThisMonth: {
        amount: totalPaidThisMonth[0]?.total || 0,
        count: totalPaidThisMonth[0]?.count || 0
      },
      failed: {
        amount: failedTransfers[0]?.total || 0,
        count: failedTransfers[0]?.count || 0
      },
      debts: {
        amount: Math.abs(activeDebts[0]?.total || 0), // Mostra come positivo per chiarezza
        count: activeDebts[0]?.count || 0
      },
      vendors: {
        withStripeConnect: vendorsWithStripe,
        pendingOnboarding: vendorsPendingOnboarding
      },
      fees: {
        stripeFees: feeStats[0]?.totalStripeFees || 0,
        transferFees: feeStats[0]?.totalTransferFees || 0,
        total: (feeStats[0]?.totalStripeFees || 0) + (feeStats[0]?.totalTransferFees || 0)
      },
      timestamp: now
    });

  } catch (error) {
    console.error('❌ [ADMIN] Errore getPaymentStatistics:', error);
    res.status(500).json({ 
      message: 'Errore nel recupero delle statistiche',
      error: error.message 
    });
  }
};

/**
 * @desc    Ottieni log di tutti i transfer effettuati (paid + failed)
 * @route   GET /api/admin/payments/transfer-log
 * @access  Private/Admin
 */
export const getTransferLog = async (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accesso negato: solo admin possono accedere' });
    }

    // Parametri di paginazione
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Costruisci filtri
    const filters = {
      status: { $in: ['paid', 'failed'] }, // Solo transfer completati o falliti
      // Escludi debiti (non sono transfer reali)
      $or: [
        { isRefundDebt: { $exists: false } },
        { isRefundDebt: false }
      ]
    };

    // Filtro per venditore
    if (req.query.vendorId) {
      filters.vendorId = req.query.vendorId;
    }

    // Filtro per status specifico
    if (req.query.status && ['paid', 'failed'].includes(req.query.status)) {
      filters.status = req.query.status;
    }

    // Filtro per range di date (paymentDate)
    if (req.query.startDate || req.query.endDate) {
      filters.paymentDate = {};
      if (req.query.startDate) {
        filters.paymentDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filters.paymentDate.$lte = new Date(req.query.endDate);
      }
    }

    // Query con popolazione e paginazione
    const transfers = await VendorPayout.find(filters)
      .populate('vendorId', 'name companyName email')
      .populate('orderId')
      .sort('-paymentDate')
      .skip(skip)
      .limit(limit);

    // Conta totale per paginazione
    const total = await VendorPayout.countDocuments(filters);

    // Calcola totali
    const totals = await VendorPayout.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$amount' },
          totalStripeFee: { $sum: '$stripeFee' },
          totalTransferFee: { $sum: '$transferFee' },
          count: { $sum: 1 }
        }
      }
    ]);

    const paidStats = totals.find(t => t._id === 'paid') || { totalAmount: 0, totalStripeFee: 0, totalTransferFee: 0, count: 0 };
    const failedStats = totals.find(t => t._id === 'failed') || { totalAmount: 0, totalStripeFee: 0, totalTransferFee: 0, count: 0 };

    // Formatta i transfer
    const transfersFormatted = transfers.map(transfer => ({
      _id: transfer._id,
      vendorId: transfer.vendorId?._id,
      vendorName: transfer.vendorId?.companyName || transfer.vendorId?.name || 'N/A',
      vendorEmail: transfer.vendorId?.email,
      orderId: transfer.orderId?._id,
      orderNumber: transfer.orderId?._id?.toString() || 'N/A',
      amount: transfer.amount,
      stripeFee: transfer.stripeFee,
      transferFee: transfer.transferFee,
      netAmount: transfer.amount - transfer.stripeFee - transfer.transferFee,
      saleDate: transfer.saleDate,
      paymentDate: transfer.paymentDate,
      stripeTransferId: transfer.stripeTransferId,
      status: transfer.status,
      failureReason: transfer.failureReason || null
    }));

    res.json({
      transfers: transfersFormatted,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalTransfers: total,
        hasMore: skip + transfers.length < total
      },
      summary: {
        totalPaidAmount: paidStats.totalAmount,
        totalFailedCount: failedStats.count,
        totalFees: paidStats.totalStripeFee + paidStats.totalTransferFee,
        // Mantieni anche la struttura dettagliata per compatibilità
        paid: {
          amount: paidStats.totalAmount,
          stripeFee: paidStats.totalStripeFee,
          transferFee: paidStats.totalTransferFee,
          count: paidStats.count
        },
        failed: {
          amount: failedStats.totalAmount,
          count: failedStats.count
        }
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Errore getTransferLog:', error);
    res.status(500).json({ 
      message: 'Errore nel recupero del log transfer',
      error: error.message 
    });
  }
};

/**
 * @desc    Esporta transfer log in formato CSV
 * @route   GET /api/admin/payments/transfer-log/export
 * @access  Private/Admin
 */
export const exportTransferLogCSV = async (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accesso negato: solo admin possono accedere' });
    }

    // Usa gli stessi filtri del getTransferLog
    const filters = {
      status: { $in: ['paid', 'failed'] },
      $or: [
        { isRefundDebt: { $exists: false } },
        { isRefundDebt: false }
      ]
    };

    if (req.query.vendorId) filters.vendorId = req.query.vendorId;
    if (req.query.status && ['paid', 'failed'].includes(req.query.status)) {
      filters.status = req.query.status;
    }
    if (req.query.startDate || req.query.endDate) {
      filters.paymentDate = {};
      if (req.query.startDate) filters.paymentDate.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filters.paymentDate.$lte = new Date(req.query.endDate);
    }

    // Recupera tutti i transfer (senza limit)
    const transfers = await VendorPayout.find(filters)
      .populate('vendorId', 'name companyName email')
      .populate('orderId')
      .sort('-paymentDate')
      .limit(1000); // Limite massimo per evitare sovraccarico

    // Genera CSV
    const csvHeader = 'Data Pagamento,Venditore,Email,Ordine,Importo Netto,Fee Stripe,Fee Transfer,Totale Ricevuto,Status,Stripe Transfer ID,Motivo Fallimento\n';
    
    const csvRows = transfers.map(t => {
      const vendorName = (t.vendorId?.companyName || t.vendorId?.name || 'N/A').replace(/,/g, ';');
      const vendorEmail = (t.vendorId?.email || 'N/A').replace(/,/g, ';');
      const orderNumber = (t.orderId?._id?.toString() || 'N/A').replace(/,/g, ';');
      const paymentDate = t.paymentDate ? new Date(t.paymentDate).toLocaleDateString('it-IT') : 'N/A';
      const failureReason = (t.failureReason || '').replace(/,/g, ';').replace(/\n/g, ' ');
      const stripeId = (t.stripeTransferId || 'N/A').replace(/,/g, ';');
      
      return `${paymentDate},${vendorName},${vendorEmail},${orderNumber},€${t.amount.toFixed(2)},€${t.stripeFee.toFixed(2)},€${t.transferFee.toFixed(2)},€${(t.amount - t.stripeFee - t.transferFee).toFixed(2)},${t.status},${stripeId},${failureReason}`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    // Imposta headers per download
    const filename = `transfer-log-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Aggiungi BOM per Excel UTF-8
    res.send('\uFEFF' + csv);

  } catch (error) {
    console.error('❌ [ADMIN] Errore exportTransferLogCSV:', error);
    res.status(500).json({ 
      message: 'Errore nell\'esportazione CSV',
      error: error.message 
    });
  }
};

/**
 * @desc    Ottieni lista venditori con payouts (per filtri dropdown)
 * @route   GET /api/admin/payments/vendors-list
 * @access  Private/Admin
 */
export const getVendorsList = async (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accesso negato: solo admin possono accedere' });
    }

    // Trova venditori che hanno almeno un payout
    const vendorsWithPayouts = await VendorPayout.distinct('vendorId');
    
    const vendors = await User.find({
      _id: { $in: vendorsWithPayouts }
    }).select('_id name companyName businessName email stripeConnectAccountId stripeOnboardingCompleted stripeChargesEnabled stripePayoutsEnabled');

    const vendorsList = vendors.map(vendor => ({
      _id: vendor._id,
      name: vendor.businessName || vendor.companyName || vendor.name,
      email: vendor.email,
      hasStripeAccount: !!vendor.stripeConnectAccountId,
      isOnboardingComplete: vendor.stripeOnboardingCompleted || false,
      isStripeActive: vendor.stripeChargesEnabled && vendor.stripePayoutsEnabled
    }));

    res.json({
      vendors: vendorsList,
      count: vendorsList.length
    });

  } catch (error) {
    console.error('❌ [ADMIN] Errore getVendorsList:', error);
    res.status(500).json({ 
      message: 'Errore nel recupero della lista venditori',
      error: error.message 
    });
  }
};

/**
 * @desc    Forza pagamento immediato di un payout (ignora limite 14 giorni)
 * @route   POST /api/admin/payments/pay-now/:payoutId
 * @access  Private/Admin
 */
export const payNow = async (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accesso negato: solo admin possono accedere' });
    }

    const { payoutId } = req.params;

    // Trova il payout
    const payout = await VendorPayout.findById(payoutId).populate('vendorId', 'stripeConnectAccountId stripeOnboardingCompleted stripeChargesEnabled stripePayoutsEnabled name companyName businessName');

    if (!payout) {
      return res.status(404).json({ message: 'Payout non trovato' });
    }

    if (payout.status !== 'pending') {
      return res.status(400).json({ message: `Payout già processato (status: ${payout.status})` });
    }

    // Verifica che il venditore abbia Stripe Connect configurato
    if (!payout.vendorId.stripeConnectAccountId || !payout.vendorId.stripeOnboardingCompleted || !payout.vendorId.stripeChargesEnabled || !payout.vendorId.stripePayoutsEnabled) {
      return res.status(400).json({ 
        message: `Il venditore ${payout.vendorId.businessName || payout.vendorId.companyName || payout.vendorId.name} non ha completato l'onboarding Stripe Connect o l'account non è attivo` 
      });
    }

    // Importa stripe qui per evitare dipendenze circolari
    const stripe = (await import('stripe')).default(process.env.STRIPE_SECRET_KEY);

    // Esegui il transfer
    const transfer = await stripe.transfers.create({
      amount: Math.round(payout.amount * 100), // Converti in centesimi
      currency: 'eur',
      destination: payout.vendorId.stripeConnectAccountId,
      description: `Pagamento manuale admin per ordine ${payout.orderId}`,
      metadata: {
        payoutId: payout._id.toString(),
        orderId: payout.orderId.toString(),
        vendorId: payout.vendorId._id.toString(),
        manualPayment: 'true',
        adminId: req.user._id.toString()
      }
    });

    // Aggiorna il payout
    payout.status = 'paid';
    payout.paymentDate = new Date();
    payout.stripeTransferId = transfer.id;
    await payout.save();

    // Aggiorna statistiche venditore
    const vendor = await User.findById(payout.vendorId._id);
    if (vendor) {
      vendor.paidEarnings = (vendor.paidEarnings || 0) + payout.amount;
      vendor.pendingEarnings = Math.max(0, (vendor.pendingEarnings || 0) - payout.amount);
      await vendor.save();
    }

    console.log(`✅ [ADMIN] Pagamento manuale eseguito - Payout: ${payout._id}, Transfer: ${transfer.id}`);

    res.json({
      message: 'Pagamento eseguito con successo',
      payout: {
        _id: payout._id,
        status: payout.status,
        paymentDate: payout.paymentDate,
        stripeTransferId: transfer.id,
        amount: payout.amount
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Errore payNow:', error);
    res.status(500).json({ 
      message: 'Errore nell\'esecuzione del pagamento',
      error: error.message 
    });
  }
};

/**
 * @desc    Riprova transfer fallito
 * @route   POST /api/admin/payments/retry/:payoutId
 * @access  Private/Admin
 */
export const retryTransfer = async (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accesso negato: solo admin possono accedere' });
    }

    const { payoutId } = req.params;

    // Trova il payout
    const payout = await VendorPayout.findById(payoutId).populate('vendorId', 'stripeConnectAccountId stripeOnboardingCompleted stripeChargesEnabled stripePayoutsEnabled name companyName businessName');

    if (!payout) {
      return res.status(404).json({ message: 'Payout non trovato' });
    }

    if (payout.status !== 'failed') {
      return res.status(400).json({ message: `Questo payout non è in stato failed (status: ${payout.status})` });
    }

    // Verifica che il venditore abbia Stripe Connect configurato
    if (!payout.vendorId.stripeConnectAccountId || !payout.vendorId.stripeOnboardingCompleted || !payout.vendorId.stripeChargesEnabled || !payout.vendorId.stripePayoutsEnabled) {
      return res.status(400).json({ 
        message: `Il venditore ${payout.vendorId.businessName || payout.vendorId.companyName || payout.vendorId.name} non ha completato l'onboarding Stripe Connect o l'account non è attivo` 
      });
    }

    // Importa stripe
    const stripe = (await import('stripe')).default(process.env.STRIPE_SECRET_KEY);

    // Riprova il transfer
    const transfer = await stripe.transfers.create({
      amount: Math.round(payout.amount * 100),
      currency: 'eur',
      destination: payout.vendorId.stripeConnectAccountId,
      description: `Retry transfer per ordine ${payout.orderId}`,
      metadata: {
        payoutId: payout._id.toString(),
        orderId: payout.orderId.toString(),
        vendorId: payout.vendorId._id.toString(),
        retry: 'true',
        adminId: req.user._id.toString(),
        previousFailureReason: payout.failureReason || 'N/A'
      }
    });

    // Aggiorna il payout
    payout.status = 'paid';
    payout.paymentDate = new Date();
    payout.stripeTransferId = transfer.id;
    payout.failureReason = null; // Rimuovi il motivo del fallimento
    await payout.save();

    // Aggiorna statistiche venditore
    const vendor = await User.findById(payout.vendorId._id);
    if (vendor) {
      vendor.paidEarnings = (vendor.paidEarnings || 0) + payout.amount;
      vendor.pendingEarnings = Math.max(0, (vendor.pendingEarnings || 0) - payout.amount);
      await vendor.save();
    }

    console.log(`✅ [ADMIN] Retry transfer riuscito - Payout: ${payout._id}, Transfer: ${transfer.id}`);

    res.json({
      message: 'Transfer riprovato con successo',
      payout: {
        _id: payout._id,
        status: payout.status,
        paymentDate: payout.paymentDate,
        stripeTransferId: transfer.id,
        amount: payout.amount
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Errore retryTransfer:', error);
    
    // Se il retry fallisce di nuovo, aggiorna il motivo
    try {
      const payout = await VendorPayout.findById(req.params.payoutId);
      if (payout) {
        payout.failureReason = error.message;
        await payout.save();
      }
    } catch (updateError) {
      console.error('❌ [ADMIN] Errore aggiornamento failureReason:', updateError);
    }

    res.status(500).json({ 
      message: 'Errore nel retry del transfer',
      error: error.message 
    });
  }
};

/**
 * @desc    Segna payout come pagato manualmente (senza Stripe transfer)
 * @route   POST /api/admin/payments/mark-paid/:payoutId
 * @access  Private/Admin
 */
export const markAsPaid = async (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accesso negato: solo admin possono accedere' });
    }

    const { payoutId } = req.params;
    const { note } = req.body; // Nota opzionale per spiegare il pagamento manuale

    // Trova il payout
    const payout = await VendorPayout.findById(payoutId).populate('vendorId', 'name companyName');

    if (!payout) {
      return res.status(404).json({ message: 'Payout non trovato' });
    }

    if (payout.status !== 'pending') {
      return res.status(400).json({ message: `Payout già processato (status: ${payout.status})` });
    }

    // Aggiorna il payout
    payout.status = 'paid';
    payout.paymentDate = new Date();
    payout.stripeTransferId = `manual_${Date.now()}`; // ID fittizio per pagamenti manuali
    payout.failureReason = note ? `Pagamento manuale: ${note}` : 'Pagamento manuale da admin';
    await payout.save();

    // Aggiorna statistiche venditore
    const vendor = await User.findById(payout.vendorId._id);
    if (vendor) {
      vendor.paidEarnings = (vendor.paidEarnings || 0) + payout.amount;
      vendor.pendingEarnings = Math.max(0, (vendor.pendingEarnings || 0) - payout.amount);
      await vendor.save();
    }

    console.log(`✅ [ADMIN] Payout segnato come pagato manualmente - Payout: ${payout._id}`);

    res.json({
      message: 'Payout segnato come pagato',
      payout: {
        _id: payout._id,
        status: payout.status,
        paymentDate: payout.paymentDate,
        amount: payout.amount,
        note: note || 'Pagamento manuale'
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Errore markAsPaid:', error);
    res.status(500).json({ 
      message: 'Errore nel segnare il payout come pagato',
      error: error.message 
    });
  }
};

/**
 * @desc    Ottieni analytics pagamenti (grafici e statistiche)
 * @route   GET /api/admin/payments/analytics
 * @access  Private/Admin
 */
export const getAnalytics = async (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accesso negato: solo admin possono accedere' });
    }

    const { months = 6 } = req.query; // Numero di mesi da mostrare (default 6)
    const monthsCount = parseInt(months);

    // Calcola data inizio (N mesi fa)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsCount);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // 1. VOLUME PAGAMENTI MENSILI
    const monthlyVolume = await VendorPayout.aggregate([
      {
        $match: {
          status: 'paid',
          paymentDate: { $gte: startDate },
          $or: [
            { isRefundDebt: { $exists: false } },
            { isRefundDebt: false }
          ]
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          totalAmount: { $sum: '$amount' },
          totalStripeFee: { $sum: '$stripeFee' },
          totalTransferFee: { $sum: '$transferFee' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Formatta dati mensili per grafico
    const monthlyData = monthlyVolume.map(item => ({
      month: `${item._id.month}/${item._id.year}`,
      monthLabel: new Date(item._id.year, item._id.month - 1).toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }),
      totalAmount: parseFloat(item.totalAmount.toFixed(2)),
      totalStripeFee: parseFloat(item.totalStripeFee.toFixed(2)),
      totalTransferFee: parseFloat(item.totalTransferFee.toFixed(2)),
      transferCount: item.count
    }));

    // 2. TOP VENDITORI PER EARNINGS
    const topVendors = await VendorPayout.aggregate([
      {
        $match: {
          status: 'paid',
          $or: [
            { isRefundDebt: { $exists: false } },
            { isRefundDebt: false }
          ]
        }
      },
      {
        $group: {
          _id: '$vendorId',
          totalEarnings: { $sum: '$amount' },
          totalStripeFee: { $sum: '$stripeFee' },
          totalTransferFee: { $sum: '$transferFee' },
          payoutCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalEarnings: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Popola info venditori
    const vendorIds = topVendors.map(v => v._id);
    const vendors = await User.find({ _id: { $in: vendorIds } }).select('name companyName businessName email');
    
    const topVendorsData = topVendors.map(item => {
      const vendor = vendors.find(v => v._id.toString() === item._id.toString());
      return {
        vendorId: item._id,
        vendorName: vendor?.businessName || vendor?.companyName || vendor?.name || 'N/A',
        vendorEmail: vendor?.email || 'N/A',
        totalEarnings: parseFloat(item.totalEarnings.toFixed(2)),
        totalStripeFee: parseFloat(item.totalStripeFee.toFixed(2)),
        totalTransferFee: parseFloat(item.totalTransferFee.toFixed(2)),
        netEarnings: parseFloat((item.totalEarnings - item.totalStripeFee - item.totalTransferFee).toFixed(2)),
        payoutCount: item.payoutCount
      };
    });

    // 3. TOTALI FEE STRIPE E TRANSFER
    const totalFees = await VendorPayout.aggregate([
      {
        $match: {
          status: 'paid',
          $or: [
            { isRefundDebt: { $exists: false } },
            { isRefundDebt: false }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalStripeFees: { $sum: '$stripeFee' },
          totalTransferFees: { $sum: '$transferFee' },
          totalPaid: { $sum: '$amount' },
          totalTransfers: { $sum: 1 }
        }
      }
    ]);

    const feesData = totalFees[0] || {
      totalStripeFees: 0,
      totalTransferFees: 0,
      totalPaid: 0,
      totalTransfers: 0
    };

    // 4. COMMISSIONI PIATTAFORMA (€0.30 IVA inclusa per transfer)
    const platformCommissions = {
      transferFeePerTransaction: 0.30, // Fee che la piattaforma paga a Stripe per transfer (IVA inclusa)
      totalCommissionsCollected: parseFloat(feesData.totalTransferFees.toFixed(2)),
      totalTransfers: feesData.totalTransfers,
      averageCommissionPerTransfer: feesData.totalTransfers > 0 
        ? parseFloat((feesData.totalTransferFees / feesData.totalTransfers).toFixed(2))
        : 0
    };

    // 5. RIEPILOGO GENERALE
    const summary = {
      totalAmountPaid: parseFloat(feesData.totalPaid.toFixed(2)),
      totalStripeFees: parseFloat(feesData.totalStripeFees.toFixed(2)),
      totalTransferFees: parseFloat(feesData.totalTransferFees.toFixed(2)),
      totalFees: parseFloat((feesData.totalStripeFees + feesData.totalTransferFees).toFixed(2)),
      netAmountToVendors: parseFloat((feesData.totalPaid - feesData.totalStripeFees - feesData.totalTransferFees).toFixed(2)),
      totalTransfers: feesData.totalTransfers,
      averageTransferAmount: feesData.totalTransfers > 0
        ? parseFloat((feesData.totalPaid / feesData.totalTransfers).toFixed(2))
        : 0
    };

    res.json({
      monthlyVolume: monthlyData,
      topVendors: topVendorsData,
      platformCommissions,
      summary
    });

  } catch (error) {
    console.error('❌ [ADMIN] Errore getAnalytics:', error);
    res.status(500).json({ 
      message: 'Errore nel recupero delle analytics',
      error: error.message 
    });
  }
};
