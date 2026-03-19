import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/Order.js';
import VendorPayout from './models/VendorPayout.js';
import User from './models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URI_PRODUCTION;

async function checkRecentOrders() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connesso al database\n');

    // Cerca ordini degli ultimi 2 giorni
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    console.log('🔍 Cerco ordini degli ultimi 2 giorni...');
    console.log(`📅 Da: ${twoDaysAgo.toISOString()}`);
    console.log(`📅 A: ${new Date().toISOString()}\n`);

    const recentOrders = await Order.find({
      createdAt: { $gte: twoDaysAgo }
    })
    .populate('buyer', 'name email')
    .sort('-createdAt');

    console.log(`\n📦 Ordini trovati: ${recentOrders.length}\n`);

    if (recentOrders.length === 0) {
      console.log('❌ Nessun ordine negli ultimi 2 giorni');
      
      // Cerca l'ultimo ordine in assoluto
      const lastOrder = await Order.findOne().sort('-createdAt');
      if (lastOrder) {
        console.log(`\n📦 Ultimo ordine nel database:`);
        console.log(`   ID: ${lastOrder._id}`);
        console.log(`   Data: ${lastOrder.createdAt}`);
        console.log(`   Totale: €${lastOrder.totalPrice}`);
        console.log(`   Status: ${lastOrder.status}`);
        console.log(`   isPaid: ${lastOrder.isPaid}`);
      }
    } else {
      for (const order of recentOrders) {
        console.log('═══════════════════════════════════════');
        console.log(`📦 Order ID: ${order._id}`);
        console.log(`📅 Data: ${order.createdAt} (${getTimeAgo(order.createdAt)})`);
        console.log(`👤 Cliente: ${order.buyer ? order.buyer.name : 'Guest'} (${order.guestEmail || order.buyer?.email || 'N/A'})`);
        console.log(`💳 Payment Method: ${order.paymentMethod || 'N/A'}`);
        console.log(`💰 Totale: €${order.totalPrice}`);
        console.log(`📊 Status: ${order.status}`);
        console.log(`💳 isPaid: ${order.isPaid}`);
        console.log(`🔵 Stripe Session: ${order.stripeSessionId || 'N/A'}`);
        console.log(`🔵 Payment Intent: ${order.paymentResult?.id || 'N/A'}`);
        
        console.log(`\n📦 Items (${order.items.length}):`);
        for (const item of order.items) {
          console.log(`   • ${item.name}: €${item.price} x ${item.quantity} = €${(item.price * item.quantity).toFixed(2)}`);
          console.log(`     Venditore: ${item.seller}`);
        }

        // Controlla VendorEarnings
        if (order.vendorEarnings && order.vendorEarnings.length > 0) {
          console.log(`\n💰 Vendor Earnings (${order.vendorEarnings.length}):`);
          for (const earning of order.vendorEarnings) {
            console.log(`   • Venditore: ${earning.vendorId}`);
            console.log(`     Prodotti: €${earning.productPrice}`);
            console.log(`     Spedizione: €${earning.shippingPrice}`);
            console.log(`     Netto: €${earning.netAmount}`);
            console.log(`     Fee Stripe: €${earning.stripeFee}`);
            console.log(`     Fee Transfer: €${earning.transferFee}`);
          }
        } else {
          console.log(`\n⚠️  NESSUN vendorEarnings calcolato!`);
        }

        // Controlla VendorPayout
        const payouts = await VendorPayout.find({ orderId: order._id })
          .populate('vendorId', 'name businessName companyName');
        
        if (payouts.length > 0) {
          console.log(`\n✅ VendorPayout (${payouts.length}):`);
          for (const payout of payouts) {
            console.log(`   • ${payout.vendorId?.businessName || payout.vendorId?.name || payout.vendorId}`);
            console.log(`     Status: ${payout.status}`);
            console.log(`     Amount: €${payout.amount}`);
            console.log(`     Stripe Transfer: ${payout.stripeTransferId || 'N/A'}`);
            console.log(`     Failure Reason: ${payout.failureReason || 'N/A'}`);
          }
        } else {
          console.log(`\n❌ NESSUN VendorPayout per questo ordine!`);
          console.log(`   ⚠️  I soldi sono rimasti sull'account principale!`);
        }

        console.log('\n');
      }
    }

    // Cerca VendorPayout recenti (anche quelli senza ordini collegati)
    console.log('\n═══════════════════════════════════════');
    console.log('📋 VendorPayout degli ultimi 2 giorni:\n');
    
    const recentPayouts = await VendorPayout.find({
      createdAt: { $gte: twoDaysAgo }
    })
    .populate('vendorId', 'name businessName companyName')
    .populate('orderId')
    .sort('-createdAt');

    console.log(`Payouts trovati: ${recentPayouts.length}\n`);

    for (const payout of recentPayouts) {
      console.log(`💰 Payout ID: ${payout._id}`);
      console.log(`   Venditore: ${payout.vendorId?.businessName || payout.vendorId?.name || payout.vendorId}`);
      console.log(`   Status: ${payout.status}`);
      console.log(`   Amount: €${payout.amount}`);
      console.log(`   Data: ${payout.createdAt} (${getTimeAgo(payout.createdAt)})`);
      console.log(`   Ordine: ${payout.orderId?._id || 'N/A'}`);
      console.log(`   Stripe Transfer: ${payout.stripeTransferId || 'N/A'}`);
      console.log(`   Failure: ${payout.failureReason || 'N/A'}`);
      console.log('');
    }

    console.log('✅ Analisi completata');
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

function getTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d fa`;
  if (hours > 0) return `${hours}h fa`;
  return 'ora';
}

checkRecentOrders();
