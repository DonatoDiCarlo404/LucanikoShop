import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import VendorPayout from './models/VendorPayout.js';

dotenv.config();

/**
 * Script per analizzare lo stato degli earnings SENZA modificare nulla.
 * Mostra quali venditori hanno earnings e in che stato sono i loro payout.
 */

const checkEarningsStatus = async () => {
  try {
    console.log('\n🔍 [CHECK EARNINGS] ========== ANALISI STATO EARNINGS ==========\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ [DB] Connesso al database\n');

    // 1. Trova tutti i venditori con earnings
    const vendors = await User.find({
      role: { $in: ['vendor', 'seller'] },
      $or: [
        { totalEarnings: { $gt: 0 } },
        { pendingEarnings: { $gt: 0 } },
        { paidEarnings: { $gt: 0 } }
      ]
    }).select('name email businessName totalEarnings pendingEarnings paidEarnings');

    console.log(`📊 [VENDITORI] Trovati ${vendors.length} venditori con earnings\n`);

    if (vendors.length === 0) {
      console.log('✅ Nessun venditore con earnings nel database.');
      await mongoose.connection.close();
      return;
    }

    // 2. Per ogni venditore, mostra earnings e payout
    for (const vendor of vendors) {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`👤 [VENDITORE] ${vendor.businessName || vendor.name}`);
      console.log(`   Email: ${vendor.email}`);
      console.log(`   ID: ${vendor._id}`);
      console.log(`\n   💰 Earnings attuali:`);
      console.log(`     - Total Earnings:   €${(vendor.totalEarnings || 0).toFixed(2)}`);
      console.log(`     - Pending Earnings: €${(vendor.pendingEarnings || 0).toFixed(2)}`);
      console.log(`     - Paid Earnings:    €${(vendor.paidEarnings || 0).toFixed(2)}`);

      // Trova tutti i payout del venditore
      const allPayouts = await VendorPayout.find({ vendorId: vendor._id })
        .sort('-createdAt')
        .populate('orderId', 'orderNumber totalPrice');

      console.log(`\n   📦 Payout totali: ${allPayouts.length}`);

      if (allPayouts.length > 0) {
        // Raggruppa per status
        const payoutsByStatus = {
          pending: allPayouts.filter(p => p.status === 'pending'),
          processing: allPayouts.filter(p => p.status === 'processing'),
          paid: allPayouts.filter(p => p.status === 'paid'),
          failed: allPayouts.filter(p => p.status === 'failed')
        };

        console.log(`\n   📊 Payout per status:`);
        console.log(`     - Pending:    ${payoutsByStatus.pending.length} (€${payoutsByStatus.pending.reduce((sum, p) => sum + p.amount, 0).toFixed(2)})`);
        console.log(`     - Processing: ${payoutsByStatus.processing.length} (€${payoutsByStatus.processing.reduce((sum, p) => sum + p.amount, 0).toFixed(2)})`);
        console.log(`     - Paid:       ${payoutsByStatus.paid.length} (€${payoutsByStatus.paid.reduce((sum, p) => sum + p.amount, 0).toFixed(2)})`);
        console.log(`     - Failed:     ${payoutsByStatus.failed.length} (€${payoutsByStatus.failed.reduce((sum, p) => sum + p.amount, 0).toFixed(2)})`);

        // Calcola cosa DOVREBBE essere in pendingEarnings
        const shouldBePending = 
          payoutsByStatus.pending.reduce((sum, p) => sum + p.amount, 0) +
          payoutsByStatus.processing.reduce((sum, p) => sum + p.amount, 0);

        const shouldBePaid = 
          payoutsByStatus.paid.reduce((sum, p) => sum + p.amount, 0);

        console.log(`\n   🔍 Analisi correttezza dati:`);
        console.log(`     - Dovrebbe essere in Pending: €${shouldBePending.toFixed(2)}`);
        console.log(`     - Attualmente in Pending:     €${(vendor.pendingEarnings || 0).toFixed(2)}`);
        console.log(`     - Dovrebbe essere in Paid:    €${shouldBePaid.toFixed(2)}`);
        console.log(`     - Attualmente in Paid:        €${(vendor.paidEarnings || 0).toFixed(2)}`);

        // Verifica se ci sono discrepanze
        const pendingDiff = Math.abs(shouldBePending - (vendor.pendingEarnings || 0));
        const paidDiff = Math.abs(shouldBePaid - (vendor.paidEarnings || 0));

        if (pendingDiff > 0.01 || paidDiff > 0.01) {
          console.log(`\n   ⚠️  DISCREPANZA RILEVATA!`);
          console.log(`     - Differenza Pending: €${pendingDiff.toFixed(2)}`);
          console.log(`     - Differenza Paid:    €${paidDiff.toFixed(2)}`);
          console.log(`     - 🔧 NECESSITA CORREZIONE via fixEarningsData.js`);
        } else {
          console.log(`\n   ✅ Dati corretti - Nessuna correzione necessaria`);
        }

        // Mostra dettagli payout non pagati (se ce ne sono)
        const unpaidPayouts = [...payoutsByStatus.pending, ...payoutsByStatus.processing];
        if (unpaidPayouts.length > 0) {
          console.log(`\n   📋 Dettaglio payout non pagati (${unpaidPayouts.length}):`);
          unpaidPayouts.forEach((payout, idx) => {
            console.log(`     ${idx + 1}. €${payout.amount.toFixed(2)} - Status: ${payout.status} - Data: ${payout.saleDate.toLocaleDateString()}`);
            if (payout.stripeTransferId) {
              console.log(`        Transfer ID: ${payout.stripeTransferId}`);
            }
          });
        }
      } else {
        console.log(`   ⚠️  Nessun payout trovato ma earnings > 0 - ANOMALIA!`);
      }
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log('\n✅ Analisi completata\n');

    await mongoose.connection.close();
    console.log('📡 [DB] Connessione chiusa');

  } catch (error) {
    console.error('\n❌ [ERRORE]:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

checkEarningsStatus();
