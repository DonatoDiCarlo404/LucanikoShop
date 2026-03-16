import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from '../models/Order.js';

dotenv.config();

async function checkOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso\n');

    const orders = await Order.find({
      $or: [{ status: 'completed' }, { status: 'delivered' }]
    }).populate('buyer', 'name email');

    console.log(`📦 Ordini completati/consegnati: ${orders.length}\n`);

    orders.forEach((order, i) => {
      console.log(`\n=== ORDINE ${i + 1} ===`);
      console.log(`ID: ${order._id}`);
      console.log(`Status: ${order.status}`);
      console.log(`Buyer ID (field): ${order.buyer}`);
      console.log(`Buyer populated: ${order.buyer ? `${order.buyer.name} (${order.buyer.email})` : 'NULL/UNDEFINED'}`);
      console.log(`Is Guest Order: ${order.isGuestOrder}`);
      console.log(`Guest Email: ${order.guestEmail || 'N/A'}`);
      console.log(`isPaid: ${order.isPaid}`);
      console.log(`Total: €${order.total}`);
      console.log(`Created: ${order.createdAt}`);
      console.log(`Items: ${order.items?.length || 0}`);
      if (order.items && order.items.length > 0) {
        order.items.forEach((item, idx) => {
          console.log(`  ${idx + 1}. ${item.name || item.productName} (${item.quantity}x)`);
        });
      }
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

checkOrders();
