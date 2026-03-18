import 'dotenv/config';
import mongoose from 'mongoose';
import Order from './models/Order.js';
import Stripe from 'stripe';

// Script per completare i dati mancanti dell'ordine
async function fixOrderComplete(orderId, paymentIntentId, useProduction = false) {
  try {
    console.log('🔍 [FIX] Connessione MongoDB...');
    
    const mongoUri = useProduction 
      ? (process.env.MONGODB_URI_PROD || process.env.MONGODB_URI)
      : (process.env.MONGODB_URI || process.env.MONGODB_URI_PROD);
    
    const stripeKey = useProduction 
      ? (process.env.STRIPE_SECRET_KEY_PROD || process.env.STRIPE_SECRET_KEY)
      : process.env.STRIPE_SECRET_KEY;
    
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
    
    // Recupera dati da Stripe
    console.log('\n🔍 [FIX] Recupero dati da Stripe...');
    const stripe = new Stripe(stripeKey);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge.balance_transaction']
    });
    
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: paymentIntentId,
      limit: 1
    });
    
    if (sessions.data.length === 0) {
      throw new Error('❌ Nessuna sessione trovata per questo Payment Intent');
    }
    
    const fullSession = await stripe.checkout.sessions.retrieve(sessions.data[0].id, {
      expand: ['line_items', 'line_items.data.price.product']
    });
    
    console.log('✅ [FIX] Dati Stripe recuperati');
    
    // Calcola shipping cost dalla sessione Stripe
    const shippingCost = fullSession.shipping_cost ? (fullSession.shipping_cost.amount_total / 100) : 0;
    const totalFromStripe = paymentIntent.amount / 100;
    
    console.log('\n💰 [FIX] Analisi importi:');
    console.log('   Totale Stripe:', totalFromStripe.toFixed(2), 'EUR');
    console.log('   Shipping Stripe:', shippingCost.toFixed(2), 'EUR');
    console.log('   Items attuale ordine:', order.itemsPrice.toFixed(2), 'EUR');
    console.log('   Shipping attuale ordine:', order.shippingPrice.toFixed(2), 'EUR');
    
    // Prepara aggiornamenti
    const updates = {};
    let needsUpdate = false;

    // 1. Aggiungi orderNumber se mancante
    if (!order.orderNumber) {
      // Genera numero ordine: LUCA-YYYYMMDD-XXXXX
      const date = new Date();
      const dateStr = date.toISOString().slice(0,10).replace(/-/g, '');
      const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
      updates.orderNumber = `LUCA-${dateStr}-${randomStr}`;
      console.log(`🔧 [FIX] Genero orderNumber: ${updates.orderNumber}`);
      needsUpdate = true;
    }

    // 2. Correggi shippingPrice
    if (order.shippingPrice === 0 && shippingCost > 0) {
      updates.shippingPrice = shippingCost;
      console.log(`🔧 [FIX] Aggiorno shippingPrice: ${shippingCost.toFixed(2)} EUR`);
      needsUpdate = true;
    }

    // 3. Ricalcola totalPrice
    const correctItemsPrice = order.itemsPrice > 0 ? order.itemsPrice : (totalFromStripe - shippingCost);
    const correctShippingPrice = updates.shippingPrice || order.shippingPrice;
    const correctTotalPrice = correctItemsPrice + correctShippingPrice - (order.discountAmount || 0);
    
    if (Math.abs(order.totalPrice - correctTotalPrice) > 0.01) {
      updates.totalPrice = correctTotalPrice;
      console.log(`🔧 [FIX] Aggiorno totalPrice: ${correctTotalPrice.toFixed(2)} EUR`);
      needsUpdate = true;
    }
    
    // 4. Verifica itemsPrice
    if (order.itemsPrice === 0) {
      updates.itemsPrice = correctItemsPrice;
      console.log(`🔧 [FIX] Aggiorno itemsPrice: ${correctItemsPrice.toFixed(2)} EUR`);
      needsUpdate = true;
    }

    if (needsUpdate) {
      console.log('\n💾 [FIX] Aggiornamento ordine...');
      await Order.findByIdAndUpdate(orderId, updates);
      console.log('✅ [FIX] Ordine aggiornato!');
      
      // Ricarica ordine aggiornato
      const updatedOrder = await Order.findById(orderId);
      console.log('\n📋 [FIX] Dati finali:');
      console.log(`   orderNumber: ${updatedOrder.orderNumber}`);
      console.log(`   itemsPrice: €${updatedOrder.itemsPrice.toFixed(2)}`);
      console.log(`   shippingPrice: €${updatedOrder.shippingPrice.toFixed(2)}`);
      console.log(`   totalPrice: €${updatedOrder.totalPrice.toFixed(2)}`);
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
const paymentIntentId = args[1];
const useProduction = args.includes('--prod');

if (!orderId || !paymentIntentId) {
  console.error('❌ Uso: node fixOrderComplete.js <orderId> <paymentIntentId> [--prod]');
  console.error('   Esempio: node fixOrderComplete.js 69babec16b1c88550245402a pi_3TCIvDK9Lxisu9UD1fxHEX5n --prod');
  process.exit(1);
}

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║         🔧 FIX ORDINE - COMPLETAMENTO DATI            ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log(`🌍 Ambiente: ${useProduction ? 'PRODUZIONE' : 'SVILUPPO'}\n`);

fixOrderComplete(orderId, paymentIntentId, useProduction);
