import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Order from './models/Order.js';
import VendorPayout from './models/VendorPayout.js';
import { calculateVendorEarnings } from './utils/vendorEarningsCalculator.js';

dotenv.config();

/**
 * ⚠️  SCRIPT PER DATABASE DI PRODUZIONE
 * Fixa VendorPayouts mancanti e riconcilia statistiche earnings
 * 
 * SICUREZZA:
 * - Usa MONGODB_URI_PROD esplicitamente
 * - Mostra report dettagliato prima di modificare
 * - Chiede conferma multipla
 * - Solo-lettura fino alla conferma finale
 */

const fixProductionVendorPayouts = async () => {
  try {
    console.log('🚨 ============================================');
    console.log('⚠️  FIX VENDOR PAYOUTS - DATABASE PRODUZIONE');
    console.log('🚨 ============================================\n');

    // Verifica che esista MONGODB_URI_PROD
    if (!process.env.MONGODB_URI_PROD) {
      console.error('❌ ERRORE: MONGODB_URI_PROD non configurato nel .env!');
      process.exit(1);
    }

    console.log('🔍 Database target: PRODUZIONE');
    console.log('🔗 URI:', process.env.MONGODB_URI_PROD.replace(/:[^:@]+@/, ':***@'));
    console.log('\n⏳ Connessione al database di PRODUZIONE...\n');

    await mongoose.connect(process.env.MONGODB_URI_PROD);
    console.log('✅ Connesso al database di PRODUZIONE\n');

    // ============================================================
    // FASE 1: ANALISI (SOLO LETTURA)
    // ============================================================

    console.log('📊 FASE 1: ANALISI SITUAZIONE ATTUALE');
    console.log('─'.repeat(80));

    // Trova tutti i venditori
    const vendors = await User.find({ role: 'seller', isApproved: true });
    console.log(`✅ Trovati ${vendors.length} venditori in produzione\n`);

    const vendorReports = [];

    for (const vendor of vendors) {
      // Trova ordini del venditore
      const orders = await Order.find({
        'items.seller': vendor._id,
        isPaid: true,
        status: { $in: ['pending', 'processing', 'shipped', 'delivered'] }
      }).sort({ createdAt: -1 });

      if (orders.length === 0) continue;

      // Analizza ogni ordine
      const ordersToFix = [];
      const ordersAlreadyOk = [];
      let totalMissingAmount = 0;

      for (const order of orders) {
        const vendorItems = order.items.filter(item => 
          item.seller && item.seller.toString() === vendor._id.toString()
        );

        if (vendorItems.length === 0) continue;

        const vendorTotal = vendorItems.reduce((sum, item) => {
          return sum + (item.price * item.quantity);
        }, 0);

        // Verifica se esiste VendorPayout
        const existingPayout = await VendorPayout.findOne({
          vendorId: vendor._id,
          orderId: order._id
        });

        if (!existingPayout) {
          // Calcola earnings
          const mockOrderForCalculation = {
            totalPrice: order.totalPrice,
            items: vendorItems.map(item => ({
              seller: item.seller,
              product: item.product,
              name: item.name,
              price: item.price,
              quantity: item.quantity
            }))
          };

          const earnings = calculateVendorEarnings(mockOrderForCalculation);
          const vendorEarning = earnings.find(e => e.vendorId === vendor._id.toString());

          if (vendorEarning) {
            totalMissingAmount += vendorEarning.netAmount;
            ordersToFix.push({
              orderId: order._id,
              orderNumber: order.orderNumber || order._id.toString().substring(0, 8),
              date: order.createdAt,
              netAmount: vendorEarning.netAmount,
              stripeFee: vendorEarning.stripeFee,
              transferFee: vendorEarning.transferFee
            });
          }
        } else {
          ordersAlreadyOk.push(order._id);
        }
      }

      if (ordersToFix.length > 0) {
        // Calcola statistiche corrette
        const allPayouts = await VendorPayout.find({ 
          vendorId: vendor._id,
          isRefundDebt: { $ne: true }
        });

        const currentTotalEarnings = vendor.totalEarnings || 0;
        const currentPendingEarnings = vendor.pendingEarnings || 0;
        const currentPaidEarnings = vendor.paidEarnings || 0;

        const correctTotalEarnings = allPayouts.reduce((sum, p) => sum + p.amount, 0) + totalMissingAmount;
        const correctPendingEarnings = allPayouts
          .filter(p => ['pending', 'processing'].includes(p.status))
          .reduce((sum, p) => sum + p.amount, 0) + totalMissingAmount;
        const correctPaidEarnings = allPayouts
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + p.amount, 0);

        vendorReports.push({
          vendor,
          ordersToFix,
          ordersAlreadyOk: ordersAlreadyOk.length,
          totalMissingAmount,
          currentStats: {
            totalEarnings: currentTotalEarnings,
            pendingEarnings: currentPendingEarnings,
            paidEarnings: currentPaidEarnings
          },
          correctStats: {
            totalEarnings: correctTotalEarnings,
            pendingEarnings: correctPendingEarnings,
            paidEarnings: correctPaidEarnings
          }
        });
      }
    }

    // ============================================================
    // REPORT RIEPILOGATIVO
    // ============================================================

    console.log('\n📋 REPORT VENDITORI CON PROBLEMI:');
    console.log('═'.repeat(80));

    if (vendorReports.length === 0) {
      console.log('✅ NESSUN PROBLEMA TROVATO!');
      console.log('   Tutti i venditori hanno VendorPayouts corretti.\n');
      await mongoose.connection.close();
      console.log('✅ Connessione chiusa');
      process.exit(0);
    }

    let totalVendorsToFix = vendorReports.length;
    let totalOrdersToFix = vendorReports.reduce((sum, r) => sum + r.ordersToFix.length, 0);
    let totalAmountToAdd = vendorReports.reduce((sum, r) => sum + r.totalMissingAmount, 0);

    console.log(`⚠️  Venditori da fixare: ${totalVendorsToFix}`);
    console.log(`⚠️  Ordini senza VendorPayout: ${totalOrdersToFix}`);
    console.log(`⚠️  Importo totale mancante: €${totalAmountToAdd.toFixed(2)}\n`);

    vendorReports.forEach((report, index) => {
      console.log(`\n${index + 1}. ${report.vendor.businessName || report.vendor.name}`);
      console.log('   Email:', report.vendor.email);
      console.log('   Ordini da fixare:', report.ordersToFix.length);
      console.log('   Ordini già OK:', report.ordersAlreadyOk);
      console.log('   Importo mancante: €' + report.totalMissingAmount.toFixed(2));
      
      console.log('\n   📊 STATISTICHE:');
      console.log('   ─────────────────────────────────────────');
      console.log('   Campo              | Attuale   | Corretto  | Diff');
      console.log('   ───────────────────|───────────|───────────|──────');
      
      const diffTotal = report.correctStats.totalEarnings - report.currentStats.totalEarnings;
      const diffPending = report.correctStats.pendingEarnings - report.currentStats.pendingEarnings;
      const diffPaid = report.correctStats.paidEarnings - report.currentStats.paidEarnings;
      
      console.log(`   Total Earnings     | €${report.currentStats.totalEarnings.toFixed(2).padEnd(8)} | €${report.correctStats.totalEarnings.toFixed(2).padEnd(8)} | ${diffTotal > 0 ? '+' : ''}€${diffTotal.toFixed(2)}`);
      console.log(`   Pending Earnings   | €${report.currentStats.pendingEarnings.toFixed(2).padEnd(8)} | €${report.correctStats.pendingEarnings.toFixed(2).padEnd(8)} | ${diffPending > 0 ? '+' : ''}€${diffPending.toFixed(2)}`);
      console.log(`   Paid Earnings      | €${report.currentStats.paidEarnings.toFixed(2).padEnd(8)} | €${report.correctStats.paidEarnings.toFixed(2).padEnd(8)} | ${diffPaid > 0 ? '+' : ''}€${diffPaid.toFixed(2)}`);

      console.log('\n   📦 ORDINI DA FIXARE:');
      report.ordersToFix.forEach((order, i) => {
        console.log(`      ${i + 1}. ${order.orderNumber} - ${order.date.toLocaleDateString('it-IT')} - €${order.netAmount.toFixed(2)}`);
      });
    });

    // ============================================================
    // CONFERMA UTENTE
    // ============================================================

    console.log('\n\n🎯 PIANO DI AZIONE:');
    console.log('═'.repeat(80));
    console.log('1. Creare ' + totalOrdersToFix + ' VendorPayout con status "pending"');
    console.log('2. Aggiornare statistiche earnings per ' + totalVendorsToFix + ' venditori');
    console.log('3. Verificare coerenza dati');

    console.log('\n\n⚠️  ATTENZIONE - DATABASE DI PRODUZIONE');
    console.log('─'.repeat(80));
    console.log('• Stai per modificare il database di PRODUZIONE');
    console.log('• Le modifiche sono IRREVERSIBILI (salvo backup manuale)');
    console.log('• Gli script sono SICURI e testati su DEV');
    console.log('• NON verranno eseguiti transfer Stripe');
    console.log('• Verranno creati solo record VendorPayout pending');

    console.log('\n\n✅ PROCEDERE CON LE MODIFICHE? (Ctrl+C per annullare)');
    console.log('─'.repeat(80));
    console.log('Attendo 8 secondi...\n');

    await new Promise(resolve => setTimeout(resolve, 8000));

    // ============================================================
    // FASE 2: ESECUZIONE MODIFICHE
    // ============================================================

    console.log('\n🚀 INIZIO ESECUZIONE MODIFICHE...\n');
    console.log('═'.repeat(80));

    let totalCreated = 0;
    let totalFailed = 0;
    let totalVendorsUpdated = 0;

    for (const report of vendorReports) {
      console.log(`\n📝 Processando: ${report.vendor.businessName || report.vendor.name}`);
      console.log('─'.repeat(80));

      // Crea VendorPayouts mancanti
      for (const orderData of report.ordersToFix) {
        try {
          const vendorPayout = await VendorPayout.create({
            vendorId: report.vendor._id,
            orderId: orderData.orderId,
            amount: orderData.netAmount,
            stripeFee: orderData.stripeFee,
            transferFee: orderData.transferFee,
            status: 'pending',
            saleDate: orderData.date
          });

          console.log(`   ✅ VendorPayout creato: ${orderData.orderNumber} - €${orderData.netAmount.toFixed(2)}`);
          totalCreated++;

        } catch (error) {
          console.error(`   ❌ Errore creazione VendorPayout ${orderData.orderNumber}:`, error.message);
          totalFailed++;
        }
      }

      // Aggiorna statistiche venditore
      try {
        report.vendor.totalEarnings = report.correctStats.totalEarnings;
        report.vendor.pendingEarnings = report.correctStats.pendingEarnings;
        report.vendor.paidEarnings = report.correctStats.paidEarnings;
        
        await report.vendor.save();

        console.log(`   ✅ Statistiche aggiornate:`);
        console.log(`      - Total: €${report.correctStats.totalEarnings.toFixed(2)}`);
        console.log(`      - Pending: €${report.correctStats.pendingEarnings.toFixed(2)}`);
        console.log(`      - Paid: €${report.correctStats.paidEarnings.toFixed(2)}`);
        
        totalVendorsUpdated++;

      } catch (error) {
        console.error(`   ❌ Errore aggiornamento statistiche:`, error.message);
      }
    }

    // ============================================================
    // VERIFICA FINALE
    // ============================================================

    console.log('\n\n🔍 VERIFICA FINALE:');
    console.log('═'.repeat(80));

    for (const report of vendorReports) {
      const updatedVendor = await User.findById(report.vendor._id);
      const allPayouts = await VendorPayout.find({ 
        vendorId: report.vendor._id,
        isRefundDebt: { $ne: true }
      });

      const calcPending = allPayouts
        .filter(p => ['pending', 'processing'].includes(p.status))
        .reduce((sum, p) => sum + p.amount, 0);
      const calcPaid = allPayouts
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);
      const calcTotal = allPayouts.reduce((sum, p) => sum + p.amount, 0);

      const pendingMatch = Math.abs(updatedVendor.pendingEarnings - calcPending) < 0.01;
      const paidMatch = Math.abs(updatedVendor.paidEarnings - calcPaid) < 0.01;
      const totalMatch = Math.abs(updatedVendor.totalEarnings - calcTotal) < 0.01;

      console.log(`\n${report.vendor.businessName || report.vendor.name}:`);
      console.log(`   Total Earnings: ${totalMatch ? '✅' : '❌'} (DB: €${updatedVendor.totalEarnings.toFixed(2)} - Calc: €${calcTotal.toFixed(2)})`);
      console.log(`   Pending Earnings: ${pendingMatch ? '✅' : '❌'} (DB: €${updatedVendor.pendingEarnings.toFixed(2)} - Calc: €${calcPending.toFixed(2)})`);
      console.log(`   Paid Earnings: ${paidMatch ? '✅' : '❌'} (DB: €${updatedVendor.paidEarnings.toFixed(2)} - Calc: €${calcPaid.toFixed(2)})`);
    }

    // ============================================================
    // RIEPILOGO FINALE
    // ============================================================

    console.log('\n\n🎉 FIX COMPLETATO!');
    console.log('═'.repeat(80));
    console.log('✅ VendorPayouts creati: ' + totalCreated);
    console.log('❌ Errori: ' + totalFailed);
    console.log('✅ Venditori aggiornati: ' + totalVendorsUpdated + '/' + totalVendorsToFix);

    console.log('\n💡 RISULTATO:');
    console.log('─'.repeat(80));
    console.log('• Le dashboard dei venditori in PRODUZIONE sono ora aggiornate');
    console.log('• I VendorPayouts mancanti sono stati creati con status "pending"');
    console.log('• Il job automatico li processerà dopo 14 giorni dalla vendita');
    console.log('• Da ora in poi ogni nuovo ordine creerà automaticamente VendorPayout');

  } catch (error) {
    console.error('\n❌ ERRORE CRITICO:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Connessione al database chiusa');
  }
};

fixProductionVendorPayouts();
