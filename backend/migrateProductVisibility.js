import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

const migrateProductVisibility = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database');

    // Conta prodotti senza isVisible
    const productsWithoutVisibility = await Product.countDocuments({
      $or: [
        { isVisible: { $exists: false } },
        { isVisible: null }
      ]
    });

    console.log(`📊 Prodotti da aggiornare: ${productsWithoutVisibility}`);

    if (productsWithoutVisibility === 0) {
      console.log('✅ Tutti i prodotti hanno già il campo isVisible');
      process.exit(0);
    }

    // Aggiorna tutti i prodotti che non hanno isVisible impostandolo a true
    const result = await Product.updateMany(
      {
        $or: [
          { isVisible: { $exists: false } },
          { isVisible: null }
        ]
      },
      {
        $set: { isVisible: true }
      }
    );

    console.log(`✅ Aggiornati ${result.modifiedCount} prodotti con isVisible: true`);

    // Verifica finale
    const allProducts = await Product.countDocuments();
    const visibleProducts = await Product.countDocuments({ isVisible: true });
    const hiddenProducts = await Product.countDocuments({ isVisible: false });

    console.log('\n📊 Riepilogo:');
    console.log(`   Totale prodotti: ${allProducts}`);
    console.log(`   Prodotti visibili: ${visibleProducts}`);
    console.log(`   Prodotti nascosti: ${hiddenProducts}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error);
    process.exit(1);
  }
};

migrateProductVisibility();
