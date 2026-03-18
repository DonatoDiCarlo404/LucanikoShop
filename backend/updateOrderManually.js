import 'dotenv/config';
import mongoose from 'mongoose';
import Order from './models/Order.js';

// Script per aggiornare manualmente l'ordine con i valori corretti
async function updateOrderManually(orderId, useProduction = false) {
  try {
    console.log('🔍 [UPDATE] Connessione MongoDB...');
    
    const mongoUri = useProduction 
      ? (process.env.MONGODB_URI_PROD || process.env.MONGODB_URI)
      : (process.env.MONGODB_URI || process.env.MONGODB_URI_PROD);
    
    if (!mongoUri) {
      throw new Error('❌ MONGODB_URI non trovato nel file .env');
    }
    
    const dbName = useProduction ? 'PRODUZIONE' : 'SVILUPPO';
    console.log(`📦 [UPDATE] Database: ${dbName}`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ [UPDATE] Connesso a MongoDB');

    console.log(`🔍 [UPDATE] Recupero ordine: ${orderId}`);
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error(`❌ Ordine ${orderId} non trovato`);
    }

    console.log('✅ [UPDATE] Ordine trovato');
    console.log('\n📋 [UPDATE] Valori ATTUALI:');
    console.log('   itemsPrice:', order.itemsPrice);
    console.log('   shippingPrice:', order.shippingPrice);
    console.log('   taxPrice:', order.taxPrice);
    console.log('   totalPrice:', order.totalPrice);
    
    // Valori corretti basati sull'analisi Stripe
    const updates = {
      itemsPrice: 31.50,      // Somma prodotti (senza spedizione)
      shippingPrice: 6.50,    // Spedizione (dal metadata Stripe)
      taxPrice: 0,            // IVA non separata
      totalPrice: 38.00,      // Totale pagato
    };
    
    console.log('\n📋 [UPDATE] Valori CORRETTI da applicare:');
    console.log('   itemsPrice: €' + updates.itemsPrice.toFixed(2));
    console.log('   shippingPrice: €' + updates.shippingPrice.toFixed(2));
    console.log('   taxPrice: €' + updates.taxPrice.toFixed(2));
    console.log('   totalPrice: €' + updates.totalPrice.toFixed(2));
    
    console.log('\n💾 [UPDATE] Aggiornamento in corso...');
    await Order.findByIdAndUpdate(orderId, updates);
    console.log('✅ [UPDATE] Ordine aggiornato con successo!');
    
    // Verifica
    const updatedOrder = await Order.findById(orderId);
    console.log('\n✅ [UPDATE] VERIFICA - Valori salvati:');
    console.log('   itemsPrice: €' + updatedOrder.itemsPrice.toFixed(2));
    console.log('   shippingPrice: €' + updatedOrder.shippingPrice.toFixed(2));
    console.log('   taxPrice: €' + updatedOrder.taxPrice.toFixed(2));
    console.log('   totalPrice: €' + updatedOrder.totalPrice.toFixed(2));

  } catch (error) {
    console.error('\n❌ [UPDATE] ERRORE:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 [UPDATE] Disconnesso da MongoDB');
  }
}

// Esegui script
const args = process.argv.slice(2);
const orderId = args[0];
const useProduction = args.includes('--prod');

if (!orderId) {
  console.error('❌ Uso: node updateOrderManually.js <orderId> [--prod]');
  console.error('   Esempio: node updateOrderManually.js 69babec16b1c88550245402a --prod');
  process.exit(1);
}

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║      📝 AGGIORNAMENTO MANUALE ORDINE                  ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log(`🌍 Ambiente: ${useProduction ? 'PRODUZIONE' : 'SVILUPPO'}\n`);

updateOrderManually(orderId, useProduction);
