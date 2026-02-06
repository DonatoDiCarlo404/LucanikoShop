/**
 * Calcola gli earnings per ogni venditore in un ordine multivendor
 * Applica le fee Stripe (1.5% + €0.25 per transazione) in modo proporzionale
 * Transfer interni tramite Stripe Connect Express: GRATUITI
 * 
 * @param {Object} order - Oggetto ordine con items, totalPrice, shippingPrice
 * @returns {Array} Array di oggetti con vendorId e calcoli earnings
 */
export const calculateVendorEarnings = (order) => {
  try {
    // 1. Calcola totale ordine (items + shipping)
    const totalOrder = order.totalPrice; // già include items + shipping

    // 2. Calcola fee Stripe transazione totale: 1.5% + €0.25
    const stripeTransactionFee = (totalOrder * 0.015) + 0.25;

    console.log('\n💰 [EARNINGS] ============ CALCOLO EARNINGS VENDITORI ============');
    console.log('💰 [EARNINGS] Totale ordine:', totalOrder.toFixed(2), '€');
    console.log('💰 [EARNINGS] Fee Stripe transazione:', stripeTransactionFee.toFixed(2), '€');

    // 3. Raggruppa prodotti per venditore
    const vendorSales = {};

    for (const item of order.items) {
      const vendorId = item.seller.toString();
      const itemTotal = item.price * item.quantity;

      if (!vendorSales[vendorId]) {
        vendorSales[vendorId] = {
          vendorId: vendorId,
          productPrice: 0,
          items: []
        };
      }

      vendorSales[vendorId].productPrice += itemTotal;
      vendorSales[vendorId].items.push({
        productId: item.product,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: itemTotal
      });
    }

    // 4. Calcola earnings per ogni venditore
    const vendorEarnings = [];

    for (const vendorId in vendorSales) {
      const vendor = vendorSales[vendorId];
      const productPrice = vendor.productPrice;

      // Fee Stripe proporzionale al valore dei prodotti del venditore
      const proportionalStripeFee = (productPrice / totalOrder) * stripeTransactionFee;

      // Fee transfer Stripe Connect Express: GRATIS
      const transferFee = 0.00;

      // Netto che riceverà il venditore
      const netAmount = productPrice - proportionalStripeFee - transferFee;

      vendorEarnings.push({
        vendorId: vendorId,
        productPrice: Math.round(productPrice * 100) / 100,
        stripeFee: Math.round(proportionalStripeFee * 100) / 100,
        transferFee: transferFee,
        netAmount: Math.round(netAmount * 100) / 100,
        items: vendor.items
      });

      console.log(`\n💰 [EARNINGS] Venditore: ${vendorId}`);
      console.log(`   - Prezzo prodotti: ${productPrice.toFixed(2)} €`);
      console.log(`   - Fee Stripe proporzionale: ${proportionalStripeFee.toFixed(2)} €`);
      console.log(`   - Fee transfer: ${transferFee.toFixed(2)} €`);
      console.log(`   - Netto da trasferire: ${netAmount.toFixed(2)} €`);
    }

    console.log('💰 [EARNINGS] ========== CALCOLO COMPLETATO ==========\n');

    return vendorEarnings;

  } catch (error) {
    console.error('❌ [EARNINGS] Errore calcolo earnings:', error);
    throw error;
  }
};

/**
 * Verifica che la somma dei netAmount sia corretta rispetto al totale ordine
 * Utile per debug e validazione
 * 
 * @param {Array} vendorEarnings - Array risultato da calculateVendorEarnings
 * @param {Number} totalOrder - Totale ordine
 * @returns {Object} Oggetto con totali e validazione
 */
