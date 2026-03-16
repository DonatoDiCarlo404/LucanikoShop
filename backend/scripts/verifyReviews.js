import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Review from '../models/Review.js';
import Product from '../models/Product.js';

dotenv.config();

const verifyReviews = async () => {
  try {
    console.log('🔄 Connessione al database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database MongoDB\n');

    const reviews = await Review.find()
      .populate('product', 'name')
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    console.log(`📊 TOTALE RECENSIONI: ${reviews.length}\n`);

    for (const review of reviews) {
      console.log(`--- Recensione ${review._id} ---`);
      console.log(`Prodotto: ${review.product?.name || 'N/A'}`);
      console.log(`Prodotto ID: ${review.product?._id || 'N/A'}`);
      console.log(`Utente: ${review.user?.name || 'Guest'}`);
      console.log(`Rating: ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}`);
      console.log(`Commento: "${review.comment}"`);
      console.log(`isVerified: ${review.isVerified}`);
      console.log(`isAutomatic: ${review.isAutomatic}`);
      console.log(`guestOrderId: ${review.guestOrderId || 'N/A'}`);
      console.log(`Data: ${review.createdAt.toLocaleDateString()}`);
      console.log('');
    }

    // Verifica per prodotto
    console.log('\n📦 RECENSIONI PER PRODOTTO:\n');
    const productIds = [...new Set(reviews.map(r => r.product?._id?.toString()).filter(Boolean))];
    
    for (const productId of productIds) {
      const product = await Product.findById(productId);
      const productReviews = reviews.filter(r => r.product?._id?.toString() === productId);
      
      console.log(`${product?.name || 'Unknown'}`);
      console.log(`  - Recensioni: ${productReviews.length}`);
      console.log(`  - Rating medio: ${(productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1)}`);
      console.log(`  - Automatiche: ${productReviews.filter(r => r.isAutomatic).length}`);
      console.log(`  - Manuali: ${productReviews.filter(r => !r.isAutomatic).length}`);
      console.log('');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

verifyReviews();
