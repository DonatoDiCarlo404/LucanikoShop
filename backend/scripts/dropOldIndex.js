import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dropOldIndex = async () => {
  try {
    console.log('🔄 Connessione al database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database MongoDB\n');

    const reviewCollection = mongoose.connection.collection('reviews');

    // Elimina l'indice vecchio
    try {
      console.log('🗑️  Eliminazione indice product_1_user_1...');
      await reviewCollection.dropIndex('product_1_user_1');
      console.log('✅ Indice product_1_user_1 eliminato con successo\n');
    } catch (err) {
      console.log('❌ Errore:', err.message, '\n');
    }

    // Mostra indici rimanenti
    console.log('📋 Indici rimanenti:');
    const indexes = await reviewCollection.indexes();
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}`, idx.unique ? '(unique)' : '');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

dropOldIndex();
