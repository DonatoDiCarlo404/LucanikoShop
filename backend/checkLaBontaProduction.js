import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Order from './models/Order.js';
import VendorPayout from './models/VendorPayout.js';

dotenv.config();

const checkSpecificVendorProduction = async () => {
  try {
    console.log('🔍 Verifica "La Bontà delle Carni" in PRODUZIONE\n');
    
    await mongoose.connect(process.env.MONGODB_URI_PROD);
    console.log('✅ Connesso a PRODUZIONE\n');

    const vendor = await User.findOne({ 
      businessName: /La Bontà delle Carni/i,
      role: 'seller'
    });

    if (!vendor) {
      console.log('❌ Venditore non trovato');
      process.exit(0);
    }

    console.log('✅ Venditore trovato:', vendor.businessName);
    console.log('   Email:', vendor.email);
    console.log('   ID:', vendor._id);

    console.log('\n📊 STATISTICHE NEL DB (User model):');
    console.log('═'.repeat(80));
    console.log('   Total Earnings: €' + (vendor.totalEarnings || 0).toFixed(2));
    console.log('   Pending Earnings: €' + (vendor.pendingEarnings || 0).toFixed(2));
    console.log('   Paid Earnings: €' + (vendor.paidEarnings || 0).toFixed(2));

    // Trova tutti gli ordini
    const orders = await Order.find({
      'items.seller': vendor._id,
      isPaid: true
    }).sort({ createdAt: -1 });

    console.log('\n📦 ORDINI TROVATI: ' + orders.length);
    console.log('═'.repeat(80));
    
    let totalRevenue = 0;
    orders.forEach((order, index) => {
      const vendorItems = order.items.filter(item => 
        item.seller && item.seller.toString() === vendor._id.toString()
      );
      const vendorTotal = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      totalRevenue += vendorTotal;
      
      console.log(`${index + 1}. ${order.orderNumber || order._id.toString().substring(0, 8)}`);
      console.log(`   Data: ${order.createdAt.toLocaleDateString('it-IT')}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Revenue venditore: €${vendorTotal.toFixed(2)}`);
    });

    console.log('\n   TOTALE REVENUE (lordo): €' + totalRevenue.toFixed(2));

    // Trova tutti i VendorPayouts
    const payouts = await VendorPayout.find({ 
      vendorId: vendor._id,
      isRefundDebt: { $ne: true }
    }).sort({ createdAt: -1 });

    console.log('\n💰 VENDOR PAYOUTS: ' + payouts.length);
    console.log('═'.repeat(80));

    const payoutsByStatus = payouts.reduce((acc, p) => {
      acc[p.status] = acc[p.status] || { count: 0, total: 0, payouts: [] };
      acc[p.status].count++;
      acc[p.status].total += p.amount;
      acc[p.status].payouts.push(p);
      return acc;
    }, {});

    Object.entries(payoutsByStatus).forEach(([status, data]) => {
      console.log(`\n${status.toUpperCase()}: ${data.count} payout(s)`);
      data.payouts.forEach((p, i) => {
        console.log(`   ${i + 1}. €${p.amount.toFixed(2)} - ${p.saleDate.toLocaleDateString('it-IT')}`);
      });
      console.log(`   Subtotale: €${data.total.toFixed(2)}`);
    });

    const totalFromPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);
    const pendingFromPayouts = payouts.filter(p => ['pending', 'processing'].includes(p.status))
      .reduce((sum, p) => sum + p.amount, 0);
    const paidFromPayouts = payouts.filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    console.log('\n\n📊 CONFRONTO FINALE:');
    console.log('═'.repeat(80));
    console.log('                        | DB User    | VendorPayouts | Match');
    console.log('────────────────────────|────────────|───────────────|──────');
    console.log(`Total Earnings          | €${(vendor.totalEarnings || 0).toFixed(2).padEnd(9)} | €${totalFromPayouts.toFixed(2).padEnd(12)} | ${Math.abs((vendor.totalEarnings || 0) - totalFromPayouts) < 0.01 ? '✅' : '❌'}`);
    console.log(`Pending Earnings        | €${(vendor.pendingEarnings || 0).toFixed(2).padEnd(9)} | €${pendingFromPayouts.toFixed(2).padEnd(12)} | ${Math.abs((vendor.pendingEarnings || 0) - pendingFromPayouts) < 0.01 ? '✅' : '❌'}`);
    console.log(`Paid Earnings           | €${(vendor.paidEarnings || 0).toFixed(2).padEnd(9)} | €${paidFromPayouts.toFixed(2).padEnd(12)} | ${Math.abs((vendor.paidEarnings || 0) - paidFromPayouts) < 0.01 ? '✅' : '❌'}`);

    console.log('\n💡 NOTA:');
    console.log('─'.repeat(80));
    console.log('• Fatturato Totale (dashboard): Somma ordini = €' + totalRevenue.toFixed(2));
    console.log('• Guadagni Totali (dashboard): totalEarnings = €' + (vendor.totalEarnings || 0).toFixed(2));
    console.log('• La differenza (€' + (totalRevenue - totalFromPayouts).toFixed(2) + ') sono le fee Stripe');

  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Connessione chiusa');
  }
};

checkSpecificVendorProduction();
