import 'dotenv/config';
import mongoose from 'mongoose';
import Order from './models/Order.js';
import VendorPayout from './models/VendorPayout.js';
import { calculateVendorEarnings } from './utils/vendorEarningsCalculator.js';

// Script per ricalcolare VendorPayout di un ordine specifico
async function recalculatePayouts(orderId, useProduction = false) {
  try {
    console.log('🔍 [RECALC] Connessione MongoDB...');
    
    const mongoUri = useProduction 
      ? (process.env.MONGODB_URI_PROD || process.env.MONGODB_URI)
      : (process.env.MONGODB_URI || process.env.MONGODB_URI_PROD);
    
    if (!mongoUri) {
      throw new Error('❌ MONGODB_URI non trovato nel file .env');
    }
    
    const dbName = useProduction ? 'PRODUZIONE' : 'SVILUPPO';
    console.log(`📦 [RECALC] Database: ${dbName}`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ [RECALC] Connesso a MongoDB');

    console.log(`🔍 [RECALC] Recupero ordine: ${orderId}`);
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error(`❌ Ordine ${orderId} non trovato`);
    }

    console.log('✅ [RECALC] Ordine trovato');
    console.log(`📋 [RECALC] Totale ordine: €${order.totalPrice}`);

    // Controlla se VendorPayout già esistono
    const existingPayouts = await VendorPayout.find({ orderId: order._id });
    console.log(`\n📦 [RECALC] VendorPayout esistenti: ${existingPayouts.length}`);
    
    if (existingPayouts.length > 0) {
      console.log('\n⚠️ [RECALC] ATTENZIONE: VendorPayout già esistenti per questo ordine:');
      existingPayouts.forEach(p => {
        console.log(`   - ID: ${p._id}, Importo: €${p.amount}, Status: ${p.status}`);
      });
      
      console.log('\n🗑️ [RECALC] Elimino VendorPayout esistenti...');
      await VendorPayout.deleteMany({ orderId: order._id });
      console.log('✅ [RECALC] VendorPayout eliminati');
    }

    // Ricalcola earnings
    console.log('\n💰 [RECALC] Ricalcolo earnings...');
    const vendorEarnings = calculateVendorEarnings(order, null);
    
    console.log(`\n📊 [RECALC] Earnings calcolati per ${vendorEarnings.length} venditori:`);
    
    // Crea nuovi VendorPayout
    for (const earning of vendorEarnings) {
      const vendorPayout = await VendorPayout.create({
        vendorId: earning.vendorId,
        orderId: order._id,
        amount: earning.netAmount,
        stripeFee: earning.stripeFee,
        transferFee: earning.transferFee,
        status: 'pending',
        saleDate: order.paidAt || order.createdAt
      });
      
      console.log(`✅ [RECALC] VendorPayout creato:`);
      console.log(`   - Venditore: ${earning.vendorId}`);
      console.log(`   - Importo netto: €${earning.netAmount.toFixed(2)}`);
      console.log(`   - Stripe Fee: €${earning.stripeFee.toFixed(2)}`);
      console.log(`   - Payout ID: ${vendorPayout._id}`);
    }

    // Salva earnings nell'ordine
    order.vendorEarnings = vendorEarnings;
    await order.save();
    console.log('\n✅ [RECALC] Earnings salvati nell\'ordine');

    console.log('\n🎉 [RECALC] RICALCOLO COMPLETATO CON SUCCESSO!');

  } catch (error) {
    console.error('\n❌ [RECALC] ERRORE:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 [RECALC] Disconnesso da MongoDB');
  }
}

// Esegui script
const args = process.argv.slice(2);
const orderId = args[0];
const useProduction = args.includes('--prod');

if (!orderId) {
  console.error('❌ Uso: node recalculatePayouts.js <orderId> [--prod]');
  console.error('   Esempio: node recalculatePayouts.js 69babec16b1c88550245402a --prod');
  process.exit(1);
}

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║      💰 RICALCOLO VENDOR PAYOUTS ORDINE               ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log(`🌍 Ambiente: ${useProduction ? 'PRODUZIONE' : 'SVILUPPO'}\n`);

recalculatePayouts(orderId, useProduction);
