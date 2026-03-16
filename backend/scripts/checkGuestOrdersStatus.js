import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order.js';

dotenv.config();

const checkAllGuestOrders = async () => {
  try {
    console.log('🔄 Connessione al database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database MongoDB\n');

    // Trova TUTTI gli ordini guest
    const allGuestOrders = await Order.find({
      isGuestOrder: true
    }).sort({ createdAt: -1 });

    console.log(`📦 TOTALE ORDINI GUEST: ${allGuestOrders.length}\n`);

    for (const order of allGuestOrders) {
      console.log(`--- Ordine ${order._id} ---`);
      console.log(`Email guest: ${order.guestEmail}`);
      console.log(`Nome guest: ${order.guestName}`);
      console.log(`Totale: €${order.totalPrice}`);
      console.log(`Payment Status: ${order.paymentStatus}`);
      console.log(`Payment Intent: ${order.paymentIntentId || 'N/A'}`);
      console.log(`Data: ${order.createdAt.toLocaleDateString()}`);
      console.log(`Prodotti: ${order.items.length}`);
      
      order.items.forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.name} (x${item.quantity}) - €${item.price}`);
      });
      
      console.log('');
    }

    // Conta gli ordini per payment status
    const statusCounts = {};
    allGuestOrders.forEach(order => {
      const status = order.paymentStatus || 'undefined';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('\n📊 ORDINI PER PAYMENT STATUS:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

checkAllGuestOrders();
