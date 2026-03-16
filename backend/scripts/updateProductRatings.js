import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import Review from '../models/Review.js';

dotenv.config();

const updateProductRatings = async () => {
  try {
    console.log('🔄 Connessione al database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database MongoDB\n');

    // Trova tutti i prodotti che hanno recensioni
    const reviews = await Review.find();
    const productIds = [...new Set(reviews.map(r => r.product?.toString()).filter(Boolean))];

    console.log(`📊 Prodotti da aggiornare: ${productIds.length}\n`);

    let updatedCount = 0;

    for (const productId of productIds) {
      const product = await Product.findById(productId);
      if (!product) {
        console.log(`⚠️  Prodotto ${productId} non trovato - SKIP`);
        continue;
      }

      // Ricalcola rating e numReviews
      const productReviews = reviews.filter(r => r.product?.toString() === productId);
      const numReviews = productReviews.length;
      const avgRating = numReviews > 0 
        ? productReviews.reduce((acc, r) => acc + r.rating, 0) / numReviews 
        : 0;

      // Aggiorna solo se necessario
      if (product.numReviews !== numReviews || product.rating !== avgRating) {
        const oldRating = product.rating;
        const oldNumReviews = product.numReviews;

        product.rating = avgRating;
        product.numReviews = numReviews;
        await product.save();

        console.log(`✅ ${product.name}`);
        console.log(`   - Recensioni: ${oldNumReviews} → ${numReviews}`);
        console.log(`   - Rating: ${oldRating?.toFixed(1) || '0.0'} → ${avgRating.toFixed(1)}`);
        console.log('');

        updatedCount++;
      } else {
        console.log(`✓  ${product.name} - già aggiornato`);
      }
    }

    console.log(`\n📈 RIEPILOGO:`);
    console.log(`   - Prodotti analizzati: ${productIds.length}`);
    console.log(`   - Prodotti aggiornati: ${updatedCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

updateProductRatings();
