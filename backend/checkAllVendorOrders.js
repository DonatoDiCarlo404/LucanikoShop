import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/Order.js';
import VendorPayout from './models/VendorPayout.js';
import User from './models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URI_PRODUCTION;

async function checkAllOrders() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connesso al database\n');

    // Trova il venditore
    const vendor = await User.findOne({
      $or: [
        { businessName: /La Bontà delle Carni/i },
        { companyName: /La Bontà delle Carni/i },
        { name: /La Bontà delle Carni/i }
      ]
    });

    if (!vendor) {
      console.log('❌ Venditore non trovato');
      process.exit(0);
    }

    console.log(`📊 Venditore: ${vendor.businessName || vendor.name} (${vendor._id})\n`);

    // Cerca TUTTI gli ordini con items del venditore (senza filtri di data)
    console.log('🔍 Cerco TUTTI gli ordini con items del venditore...\n');

    const allOrders = await Order.find({
      'items.seller': vendor._id
    }).sort('-createdAt').limit(20);

    console.log(`Ordini trovati: ${allOrders.length}\n`);

    if (allOrders.length === 0) {
      console.log('❌ Nessun ordine trovato per questo venditore!');
      console.log('Verifico se il venditore ha prodotti...\n');
      
      const Product = (await import('./models/Product.js')).default;
      const products = await Product.find({ seller: vendor._id }).limit(5);
      console.log(`Prodotti del venditore: ${products.length}`);
      if (products.length > 0) {
        products.forEach(p => {
          console.log(`  - ${p.title} (${p._id})`);
        });
      }
    } else {
      for (const order of allOrders) {
        const vendorItems = order.items.filter(item => 
          item.seller && item.seller.toString() === vendor._id.toString()
        );

        const vendorTotal = vendorItems.reduce((sum, item) => 
          sum + (item.price * item.quantity), 0
        );

        console.log('═══════════════════════════════════════');
        console.log(`📦 Order: ${order.orderNumber || 'N/A'} (${order._id})`);
        console.log(`📅 Data: ${order.createdAt.toISOString()}`);
        console.log(`💳 Payment Status: ${order.paymentStatus || 'N/A'}`);
        console.log(`📊 Order Status: ${order.orderStatus || 'N/A'}`);
        console.log(`💰 Totale ordine: €${(order.totalAmount || 0).toFixed(2)}`);
        console.log(`💰 Totale venditore: €${vendorTotal.toFixed(2)}`);
        console.log(`📦 Items venditore: ${vendorItems.length}`);
        
        vendorItems.forEach(item => {
          console.log(`   • ${item.title || 'N/A'}: €${item.price} x ${item.quantity} = €${(item.price * item.quantity).toFixed(2)}`);
        });

        // Stripe info
        if (order.stripePaymentIntentId) {
          console.log(`🔵 Stripe Payment Intent: ${order.stripePaymentIntentId}`);
        }
        if (order.stripeCheckoutSessionId) {
          console.log(`🔵 Stripe Checkout Session: ${order.stripeCheckoutSessionId}`);
        }

        // Verifica VendorPayout
        const payout = await VendorPayout.findOne({
          vendorId: vendor._id,
          orderId: order._id
        });

        if (payout) {
          console.log(`\n✅ VendorPayout ESISTE:`);
          console.log(`   ID: ${payout._id}`);
          console.log(`   Status: ${payout.status}`);
          console.log(`   Amount: €${payout.amount.toFixed(2)}`);
          console.log(`   Stripe Fee: €${payout.stripeFee?.toFixed(2) || '0.00'}`);
          console.log(`   Transfer Fee: €${payout.transferFee?.toFixed(2) || '0.00'}`);
          console.log(`   Sale Date: ${payout.saleDate.toISOString()}`);
          if (payout.paymentDate) {
            console.log(`   Payment Date: ${payout.paymentDate.toISOString()}`);
          }
          if (payout.stripeTransferId) {
            console.log(`   Stripe Transfer: ${payout.stripeTransferId}`);
          }
          if (payout.stripePayoutId) {
            console.log(`   Stripe Payout: ${payout.stripePayoutId}`);
          }
        } else {
          console.log(`\n❌ NESSUN VendorPayout per questo ordine!`);
          console.log(`   ⚠️  Questo è un problema: l'ordine è ${order.paymentStatus} ma non ha generato un payout`);
        }
        console.log('');
      }
    }

    // Controlla tutti i VendorPayout esistenti
    console.log('\n═══════════════════════════════════════');
    console.log('📋 TUTTI i VendorPayout nel database:\n');
    
    const allPayouts = await VendorPayout.find({})
      .populate('vendorId', 'businessName companyName name email')
      .populate('orderId', 'orderNumber')
      .sort('-saleDate')
      .limit(20);

    console.log(`Totale VendorPayout (ultimi 20): ${allPayouts.length}\n`);

    allPayouts.forEach(payout => {
      const vendorName = payout.vendorId?.businessName || payout.vendorId?.companyName || payout.vendorId?.name || 'N/A';
      const daysSince = Math.floor((new Date() - payout.saleDate) / (1000 * 60 * 60 * 24));
      console.log(`${payout.status.padEnd(12)} | ${vendorName.padEnd(25)} | €${payout.amount.toFixed(2).padStart(8)} | ${payout.saleDate.toISOString().split('T')[0]} (${daysSince}d) | Order: ${payout.orderId?.orderNumber || 'N/A'}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Analisi completata');
    
  } catch (error) {
    console.error('❌ Errore:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

checkAllOrders();
