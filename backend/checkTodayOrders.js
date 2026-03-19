import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/Order.js';
import User from './models/User.js';

dotenv.config();

const isProd = process.argv.includes('--prod');
const MONGODB_URI = isProd ? process.env.MONGODB_URI_PROD : process.env.MONGODB_URI;

console.log(`🔧 Ambiente: ${isProd ? 'PRODUZIONE' : 'SVILUPPO'}`);

async function checkTodayOrders() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connesso al database\n');

    // Ordini di oggi (19 marzo 2026)
    const today = new Date('2026-03-19');
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    console.log(`🔍 Cerco ordini di OGGI (19 marzo 2026)`);
    console.log(`📅 Da: ${startOfDay.toISOString()}`);
    console.log(`📅 A: ${endOfDay.toISOString()}\n`);

    const todayOrders = await Order.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    })
    .populate('buyer', 'name email')
    .sort('-createdAt');

    console.log(`📦 Ordini trovati: ${todayOrders.length}\n`);

    if (todayOrders.length === 0) {
      console.log('❌ Nessun ordine oggi\n');
      
      // Mostra gli ultimi 3 ordini
      console.log('📋 Ultimi 3 ordini nel database:');
      const lastOrders = await Order.find().sort('-createdAt').limit(3);
      
      lastOrders.forEach((order, idx) => {
        console.log(`\n${idx + 1}. ID: ${order._id}`);
        console.log(`   Data: ${order.createdAt}`);
        console.log(`   Totale: €${order.totalPrice}`);
        console.log(`   Cliente: ${order.buyer?.name || order.guestName || 'Guest'}`);
      });
    } else {
      todayOrders.forEach((order, idx) => {
        console.log('═══════════════════════════════════════');
        console.log(`${idx + 1}. 📦 Order ID: ${order._id}`);
        console.log(`📅 Creato: ${order.createdAt}`);
        console.log(`👤 Cliente: ${order.buyer?.name || order.guestName || 'Guest'}`);
        console.log(`📧 Email: ${order.buyer?.email || order.guestEmail || 'N/A'}`);
        console.log(`💰 Totale: €${order.totalPrice}`);
        console.log(`📊 Status: ${order.status}`);
        console.log(`💳 isPaid: ${order.isPaid}`);
        console.log(`🔑 Stripe Session: ${order.stripeSessionId || 'N/A'}`);
        console.log('\n📋 Items:');
        
        order.items.forEach((item, itemIdx) => {
          console.log(`  ${itemIdx + 1}. ${item.name} x${item.quantity} - €${item.price}`);
          if (item.selectedVariantSku) {
            console.log(`     ✅ Variante SKU: ${item.selectedVariantSku}`);
          }
          if (item.selectedVariantAttributes) {
            console.log(`     ✅ Variante: ${JSON.stringify(item.selectedVariantAttributes)}`);
          }
        });
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnesso dal database');
  }
}

checkTodayOrders();
