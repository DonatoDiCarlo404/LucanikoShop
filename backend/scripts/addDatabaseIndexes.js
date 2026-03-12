/**
 * Script per aggiungere indici MongoDB per migliorare le performance
 * Esegui: node scripts/addDatabaseIndexes.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';

dotenv.config();

// Helper per creare indici saltando quelli già esistenti
const safeCreateIndex = async (collection, keys, options, description) => {
  try {
    await collection.createIndex(keys, options);
    console.log(`   ✅ ${description}`);
    return true;
  } catch (err) {
    if (err.code === 85 || err.message.includes('already exists')) {
      console.log(`   ℹ️  ${description} - già esistente (saltato)`);
      return false;
    }
    console.log(`   ⚠️  ${description} - errore: ${err.message}`);
    return false;
  }
};

const addIndexes = async () => {
  let hasError = false;
  try {
    console.log('🔌 Connessione a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB');

    // ========== PRODOTTI ==========
    console.log('\n📦 Creazione indici per Product...');
    
    await safeCreateIndex(
      Product.collection,
      { isActive: 1, category: 1, isApproved: 1 },
      { name: 'idx_product_listing', background: true },
      'Indice compound listing (isActive+category+isApproved)'
    );
    
    await safeCreateIndex(
      Product.collection,
      { seller: 1, isActive: 1 },
      { name: 'idx_product_by_seller', background: true },
      'Indice per seller (dashboard venditori)'
    );
    
    // Text search - gestione speciale
    console.log('   ℹ️  Verifica indice text search...');
    const existingIndexes = await Product.collection.indexes();
    const textIndex = existingIndexes.find(idx => idx.key && idx.key._fts === 'text');
    
    if (textIndex) {
      console.log(`   ℹ️  Indice text search già presente: "${textIndex.name}"`);
    } else {
      await safeCreateIndex(
        Product.collection,
        { name: 'text', description: 'text' },
        { name: 'idx_product_search', default_language: 'italian', background: true },
        'Indice text search (name+description)'
      );
    }
    
    await safeCreateIndex(
      Product.collection,
      { subcategory: 1 },
      { name: 'idx_product_subcategory', background: true },
      'Indice subcategory'
    );
    
    await safeCreateIndex(
      Product.collection,
      { rating: -1 },
      { name: 'idx_product_rating', background: true },
      'Indice rating (ordinamento)'
    );

    console.log('✅ Indici Product completati');

    // ========== ORDERS ==========
    console.log('\n📦 Creazione indici per Order...');
    
    await safeCreateIndex(
      Order.collection,
      { buyer: 1, createdAt: -1 },
      { name: 'idx_order_by_buyer', background: true },
      'Indice buyer (storico ordini)'
    );
    
    await safeCreateIndex(
      Order.collection,
      { 'vendorOrders.vendor': 1, createdAt: -1 },
      { name: 'idx_order_by_vendor', background: true },
      'Indice vendor (dashboard venditori)'
    );
    
    await safeCreateIndex(
      Order.collection,
      { paymentStatus: 1 },
      { name: 'idx_order_payment_status', background: true },
      'Indice paymentStatus'
    );

    console.log('✅ Indici Order completati');

    // ========== USERS ==========
    console.log('\n👤 Creazione indici per User...');
    
    await safeCreateIndex(
      User.collection,
      { email: 1 },
      { unique: true, name: 'idx_user_email', background: true },
      'Indice email (unique)'
    );
    
    await safeCreateIndex(
      User.collection,
      { role: 1 },
      { name: 'idx_user_role', background: true },
      'Indice role'
    );

    console.log('✅ Indici User completati');

    // ========== REVIEWS ==========
    console.log('\n⭐ Creazione indici per Review...');
    
    await safeCreateIndex(
      Review.collection,
      { product: 1, createdAt: -1 },
      { name: 'idx_review_by_product', background: true },
      'Indice compound product+createdAt'
    );
    
    await safeCreateIndex(
      Review.collection,
      { user: 1 },
      { name: 'idx_review_by_user', background: true },
      'Indice user'
    );

    console.log('✅ Indici Review completati');

    console.log('\n✅ Tutti gli indici sono stati creati con successo!');
    console.log('\n📊 Verifica indici creati:');
    
    const productIndexes = await Product.collection.indexes();
    console.log('\n📦 Product indexes:', productIndexes.map(i => i.name).join(', '));
    
    const orderIndexes = await Order.collection.indexes();
    console.log('📦 Order indexes:', orderIndexes.map(i => i.name).join(', '));
    
    const userIndexes = await User.collection.indexes();
    console.log('👤 User indexes:', userIndexes.map(i => i.name).join(', '));
    
    const reviewIndexes = await Review.collection.indexes();
    console.log('⭐ Review indexes:', reviewIndexes.map(i => i.name).join(', '));

    console.log('\n🎉 Operazione completata con successo!');
    
  } catch (error) {
    hasError = true;
    console.error('\n❌ Errore creazione indici:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Disconnetti sempre da MongoDB, anche in caso di errore
    console.log('\n🔌 Disconnessione da MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Disconnesso');
    process.exit(hasError ? 1 : 0);
  }
};

addIndexes();
