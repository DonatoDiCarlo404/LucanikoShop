import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import readline from 'readline';

const PRODUCTION_URI = process.env.MONGODB_URI_PROD;
const DEVELOPMENT_URI = process.env.MONGODB_URI;

if (!PRODUCTION_URI) {
  console.error('❌ ERRORE: MONGODB_URI_PROD non trovato nelle variabili d\'ambiente');
  console.log('Aggiungi MONGODB_URI_PROD nel file .env con la stringa di connessione di produzione');
  process.exit(1);
}

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

// Prompt per conferma
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'si' || answer.toLowerCase() === 's' || answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function copyDatabase() {
  let prodConnection, devConnection;
  
  try {
    console.log('\n⚠️  ATTENZIONE: STAI PER COPIARE DA DEVELOPMENT A PRODUCTION ⚠️\n');
    console.log('Questa operazione:');
    console.log('  - CANCELLERÀ tutti i dati di produzione');
    console.log('  - Li sostituirà con i dati di sviluppo');
    console.log('  - È IRREVERSIBILE senza un backup\n');
    
    const confirmed = await askConfirmation('Sei ASSOLUTAMENTE SICURO di voler continuare? (digita "si" per confermare): ');
    
    if (!confirmed) {
      console.log('\n❌ Operazione annullata dall\'utente');
      process.exit(0);
    }

    console.log('\n🔗 Connessione al database di SVILUPPO...');
    devConnection = await mongoose.createConnection(DEVELOPMENT_URI).asPromise();
    console.log('✅ Connesso a DEVELOPMENT\n');

    console.log('🔗 Connessione al database di PRODUZIONE...');
    prodConnection = await mongoose.createConnection(PRODUCTION_URI).asPromise();
    console.log('✅ Connesso a PRODUCTION\n');

    console.log('📊 Inizio copia collezioni da DEV a PROD...\n');

    for (const collectionName of COLLECTIONS) {
      try {
        // Verifica se la collezione esiste in sviluppo
        const collections = await devConnection.db.listCollections({ name: collectionName }).toArray();
        
        if (collections.length === 0) {
          console.log(`⏭️  ${collectionName}: non esiste in sviluppo, skip`);
          continue;
        }

        const devCollection = devConnection.db.collection(collectionName);
        const prodCollection = prodConnection.db.collection(collectionName);

        // Conta documenti in sviluppo
        const count = await devCollection.countDocuments();
        
        if (count === 0) {
          console.log(`⏭️  ${collectionName}: vuota, skip`);
          continue;
        }

        console.log(`📦 Copiando ${collectionName}: ${count} documenti...`);

        // Copia tutti i documenti
        const documents = await devCollection.find({}).toArray();
        
        if (documents.length > 0) {
          // Svuota la collezione di produzione prima di copiare
          await prodCollection.deleteMany({});
          
          // Inserisci tutti i documenti
          await prodCollection.insertMany(documents, { ordered: false });
          
          console.log(`✅ ${collectionName}: ${documents.length} documenti copiati\n`);
        }
      } catch (error) {
        console.error(`❌ Errore copiando ${collectionName}:`, error.message);
      }
    }

    console.log('\n🎉 Copia completata con successo!');
    console.log('\n📊 Verifica del database di produzione:');
    
    // Verifica finale
    for (const collectionName of COLLECTIONS) {
      try {
        const collections = await prodConnection.db.listCollections({ name: collectionName }).toArray();
        if (collections.length > 0) {
          const count = await prodConnection.db.collection(collectionName).countDocuments();
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
