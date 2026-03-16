import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import User from '../models/User.js';

dotenv.config();

async function checkRegisteredOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso\n');

    // Cerca TUTTI gli ordini (non solo completati)
    const allOrders = await Order.find().populate('buyer', 'name email role');
    
    console.log(`📊 ANALISI COMPLETA ORDINI\n`);
    console.log(`Totale ordini: ${allOrders.length}`);
    
    const guestOrders = allOrders.filter(o => o.isGuestOrder || !o.buyer);
    const registeredOrders = allOrders.filter(o => o.buyer && !o.isGuestOrder);
    const paidOrders = allOrders.filter(o => o.isPaid);
    const completedOrders = allOrders.filter(o => o.status === 'completed' || o.status === 'delivered');
    
    console.log(`- Ordini guest: ${guestOrders.length}`);
    console.log(`- Ordini utenti registrati: ${registeredOrders.length}`);
    console.log(`- Ordini pagati: ${paidOrders.length}`);
    console.log(`- Ordini completati/consegnati: ${completedOrders.length}\n`);

    // Controlla utenti registrati
    const buyers = await User.find({ role: 'buyer' });
    console.log(`👥 Utenti buyer registrati: ${buyers.length}\n`);
    
    if (buyers.length > 0) {
      console.log('Lista buyers:');
      buyers.forEach(b => {
        const userOrders = allOrders.filter(o => o.buyer && o.buyer._id.toString() === b._id.toString());
        console.log(`  - ${b.name} (${b.email}): ${userOrders.length} ordini`);
        userOrders.forEach(o => {
          console.log(`    → ${o._id} - ${o.status} - ${o.isPaid ? 'Pagato' : 'Non pagato'}`);
        });
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

checkRegisteredOrders();
