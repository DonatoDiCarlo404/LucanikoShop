import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Order from '../models/Order.js';

dotenv.config();

async function checkReviews() {
  try {
    console.log('🔌 Connessione a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso\n');

    // Conta recensioni
    const totalReviews = await Review.countDocuments();
    console.log('📊 Totale recensioni nel database:', totalReviews);

    if (totalReviews > 0) {
      const reviews = await Review.find()
        .populate('user', 'name email')
        .populate('product', 'name')
        .limit(5)
        .sort({ createdAt: -1 });
      
      console.log('\n📝 Ultime 5 recensioni:');
      reviews.forEach((r, i) => {
        console.log(`\n${i + 1}. Prodotto: ${r.product?.name || 'N/A'}`);
        console.log(`   Utente: ${r.user?.name || 'N/A'} (${r.user?.email || 'N/A'})`);
        console.log(`   Rating: ${r.rating}/5`);
        console.log(`   Commento: ${r.comment?.substring(0, 50)}...`);
        console.log(`   Data: ${r.createdAt}`);
      });
    }

    // Conta ordini completati
    const completedOrders = await Order.countDocuments({ 
      $or: [
        { status: 'completed' },
        { status: 'delivered' }
      ]
    });
    console.log(`\n📦 Ordini completati/consegnati: ${completedOrders}`);

    // Controlla se ci sono ordini senza recensioni
    const ordersWithoutReviews = await Order.find({
      $or: [
        { status: 'completed' },
        { status: 'delivered' }
      ]
    }).limit(3).lean();

    console.log(`\n🔍 Campione ordini completati (prime 3):`);
    for (const order of ordersWithoutReviews) {
      console.log(`\nOrdine ID: ${order._id}`);
      console.log(`Status: ${order.status}`);
      console.log(`Buyer: ${order.buyer}`);
      console.log(`Items: ${order.items?.length || 0}`);
      
      // Verifica se esistono recensioni per i prodotti di questo ordine
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          const reviewExists = await Review.findOne({
            product: item.product,
            user: order.buyer
          });
          console.log(`  - Prodotto ${item.productName}: ${reviewExists ? '✅ Recensione presente' : '❌ Nessuna recensione'}`);
        }
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnesso');
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
}

checkReviews();
