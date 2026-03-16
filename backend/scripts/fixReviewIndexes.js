import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Review from '../models/Review.js';

dotenv.config();

const fixReviewIndexes = async () => {
  try {
    console.log('🔄 Connessione al database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database MongoDB\n');

    // Ottieni la collection Review
    const reviewCollection = mongoose.connection.collection('reviews');

    // Lista tutti gli indici
    console.log('📋 Indici esistenti:');
    const indexes = await reviewCollection.indexes();
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}:`, idx.key, idx.unique ? '(unique)' : '', idx.partialFilterExpression ? `(partial: ${JSON.stringify(idx.partialFilterExpression)})` : '');
    });

    // Rimuovi l'indice problematico product_1_user_1 se esiste
    try {
      console.log('\n🗑️  Rimozione indice product_1_user_1...');
      await reviewCollection.dropIndex('product_1_user_1');
      console.log('✅ Indice product_1_user_1 rimosso');
    } catch (err) {
      if (err.code === 27) {
        console.log('ℹ️  Indice product_1_user_1 non esistente (già rimosso)');
      } else {
        console.error('❌ Errore rimozione indice:', err.message);
      }
    }

    // Crea nuovi indici corretti
    console.log('\n✨ Creazione nuovi indici...');
    
    // Indice unique solo per recensioni con user definito (utenti registrati)
    await reviewCollection.createIndex(
      { product: 1, user: 1 },
      { 
        name: 'product_user_unique_registered',
        unique: true,
        partialFilterExpression: { user: { $exists: true, $type: 'objectId' } }
      }
    );
    console.log('✅ Indice product_user_unique_registered creato');

    // Indice unique per recensioni guest (usa guestOrderId)
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
    console.log('✅ Indice product_guestOrder_unique creato');

    // Mostra indici finali
    console.log('\n📋 Indici finali:');
    const finalIndexes = await reviewCollection.indexes();
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}:`, idx.key, idx.unique ? '(unique)' : '', idx.sparse ? '(sparse)' : '');
    });

    console.log('\n✅ Fix indici completato!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

fixReviewIndexes();
