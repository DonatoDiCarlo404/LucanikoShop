import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Product from './models/Product.js';
import User from './models/User.js'; // IMPORTANTE: importa User per il populate

async function checkProducts() {
  try {
    console.log('🔗 Connessione al database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database\n');

    console.log('🔍 Verifica prodotti senza seller valido...\n');

    // Trova tutti i prodotti
    const allProducts = await Product.find();
    console.log(`📦 Totale prodotti: ${allProducts.length}\n`);

    // Trova prodotti senza seller
    const productsWithoutSeller = await Product.find({ seller: { $exists: false } });
    console.log(`❌ Prodotti senza campo seller: ${productsWithoutSeller.length}`);
    if (productsWithoutSeller.length > 0) {
      productsWithoutSeller.forEach(p => {
        console.log(`   - ${p.name} (ID: ${p._id})`);
      });
    }

    // Trova prodotti con seller null
    const productsWithNullSeller = await Product.find({ seller: null });
    console.log(`❌ Prodotti con seller null: ${productsWithNullSeller.length}`);
    if (productsWithNullSeller.length > 0) {
      productsWithNullSeller.forEach(p => {
        console.log(`   - ${p.name} (ID: ${p._id})`);
      });
    }

    // Prova a popolare tutti i prodotti e vedi quali falliscono
    console.log('\n🔍 Verifica populate dei seller...\n');
    let populateErrors = 0;
    
    for (const product of allProducts) {
      try {
        const populated = await Product.findById(product._id).populate('seller');
        if (!populated.seller) {
          console.log(`⚠️  Prodotto "${product.name}" (${product._id}): seller non popolato`);
          console.log(`   seller field value:`, product.seller);
          populateErrors++;
        }
      } catch (err) {
        console.log(`❌ Errore populate per "${product.name}" (${product._id}):`, err.message);
        populateErrors++;
      }
    }

    console.log(`\n📊 Risultati:`);
    console.log(`   ✅ Prodotti OK: ${allProducts.length - populateErrors}`);
    console.log(`   ❌ Prodotti con problemi: ${populateErrors}`);

  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnesso dal database');
    process.exit(0);
  }
}

checkProducts();
