import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function checkDatabase() {
  try {
    console.log('\n🔍 VERIFICA DATABASE\n');
    console.log('📍 Connection String:', process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@'));
    console.log('📊 Database Name:', process.env.MONGODB_URI.split('/').pop().split('?')[0]);
    
    // Connessione
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('\n✅ Connesso a MongoDB\n');

    // Lista tutte le collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Collections trovate:', collections.length);
    
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`  - ${collection.name}: ${count} documenti`);
    }

    // Verifica specifica per User con l'ID dal token
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
    const specificUser = await User.findById('698754e3e584c04ebda2da7e');
    
    console.log('\n🔍 Ricerca utente specifico (ID dal token):');
    console.log(`  ID: 698754e3e584c04ebda2da7e`);
    console.log(`  Trovato: ${specificUser ? '✅ SI' : '❌ NO'}`);
    
    if (specificUser) {
      console.log(`  Email: ${specificUser.email}`);
      console.log(`  Nome: ${specificUser.name}`);
    }

    // Lista primi 5 utenti per vedere cosa c'è
    const allUsers = await User.find().limit(5).select('email name role');
    console.log('\n👥 Primi 5 utenti nel database:');
    if (allUsers.length === 0) {
      console.log('  ❌ NESSUN UTENTE TROVATO!');
    } else {
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.role}) - ID: ${u._id}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Verifica completata\n');

  } catch (error) {
    console.error('\n❌ ERRORE:', error.message);
    process.exit(1);
  }
}

checkDatabase();
