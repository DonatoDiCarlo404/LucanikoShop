import 'dotenv/config';
import mongoose from 'mongoose';
import Order from './models/Order.js';
import User from './models/User.js';
import Product from './models/Product.js';

// Script per ispezionare l'ordine e vedere i dati completi
async function inspectOrder(orderId, useProduction = false) {
  try {
    console.log('🔍 [INSPECT] Connessione MongoDB...');
    
    const mongoUri = useProduction 
      ? (process.env.MONGODB_URI_PROD || process.env.MONGODB_URI)
      : (process.env.MONGODB_URI || process.env.MONGODB_URI_PROD);
    
    if (!mongoUri) {
      throw new Error('❌ MONGODB_URI non trovato nel file .env');
    }
    
    const dbName = useProduction ? 'PRODUZIONE' : 'SVILUPPO';
    console.log(`📦 [INSPECT] Database: ${dbName}`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ [INSPECT] Connesso a MongoDB');

    console.log(`🔍 [INSPECT] Recupero ordine: ${orderId}`);
    const order = await Order.findById(orderId)
      .populate('buyer', 'name email')
      .populate({
        path: 'items.product',
        populate: { path: 'seller', select: 'name email businessName' }
      });

    if (!order) {
      throw new Error(`❌ Ordine ${orderId} non trovato`);
    }

    console.log('\n✅ [INSPECT] Ordine trovato\n');
    console.log('═══════════════════════════════════════');
    console.log('📋 DATI ORDINE COMPLETI');
    console.log('═══════════════════════════════════════\n');
    
    console.log('🆔 Order ID:', order._id.toString());
    console.log('📅 Data creazione:', order.createdAt);
    console.log('💳 Pagato:', order.isPaid ? '✅ SI' : '❌ NO');
    console.log('📧 Guest Email:', order.guestEmail || 'N/A');
    console.log('👤 Guest Name:', order.guestName || 'N/A');
    console.log('🔢 Numero prodotti:', order.items.length);
    
    console.log('\n💰 PREZZI:');
    console.log('   itemsPrice:', order.itemsPrice);
    console.log('   shippingPrice:', order.shippingPrice);
    console.log('   taxPrice:', order.taxPrice);
    console.log('   totalPrice:', order.totalPrice);
    console.log('   discountAmount:', order.discountAmount);
    
    console.log('\n📦 PRODOTTI:');
    order.items.forEach((item, idx) => {
      console.log(`   ${idx + 1}. ${item.name || item.product?.name || 'N/A'}`);
      console.log(`      Quantità: ${item.quantity}, Prezzo: €${item.price}`);
    });
    
    console.log('\n📍 BILLING ADDRESS:');
    if (order.billingAddress) {
      console.log('   Tipo:', typeof order.billingAddress);
      console.log('   È oggetto?', order.billingAddress && typeof order.billingAddress === 'object');
      console.log('   JSON completo:');
      console.log(JSON.stringify(order.billingAddress, null, 2));
      
      console.log('\n   Campi specifici:');
      console.log('   - firstName:', order.billingAddress.firstName || 'UNDEFINED');
      console.log('   - lastName:', order.billingAddress.lastName || 'UNDEFINED');
      console.log('   - email:', order.billingAddress.email || 'UNDEFINED');
      console.log('   - street:', order.billingAddress.street || 'UNDEFINED');
      console.log('   - city:', order.billingAddress.city || 'UNDEFINED');
      console.log('   - phone:', order.billingAddress.phone || 'UNDEFINED');
    } else {
      console.log('   ❌ BILLING ADDRESS = NULL/UNDEFINED');
    }
    
    console.log('\n📍 SHIPPING ADDRESS:');
    if (order.shippingAddress) {
      console.log(JSON.stringify(order.shippingAddress, null, 2));
    } else {
      console.log('   ❌ SHIPPING ADDRESS = NULL/UNDEFINED');
    }
    
    console.log('\n═══════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ [INSPECT] ERRORE:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 [INSPECT] Disconnesso da MongoDB');
  }
}

// Esegui script
const args = process.argv.slice(2);
const orderId = args[0];
const useProduction = args.includes('--prod');

if (!orderId) {
  console.error('❌ Uso: node inspectOrder.js <orderId> [--prod]');
  process.exit(1);
}

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║              🔍 ISPEZIONE ORDINE                       ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

inspectOrder(orderId, useProduction);
