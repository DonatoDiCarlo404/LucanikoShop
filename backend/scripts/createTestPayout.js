import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import VendorPayout from '../models/VendorPayout.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connesso\n');
  } catch (error) {
    console.error(`❌ Errore connessione MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const createTestPayout = async () => {
  console.log('🧪 CREA VENDORPAYOUT DI TEST (per test notifiche)\n');
  
  // Trova un venditore
  const vendor = await User.findOne({ role: 'seller' });
  
  if (!vendor) {
    console.log('❌ Nessun venditore trovato nel database');
    process.exit(1);
  }

  console.log(`✅ Venditore trovato: ${vendor.companyName || vendor.name} (${vendor.email})\n`);

  // Trova un ordine pagato
  const order = await Order.findOne({ isPaid: true });
  
  if (!order) {
    console.log('❌ Nessun ordine pagato trovato');
    process.exit(1);
  }

  // Crea un nuovo VendorPayout pending
  const newPayout = await VendorPayout.create({
    vendorId: vendor._id,
    orderId: order._id,
    amount: 25.50,
    stripeFee: 0.41,  // 1.5% + €0.25 su esempio
    transferFee: 0.00,  // GRATIS con Stripe Connect Express
    saleDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 giorni fa
    expectedPaymentDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // tra 4 giorni
    status: 'pending'
  });

  console.log('✅ VendorPayout creato:');
  console.log(`   - ID: ${newPayout._id}`);
  console.log(`   - Venditore: ${vendor.companyName || vendor.name}`);
  console.log(`   - Importo: €${newPayout.amount.toFixed(2)}`);
  console.log(`   - Status: ${newPayout.status}\n`);

  // Aggiorna statistiche venditore
  vendor.pendingEarnings = (vendor.pendingEarnings || 0) + newPayout.amount;
  await vendor.save();

  console.log('✅ Statistiche venditore aggiornate');
  console.log(`   - Pending Earnings: €${vendor.pendingEarnings.toFixed(2)}\n`);

  console.log('🎉 Test preparato! Ora puoi eseguire simulatePaidPayout.js\n');
  
  await mongoose.connection.close();
  process.exit(0);
};

connectDB().then(createTestPayout);
