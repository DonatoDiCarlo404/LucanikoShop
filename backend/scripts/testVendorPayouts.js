import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Risolvi il percorso del file .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import VendorPayout from '../models/VendorPayout.js';
import User from '../models/User.js';
import Order from '../models/Order.js';

/**
 * Script di test per il sistema di pagamenti automatici ai venditori
 * 
 * MODALITÀ D'USO:
 * 1. Test Database: verifica VendorPayout esistenti
 * 2. Test Simulato: modifica temporaneamente le date per forzare pagamenti
 * 3. Test Reale: esegui il job manualmente
 * 
 * COMANDO:
 * node scripts/testVendorPayouts.js [mode]
 * 
 * MODES:
 * - check: verifica stato database
 * - simulate: simula pagamenti modificando date (TEST MODE)
 * - run: esegui job reale
 */

const mode = process.argv[2] || 'check';

// Connetti a MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI non trovato nelle variabili ambiente');
    }
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connesso: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Errore connessione MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Test 1: Verifica stato database
const checkDatabase = async () => {
  console.log('\n📊 ========== VERIFICA DATABASE ==========\n');

  // Conta VendorPayout per status
  const pendingPayouts = await VendorPayout.find({ status: 'pending' })
    .populate('vendorId', 'name companyName email stripeConnectAccountId onboardingComplete')
    .populate('orderId', 'orderNumber totalAmount');
  
  const processingPayouts = await VendorPayout.find({ status: 'processing' });
  const paidPayouts = await VendorPayout.find({ status: 'paid' });
  const failedPayouts = await VendorPayout.find({ status: 'failed' });

  console.log(`📋 STATO VENDORPAYOUT:`);
  console.log(`   - Pending: ${pendingPayouts.length}`);
  console.log(`   - Processing: ${processingPayouts.length}`);
  console.log(`   - Paid: ${paidPayouts.length}`);
  console.log(`   - Failed: ${failedPayouts.length}`);

  // Verifica quali sono pronti per il pagamento (>14 giorni)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const readyForPayment = pendingPayouts.filter(p => p.saleDate <= fourteenDaysAgo);
  const notReadyYet = pendingPayouts.filter(p => p.saleDate > fourteenDaysAgo);

  console.log(`\n📅 ANALISI DATE (limite: ${fourteenDaysAgo.toLocaleDateString()}):`);
  console.log(`   - Pronti per pagamento (>14 giorni): ${readyForPayment.length}`);
  console.log(`   - In attesa (<14 giorni): ${notReadyYet.length}`);

  // Dettagli pending payouts
  if (pendingPayouts.length > 0) {
    console.log(`\n📦 DETTAGLIO PENDING PAYOUTS:\n`);
    pendingPayouts.forEach((payout, index) => {
      const daysSinceSale = Math.floor((new Date() - payout.saleDate) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, 14 - daysSinceSale);
      const isReady = daysRemaining === 0;

      console.log(`${index + 1}. Payout ID: ${payout._id}`);
      console.log(`   - Venditore: ${payout.vendorId?.companyName || payout.vendorId?.name || 'N/A'}`);
      console.log(`   - Email: ${payout.vendorId?.email || 'N/A'}`);
      console.log(`   - Importo: €${payout.amount.toFixed(2)}`);
      console.log(`   - Data vendita: ${payout.saleDate.toLocaleDateString()}`);
      console.log(`   - Giorni trascorsi: ${daysSinceSale}`);
      console.log(`   - Giorni mancanti: ${daysRemaining}`);
      console.log(`   - Stripe Connect: ${payout.vendorId?.stripeConnectAccountId ? '✅' : '❌'}`);
      console.log(`   - Onboarding: ${payout.vendorId?.onboardingComplete ? '✅' : '❌'}`);
      console.log(`   - Stato: ${isReady ? '✅ PRONTO' : '⏳ IN ATTESA'}\n`);
    });
  }

  // Statistiche venditori
  const vendors = await User.find({ role: 'vendor' });
  console.log(`\n👥 STATISTICHE VENDITORI (${vendors.length} totali):\n`);
  
  for (const vendor of vendors) {
    const vendorPendingPayouts = pendingPayouts.filter(
      p => p.vendorId && p.vendorId._id.toString() === vendor._id.toString()
    );
    
    if (vendorPendingPayouts.length > 0) {
      const totalPending = vendorPendingPayouts.reduce((sum, p) => sum + p.amount, 0);
      
      console.log(`📍 ${vendor.companyName || vendor.name}`);
      console.log(`   - Total Earnings: €${(vendor.totalEarnings || 0).toFixed(2)}`);
      console.log(`   - Pending Earnings: €${(vendor.pendingEarnings || 0).toFixed(2)}`);
      console.log(`   - Paid Earnings: €${(vendor.paidEarnings || 0).toFixed(2)}`);
      console.log(`   - VendorPayout pending: ${vendorPendingPayouts.length} (€${totalPending.toFixed(2)})`);
      console.log(`   - Stripe Connect: ${vendor.stripeConnectAccountId ? '✅' : '❌'}\n`);
    }
  }

  return {
    pending: pendingPayouts.length,
    readyForPayment: readyForPayment.length,
    notReadyYet: notReadyYet.length
  };
};

