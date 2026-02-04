import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

/**
 * Script per generare un JWT token per test
 * Utile per testare gli endpoint protetti senza dover fare login
 */

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

const generateTestToken = async () => {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   GENERA JWT TOKEN PER TEST                          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Cerca venditori nel database (cerca sia 'vendor' che 'seller')
  const vendors = await User.find({ 
    $or: [{ role: 'vendor' }, { role: 'seller' }] 
  }).select('name email companyName role');
  
  if (vendors.length === 0) {
    console.log('❌ Nessun venditore trovato nel database');
    console.log('💡 Crea prima un utente con role: "vendor" o "seller"\n');
    process.exit(1);
  }

  console.log(`📋 Venditori disponibili:\n`);
  vendors.forEach((vendor, index) => {
    console.log(`${index + 1}. ${vendor.companyName || vendor.name}`);
    console.log(`   Email: ${vendor.email}`);
    console.log(`   Role: ${vendor.role}`);
    console.log(`   ID: ${vendor._id}\n`);
  });

  // Usa il primo venditore
  const vendor = vendors[0];
  const token = generateToken(vendor._id);

  console.log('✅ Token generato per:', vendor.companyName || vendor.name);
  console.log('📧 Email:', vendor.email);
  console.log('\n🔑 JWT TOKEN:\n');
  console.log(token);
  console.log('\n📋 Copia questo token per usarlo nei test:\n');
  console.log(`node scripts/testEarningsEndpoints.js ${token}`);
  console.log('\n');

  await mongoose.connection.close();
  process.exit(0);
};

connectDB().then(generateTestToken);
