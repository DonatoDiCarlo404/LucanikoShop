import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/Order.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URI_PRODUCTION;

async function checkOrderDetails() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connesso al database\n');

    const orderId = '69b054d27aca615681b9b181';
    const order = await Order.findById(orderId);

    if (!order) {
      console.log('❌ Ordine non trovato');
      process.exit(0);
    }

    console.log('📦 DETTAGLI COMPLETI ORDINE:\n');
    console.log(JSON.stringify(order, null, 2));

    await mongoose.connection.close();
    console.log('\n✅ Analisi completata');
    
  } catch (error) {
    console.error('❌ Errore:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

checkOrderDetails();
