/**
 * Calcola gli earnings per ogni venditore in un ordine multivendor
 * Applica le fee Stripe (transazione + transfer) in modo proporzionale
 * 
 * @param {Object} order - Oggetto ordine con items, totalPrice, shippingPrice
 * @returns {Array} Array di oggetti con vendorId e calcoli earnings
 */
export const calculateVendorEarnings = (order) => {
  try {
    // 1. Calcola totale ordine (items + shipping)
    const totalOrder = order.totalPrice; // già include items + shipping

    // 2. Calcola fee Stripe transazione totale: 1.4% + €0.25
    const stripeTransactionFee = (totalOrder * 0.014) + 0.25;

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

      // Fee transfer Stripe: €0.25 per ogni transfer
      const transferFee = 0.25;

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
