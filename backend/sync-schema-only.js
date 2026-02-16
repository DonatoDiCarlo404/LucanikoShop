import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

const PRODUCTION_URI = process.env.MONGODB_URI_PROD;
const DEVELOPMENT_URI = process.env.MONGODB_URI;

if (!PRODUCTION_URI) {
  console.error('❌ ERRORE: MONGODB_URI_PROD non trovato nelle variabili d\'ambiente');
  console.log('Aggiungi MONGODB_URI_PROD nel file .env con la stringa di connessione di produzione');
  process.exit(1);
}

// Solo le collezioni di configurazione/struttura, NON i dati utente
const SCHEMA_COLLECTIONS = [
  'categories',
  'categoryattributes'
];

async function syncSchema() {
  let prodConnection, devConnection;
  
  try {
    console.log('🔧 Sincronizzazione SOLO dello schema (categorie e attributi)...\n');
    console.log('⚠️  Questo NON copia utenti, prodotti, ordini, ecc.\n');

    console.log('🔗 Connessione a PRODUCTION...');
    prodConnection = await mongoose.createConnection(PRODUCTION_URI).asPromise();
    console.log('✅ Connesso a PRODUCTION\n');

    console.log('🔗 Connessione a DEVELOPMENT...');
    devConnection = await mongoose.createConnection(DEVELOPMENT_URI).asPromise();
    console.log('✅ Connesso a DEVELOPMENT\n');

    const direction = process.argv[2] === 'to-dev' ? 'PROD → DEV' : 'DEV → PROD';
    console.log(`📊 Direzione: ${direction}\n`);

    const [sourceConnection, targetConnection] = process.argv[2] === 'to-dev' 
      ? [prodConnection, devConnection]
      : [devConnection, prodConnection];

    for (const collectionName of SCHEMA_COLLECTIONS) {
      try {
        const collections = await sourceConnection.db.listCollections({ name: collectionName }).toArray();
        
        if (collections.length === 0) {
          console.log(`⏭️  ${collectionName}: non esiste nel database sorgente, skip`);
          continue;
        }

        const sourceCollection = sourceConnection.db.collection(collectionName);
        const targetCollection = targetConnection.db.collection(collectionName);

        const count = await sourceCollection.countDocuments();
        
        if (count === 0) {
          console.log(`⏭️  ${collectionName}: vuota, skip`);
          continue;
        }

        console.log(`📦 Sincronizzando ${collectionName}: ${count} documenti...`);

        const documents = await sourceCollection.find({}).toArray();
        
        if (documents.length > 0) {
          await targetCollection.deleteMany({});
          await targetCollection.insertMany(documents, { ordered: false });
          console.log(`✅ ${collectionName}: ${documents.length} documenti sincronizzati\n`);
        }
      } catch (error) {
        console.error(`❌ Errore sincronizzando ${collectionName}:`, error.message);
      }
    }

    console.log('\n🎉 Sincronizzazione schema completata!');

  } catch (error) {
    console.error('❌ Errore durante la sincronizzazione:', error);
    process.exit(1);
  } finally {
    if (prodConnection) await prodConnection.close();
    if (devConnection) await devConnection.close();
    process.exit(0);
  }
}

// Validazione argomenti
if (!process.argv[2] || !['to-dev', 'to-prod'].includes(process.argv[2])) {
  console.log('❌ Uso: node sync-schema-only.js [to-dev|to-prod]');
  console.log('   - to-dev: copia schema da PROD → DEV');
  console.log('   - to-prod: copia schema da DEV → PROD\n');
  process.exit(1);
}

syncSchema();
