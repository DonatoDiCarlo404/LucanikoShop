import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Order from './models/Order.js';
import VendorPayout from './models/VendorPayout.js';
import { calculateVendorEarnings } from './utils/vendorEarningsCalculator.js';

dotenv.config();

/**
 * Script per creare VendorPayout mancanti per ordini già completati
 * Questo script è sicuro perché:
 * 1. Controlla se il VendorPayout esiste già
 * 2. Usa la stessa logica di calcolo del webhook
 * 3. Non esegue transfer Stripe (solo crea record pending)
 * 4. Mostra un report dettagliato prima di confermare
 */

const fixMissingVendorPayouts = async () => {
  try {
    console.log('🔧 ============ FIX VENDOR PAYOUTS MANCANTI ============\n');
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
    console.log('   Email:', vendor.email);
    console.log('\n📊 STATISTICHE ATTUALI:');
    console.log('   Total Earnings: €' + (vendor.totalEarnings || 0).toFixed(2));
    console.log('   Pending Earnings: €' + (vendor.pendingEarnings || 0).toFixed(2));
    console.log('   Paid Earnings: €' + (vendor.paidEarnings || 0).toFixed(2));

    // Trova tutti gli ordini del venditore
    const orders = await Order.find({
      'items.seller': vendor._id,
      isPaid: true,
      status: { $in: ['pending', 'processing', 'shipped', 'delivered'] } // Escludi cancelled
    }).sort({ createdAt: -1 });

    console.log('\n📦 ORDINI TROVATI: ' + orders.length);
    console.log('─'.repeat(80));

    const ordersToFix = [];
    const ordersAlreadyOk = [];
    let totalMissingAmount = 0;

    for (const order of orders) {
      // Filtra items del venditore
      const vendorItems = order.items.filter(item => 
        item.seller && item.seller.toString() === vendor._id.toString()
      );

      if (vendorItems.length === 0) continue;

      // Calcola totale venditore
      const vendorTotal = vendorItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

      // Verifica se esiste già un VendorPayout
      const existingPayout = await VendorPayout.findOne({
        vendorId: vendor._id,
        orderId: order._id
      });

      if (existingPayout) {
        ordersAlreadyOk.push({
          orderId: order._id.toString().substring(0, 8),
          orderNumber: order.orderNumber,
          date: order.createdAt,
          amount: vendorTotal,
          payoutAmount: existingPayout.amount,
          payoutStatus: existingPayout.status
        });
      } else {
        // Calcola earnings usando la stessa logica del webhook
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
            vendorTotal: vendorTotal,
            netAmount: vendorEarning.netAmount,
            stripeFee: vendorEarning.stripeFee,
            transferFee: vendorEarning.transferFee,
            items: vendorItems
          });
        }
      }
    }

    console.log('\n📋 REPORT:');
    console.log('─'.repeat(80));
    console.log('✅ Ordini già con VendorPayout: ' + ordersAlreadyOk.length);
    console.log('❌ Ordini SENZA VendorPayout: ' + ordersToFix.length);
    console.log('💰 Importo totale mancante: €' + totalMissingAmount.toFixed(2));

    if (ordersToFix.length === 0) {
      console.log('\n✅ Tutti gli ordini hanno già VendorPayout!');
      console.log('   Non c\'è nulla da fare.');
      process.exit(0);
    }

    console.log('\n📦 ORDINI DA FIXARE:');
    console.log('─'.repeat(80));
    ordersToFix.forEach((order, index) => {
      console.log(`\n${index + 1}. Ordine: ${order.orderNumber}`);
      console.log(`   Data: ${order.date.toLocaleDateString('it-IT')}`);
      console.log(`   Prodotti (lordo): €${order.vendorTotal.toFixed(2)}`);
      console.log(`   Stripe Fee: €${order.stripeFee.toFixed(2)}`);
      console.log(`   Transfer Fee: €${order.transferFee.toFixed(2)}`);
      console.log(`   Netto da pagare: €${order.netAmount.toFixed(2)}`);
      console.log(`   Items:`);
      order.items.forEach(item => {
        console.log(`     - ${item.name} x${item.quantity} @ €${item.price}`);
      });
    });

    console.log('\n\n🎯 PIANO DI AZIONE:');
    console.log('─'.repeat(80));
    console.log('1. Creare ' + ordersToFix.length + ' VendorPayout con status "pending"');
    console.log('2. Aggiornare statistiche venditore:');
    console.log('   - pendingEarnings: €' + (vendor.pendingEarnings || 0).toFixed(2) + ' → €' + ((vendor.pendingEarnings || 0) + totalMissingAmount).toFixed(2));
    console.log('   - totalEarnings: €' + (vendor.totalEarnings || 0).toFixed(2) + ' → €' + ((vendor.totalEarnings || 0) + totalMissingAmount).toFixed(2));

    // Verifica coerenza finale
    const totalPendingPayouts = totalMissingAmount;
    const existingPayouts = await VendorPayout.find({ 
      vendorId: vendor._id,
      status: { $in: ['pending', 'processing'] }
    });
    const existingPendingAmount = existingPayouts.reduce((sum, p) => sum + p.amount, 0);
    const expectedPendingTotal = existingPendingAmount + totalPendingPayouts;

    console.log('\n3. Verificare coerenza:');
    console.log('   - Pending esistenti: €' + existingPendingAmount.toFixed(2));
    console.log('   - Pending da aggiungere: €' + totalPendingPayouts.toFixed(2));
    console.log('   - Totale pending atteso: €' + expectedPendingTotal.toFixed(2));

    console.log('\n\n⚠️  IMPORTANTE:');
    console.log('─'.repeat(80));
    console.log('• I VendorPayout saranno creati con status "pending"');
    console.log('• Il job automatico li processerà dopo 14 giorni dalla vendita');
    console.log('• NON verrà eseguito nessun transfer Stripe ora');
    console.log('• Questo script è SICURO e non compromette nulla');

    console.log('\n\n✅ PROCEDERE CON LA CREAZIONE? (Ctrl+C per annullare)');
    console.log('─'.repeat(80));
    
    // Attendi 5 secondi prima di procedere
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('\n🚀 Inizio creazione VendorPayouts...\n');

    let createdCount = 0;
    let failedCount = 0;

    for (const orderData of ordersToFix) {
      try {
        console.log(`📝 Creazione VendorPayout per ordine ${orderData.orderNumber}...`);

        const vendorPayout = await VendorPayout.create({
          vendorId: vendor._id,
          orderId: orderData.orderId,
          amount: orderData.netAmount,
          stripeFee: orderData.stripeFee,
          transferFee: orderData.transferFee,
          status: 'pending',
          saleDate: orderData.date
        });

        console.log(`✅ VendorPayout creato: ${vendorPayout._id}`);
        console.log(`   - Importo: €${vendorPayout.amount.toFixed(2)}`);
        console.log(`   - Status: ${vendorPayout.status}`);
        console.log(`   - Data vendita: ${vendorPayout.saleDate.toLocaleDateString('it-IT')}`);
        
        createdCount++;

      } catch (error) {
        console.error(`❌ Errore creazione VendorPayout per ordine ${orderData.orderNumber}:`, error.message);
        failedCount++;
      }
    }

    console.log('\n\n📊 AGGIORNAMENTO STATISTICHE VENDITORE...');
    console.log('─'.repeat(80));

    // Aggiorna statistiche venditore
    const oldPendingEarnings = vendor.pendingEarnings || 0;
    const oldTotalEarnings = vendor.totalEarnings || 0;

    vendor.pendingEarnings = oldPendingEarnings + totalMissingAmount;
    vendor.totalEarnings = oldTotalEarnings + totalMissingAmount;
    
    await vendor.save();

    console.log('✅ Statistiche aggiornate:');
    console.log('   - Pending Earnings: €' + oldPendingEarnings.toFixed(2) + ' → €' + vendor.pendingEarnings.toFixed(2));
    console.log('   - Total Earnings: €' + oldTotalEarnings.toFixed(2) + ' → €' + vendor.totalEarnings.toFixed(2));

    // Verifica finale
    console.log('\n\n🔍 VERIFICA FINALE:');
    console.log('─'.repeat(80));

    const allPayouts = await VendorPayout.find({ vendorId: vendor._id });
    const payoutsByStatus = allPayouts.reduce((acc, p) => {
      acc[p.status] = acc[p.status] || { count: 0, total: 0 };
      acc[p.status].count++;
      acc[p.status].total += p.amount;
      return acc;
    }, {});

    console.log('VendorPayouts totali:', allPayouts.length);
    Object.entries(payoutsByStatus).forEach(([status, data]) => {
      console.log(`   - ${status.toUpperCase()}: ${data.count} payout(s) - €${data.total.toFixed(2)}`);
    });

    const calcPendingEarnings = allPayouts
      .filter(p => ['pending', 'processing'].includes(p.status))
      .reduce((sum, p) => sum + p.amount, 0);
    const calcPaidEarnings = allPayouts
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    console.log('\nCoerenza dati:');
    console.log('   - Pending calcolato: €' + calcPendingEarnings.toFixed(2));
    console.log('   - Pending nel DB: €' + vendor.pendingEarnings.toFixed(2));
    console.log('   - Match: ' + (Math.abs(calcPendingEarnings - vendor.pendingEarnings) < 0.01 ? '✅' : '❌'));

    console.log('\n\n✅ FIX COMPLETATO CON SUCCESSO!');
    console.log('─'.repeat(80));
    console.log('✅ VendorPayouts creati: ' + createdCount);
    console.log('❌ Errori: ' + failedCount);
    console.log('\n💡 PROSSIMI PASSI:');
    console.log('   1. Verifica dashboard venditore');
    console.log('   2. Il job automatico processerà i payouts dopo 14 giorni');
    console.log('   3. Le statistiche si aggiorneranno automaticamente quando arrivano i pagamenti');

  } catch (error) {
    console.error('\n❌ ERRORE:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Connessione chiusa');
  }
};

fixMissingVendorPayouts();
