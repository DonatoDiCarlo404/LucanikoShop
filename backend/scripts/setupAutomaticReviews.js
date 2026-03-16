import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

dotenv.config();

/**
 * Script completo per setup recensioni automatiche in produzione
 * Esegue in sequenza:
 * 1. Fix indici MongoDB
 * 2. Creazione recensioni automatiche per ordini esistenti
 * 3. Aggiornamento rating prodotti
 */

const setupAutomaticReviews = async () => {
  try {
    console.log('🚀 SETUP RECENSIONI AUTOMATICHE IN PRODUZIONE');
    console.log('='.repeat(80));
    console.log(`📅 Data: ${new Date().toLocaleString()}`);
    console.log(`🔗 Database: ${process.env.MONGODB_URI ? 'CONFIGURATO' : '❌ NON CONFIGURATO'}`);
    console.log('='.repeat(80));
    console.log('');

    // STEP 1: Connessione
    console.log('📡 STEP 1: Connessione al database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database MongoDB\n');

    const reviewCollection = mongoose.connection.collection('reviews');

    // STEP 2: Fix Indici
    console.log('🔧 STEP 2: Fix indici MongoDB...');
    console.log('─'.repeat(80));
    
    // Lista indici esistenti
    const existingIndexes = await reviewCollection.indexes();
    console.log('📋 Indici attuali:');
    existingIndexes.forEach(idx => {
      console.log(`  - ${idx.name}`);
    });
    console.log('');

    // Rimuovi indice problematico se esiste
    const hasOldIndex = existingIndexes.some(idx => idx.name === 'product_1_user_1');
    if (hasOldIndex) {
      try {
        console.log('🗑️  Rimozione indice vecchio product_1_user_1...');
        await reviewCollection.dropIndex('product_1_user_1');
        console.log('✅ Indice product_1_user_1 rimosso\n');
      } catch (err) {
        console.log('⚠️  Errore rimozione indice:', err.message, '\n');
      }
    } else {
      console.log('✅ Indice product_1_user_1 già rimosso o non presente\n');
    }

    // Verifica indici corretti
    const hasCorrectIndexes = existingIndexes.some(idx => idx.name === 'product_user_unique_registered') &&
                              existingIndexes.some(idx => idx.name === 'product_guestOrder_unique');
    
    if (!hasCorrectIndexes) {
      console.log('✨ Creazione indici corretti...');
      
      try {
        await reviewCollection.createIndex(
          { product: 1, user: 1 },
          { 
            name: 'product_user_unique_registered',
            unique: true,
            partialFilterExpression: { user: { $exists: true, $type: 'objectId' } }
          }
        );
        console.log('✅ Indice product_user_unique_registered creato');
      } catch (e) {
        console.log('ℹ️  Indice product_user_unique_registered già esistente');
      }

      try {
        await reviewCollection.createIndex(
          { product: 1, guestOrderId: 1 },
          {
            name: 'product_guestOrder_unique',
            unique: true,
            partialFilterExpression: {
              isAutomatic: true,
              guestOrderId: { $exists: true, $type: 'objectId' }
            }
          }
        );
        console.log('✅ Indice product_guestOrder_unique creato\n');
      } catch (e) {
        console.log('ℹ️  Indice product_guestOrder_unique già esistente\n');
      }
    } else {
      console.log('✅ Indici corretti già presenti\n');
    }

    // STEP 3: Creazione Recensioni Automatiche
    console.log('⭐ STEP 3: Creazione recensioni automatiche...');
    console.log('─'.repeat(80));
    
    const guestOrders = await Order.find({
      isGuestOrder: true,
      isPaid: true
    }).sort({ createdAt: -1 });

    console.log(`📦 Ordini guest pagati trovati: ${guestOrders.length}\n`);

    let totalCreated = 0;
    let totalExisting = 0;

    for (const order of guestOrders) {
      console.log(`Ordine ${order._id} (${order.guestEmail}):`);
      
      for (const item of order.items) {
        const existingReview = await Review.findOne({
          product: item.product,
          guestOrderId: order._id,
          isAutomatic: true
        });

        if (!existingReview) {
          try {
            await Review.create({
              product: item.product,
              rating: 5,
              comment: 'Recensione automatica da acquisto verificato',
              isVerified: true,
              isAutomatic: true,
              guestOrderId: order._id,
              helpful: 0
            });
            console.log(`  ✅ ${item.name}`);
            totalCreated++;
          } catch (err) {
            console.log(`  ❌ ${item.name}: ${err.message}`);
          }
        } else {
          console.log(`  ℹ️  ${item.name} (già esistente)`);
          totalExisting++;
        }
      }
      console.log('');
    }

    console.log('📊 Riepilogo creazione:');
    console.log(`  - Nuove recensioni: ${totalCreated}`);
    console.log(`  - Già esistenti: ${totalExisting}`);
    console.log(`  - Totale: ${totalCreated + totalExisting}\n`);

    // STEP 4: Aggiornamento Rating Prodotti
    console.log('📈 STEP 4: Aggiornamento rating prodotti...');
    console.log('─'.repeat(80));

    const allReviews = await Review.find();
    const productIds = [...new Set(allReviews.map(r => r.product?.toString()).filter(Boolean))];

    console.log(`🎯 Prodotti da aggiornare: ${productIds.length}\n`);

    let updatedCount = 0;

    for (const productId of productIds) {
      const product = await Product.findById(productId);
      if (!product) {
        console.log(`⚠️  Prodotto ${productId} non trovato - SKIP`);
        continue;
      }

      const productReviews = allReviews.filter(r => r.product?.toString() === productId);
      const numReviews = productReviews.length;
      const avgRating = numReviews > 0 
        ? productReviews.reduce((acc, r) => acc + r.rating, 0) / numReviews 
        : 0;

      if (product.numReviews !== numReviews || Math.abs(product.rating - avgRating) > 0.01) {
        const oldRating = product.rating || 0;
        const oldNumReviews = product.numReviews || 0;

        product.rating = avgRating;
        product.numReviews = numReviews;
        await product.save();

        console.log(`✅ ${product.name}`);
        console.log(`   ${oldNumReviews} → ${numReviews} recensioni | Rating: ${oldRating.toFixed(1)} → ${avgRating.toFixed(1)}`);

        updatedCount++;
      }
    }

    console.log(`\n📊 Prodotti aggiornati: ${updatedCount}/${productIds.length}\n`);

    // STEP 5: Riepilogo Finale
    console.log('✅ SETUP COMPLETATO!');
    console.log('='.repeat(80));
    
    const stats = await Review.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          automatic: {
            $sum: { $cond: [{ $eq: ['$isAutomatic', true] }, 1, 0] }
          },
          manual: {
            $sum: { $cond: [{ $eq: ['$isAutomatic', false] }, 1, 0] }
          },
          verified: {
            $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] }
          }
        }
      }
    ]);

    if (stats.length > 0) {
      const s = stats[0];
      console.log('📊 STATISTICHE FINALI:');
      console.log(`  - Recensioni totali: ${s.total}`);
      console.log(`  - Automatiche (guest): ${s.automatic}`);
      console.log(`  - Manuali (registrati): ${s.manual}`);
      console.log(`  - Verificate: ${s.verified}`);
    }

    console.log('='.repeat(80));
    console.log('');
    console.log('🎉 Tutte le recensioni automatiche sono ora attive in produzione!');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERRORE DURANTE IL SETUP:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

setupAutomaticReviews();
