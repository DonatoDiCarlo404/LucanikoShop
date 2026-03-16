import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Review from '../models/Review.js';

dotenv.config();

const cleanOldAutomaticReviews = async () => {
  try {
    console.log('🔄 Connessione al database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database MongoDB\n');

    // Trova recensioni guest senza guestOrderId (create prima del fix)
    const oldGuestReviews = await Review.find({
      user: null,
      isAutomatic: true,
      guestOrderId: { $exists: false }
    });

    console.log(`📋 Recensioni guest vecchie (senza guestOrderId): ${oldGuestReviews.length}\n`);

    if (oldGuestReviews.length > 0) {
      for (const review of oldGuestReviews) {
        const product = await mongoose.model('Product').findById(review.product);
        console.log(`  - ${product?.name || 'Prodotto sconosciuto'} (ID: ${review._id})`);
      }

      console.log('\n🗑️  Elimino recensioni vecchie senza guestOrderId...');
      const deleteResult = await Review.deleteMany({
        user: null,
        isAutomatic: true,
        guestOrderId: { $exists: false }
      });

      console.log(`✅ Eliminate ${deleteResult.deletedCount} recensioni vecchie`);
    } else {
      console.log('✅ Nessuna recensione vecchia da eliminare');
    }

    // Mostra recensioni rimanenti
    const remainingReviews = await Review.find();
    console.log(`\n📊 Recensioni totali rimanenti: ${remainingReviews.length}`);

    const automatic = remainingReviews.filter(r => r.isAutomatic);
    const withGuestOrder = remainingReviews.filter(r => r.guestOrderId);
    
    console.log(`  - Automatiche: ${automatic.length}`);
    console.log(`  - Con guestOrderId: ${withGuestOrder.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

cleanOldAutomaticReviews();
