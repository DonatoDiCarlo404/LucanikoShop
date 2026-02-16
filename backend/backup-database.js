import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Scegli quale database fare backup
const DB_URI = process.argv[2] === 'prod' 
  ? process.env.MONGODB_URI_PROD
  : process.env.MONGODB_URI;

const DB_NAME = process.argv[2] === 'prod' ? 'PRODUCTION' : 'DEVELOPMENT';

if (!DB_URI) {
  console.error('❌ ERRORE: Variabile d\'ambiente MongoDB non trovata');
  console.log('Aggiungi MONGODB_URI (dev) e MONGODB_URI_PROD (prod) nel file .env');
  process.exit(1);
}

// Collezioni da backuppare
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

async function backupDatabase() {
  let connection;
  
  try {
    console.log(`📦 Inizio backup del database ${DB_NAME}...\n`);

    console.log('🔗 Connessione al database...');
    connection = await mongoose.createConnection(DB_URI).asPromise();
    console.log('✅ Connesso\n');

    // Crea cartella backup con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                      new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const backupDir = path.join(__dirname, 'mongodb_backup', `${DB_NAME.toLowerCase()}_${timestamp}`);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log(`📁 Backup in: ${backupDir}\n`);

    let totalDocs = 0;

    for (const collectionName of COLLECTIONS) {
      try {
        // Verifica se la collezione esiste
        const collections = await connection.db.listCollections({ name: collectionName }).toArray();
        
        if (collections.length === 0) {
          console.log(`⏭️  ${collectionName}: non esiste, skip`);
          continue;
        }

        const collection = connection.db.collection(collectionName);
        const count = await collection.countDocuments();
        
        if (count === 0) {
          console.log(`⏭️  ${collectionName}: vuota, skip`);
          continue;
        }

        console.log(`💾 Backup ${collectionName}: ${count} documenti...`);

        // Esporta tutti i documenti
        const documents = await collection.find({}).toArray();
        
        const filePath = path.join(backupDir, `${collectionName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
        
        totalDocs += documents.length;
        console.log(`✅ ${collectionName}: salvato in ${collectionName}.json\n`);
        
      } catch (error) {
        console.error(`❌ Errore backup ${collectionName}:`, error.message);
      }
    }

    // Salva metadata
    const metadata = {
      database: DB_NAME,
      timestamp: new Date().toISOString(),
      totalDocuments: totalDocs,
      collections: COLLECTIONS
    };
    
    fs.writeFileSync(
      path.join(backupDir, '_metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    console.log('\n🎉 Backup completato con successo!');
    console.log(`📊 Totale documenti salvati: ${totalDocs}`);
    console.log(`📁 Percorso: ${backupDir}\n`);

  } catch (error) {
    console.error('❌ Errore durante il backup:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.close();
    process.exit(0);
  }
}

// Validazione argomenti
if (process.argv[2] && !['dev', 'prod'].includes(process.argv[2])) {
  console.log('❌ Uso: node backup-database.js [dev|prod]');
  console.log('   - Senza argomenti: backup del database di sviluppo');
  console.log('   - dev: backup del database di sviluppo');
  console.log('   - prod: backup del database di produzione\n');
  process.exit(1);
}

console.log(`\n🚀 Backup database: ${DB_NAME}\n`);
backupDatabase();
