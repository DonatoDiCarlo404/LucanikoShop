import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/Order.js';
import VendorPayout from './models/VendorPayout.js';
import User from './models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URI_PRODUCTION;

async function checkVendorSales() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connesso al database\n');

    // Trova il venditore "La Bontà delle Carni"
    const vendor = await User.findOne({
      $or: [
        { businessName: /La Bontà delle Carni/i },
        { companyName: /La Bontà delle Carni/i },
        { name: /La Bontà delle Carni/i }
      ]
    });

    if (!vendor) {
      console.log('❌ Venditore "La Bontà delle Carni" non trovato');
      process.exit(0);
    }

    console.log('📊 Venditore trovato:');
    console.log(`ID: ${vendor._id}`);
    console.log(`Nome: ${vendor.businessName || vendor.companyName || vendor.name}`);
    console.log(`Email: ${vendor.email}`);
    console.log(`Stripe Connect: ${vendor.stripeConnectAccountId || 'N/A'}\n`);

    // Cerca ordini degli ultimi 7 giorni
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    console.log('🔍 Cerco ordini degli ultimi 7 giorni...\n');

    const recentOrders = await Order.find({
      'items.seller': vendor._id,
      createdAt: { $gte: sevenDaysAgo },
      paymentStatus: 'paid'
    }).sort('-createdAt');

    console.log(`Ordini trovati: ${recentOrders.length}\n`);

    for (const order of recentOrders) {
      // Trova gli item del venditore
      const vendorItems = order.items.filter(item => 
        item.seller && item.seller.toString() === vendor._id.toString()
      );

      const vendorTotal = vendorItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );

      console.log('-----------------------------------');
      console.log(`Order ID: ${order._id}`);
      console.log(`Order Number: ${order.orderNumber}`);
      console.log(`Data: ${order.createdAt.toISOString()}`);
      console.log(`Payment Status: ${order.paymentStatus}`);
      console.log(`Totale venditore: €${vendorTotal.toFixed(2)}`);
      console.log(`Items del venditore: ${vendorItems.length}`);
      
      vendorItems.forEach(item => {
        console.log(`  - ${item.title}: €${item.price} x ${item.quantity}`);
      });

      // Verifica se esiste un VendorPayout per questo ordine
      const payout = await VendorPayout.findOne({
        vendorId: vendor._id,
        orderId: order._id
      });

      if (payout) {
        console.log(`\n✅ VendorPayout trovato:`);
        console.log(`   Status: ${payout.status}`);
        console.log(`   Amount: €${payout.amount.toFixed(2)}`);
        console.log(`   Stripe Fee: €${payout.stripeFee.toFixed(2)}`);
        console.log(`   Transfer Fee: €${payout.transferFee.toFixed(2)}`);
        console.log(`   Sale Date: ${payout.saleDate.toISOString()}`);
        if (payout.paymentDate) {
          console.log(`   Payment Date: ${payout.paymentDate.toISOString()}`);
        }
        if (payout.stripeTransferId) {
          console.log(`   Stripe Transfer ID: ${payout.stripeTransferId}`);
        }
      } else {
        console.log(`\n❌ Nessun VendorPayout trovato per questo ordine!`);
      }
      console.log('');
    }

    // Mostra tutti i VendorPayout del venditore
    console.log('\n📋 Tutti i VendorPayout del venditore:\n');
    const allPayouts = await VendorPayout.find({ vendorId: vendor._id })
      .populate('orderId', 'orderNumber createdAt')
      .sort('-saleDate');

    console.log(`Totale payouts: ${allPayouts.length}\n`);

    const statusCount = {};
    allPayouts.forEach(payout => {
      statusCount[payout.status] = (statusCount[payout.status] || 0) + 1;
      
      const daysSinceSale = Math.floor((new Date() - payout.saleDate) / (1000 * 60 * 60 * 24));
      console.log(`Status: ${payout.status.padEnd(12)} | €${payout.amount.toFixed(2).padStart(8)} | Sale: ${payout.saleDate.toISOString().split('T')[0]} (${daysSinceSale} giorni fa) | Order: ${payout.orderId?.orderNumber || 'N/A'}`);
    });

    console.log('\n📊 Riepilogo per status:');
    Object.entries(statusCount).forEach(([status, count]) => {
      const total = allPayouts
        .filter(p => p.status === status)
        .reduce((sum, p) => sum + p.amount, 0);
      console.log(`  ${status}: ${count} payouts, €${total.toFixed(2)}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Connessione chiusa');
    
  } catch (error) {
    console.error('❌ Errore:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

checkVendorSales();