export const validateEarningsCalculation = (vendorEarnings, totalOrder) => {
  const totalNetAmount = vendorEarnings.reduce((sum, v) => sum + v.netAmount, 0);
  const totalStripeFees = vendorEarnings.reduce((sum, v) => sum + v.stripeFee, 0);
  const totalTransferFees = vendorEarnings.reduce((sum, v) => sum + v.transferFee, 0);
  const totalDeductions = totalStripeFees + totalTransferFees;

  const expectedNetAmount = totalOrder - totalDeductions;
  const difference = Math.abs(totalNetAmount - expectedNetAmount);
  const isValid = difference < 0.01; // Tolleranza 1 centesimo per arrotondamenti

  console.log('\n🔍 [VALIDATION] ============ VALIDAZIONE EARNINGS ============');
  console.log('🔍 [VALIDATION] Totale ordine:', totalOrder.toFixed(2), '€');
  console.log('🔍 [VALIDATION] Totale fee Stripe:', totalStripeFees.toFixed(2), '€');
  console.log('🔍 [VALIDATION] Totale fee transfer:', totalTransferFees.toFixed(2), '€');
  console.log('🔍 [VALIDATION] Totale detrazioni:', totalDeductions.toFixed(2), '€');
  console.log('🔍 [VALIDATION] Totale netto venditori:', totalNetAmount.toFixed(2), '€');
  console.log('🔍 [VALIDATION] Atteso:', expectedNetAmount.toFixed(2), '€');
  console.log('🔍 [VALIDATION] Differenza:', difference.toFixed(4), '€');
  console.log('🔍 [VALIDATION] Valido:', isValid ? '✅' : '❌');
  console.log('🔍 [VALIDATION] ========================================\n');

  return {
    totalNetAmount: Math.round(totalNetAmount * 100) / 100,
    totalStripeFees: Math.round(totalStripeFees * 100) / 100,
    totalTransferFees: Math.round(totalTransferFees * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    expectedNetAmount: Math.round(expectedNetAmount * 100) / 100,
    difference: Math.round(difference * 10000) / 10000,
    isValid
  };
};

/**
 * Cancella gli earnings di un ordine rimborsato (solo se ancora pending)
 * Questa funzione gestisce i rimborsi entro i 14 giorni dalla vendita
 * 
 * @param {String} orderId - ID dell'ordine da rimborsare
 * @returns {Object} Risultato operazione con dettagli cancellazione
 */
export const cancelVendorEarnings = async (orderId) => {
  try {
    // Import dinamico per evitare dipendenze circolari
    const VendorPayout = (await import('../models/VendorPayout.js')).default;
    const User = (await import('../models/User.js')).default;

    console.log('\n🔄 [REFUND] ============ CANCELLAZIONE EARNINGS ============');
    console.log('🔄 [REFUND] Ordine ID:', orderId);

    // Trova tutti i VendorPayout pending per questo ordine
    const pendingPayouts = await VendorPayout.find({
      orderId: orderId,
      status: 'pending'
    });

    if (pendingPayouts.length === 0) {
      console.log('⚠️  [REFUND] Nessun VendorPayout pending trovato per questo ordine');
      console.log('⚠️  [REFUND] Probabile pagamento già effettuato (>14 giorni)');
      return {
        success: false,
        message: 'Nessun payout pending da cancellare. Il pagamento potrebbe essere già stato effettuato.',
        cancelledPayouts: []
      };
    }

    console.log(`🔄 [REFUND] Trovati ${pendingPayouts.length} payout pending da cancellare`);

    const cancelledPayouts = [];
    const vendorUpdates = [];

    // Per ogni payout pending, cancella e aggiorna statistiche venditore
    for (const payout of pendingPayouts) {
      console.log(`\n🔄 [REFUND] Cancellazione payout: ${payout._id}`);
      console.log(`   - Venditore: ${payout.vendorId}`);
      console.log(`   - Importo: €${payout.amount.toFixed(2)}`);

      // Aggiorna statistiche venditore
      const vendor = await User.findById(payout.vendorId);
      
      if (vendor) {
        const oldPendingEarnings = vendor.pendingEarnings || 0;
        const oldTotalEarnings = vendor.totalEarnings || 0;

        vendor.pendingEarnings = Math.max(0, oldPendingEarnings - payout.amount);
        vendor.totalEarnings = Math.max(0, oldTotalEarnings - payout.amount);
        
        await vendor.save();

        console.log(`✅ [REFUND] Statistiche venditore aggiornate:`);
        console.log(`   - Pending Earnings: €${oldPendingEarnings.toFixed(2)} → €${vendor.pendingEarnings.toFixed(2)}`);
        console.log(`   - Total Earnings: €${oldTotalEarnings.toFixed(2)} → €${vendor.totalEarnings.toFixed(2)}`);

        vendorUpdates.push({
          vendorId: vendor._id,
          vendorName: vendor.companyName || vendor.name,
          amountCancelled: payout.amount,
          oldPendingEarnings,
          newPendingEarnings: vendor.pendingEarnings,
          oldTotalEarnings,
          newTotalEarnings: vendor.totalEarnings
        });
      }

      // Elimina il VendorPayout
      await VendorPayout.deleteOne({ _id: payout._id });
      console.log(`✅ [REFUND] VendorPayout eliminato: ${payout._id}`);

      cancelledPayouts.push({
        payoutId: payout._id,
        vendorId: payout.vendorId,
        amount: payout.amount,
        stripeFee: payout.stripeFee,
        transferFee: payout.transferFee
      });
    }

    console.log('\n✅ [REFUND] ============ CANCELLAZIONE COMPLETATA ============');
    console.log(`✅ [REFUND] ${cancelledPayouts.length} payout cancellati`);
    console.log(`✅ [REFUND] ${vendorUpdates.length} venditori aggiornati`);
    console.log('✅ [REFUND] ================================================\n');

    return {
      success: true,
      message: `Cancellati ${cancelledPayouts.length} payout pending. Earnings venditori aggiornati.`,
      cancelledPayouts,
      vendorUpdates,
      timestamp: new Date()
    };

  } catch (error) {
    console.error('❌ [REFUND] Errore cancellazione earnings:', error);
    throw error;
  }
};

/**
 * Crea debiti per rimborsi post-pagamento (venditore già pagato)
 * Gestisce i casi in cui il pagamento è già stato effettuato al venditore (>14 giorni)
 * 
 * @param {String} orderId - ID dell'ordine da rimborsare
 * @returns {Object} Risultato operazione con dettagli debiti creati
 */
export const createRefundDebt = async (orderId) => {
  try {
    // Import dinamico per evitare dipendenze circolari
    const VendorPayout = (await import('../models/VendorPayout.js')).default;
    const User = (await import('../models/User.js')).default;
    const Order = (await import('../models/Order.js')).default;

    console.log('\n💳 [REFUND_DEBT] ============ CREAZIONE DEBITO RIMBORSO ============');
    console.log('💳 [REFUND_DEBT] Ordine ID:', orderId);

    // Trova ordine
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Ordine non trovato');
    }

    // Trova tutti i VendorPayout già pagati per questo ordine
    const paidPayouts = await VendorPayout.find({
      orderId: orderId,
      status: 'paid'
    });

    if (paidPayouts.length === 0) {
      console.log('⚠️  [REFUND_DEBT] Nessun VendorPayout già pagato trovato');
      return {
        success: false,
        message: 'Nessun pagamento effettuato da rimborsare',
        debts: []
      };
    }

    console.log(`💳 [REFUND_DEBT] Trovati ${paidPayouts.length} payout già pagati`);

    const createdDebts = [];
    const vendorUpdates = [];

    // Per ogni payout già pagato, crea un debito negativo
    for (const payout of paidPayouts) {
      console.log(`\n💳 [REFUND_DEBT] Creazione debito per payout: ${payout._id}`);
      console.log(`   - Venditore: ${payout.vendorId}`);
      console.log(`   - Importo pagato: €${payout.amount.toFixed(2)}`);

      // Crea VendorPayout negativo (debito)
      const debtPayout = await VendorPayout.create({
        vendorId: payout.vendorId,
        orderId: orderId,
        amount: -Math.abs(payout.amount), // Negativo per indicare debito
        stripeFee: 0, // Il debito è solo sull'importo netto
        transferFee: 0,
        status: 'pending', // Sarà detratto dal prossimo pagamento
        saleDate: new Date(),
        isRefundDebt: true, // Flag per identificare i debiti
        refundedPayoutId: payout._id // Riferimento al payout originale
      });

      console.log(`✅ [REFUND_DEBT] Debito creato: ${debtPayout._id}`);
      console.log(`   - Importo debito: €${debtPayout.amount.toFixed(2)}`);

      // Aggiorna statistiche venditore
      const vendor = await User.findById(payout.vendorId);
      
      if (vendor) {
        const oldDebtBalance = vendor.debtBalance || 0;
        const oldPaidEarnings = vendor.paidEarnings || 0;

        // Incrementa debito
        vendor.debtBalance = oldDebtBalance + Math.abs(payout.amount);
        
        // Sottrai da paidEarnings (ma non scendere sotto zero)
        vendor.paidEarnings = Math.max(0, oldPaidEarnings - Math.abs(payout.amount));
        
        await vendor.save();

        console.log(`✅ [REFUND_DEBT] Statistiche venditore aggiornate:`);
        console.log(`   - Debt Balance: €${oldDebtBalance.toFixed(2)} → €${vendor.debtBalance.toFixed(2)}`);
        console.log(`   - Paid Earnings: €${oldPaidEarnings.toFixed(2)} → €${vendor.paidEarnings.toFixed(2)}`);

        vendorUpdates.push({
          vendorId: vendor._id,
          vendorName: vendor.companyName || vendor.name,
          debtAmount: Math.abs(payout.amount),
          oldDebtBalance,
          newDebtBalance: vendor.debtBalance,
          oldPaidEarnings,
          newPaidEarnings: vendor.paidEarnings
        });
      }

      createdDebts.push({
        debtPayoutId: debtPayout._id,
        vendorId: payout.vendorId,
        amount: Math.abs(payout.amount),
        originalPayoutId: payout._id
      });
    }

    console.log('\n✅ [REFUND_DEBT] ============ DEBITO CREATO ============');
    console.log(`✅ [REFUND_DEBT] ${createdDebts.length} debiti creati`);
    console.log(`✅ [REFUND_DEBT] ${vendorUpdates.length} venditori aggiornati`);
    console.log('⚠️  [REFUND_DEBT] ATTENZIONE: I venditori hanno un debito attivo!');
    console.log('⚠️  [REFUND_DEBT] Sarà detratto automaticamente dal prossimo pagamento');
    console.log('✅ [REFUND_DEBT] ============================================\n');

    return {
      success: true,
      message: `Creati ${createdDebts.length} debiti. Saranno detratti dai prossimi pagamenti.`,
      debts: createdDebts,
      vendorUpdates,
      timestamp: new Date(),
      warning: 'I venditori hanno debiti attivi. Verranno detratti automaticamente.'
    };

  } catch (error) {
    console.error('❌ [REFUND_DEBT] Errore creazione debito:', error);
    throw error;
  }
};
