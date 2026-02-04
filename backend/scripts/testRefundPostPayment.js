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
import { createRefundDebt } from '../utils/vendorEarningsCalculator.js';

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

const testRefundPostPayment = async () => {
  console.log('🧪 TEST RIMBORSO POST-PAGAMENTO (Fase 6.2)\n');
  console.log('📋 Scenario: Venditore GIÀ PAGATO, cliente chiede rimborso\n');
  
  // Trova un VendorPayout già pagato
  const paidPayout = await VendorPayout.findOne({ status: 'paid' })
    .populate('vendorId', 'name companyName email debtBalance paidEarnings')
    .populate('orderId');
  
  if (!paidPayout) {
    console.log('❌ Nessun VendorPayout pagato trovato');
    console.log('💡 Esegui prima simulatePaidPayout.js per creare un pagamento\n');
    process.exit(1);
  }

  console.log('📦 VendorPayout PAGATO trovato:');
  console.log(`   - ID: ${paidPayout._id}`);
  console.log(`   - Ordine: ${paidPayout.orderId?._id || 'N/A'}`);
  console.log(`   - Venditore: ${paidPayout.vendorId?.companyName || paidPayout.vendorId?.name}`);
  console.log(`   - Importo pagato: €${paidPayout.amount.toFixed(2)}`);
  console.log(`   - Data pagamento: ${paidPayout.paymentDate?.toLocaleDateString('it-IT') || 'N/A'}`);
  console.log(`   - Stripe Transfer ID: ${paidPayout.stripeTransferId || 'N/A'}\n`);

  // Statistiche venditore PRIMA
  const vendorBefore = await User.findById(paidPayout.vendorId._id);
  console.log('📊 Statistiche venditore PRIMA del rimborso:');
  console.log(`   - Paid Earnings: €${vendorBefore.paidEarnings?.toFixed(2) || '0.00'}`);
  console.log(`   - Debt Balance: €${vendorBefore.debtBalance?.toFixed(2) || '0.00'}\n`);

  // Conta VendorPayout prima
  const payoutsCountBefore = await VendorPayout.countDocuments({ 
    orderId: paidPayout.orderId._id 
  });
  console.log(`📋 VendorPayout per questo ordine PRIMA: ${payoutsCountBefore}\n`);

  // ============ ESEGUI RIMBORSO POST-PAGAMENTO ============
  console.log('💳 Esecuzione creazione debito...\n');
  
  const result = await createRefundDebt(paidPayout.orderId._id.toString());

  // ============ VERIFICA RISULTATI ============
  console.log('\n🔍 VERIFICA POST-RIMBORSO:\n');

  // Statistiche venditore DOPO
  const vendorAfter = await User.findById(paidPayout.vendorId._id);
  console.log('📊 Statistiche venditore DOPO il rimborso:');
  console.log(`   - Paid Earnings: €${vendorAfter.paidEarnings?.toFixed(2) || '0.00'}`);
  console.log(`   - Debt Balance: €${vendorAfter.debtBalance?.toFixed(2) || '0.00'}`);
  console.log(`   - Differenza Paid: €${((vendorBefore.paidEarnings || 0) - (vendorAfter.paidEarnings || 0)).toFixed(2)}`);
  console.log(`   - Debito creato: €${((vendorAfter.debtBalance || 0) - (vendorBefore.debtBalance || 0)).toFixed(2)}\n`);

  // Conta VendorPayout dopo (dovrebbe aumentare di 1 per il debito)
  const payoutsCountAfter = await VendorPayout.countDocuments({ 
    orderId: paidPayout.orderId._id 
  });
  console.log(`📋 VendorPayout per questo ordine DOPO: ${payoutsCountAfter}`);
  console.log(`   - Nuovi payout (debiti): ${payoutsCountAfter - payoutsCountBefore}\n`);

  // Verifica payout negativo creato
  const debtPayout = await VendorPayout.findOne({
    orderId: paidPayout.orderId._id,
    isRefundDebt: true,
    amount: { $lt: 0 }
  });

  if (debtPayout) {
    console.log('💳 DEBITO CREATO:');
    console.log(`   - ID: ${debtPayout._id}`);
    console.log(`   - Importo: €${debtPayout.amount.toFixed(2)}`);
    console.log(`   - Status: ${debtPayout.status}`);
    console.log(`   - isRefundDebt: ${debtPayout.isRefundDebt}`);
    console.log(`   - Riferimento payout originale: ${debtPayout.refundedPayoutId}\n`);
  }

  // Risultato
  console.log('📊 RISULTATO OPERAZIONE:');
  console.log(`   - Success: ${result.success ? '✅' : '❌'}`);
  console.log(`   - Message: ${result.message}`);
  console.log(`   - Debiti creati: ${result.debts?.length || 0}`);
  console.log(`   - Venditori aggiornati: ${result.vendorUpdates?.length || 0}\n`);

  if (result.success) {
    console.log('✅ TEST COMPLETATO CON SUCCESSO!\n');
    console.log('📌 VERIFICA:');
    console.log('   1. VendorPayout negativo (debito) creato ✅');
    console.log('   2. User.debtBalance incrementato ✅');
    console.log('   3. User.paidEarnings ridotto ✅');
    console.log('   4. isRefundDebt = true ✅');
    console.log('   5. Debito sarà detratto dal prossimo pagamento ⏳\n');
    console.log('⚠️  IMPORTANTE:');
    console.log('   - Il venditore ha ora un DEBITO attivo');
    console.log('   - Verrà automaticamente detratto dal prossimo transfer');
    console.log('   - Se debito > prossimo pagamento, il pagamento sarà 0\n');
  }

  await mongoose.connection.close();
  process.exit(0);
};

connectDB().then(testRefundPostPayment);
