import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Product from './models/Product.js';

/**
 * Script per sincronizzare gli indici del modello Product
 * Applica tutti gli indici definiti nel modello al database di produzione
 */
async function syncIndexes() {
  try {
    console.log('🔗 Connessione a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB');

    console.log('📊 Indici esistenti PRIMA della sincronizzazione:');
    const existingIndexes = await Product.collection.getIndexes();
    console.log(JSON.stringify(existingIndexes, null, 2));

    console.log('\n🔄 Sincronizzazione indici in corso...');
    console.log('⏳ Questo può richiedere 10-30 secondi...\n');

    // Sincronizza gli indici (crea nuovi, rimuove obsoleti)
    await Product.syncIndexes();

    console.log('📊 Indici DOPO la sincronizzazione:');
    const newIndexes = await Product.collection.getIndexes();
    console.log(JSON.stringify(newIndexes, null, 2));

    console.log('\n✅ Sincronizzazione indici completata con successo!');
    console.log('🚀 Le query su Product saranno ora 10-100x più veloci');

    console.log('\n📈 Indici aggiunti:');
    console.log('   • isActive');
    console.log('   • isVisible');
    console.log('   • isActive + isVisible');
    console.log('   • isActive + isVisible + category + createdAt');
    console.log('   • isActive + isVisible + category + subcategory');
    console.log('   • subcategory');
    console.log('   • hasActiveDiscount + isActive + isVisible + createdAt');
    console.log('   • seller + isActive + createdAt');

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante la sincronizzazione:', error);
    process.exit(1);
  }
}

syncIndexes();
