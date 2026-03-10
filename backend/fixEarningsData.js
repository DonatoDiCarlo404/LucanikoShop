import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import VendorPayout from './models/VendorPayout.js';

dotenv.config();

/**
 * Script di migrazione per correggere gli earnings dei venditori.
 * 
 * PROBLEMA:
 * Gli earnings venivano spostati da pendingEarnings a paidEarnings
 * immediatamente dopo la creazione del transfer Stripe Connect,
 * anche se il payout era solo 'processing' e non 'paid'.
 * 
 * SOLUZIONE:
 * - Trova tutti i VendorPayout con status='processing' (non ancora pagati)
 * - Per ogni venditore, sposta l'importo da paidEarnings a pendingEarnings
 * - Mostra report di cosa è stato corretto
 */

const fixEarningsData = async () => {
  try {
    console.log('\n🔧 [FIX EARNINGS] ========== INIZIO CORREZIONE EARNINGS ==========\n');

    // Connessione al database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ [DB] Connesso al database');

    // 1. Trova tutti i VendorPayout con status='processing' (transfer iniziato ma non completato)
    // e anche quelli con status='pending' (vendita confermata ma transfer non iniziato)
    const processingPayouts = await VendorPayout.find({ status: 'processing' });
    const pendingPayouts = await VendorPayout.find({ status: 'pending' });
    
    console.log(`\n📊 [ANALISI] Trovati ${processingPayouts.length} payout in stato 'processing'`);
    console.log(`📊 [ANALISI] Trovati ${pendingPayouts.length} payout in stato 'pending'`);
    console.log(`📊 [ANALISI] Totale payout non pagati: ${processingPayouts.length + pendingPayouts.length}\n`);

    const unpaidPayouts = [...processingPayouts, ...pendingPayouts];

    if (unpaidPayouts.length === 0) {
      console.log('✅ Nessun payout da correggere. Tutti i dati sono corretti.');
      await mongoose.connection.close();
      return;
    }

    // 2. Raggruppa i payout per venditore
    const payoutsByVendor = {};
    for (const payout of unpaidPayouts) {
      const vendorId = payout.vendorId.toString();
      if (!payoutsByVendor[vendorId]) {
        payoutsByVendor[vendorId] = {
          payouts: [],
          totalAmount: 0
        };
      }
      payoutsByVendor[vendorId].payouts.push(payout);
      payoutsByVendor[vendorId].totalAmount += payout.amount;
    }

    console.log(`📊 [ANALISI] Venditori coinvolti: ${Object.keys(payoutsByVendor).length}\n`);

    // 3. Per ogni venditore, correggi gli earnings
    let vendorsFixed = 0;
    let totalAmountMoved = 0;

    for (const [vendorId, data] of Object.entries(payoutsByVendor)) {
      try {
        const vendor = await User.findById(vendorId);
        
        if (!vendor) {
          console.log(`⚠️ [SKIP] Venditore ${vendorId} non trovato nel database`);
          continue;
        }

        console.log(`\n👤 [VENDITORE] ${vendor.businessName || vendor.name} (${vendor.email})`);
        console.log(`   ID: ${vendorId}`);
        console.log(`   Payout non pagati: ${data.payouts.length}`);
        console.log(`     - Pending: ${data.payouts.filter(p => p.status === 'pending').length}`);
        console.log(`     - Processing: ${data.payouts.filter(p => p.status === 'processing').length}`);
        console.log(`   Importo totale da spostare: €${data.totalAmount.toFixed(2)}`);
        console.log(`   Prima della correzione:`);
        console.log(`     - Pending Earnings: €${(vendor.pendingEarnings || 0).toFixed(2)}`);
        console.log(`     - Paid Earnings: €${(vendor.paidEarnings || 0).toFixed(2)}`);
        console.log(`     - Total Earnings: €${(vendor.totalEarnings || 0).toFixed(2)}`);

        // Sposta l'importo da paidEarnings a pendingEarnings
        vendor.paidEarnings = Math.max(0, (vendor.paidEarnings || 0) - data.totalAmount);
        vendor.pendingEarnings = (vendor.pendingEarnings || 0) + data.totalAmount;
        
        await vendor.save();

        console.log(`   Dopo la correzione:`);
        console.log(`     - Pending Earnings: €${vendor.pendingEarnings.toFixed(2)} ✅`);
        console.log(`     - Paid Earnings: €${vendor.paidEarnings.toFixed(2)} ✅`);
        console.log(`     - Total Earnings: €${vendor.totalEarnings.toFixed(2)}`);

        vendorsFixed++;
        totalAmountMoved += data.totalAmount;

      } catch (vendorError) {
        console.error(`❌ [ERRORE] Impossibile correggere venditore ${vendorId}:`, vendorError.message);
      }
    }

    // 4. Report finale
    console.log('\n' + '='.repeat(70));
    console.log('📊 [REPORT FINALE]');
    console.log('='.repeat(70));
    console.log(`✅ Venditori corretti: ${vendorsFixed}/${Object.keys(payoutsByVendor).length}`);
    console.log(`💰 Importo totale spostato da paid a pending: €${totalAmountMoved.toFixed(2)}`);
    console.log(`📦 Payout in processing: ${processingPayouts.length}`);
    console.log(`📦 Payout in pending: ${pendingPayouts.length}`);
    console.log(`📦 Totale payout non pagati: ${unpaidPayouts.length}`);
    console.log('\n✅ Correzione completata con successo!\n');
    
    console.log('ℹ️  NOTA: Gli earnings ora sono in "In Attesa di Pagamento" finché');
    console.log('   l\'admin non segna i payout come "paid" dal pannello admin.\n');

    await mongoose.connection.close();
    console.log('📡 [DB] Connessione chiusa');

  } catch (error) {
    console.error('\n❌ [ERRORE FATALE]:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Esegui lo script
fixEarningsData();
