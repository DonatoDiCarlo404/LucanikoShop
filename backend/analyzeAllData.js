import mongoose from 'mongoose';
import dotenv from 'dotenv';
import VendorPayout from './models/VendorPayout.js';
import Order from './models/Order.js';
import User from './models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URI_PRODUCTION;

async function analyzeAllData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connesso al database\n');

    // 1. Analizza VendorPayouts
    console.log('═══════════════════════════════════════');
    console.log('📊 ANALISI VENDOR PAYOUTS');
    console.log('═══════════════════════════════════════\n');

    const allPayouts = await VendorPayout.find({})
      .populate('vendorId', 'businessName name email')
      .populate('orderId', 'orderNumber status')
      .sort('-createdAt');

    console.log(`Totale VendorPayouts: ${allPayouts.length}\n`);

    const payoutsByStatus = {};
    const payoutsWithoutVendor = [];
    const payoutsWithoutOrder = [];

    allPayouts.forEach(payout => {
      // Conta per status
      payoutsByStatus[payout.status] = (payoutsByStatus[payout.status] || 0) + 1;

      // VendorId mancante
      if (!payout.vendorId) {
        payoutsWithoutVendor.push(payout);
      }

      // OrderId mancante
      if (!payout.orderId) {
        payoutsWithoutOrder.push(payout);
      }
    });

    console.log('📋 Riepilogo per Status:');
    Object.entries(payoutsByStatus).forEach(([status, count]) => {
      const amount = allPayouts
        .filter(p => p.status === status)
        .reduce((sum, p) => sum + p.amount, 0);
      console.log(`  ${status.padEnd(12)}: ${count} payouts, €${amount.toFixed(2)}`);
    });

    console.log(`\n❌ Payouts senza VendorId: ${payoutsWithoutVendor.length}`);
    if (payoutsWithoutVendor.length > 0) {
      console.log('\nDettagli payouts senza VendorId:');
      payoutsWithoutVendor.forEach(p => {
        console.log(`  ID: ${p._id}`);
        console.log(`  Amount: €${p.amount.toFixed(2)}`);
        console.log(`  Status: ${p.status}`);
        console.log(`  Date: ${p.saleDate ? p.saleDate.toISOString().split('T')[0] : 'N/A'}`);
        console.log(`  Order: ${p.orderId?.orderNumber || p.orderId || 'N/A'}`);
        console.log(`  Stripe Transfer: ${p.stripeTransferId || 'N/A'}`);
        console.log('');
      });
    }

    console.log(`\n❌ Payouts senza OrderId: ${payoutsWithoutOrder.length}`);

    // 2. Analizza Ordini
    console.log('\n═══════════════════════════════════════');
    console.log('📦 ANALISI ORDINI');
    console.log('═══════════════════════════════════════\n');

    const allOrders = await Order.find({ isPaid: true })
      .sort('-createdAt')
      .limit(20);

    console.log(`Ordini pagati (ultimi 20): ${allOrders.length}\n`);

    const ordersByStatus = {};
    allOrders.forEach(order => {
      const status = order.status || 'undefined';
      ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
    });

    console.log('📋 Riepilogo per Status:');
    Object.entries(ordersByStatus).forEach(([status, count]) => {
      console.log(`  ${status.padEnd(12)}: ${count} ordini`);
    });

    // Ordini cancelled o con problemi
    const cancelledOrders = allOrders.filter(o => o.status === 'cancelled');
    console.log(`\n📋 Ordini CANCELLED: ${cancelledOrders.length}`);
    cancelledOrders.forEach(order => {
      console.log(`  ID: ${order._id}`);
      console.log(`  Order Number: ${order.orderNumber || 'N/A'}`);
      console.log(`  Date: ${order.createdAt.toISOString().split('T')[0]}`);
      console.log(`  Items: ${order.items.length}`);
      console.log(`  Total: €${order.totalPrice || 0}`);
      console.log(`  Paid: ${order.isPaid}`);
      console.log(`  VendorEarnings: ${order.vendorEarnings ? order.vendorEarnings.length : 0}`);
      console.log('');
    });

    // 3. Verifica coerenza
    console.log('\n═══════════════════════════════════════');
    console.log('🔍 VERIFICA COERENZA');
    console.log('═══════════════════════════════════════\n');

    // Ordini paid con vendorEarnings ma senza VendorPayout
    const ordersWithEarningsWithoutPayout = [];
    for (const order of allOrders) {
      if (order.vendorEarnings && order.vendorEarnings.length > 0) {
        for (const earning of order.vendorEarnings) {
          const payout = await VendorPayout.findOne({
            orderId: order._id,
            vendorId: earning.vendorId
          });
          if (!payout) {
            ordersWithEarningsWithoutPayout.push({
              orderId: order._id,
              orderNumber: order.orderNumber,
              vendorId: earning.vendorId,
              amount: earning.netAmount
            });
          }
        }
      }
    }

    console.log(`❌ Ordini con earnings ma senza VendorPayout: ${ordersWithEarningsWithoutPayout.length}`);
    if (ordersWithEarningsWithoutPayout.length > 0) {
      ordersWithEarningsWithoutPayout.forEach(item => {
        console.log(`  Order: ${item.orderNumber || item.orderId}, Vendor: ${item.vendorId}, Amount: €${item.amount}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Analisi completata');
    
  } catch (error) {
    console.error('❌ Errore:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

analyzeAllData();
