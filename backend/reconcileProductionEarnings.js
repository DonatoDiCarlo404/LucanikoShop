import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import VendorPayout from './models/VendorPayout.js';

dotenv.config();

/**
 * Verifica e riconcilia SOLO le statistiche earnings in PRODUZIONE
 * basandosi sui VendorPayouts esistenti (fonte di verità)
 */

const reconcileProductionEarnings = async () => {
  try {
    console.log('🔄 ============================================');
    console.log('⚠️  RICONCILIAZIONE EARNINGS - PRODUZIONE');
    console.log('🔄 ============================================\n');

    if (!process.env.MONGODB_URI_PROD) {
      console.error('❌ ERRORE: MONGODB_URI_PROD non configurato!');
      process.exit(1);
    }

    console.log('🔍 Database: PRODUZIONE');
    console.log('🔗 URI:', process.env.MONGODB_URI_PROD.replace(/:[^:@]+@/, ':***@'));
    console.log('\n⏳ Connessione...\n');

    await mongoose.connect(process.env.MONGODB_URI_PROD);
    console.log('✅ Connesso a PRODUZIONE\n');

    // Trova tutti i venditori
    const vendors = await User.find({ role: 'seller', isApproved: true });
    console.log(`📊 Analizzando ${vendors.length} venditori...\n`);
    console.log('═'.repeat(80));

    const vendorsToFix = [];

    for (const vendor of vendors) {
      // Ottieni tutti i VendorPayouts (fonte di verità)
      const allPayouts = await VendorPayout.find({ 
        vendorId: vendor._id,
        isRefundDebt: { $ne: true } // Escludi debiti
      });

      if (allPayouts.length === 0) continue;

      // Calcola valori CORRETTI dai VendorPayouts
      const correctTotal = allPayouts.reduce((sum, p) => sum + p.amount, 0);
      const correctPending = allPayouts
        .filter(p => ['pending', 'processing'].includes(p.status))
        .reduce((sum, p) => sum + p.amount, 0);
      const correctPaid = allPayouts
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);

      // Valori attuali nel DB
      const currentTotal = vendor.totalEarnings || 0;
      const currentPending = vendor.pendingEarnings || 0;
      const currentPaid = vendor.paidEarnings || 0;

      // Calcola differenze
      const diffTotal = Math.abs(currentTotal - correctTotal);
      const diffPending = Math.abs(currentPending - correctPending);
      const diffPaid = Math.abs(currentPaid - correctPaid);

      const needsFix = diffTotal > 0.01 || diffPending > 0.01 || diffPaid > 0.01;

      if (needsFix) {
        vendorsToFix.push({
          vendor,
          payoutsCount: allPayouts.length,
          current: {
            total: currentTotal,
            pending: currentPending,
            paid: currentPaid
          },
          correct: {
            total: correctTotal,
            pending: correctPending,
            paid: correctPaid
          },
          diff: {
            total: diffTotal,
            pending: diffPending,
            paid: diffPaid
          },
          statusBreakdown: allPayouts.reduce((acc, p) => {
            acc[p.status] = acc[p.status] || { count: 0, total: 0 };
            acc[p.status].count++;
            acc[p.status].total += p.amount;
            return acc;
          }, {})
        });
      }
    }

    // REPORT
    console.log('\n📋 RISULTATI ANALISI:');
    console.log('═'.repeat(80));

    if (vendorsToFix.length === 0) {
      console.log('✅ PERFETTO! Tutte le statistiche sono già sincronizzate.\n');
      await mongoose.connection.close();
      console.log('✅ Connessione chiusa');
      process.exit(0);
    }

    console.log(`⚠️  Trovati ${vendorsToFix.length} venditori con statistiche NON sincronizzate:\n`);

    vendorsToFix.forEach((v, index) => {
      console.log(`${index + 1}. ${v.vendor.businessName || v.vendor.name}`);
      console.log('   Email:', v.vendor.email);
      console.log('   VendorPayouts:', v.payoutsCount);
      
      console.log('\n   Breakdown VendorPayouts per status:');
      Object.entries(v.statusBreakdown).forEach(([status, data]) => {
        console.log(`      - ${status}: ${data.count} payout(s) = €${data.total.toFixed(2)}`);
      });

      console.log('\n   📊 CONFRONTO STATISTICHE:');
      console.log('   ─────────────────────────────────────────────────────');
      console.log('   Campo              | Attuale DB | Corretto   | Diff');
      console.log('   ───────────────────|────────────|────────────|──────────');
      console.log(`   Total Earnings     | €${v.current.total.toFixed(2).padEnd(9)} | €${v.correct.total.toFixed(2).padEnd(9)} | ${v.diff.total > 0.01 ? '❌ €' + v.diff.total.toFixed(2) : '✅'}`);
      console.log(`   Pending Earnings   | €${v.current.pending.toFixed(2).padEnd(9)} | €${v.correct.pending.toFixed(2).padEnd(9)} | ${v.diff.pending > 0.01 ? '❌ €' + v.diff.pending.toFixed(2) : '✅'}`);
      console.log(`   Paid Earnings      | €${v.current.paid.toFixed(2).padEnd(9)} | €${v.correct.paid.toFixed(2).padEnd(9)} | ${v.diff.paid > 0.01 ? '❌ €' + v.diff.paid.toFixed(2) : '✅'}`);
      console.log('');
    });

    // PIANO DI AZIONE
    console.log('\n🎯 PIANO DI AZIONE:');
    console.log('═'.repeat(80));
    console.log('La "fonte di verità" sono i VendorPayouts nel database.');
    console.log('Le statistiche nel modello User devono essere ricalcolate per matchare.\n');
    
    console.log('Azioni da eseguire:');
    vendorsToFix.forEach((v, index) => {
      console.log(`\n${index + 1}. ${v.vendor.businessName || v.vendor.name}`);
      if (v.diff.total > 0.01) {
        console.log(`   - Aggiorna totalEarnings: €${v.current.total.toFixed(2)} → €${v.correct.total.toFixed(2)}`);
      }
      if (v.diff.pending > 0.01) {
        console.log(`   - Aggiorna pendingEarnings: €${v.current.pending.toFixed(2)} → €${v.correct.pending.toFixed(2)}`);
      }
      if (v.diff.paid > 0.01) {
        console.log(`   - Aggiorna paidEarnings: €${v.current.paid.toFixed(2)} → €${v.correct.paid.toFixed(2)}`);
      }
    });

    // CONFERMA
    console.log('\n\n⚠️  ATTENZIONE - DATABASE DI PRODUZIONE');
    console.log('─'.repeat(80));
    console.log('• Stai per aggiornare le statistiche earnings in PRODUZIONE');
    console.log('• NON verranno modificati ordini o VendorPayouts');
    console.log('• Verranno aggiornati SOLO i campi earnings nel modello User');
    console.log('• Le modifiche sono SICURE e basate sui dati reali (VendorPayouts)');

    console.log('\n\n✅ PROCEDERE CON L\'AGGIORNAMENTO? (Ctrl+C per annullare)');
    console.log('─'.repeat(80));
    console.log('Attendo 8 secondi...\n');

    await new Promise(resolve => setTimeout(resolve, 8000));

    // ESECUZIONE
    console.log('\n🚀 AGGIORNAMENTO IN CORSO...\n');
    console.log('═'.repeat(80));

    let successCount = 0;
    let failedCount = 0;

    for (const v of vendorsToFix) {
      try {
        console.log(`\n📝 Aggiornando: ${v.vendor.businessName || v.vendor.name}`);
        
        v.vendor.totalEarnings = v.correct.total;
        v.vendor.pendingEarnings = v.correct.pending;
        v.vendor.paidEarnings = v.correct.paid;
        
        await v.vendor.save();

        console.log('   ✅ Aggiornamento completato:');
        console.log(`      - Total: €${v.correct.total.toFixed(2)}`);
        console.log(`      - Pending: €${v.correct.pending.toFixed(2)}`);
        console.log(`      - Paid: €${v.correct.paid.toFixed(2)}`);
        
        successCount++;

      } catch (error) {
        console.error(`   ❌ Errore:`, error.message);
        failedCount++;
      }
    }

    // VERIFICA FINALE
    console.log('\n\n🔍 VERIFICA FINALE:');
    console.log('═'.repeat(80));

    for (const v of vendorsToFix) {
      const updatedVendor = await User.findById(v.vendor._id);
      const totalMatch = Math.abs(updatedVendor.totalEarnings - v.correct.total) < 0.01;
      const pendingMatch = Math.abs(updatedVendor.pendingEarnings - v.correct.pending) < 0.01;
      const paidMatch = Math.abs(updatedVendor.paidEarnings - v.correct.paid) < 0.01;

      console.log(`\n${v.vendor.businessName || v.vendor.name}:`);
      console.log(`   Total Earnings: ${totalMatch ? '✅' : '❌'}`);
      console.log(`   Pending Earnings: ${pendingMatch ? '✅' : '❌'}`);
      console.log(`   Paid Earnings: ${paidMatch ? '✅' : '❌'}`);
    }

    // RIEPILOGO
    console.log('\n\n🎉 RICONCILIAZIONE COMPLETATA!');
    console.log('═'.repeat(80));
    console.log('✅ Venditori aggiornati: ' + successCount);
    console.log('❌ Errori: ' + failedCount);

    console.log('\n💡 RISULTATO:');
    console.log('─'.repeat(80));
    console.log('• Le dashboard dei venditori in PRODUZIONE mostrano ora i dati corretti');
    console.log('• Le statistiche earnings sono sincronizzate con i VendorPayouts');
    console.log('• Il sistema continuerà ad aggiornarsi automaticamente per i nuovi ordini');

  } catch (error) {
    console.error('\n❌ ERRORE:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Connessione chiusa');
  }
};

reconcileProductionEarnings();
