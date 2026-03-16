import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order.js';
import Review from '../models/Review.js';

dotenv.config();

const testAutomaticReviews = async () => {
  try {
    console.log('🔄 Connessione al database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database MongoDB');

    // Trova ordini guest completati senza recensioni automatiche
    const guestOrders = await Order.find({
      isGuestOrder: true,
      isPaid: true
    }).sort({ createdAt: -1 }).limit(5);

    console.log(`\n📦 Trovati ${guestOrders.length} ordini guest pagati\n`);

    for (const order of guestOrders) {
      console.log(`\n--- Ordine ${order._id} ---`);
      console.log(`Email guest: ${order.guestEmail}`);
      console.log(`Nome guest: ${order.guestName}`);
      console.log(`Totale: €${order.totalPrice}`);
      console.log(`Prodotti: ${order.items.length}`);
      console.log(`Data: ${order.createdAt.toLocaleDateString()}`);

      let createdCount = 0;
      let existingCount = 0;

      for (const item of order.items) {
        // Controlla se esiste già una recensione automatica
        const existingReview = await Review.findOne({
          product: item.product,
          guestOrderId: order._id,
          isAutomatic: true
        });

        if (existingReview) {
          console.log(`  ℹ️  Recensione automatica già esistente per: ${item.name}`);
          existingCount++;
        } else {
          // Crea recensione automatica
          const review = await Review.create({
            product: item.product,
            rating: 5,
            comment: 'Recensione automatica da acquisto verificato',
            isVerified: true,
            isAutomatic: true,
            guestOrderId: order._id,
            helpful: 0
          });

          console.log(`  ✅ Recensione automatica creata per: ${item.name}`);
          createdCount++;
        }
      }

      console.log(`\n📊 Riepilogo ordine:`);
      console.log(`  - Recensioni create: ${createdCount}`);
      console.log(`  - Recensioni esistenti: ${existingCount}`);
    }

    // Conta tutte le recensioni
    const totalReviews = await Review.countDocuments();
    const automaticReviews = await Review.countDocuments({ isAutomatic: true });
    const verifiedReviews = await Review.countDocuments({ isVerified: true });
    const manualReviews = await Review.countDocuments({ isAutomatic: false });

    console.log(`\n\n📈 STATISTICHE RECENSIONI:`);
    console.log(`  - Totale recensioni: ${totalReviews}`);
    console.log(`  - Recensioni automatiche: ${automaticReviews}`);
    console.log(`  - Recensioni manuali: ${manualReviews}`);
    console.log(`  - Recensioni verificate: ${verifiedReviews}`);

    console.log('\n✅ Test completato!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

testAutomaticReviews();
