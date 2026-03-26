import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

const testQuery = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database\n');

    // Query originale con $and
    const query = {
      hasActiveDiscount: true,
      isActive: true,
      $and: [
        {
          $or: [
            { isVisible: true },
            { isVisible: { $exists: false } },
            { isVisible: null }
          ]
        },
        {
          $or: [
            { hasVariants: false, stock: { $gt: 0 } },
            { hasVariants: true, 'variants.0': { $exists: true } }
          ]
        }
      ]
    };

    console.log('🔍 Query completa:');
    console.log(JSON.stringify(query, null, 2));
    console.log('\n');

    const products = await Product.find(query).limit(5);
    console.log(`✅ Prodotti trovati con query completa: ${products.length}\n`);

    // Test query semplificata
    const simpleQuery = {
      hasActiveDiscount: true,
      isActive: true
    };
    const simpleProducts = await Product.find(simpleQuery).limit(5);
    console.log(`✅ Prodotti con solo hasActiveDiscount + isActive: ${simpleProducts.length}\n`);

    // Test con isVisible
    const visibleQuery = {
      hasActiveDiscount: true,
      isActive: true,
      isVisible: true
    };
    const visibleProducts = await Product.find(visibleQuery).limit(5);
    console.log(`✅ Prodotti con isVisible: true: ${visibleProducts.length}\n`);

    // Mostra dettagli primi 2 prodotti
    if (simpleProducts.length > 0) {
      console.log('📋 Esempio prodotto 1:');
      console.log(`   Nome: ${simpleProducts[0].name}`);
      console.log(`   hasActiveDiscount: ${simpleProducts[0].hasActiveDiscount}`);
      console.log(`   isActive: ${simpleProducts[0].isActive}`);
      console.log(`   isVisible: ${simpleProducts[0].isVisible}`);
      console.log(`   hasVariants: ${simpleProducts[0].hasVariants}`);
      console.log(`   stock: ${simpleProducts[0].stock}`);
      if (simpleProducts[0].hasVariants) {
        console.log(`   variants count: ${simpleProducts[0].variants?.length || 0}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

testQuery();
