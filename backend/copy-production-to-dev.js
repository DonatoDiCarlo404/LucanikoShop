import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

const PRODUCTION_URI = 'mongodb+srv://lucanikofood_db_user:m5Qvi9N2DsTHCgF3GZoY6zMuyr0SVEP4@lucanikoshop-production.vocyyy.mongodb.net/lucanikoshop?retryWrites=true&w=majority';
const DEVELOPMENT_URI = process.env.MONGODB_URI;

// Collezioni da copiare (tutte quelle principali)
const COLLECTIONS = [
  'users',
  'products',
  'categories',
  'categoryattributes',
  'orders',
  'reviews',
  'discounts',
  'sponsors',
  'adminnews',
  'notifications',
  'cookieconsents',
  'wishlists'
];

async function copyDatabase() {
  let prodConnection, devConnection;
  
  try {
    console.log('🔗 Connessione al database di PRODUZIONE...');
    prodConnection = await mongoose.createConnection(PRODUCTION_URI).asPromise();
    console.log('✅ Connesso a PRODUCTION\n');

    console.log('🔗 Connessione al database di SVILUPPO...');
    devConnection = await mongoose.createConnection(DEVELOPMENT_URI).asPromise();
    console.log('✅ Connesso a DEVELOPMENT\n');

    console.log('📊 Inizio copia collezioni...\n');

    for (const collectionName of COLLECTIONS) {
      try {
        // Verifica se la collezione esiste in produzione
        const collections = await prodConnection.db.listCollections({ name: collectionName }).toArray();
        
        if (collections.length === 0) {
          console.log(`⏭️  ${collectionName}: non esiste in produzione, skip`);
          continue;
        }

        const prodCollection = prodConnection.db.collection(collectionName);
        const devCollection = devConnection.db.collection(collectionName);

        // Conta documenti in produzione
        const count = await prodCollection.countDocuments();
        
        if (count === 0) {
          console.log(`⏭️  ${collectionName}: vuota, skip`);
          continue;
        }

        console.log(`📦 Copiando ${collectionName}: ${count} documenti...`);

        // Copia tutti i documenti
        const documents = await prodCollection.find({}).toArray();
        
        if (documents.length > 0) {
          // Svuota la collezione di sviluppo prima di copiare
          await devCollection.deleteMany({});
          
          // Inserisci tutti i documenti
          await devCollection.insertMany(documents, { ordered: false });
          
          console.log(`✅ ${collectionName}: ${documents.length} documenti copiati\n`);
        }
      } catch (error) {
        console.error(`❌ Errore copiando ${collectionName}:`, error.message);
      }
    }

    console.log('\n🎉 Copia completata con successo!');
    console.log('\n📊 Verifica del database di sviluppo:');
    
    // Verifica finale
    for (const collectionName of COLLECTIONS) {
      try {
        const collections = await devConnection.db.listCollections({ name: collectionName }).toArray();
        if (collections.length > 0) {
          const count = await devConnection.db.collection(collectionName).countDocuments();
          if (count > 0) {
            console.log(`   ✅ ${collectionName}: ${count} documenti`);
          }
        }
      } catch (error) {
        // Ignora errori nella verifica
      }
    }

  } catch (error) {
    console.error('❌ Errore durante la copia:', error);
    process.exit(1);
  } finally {
    if (prodConnection) await prodConnection.close();
    if (devConnection) await devConnection.close();
    process.exit(0);
  }
}

copyDatabase();
