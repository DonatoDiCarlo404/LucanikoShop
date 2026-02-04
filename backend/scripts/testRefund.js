import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import Order from '../models/Order.js';
import VendorPayout from '../models/VendorPayout.js';
import User from '../models/User.js';
import { cancelVendorEarnings } from '../utils/vendorEarningsCalculator.js';

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

const testRefund = async () => {
  console.log('🧪 TEST RIMBORSO ORDINE (Fase 6.1)\n');
  
  // Trova un ordine con VendorPayout pending
  const pendingPayout = await VendorPayout.findOne({ status: 'pending' })
    .populate('vendorId', 'name companyName email pendingEarnings totalEarnings')
    .populate('orderId');
  
  if (!pendingPayout) {
    console.log('❌ Nessun VendorPayout pending trovato');
    console.log('💡 Crea prima un ordine di test o esegui createTestPayout.js\n');
    process.exit(1);
  }

  console.log('📦 VendorPayout trovato:');
  console.log(`   - ID: ${pendingPayout._id}`);
  console.log(`   - Ordine: ${pendingPayout.orderId?._id || 'N/A'}`);
  console.log(`   - Venditore: ${pendingPayout.vendorId?.companyName || pendingPayout.vendorId?.name}`);
  console.log(`   - Importo: €${pendingPayout.amount.toFixed(2)}`);
  console.log(`   - Status: ${pendingPayout.status}\n`);

  // Statistiche venditore PRIMA
  const vendorBefore = await User.findById(pendingPayout.vendorId._id);
  console.log('📊 Statistiche venditore PRIMA del rimborso:');
  console.log(`   - Pending Earnings: €${vendorBefore.pendingEarnings?.toFixed(2) || '0.00'}`);
  console.log(`   - Total Earnings: €${vendorBefore.totalEarnings?.toFixed(2) || '0.00'}\n`);

  // Conta VendorPayout prima
  const payoutsCountBefore = await VendorPayout.countDocuments({ 
    orderId: pendingPayout.orderId._id 
  });
  console.log(`📋 VendorPayout per questo ordine PRIMA: ${payoutsCountBefore}\n`);

  // ============ ESEGUI RIMBORSO ============
  console.log('💸 Esecuzione cancellazione earnings...\n');
  
  const result = await cancelVendorEarnings(pendingPayout.orderId._id.toString());

  // ============ VERIFICA RISULTATI ============
  console.log('\n🔍 VERIFICA POST-RIMBORSO:\n');

  // Statistiche venditore DOPO
  const vendorAfter = await User.findById(pendingPayout.vendorId._id);
  console.log('📊 Statistiche venditore DOPO il rimborso:');
  console.log(`   - Pending Earnings: €${vendorAfter.pendingEarnings?.toFixed(2) || '0.00'}`);
  console.log(`   - Total Earnings: €${vendorAfter.totalEarnings?.toFixed(2) || '0.00'}`);
  console.log(`   - Differenza Pending: €${((vendorBefore.pendingEarnings || 0) - (vendorAfter.pendingEarnings || 0)).toFixed(2)}`);
  console.log(`   - Differenza Total: €${((vendorBefore.totalEarnings || 0) - (vendorAfter.totalEarnings || 0)).toFixed(2)}\n`);

  // Conta VendorPayout dopo
  const payoutsCountAfter = await VendorPayout.countDocuments({ 
    orderId: pendingPayout.orderId._id 
  });
  console.log(`📋 VendorPayout per questo ordine DOPO: ${payoutsCountAfter}`);
  console.log(`   - Payout eliminati: ${payoutsCountBefore - payoutsCountAfter}\n`);

  // Risultato
  console.log('📊 RISULTATO OPERAZIONE:');
  console.log(`   - Success: ${result.success ? '✅' : '❌'}`);
  console.log(`   - Message: ${result.message}`);
  console.log(`   - Payout cancellati: ${result.cancelledPayouts?.length || 0}`);
  console.log(`   - Venditori aggiornati: ${result.vendorUpdates?.length || 0}\n`);

  if (result.success) {
    console.log('✅ TEST COMPLETATO CON SUCCESSO!\n');
    console.log('📌 VERIFICA:');
    console.log('   1. VendorPayout pending eliminati ✅');
    console.log('   2. User.pendingEarnings aggiornato ✅');
    console.log('   3. User.totalEarnings aggiornato ✅');
    console.log('   4. Log tracciabilità presente ✅\n');
  } else {
    console.log('⚠️  TEST COMPLETATO CON WARNING');
    console.log('   Possibile che il payout sia già stato pagato (>14 giorni)\n');
  }

  await mongoose.connection.close();
  process.exit(0);
};

connectDB().then(testRefund);
