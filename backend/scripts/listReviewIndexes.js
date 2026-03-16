import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const listIndexes = async () => {
  try {
    console.log('🔄 Connessione al database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database MongoDB\n');

    const reviewCollection = mongoose.connection.collection('reviews');

    console.log('📋 Indici Reviews Collection:\n');
    const indexes = await reviewCollection.indexes();
    
    indexes.forEach((idx, i) => {
      console.log(`${i + 1}. ${idx.name}`);
      console.log(`   Key: ${JSON.stringify(idx.key)}`);
      if (idx.unique) console.log(`   Unique: true`);
      if (idx.partialFilterExpression) {
        console.log(`   Partial: ${JSON.stringify(idx.partialFilterExpression)}`);
      }
      console.log('');
    });

    console.log(`Totale indici: ${indexes.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

listIndexes();
