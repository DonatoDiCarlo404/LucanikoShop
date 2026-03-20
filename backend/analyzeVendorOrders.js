import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Order from './models/Order.js';
import VendorPayout from './models/VendorPayout.js';

dotenv.config();

const analyzeVendorOrders = async () => {
  try {
    console.log('🔍 Connessione al database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso\n');

    const vendor = await User.findOne({ 
      businessName: /La Bontà delle Carni/i,
      role: 'seller'
    });

    if (!vendor) {
      console.log('❌ Venditore non trovato');
      process.exit(0);
    }

    console.log('✅ Venditore:', vendor.businessName);
    console.log('   ID:', vendor._id);
    console.log('   Total Earnings nel DB: €' + (vendor.totalEarnings || 0).toFixed(2));
    console.log('\n' + '─'.repeat(80));

    // Trova tutti gli ordini che includono prodotti di questo venditore
    const orders = await Order.find({
      'items.seller': vendor._id
    }).sort({ createdAt: -1 });

    console.log(`\n📦 ORDINI TOTALI: ${orders.length}`);
    console.log('─'.repeat(80));

    let totalVendorRevenue = 0;
    const ordersWithDetails = [];

    for (const order of orders) {
      // Filtra solo gli items di questo venditore
      const vendorItems = order.items.filter(item => 
        item.seller && item.seller.toString() === vendor._id.toString()
      );

      if (vendorItems.length === 0) continue;

      // Calcola il totale per questo venditore in questo ordine
      const vendorTotal = vendorItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

      // Calcola shipping per questo venditore (se items hanno shippingCost)
      const vendorShipping = vendorItems.reduce((sum, item) => {
        return sum + (item.shippingCost || 0);
      }, 0);

      const orderVendorTotal = vendorTotal + vendorShipping;
      totalVendorRevenue += orderVendorTotal;

      // Cerca se esiste un VendorPayout per questo ordine
      const payout = await VendorPayout.findOne({ 
        vendorId: vendor._id,
        orderId: order._id 
      });

      ordersWithDetails.push({
        orderId: order._id,
        orderNumber: order.orderNumber || order._id.toString().substring(0, 8),
        date: order.createdAt,
        status: order.status,
        isPaid: order.isPaid,
        vendorRevenue: orderVendorTotal,
        hasPayout: !!payout,
        payoutStatus: payout ? payout.status : null,
        payoutAmount: payout ? payout.amount : null
      });
    }

    console.log('\n📋 DETTAGLIO ORDINI:');
    console.log('─'.repeat(80));

    ordersWithDetails.forEach((o, index) => {
      console.log(`\n${index + 1}. Ordine: ${o.orderNumber}`);
      console.log(`   Data: ${o.date.toLocaleDateString('it-IT')}`);
      console.log(`   Status: ${o.status}`);
      console.log(`   Pagato: ${o.isPaid ? 'Sì' : 'No'}`);
      console.log(`   Revenue venditore: €${o.vendorRevenue.toFixed(2)}`);
      console.log(`   Ha VendorPayout: ${o.hasPayout ? '✅' : '❌'}`);
      if (o.hasPayout) {
        console.log(`   Payout Status: ${o.payoutStatus}`);
        console.log(`   Payout Amount: €${o.payoutAmount.toFixed(2)}`);
        if (Math.abs(o.payoutAmount - o.vendorRevenue) > 0.01) {
          console.log(`   ⚠️  DIFFERENZA: €${Math.abs(o.payoutAmount - o.vendorRevenue).toFixed(2)}`);
        }
      }
    });

    console.log('\n\n📊 RIEPILOGO FINALE:');
    console.log('─'.repeat(80));
    console.log(`Total ordini: ${ordersWithDetails.length}`);
    console.log(`Revenue totale calcolata: €${totalVendorRevenue.toFixed(2)}`);
    console.log(`Total Earnings nel DB: €${(vendor.totalEarnings || 0).toFixed(2)}`);
    console.log(`Differenza: €${Math.abs(totalVendorRevenue - (vendor.totalEarnings || 0)).toFixed(2)}`);
    
    const ordersWithoutPayout = ordersWithDetails.filter(o => !o.hasPayout);
    const ordersWithPayout = ordersWithDetails.filter(o => o.hasPayout);
    
    console.log(`\nOrdini CON VendorPayout: ${ordersWithPayout.length}`);
    console.log(`Ordini SENZA VendorPayout: ${ordersWithoutPayout.length} ❌`);

    if (ordersWithoutPayout.length > 0) {
      console.log('\n⚠️  ORDINI SENZA VENDORPAYOUT:');
      ordersWithoutPayout.forEach(o => {
        console.log(`   - ${o.orderNumber}: €${o.vendorRevenue.toFixed(2)} (${o.date.toLocaleDateString('it-IT')})`);
      });
      
      const missingPayoutsTotal = ordersWithoutPayout.reduce((sum, o) => sum + o.vendorRevenue, 0);
      console.log(`   Totale mancante: €${missingPayoutsTotal.toFixed(2)}`);
    }

    console.log('\n\n💡 CONCLUSIONE:');
    console.log('─'.repeat(80));
    if (ordersWithoutPayout.length > 0) {
      console.log('❌ PROBLEMA: Ci sono ordini che non hanno generato VendorPayout!');
      console.log('   Questo spiega la differenza nei dati.');
      console.log('\n   SOLUZIONI:');
      console.log('   1. Creare manualmente i VendorPayout mancanti');
      console.log('   2. Ricalcolare totalEarnings/pendingEarnings basandosi sui VendorPayout esistenti');
      console.log('   3. Verificare e fixare il sistema di creazione ordini per prevenire il problema');
    } else {
      console.log('✅ Tutti gli ordini hanno VendorPayout associati');
      if (Math.abs(totalVendorRevenue - (vendor.totalEarnings || 0)) > 0.01) {
        console.log('   Ma ci sono discrepanze negli importi - necessita riconciliazione');
      }
    }

  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Connessione chiusa');
  }
};

analyzeVendorOrders();
