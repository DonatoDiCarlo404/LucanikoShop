import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import Order from './models/Order.js';

dotenv.config();

// Determina connessione database
const isProd = process.argv.includes('--prod');
const MONGODB_URI = isProd ? process.env.MONGODB_URI_PROD : process.env.MONGODB_URI;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

console.log(`🔧 [CONTROLLO VARIANTI] Ambiente: ${isProd ? 'PRODUZIONE' : 'SVILUPPO'}`);

async function checkOrderVariant(orderId) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connesso al database\n');

    // Recupera ordine
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.log('❌ Ordine non trovato');
      process.exit(1);
    }

    console.log('═══════════════════════════════════════');
    console.log(`📦 Ordine: ${order._id}`);
    console.log(`📅 Data: ${order.createdAt}`);
    console.log(`💰 Totale: €${order.totalPrice}`);
    console.log(`🔑 Stripe Session ID: ${order.stripeSessionId || 'N/A'}`);
    console.log('\n📋 Items nell\'ordine:');
    
    order.items.forEach((item, idx) => {
      console.log(`\n  ${idx + 1}. ${item.name}`);
      console.log(`     Quantità: ${item.quantity}`);
      console.log(`     Prezzo: €${item.price}`);
      console.log(`     selectedVariantSku: ${item.selectedVariantSku || 'N/A'}`);
      console.log(`     selectedVariantAttributes: ${item.selectedVariantAttributes ? JSON.stringify(item.selectedVariantAttributes) : 'N/A'}`);
    });

    // Se c'è un Stripe Session ID, recupera i metadata
    if (order.stripeSessionId) {
      console.log('\n\n🔍 Recupero metadata da Stripe...\n');
      
      try {
        const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
        console.log('📋 Metadata Stripe:');
        console.log(JSON.stringify(session.metadata, null, 2));
        
        // Cerca cartItems nei metadata chunk
        if (session.metadata.cartItems_count) {
          console.log('\n🛒 Cart Items da Stripe:');
          const chunkCount = parseInt(session.metadata.cartItems_count);
          let allItems = [];
          
          for (let i = 0; i < chunkCount; i++) {
            const chunk = JSON.parse(session.metadata[`cartItems_${i}`]);
            allItems = allItems.concat(chunk);
          }
          
          console.log(JSON.stringify(allItems, null, 2));
          
          // Verifica se ci sono varianti nei cart items
          const itemsWithVariants = allItems.filter(item => item.selectedVariantSku || item.selectedVariantAttributes);
          
          if (itemsWithVariants.length > 0) {
            console.log('\n✅ TROVATE VARIANTI NEI METADATA STRIPE!');
            console.log('\n🔧 Posso aggiornare l\'ordine con questi dati.\n');
          } else {
            console.log('\n❌ Nessuna variante trovata nei metadata Stripe');
          }
        }
      } catch (stripeErr) {
        console.error('❌ Errore recupero sessione Stripe:', stripeErr.message);
      }
    } else {
      console.log('\n⚠️ Ordine senza Stripe Session ID - impossibile recuperare metadata');
    }

  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnesso dal database');
  }
}

// Esegui con: node checkOrderVariant.js <orderId> [--prod]
const orderId = process.argv[2];

if (!orderId || orderId === '--prod') {
  console.log('❌ Uso: node checkOrderVariant.js <orderId> [--prod]');
  process.exit(1);
}

checkOrderVariant(orderId);