// Test 2: Simula pagamenti modificando le date (SOLO TEST)
const simulatePayments = async () => {
  console.log('\n🧪 ========== MODALITÀ SIMULAZIONE (TEST) ==========\n');
  console.log('⚠️  ATTENZIONE: Questa modalità modifica temporaneamente le date dei VendorPayout');
  console.log('⚠️  per simulare il passaggio di 14 giorni. NON usare in produzione!\n');

  const pendingPayouts = await VendorPayout.find({ status: 'pending' });
  
  if (pendingPayouts.length === 0) {
    console.log('❌ Nessun VendorPayout pending da simulare.');
    console.log('💡 Suggerimento: Crea un ordine di test per generare VendorPayout.\n');
    return;
  }

  console.log(`📦 Trovati ${pendingPayouts.length} VendorPayout pending`);
  console.log('🔄 Modifico le date per simulare 14+ giorni...\n');

  // Modifica date a 15 giorni fa
  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

  for (const payout of pendingPayouts) {
    payout.saleDate = fifteenDaysAgo;
    await payout.save();
    console.log(`✅ Payout ${payout._id} -> saleDate impostata a ${fifteenDaysAgo.toLocaleDateString()}`);
  }

  console.log('\n🚀 Eseguo il job di pagamenti...\n');
  
  // Importa dinamicamente il job solo quando serve (così dotenv è già caricato)
  const { processVendorPayouts } = await import('../jobs/processVendorPayouts.js');
  const result = await processVendorPayouts();

  console.log('\n📊 RISULTATO SIMULAZIONE:');
  console.log(`   - Processati: ${result.processed}`);
  console.log(`   - Successo: ${result.success}`);
  console.log(`   - Falliti: ${result.failed}\n`);

  // Mostra stato finale
  await checkDatabase();
};

// Test 3: Esegui job reale
const runJob = async () => {
  console.log('\n🚀 ========== ESECUZIONE JOB REALE ==========\n');
  console.log('⚠️  Questo eseguirà i transfer Stripe reali per i pagamenti pronti.\n');

  // Importa dinamicamente il job solo quando serve (così dotenv è già caricato)
  const { processVendorPayouts } = await import('../jobs/processVendorPayouts.js');
  const result = await processVendorPayouts();

  console.log('\n📊 RISULTATO:');
  console.log(`   - Processati: ${result.processed}`);
  console.log(`   - Successo: ${result.success}`);
  console.log(`   - Falliti: ${result.failed}\n`);
};

// Main
const main = async () => {
  await connectDB();

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   TEST SISTEMA PAGAMENTI AUTOMATICI VENDITORI        ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  switch (mode) {
    case 'check':
      await checkDatabase();
      break;
    
    case 'simulate':
      await simulatePayments();
      break;
    
    case 'run':
      await runJob();
      break;
    
    default:
      console.log(`\n❌ Modalità sconosciuta: ${mode}`);
      console.log('\nModalità disponibili:');
      console.log('  - check: verifica stato database');
      console.log('  - simulate: simula pagamenti (TEST MODE)');
      console.log('  - run: esegui job reale\n');
  }

  await mongoose.connection.close();
  console.log('\n✅ Connessione MongoDB chiusa. Test completato.\n');
  process.exit(0);
};

main().catch(error => {
  console.error('\n❌ ERRORE:', error);
  process.exit(1);
});
