import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import VendorPayout from './models/VendorPayout.js';

dotenv.config();

/**
 * Script per riconciliare le statistiche earnings del venditore
 * basandosi sui VendorPayouts effettivi nel database.
 * 
 * Questo è la "fonte di verità" - ricalcola tutto dai VendorPayouts.
 */

const reconcileVendorEarnings = async () => {
  try {
    console.log('🔄 ============ RICONCILIAZIONE EARNINGS ============\n');
    console.log('🔍 Connessione al database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso\n');

    // Trova il venditore
    const vendor = await User.findOne({ 
      businessName: /La Bontà delle Carni/i,
      role: 'seller'
    });

    if (!vendor) {
      console.log('❌ Venditore non trovato');
      process.exit(0);
    }

    console.log('✅ Venditore trovato:', vendor.businessName);
    console.log('   ID:', vendor._id);
    console.log('\n📊 STATISTICHE ATTUALI (nel DB):');
    console.log('   Total Earnings: €' + (vendor.totalEarnings || 0).toFixed(2));
    console.log('   Pending Earnings: €' + (vendor.pendingEarnings || 0).toFixed(2));
    console.log('   Paid Earnings: €' + (vendor.paidEarnings || 0).toFixed(2));

    // Trova tutti i VendorPayouts
    const allPayouts = await VendorPayout.find({ 
      vendorId: vendor._id,
      isRefundDebt: { $ne: true } // Escludi debiti da rimborsi
    });

    console.log('\n📦 VENDOR PAYOUTS TROVATI: ' + allPayouts.length);
    console.log('─'.repeat(80));

    // Calcola totali per status
    const payoutsByStatus = allPayouts.reduce((acc, p) => {
      acc[p.status] = acc[p.status] || { count: 0, total: 0, payouts: [] };
      acc[p.status].count++;
      acc[p.status].total += p.amount;
      acc[p.status].payouts.push(p);
      return acc;
    }, {});

    console.log('\nBreakdown per status:');
    Object.entries(payoutsByStatus).forEach(([status, data]) => {
      console.log(`   ${status.toUpperCase()}: ${data.count} payout(s) - €${data.total.toFixed(2)}`);
    });

    // Calcola valori corretti
    const correctTotalEarnings = allPayouts.reduce((sum, p) => sum + p.amount, 0);
    const correctPendingEarnings = allPayouts
      .filter(p => ['pending', 'processing'].includes(p.status))
      .reduce((sum, p) => sum + p.amount, 0);
    const correctPaidEarnings = allPayouts
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    console.log('\n📊 VALORI CORRETTI (calcolati da VendorPayouts):');
    console.log('   Total Earnings: €' + correctTotalEarnings.toFixed(2));
    console.log('   Pending Earnings: €' + correctPendingEarnings.toFixed(2));
    console.log('   Paid Earnings: €' + correctPaidEarnings.toFixed(2));

    console.log('\n🔍 DIFFERENZE:');
    console.log('─'.repeat(80));
    const diffTotal = (vendor.totalEarnings || 0) - correctTotalEarnings;
    const diffPending = (vendor.pendingEarnings || 0) - correctPendingEarnings;
    const diffPaid = (vendor.paidEarnings || 0) - correctPaidEarnings;

    console.log('   Total: ' + (Math.abs(diffTotal) > 0.01 ? '❌' : '✅') + ' €' + diffTotal.toFixed(2));
    console.log('   Pending: ' + (Math.abs(diffPending) > 0.01 ? '❌' : '✅') + ' €' + diffPending.toFixed(2));
    console.log('   Paid: ' + (Math.abs(diffPaid) > 0.01 ? '❌' : '✅') + ' €' + diffPaid.toFixed(2));

    const needsUpdate = Math.abs(diffTotal) > 0.01 || Math.abs(diffPending) > 0.01 || Math.abs(diffPaid) > 0.01;

    if (!needsUpdate) {
      console.log('\n✅ I dati sono già sincronizzati!');
      console.log('   Non è necessario fare nulla.');
      process.exit(0);
    }

    console.log('\n\n⚠️  È NECESSARIO AGGIORNARE I DATI!');
    console.log('─'.repeat(80));
    console.log('I valori nel modello User non riflettono i VendorPayouts reali.');
    console.log('Questa è la "fonte di verità" - i VendorPayouts sono corretti.\n');

    console.log('🎯 PIANO DI AGGIORNAMENTO:');
    console.log('─'.repeat(80));
    console.log('CAMPO              | ATTUALE    | CORRETTO   | AZIONE');
    console.log('───────────────────|────────────|────────────|────────────');
    console.log(`totalEarnings      | €${(vendor.totalEarnings || 0).toFixed(2).padEnd(9)} | €${correctTotalEarnings.toFixed(2).padEnd(9)} | ${Math.abs(diffTotal) > 0.01 ? 'UPDATE' : 'OK'}`);
    console.log(`pendingEarnings    | €${(vendor.pendingEarnings || 0).toFixed(2).padEnd(9)} | €${correctPendingEarnings.toFixed(2).padEnd(9)} | ${Math.abs(diffPending) > 0.01 ? 'UPDATE' : 'OK'}`);
    console.log(`paidEarnings       | €${(vendor.paidEarnings || 0).toFixed(2).padEnd(9)} | €${correctPaidEarnings.toFixed(2).padEnd(9)} | ${Math.abs(diffPaid) > 0.01 ? 'UPDATE' : 'OK'}`);

    console.log('\n\n✅ PROCEDERE CON L\'AGGIORNAMENTO? (Ctrl+C per annullare)');
    console.log('─'.repeat(80));
    console.log('Attendo 5 secondi...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🚀 Aggiornamento in corso...\n');

    // Aggiorna i valori
    vendor.totalEarnings = correctTotalEarnings;
    vendor.pendingEarnings = correctPendingEarnings;
    vendor.paidEarnings = correctPaidEarnings;
    
    await vendor.save();

    console.log('✅ AGGIORNAMENTO COMPLETATO!');
    console.log('─'.repeat(80));
    console.log('📊 NUOVI VALORI NEL DATABASE:');
    console.log('   Total Earnings: €' + vendor.totalEarnings.toFixed(2));
    console.log('   Pending Earnings: €' + vendor.pendingEarnings.toFixed(2));
    console.log('   Paid Earnings: €' + vendor.paidEarnings.toFixed(2));

    // Verifica finale
    const updatedVendor = await User.findById(vendor._id);
    const finalDiffTotal = Math.abs(updatedVendor.totalEarnings - correctTotalEarnings);
    const finalDiffPending = Math.abs(updatedVendor.pendingEarnings - correctPendingEarnings);
    const finalDiffPaid = Math.abs(updatedVendor.paidEarnings - correctPaidEarnings);

    console.log('\n🔍 VERIFICA FINALE:');
    console.log('   Total Earnings: ' + (finalDiffTotal < 0.01 ? '✅' : '❌'));
    console.log('   Pending Earnings: ' + (finalDiffPending < 0.01 ? '✅' : '❌'));
    console.log('   Paid Earnings: ' + (finalDiffPaid < 0.01 ? '✅' : '❌'));

    if (finalDiffTotal < 0.01 && finalDiffPending < 0.01 && finalDiffPaid < 0.01) {
      console.log('\n🎉 PERFETTO! I dati sono ora sincronizzati!');
      console.log('\n💡 La dashboard del venditore ora mostrerà:');
      console.log('   - Guadagni Totali: €' + correctTotalEarnings.toFixed(2));
      console.log('   - In Attesa di Pagamento: €' + correctPendingEarnings.toFixed(2));
      console.log('   - Pagamenti Ricevuti: €' + correctPaidEarnings.toFixed(2));
    } else {
      console.log('\n⚠️  Potrebbero esserci ancora discrepanze minori');
    }

  } catch (error) {
    console.error('\n❌ ERRORE:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Connessione chiusa');
  }
};

reconcileVendorEarnings();
