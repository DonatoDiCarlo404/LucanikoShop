import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Product from './models/Product.js';
import User from './models/User.js';
import Order from './models/Order.js';

(async () => {
  try {
    console.log('🔍 Connessione al database...');
    console.log('📝 MONGODB_URI:', process.env.MONGODB_URI?.substring(0, 50) + '...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso!\n');

    const productsCount = await Product.countDocuments();
    const usersCount = await User.countDocuments();
    const ordersCount = await Order.countDocuments();

    console.log('📊 Stato del database:');
    console.log(`   👥 Utenti: ${usersCount}`);
    console.log(`   📦 Prodotti: ${productsCount}`);
    console.log(`   🛒 Ordini: ${ordersCount}`);
    
    if (productsCount === 0 && usersCount === 0 && ordersCount === 0) {
      console.log('\n✅ Database VUOTO - perfetto per sviluppo!');
    } else {
      console.log('\n⚠️  Database contiene dati - verifica che sia quello di sviluppo!');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
})();
