import 'dotenv/config';
import mongoose from 'mongoose';
import Order from './models/Order.js';

// Script per correggere i campi dell'ordine recuperato
async function fixOrder(orderId, useProduction = false) {
  try {
    console.log('🔍 [FIX] Connessione MongoDB...');
    
    const mongoUri = useProduction 
      ? (process.env.MONGODB_URI_PROD || process.env.MONGODB_URI)
      : (process.env.MONGODB_URI || process.env.MONGODB_URI_PROD);
    
    if (!mongoUri) {
      throw new Error('❌ MONGODB_URI non trovato nel file .env');
    }
    
    const dbName = useProduction ? 'PRODUZIONE' : 'SVILUPPO';
    console.log(`📦 [FIX] Database: ${dbName}`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ [FIX] Connesso a MongoDB');

    console.log(`🔍 [FIX] Recupero ordine: ${orderId}`);
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error(`❌ Ordine ${orderId} non trovato`);
    }

    console.log('✅ [FIX] Ordine trovato');
    console.log(`📋 [FIX] Campi attuali:`);
    console.log(`   itemsPrice: ${order.itemsPrice}`);
    console.log(`   shippingPrice: ${order.shippingPrice}`);
    console.log(`   taxPrice: ${order.taxPrice}`);
    console.log(`   totalPrice: ${order.totalPrice}`);
    console.log(`   billingAddress: ${order.billingAddress ? 'presente' : 'MANCANTE'}`);

    // Calcola i valori corretti se mancano
    let needsUpdate = false;
    const updates = {};

    // Calcola itemsPrice dai prodotti se mancante
    if (!order.itemsPrice || order.itemsPrice === 0) {
      const itemsPrice = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      updates.itemsPrice = itemsPrice;
      console.log(`🔧 [FIX] Imposto itemsPrice = ${itemsPrice}`);
      needsUpdate = true;
    }

    // Usa shippingCost se shippingPrice mancante
    if ((!order.shippingPrice || order.shippingPrice === 0) && order.shippingCost) {
      updates.shippingPrice = order.shippingCost;
      console.log(`🔧 [FIX] Imposto shippingPrice = ${order.shippingCost}`);
      needsUpdate = true;
    }

    // Usa totalIva se taxPrice mancante
    if ((!order.taxPrice || order.taxPrice === 0) && order.totalIva) {
      updates.taxPrice = order.totalIva;
      console.log(`🔧 [FIX] Imposto taxPrice = ${order.totalIva}`);
      needsUpdate = true;
    }

    // Usa totalAmount se totalPrice mancante
    if ((!order.totalPrice || order.totalPrice === 0) && order.totalAmount) {
      updates.totalPrice = order.totalAmount;
      console.log(`🔧 [FIX] Imposto totalPrice = ${order.totalAmount}`);
      needsUpdate = true;
    }

    // Se totalPrice ancora mancante, calcolalo
    if ((!order.totalPrice || order.totalPrice === 0) && !updates.totalPrice) {
      const itemsPrice = updates.itemsPrice || order.itemsPrice || 0;
      const shippingPrice = updates.shippingPrice || order.shippingPrice || 0;
      const discountAmount = order.discountAmount || 0;
      const totalPrice = itemsPrice + shippingPrice - discountAmount;
      updates.totalPrice = totalPrice;
      console.log(`🔧 [FIX] Calcolo totalPrice = ${totalPrice}`);
      needsUpdate = true;
    }

    // Verifica billingAddress
    if (!order.billingAddress || !order.billingAddress.email) {
      console.warn('⚠️ [FIX] BillingAddress mancante o incompleto - dati insufficienti per recupero email');
    }

    if (needsUpdate) {
      console.log('\n💾 [FIX] Aggiornamento ordine...');
      await Order.findByIdAndUpdate(orderId, updates);
      console.log('✅ [FIX] Ordine aggiornato!');
      
      // Ricarica ordine aggiornato
      const updatedOrder = await Order.findById(orderId);
      console.log('\n📋 [FIX] Campi aggiornati:');
      console.log(`   itemsPrice: €${updatedOrder.itemsPrice}`);
      console.log(`   shippingPrice: €${updatedOrder.shippingPrice}`);
      console.log(`   taxPrice: €${updatedOrder.taxPrice}`);
      console.log(`   totalPrice: €${updatedOrder.totalPrice}`);
    } else {
      console.log('\n✅ [FIX] Nessun aggiornamento necessario');
    }

  } catch (error) {
    console.error('\n❌ [FIX] ERRORE:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 [FIX] Disconnesso da MongoDB');
  }
}

// Esegui script
const args = process.argv.slice(2);
const orderId = args[0];
const useProduction = args.includes('--prod');

if (!orderId) {
  console.error('❌ Uso: node fixOrder.js <orderId> [--prod]');
  process.exit(1);
}

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║          🔧 FIX ORDINE - CORREZIONE CAMPI             ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log(`🌍 Ambiente: ${useProduction ? 'PRODUZIONE' : 'SVILUPPO'}\n`);

fixOrder(orderId, useProduction);
