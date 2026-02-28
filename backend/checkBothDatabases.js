import mongoose from 'mongoose';
import Category from './models/Category.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Script per verificare le sottocategorie su entrambi i database
 */

const checkBothDatabases = async () => {
  const DEV_URI = process.env.MONGODB_URI_DEV;
  const PROD_URI = process.env.MONGODB_URI_PROD;

  if (!DEV_URI || !PROD_URI) {
    console.error('❌ Errore: MONGODB_URI_DEV e MONGODB_URI_PROD devono essere definiti nel file .env');
    process.exit(1);
  }

  try {
    // Check DEVELOPMENT
    console.log('🔧 Controllo DATABASE DI SVILUPPO...\n');
    await mongoose.connect(DEV_URI);
    
    const devParent = await Category.findOne({ name: 'Casa, Arredi e Ufficio', parent: null });
    const devSubs = await Category.find({ parent: devParent._id }).select('name').sort('name');
    
    console.log(`📁 Casa, Arredi e Ufficio - SVILUPPO (${devSubs.length} sottocategorie):`);
    devSubs.forEach(sub => console.log(`   - ${sub.name}`));
    
    await mongoose.disconnect();
    
    // Check PRODUCTION
    console.log('\n🚀 Controllo DATABASE DI PRODUZIONE...\n');
    await mongoose.connect(PROD_URI);
    
    const prodParent = await Category.findOne({ name: 'Casa, Arredi e Ufficio', parent: null });
    const prodSubs = await Category.find({ parent: prodParent._id }).select('name').sort('name');
    
    console.log(`📁 Casa, Arredi e Ufficio - PRODUZIONE (${prodSubs.length} sottocategorie):`);
    prodSubs.forEach(sub => console.log(`   - ${sub.name}`));
    
    // Confronto
    console.log('\n📊 CONFRONTO:');
    console.log(`   Sviluppo: ${devSubs.length} sottocategorie`);
    console.log(`   Produzione: ${prodSubs.length} sottocategorie`);
    
    if (devSubs.length === prodSubs.length) {
      console.log('\n✅ I database hanno lo stesso numero di sottocategorie!');
    } else {
      console.log('\n⚠️  ATTENZIONE: Differenza nel numero di sottocategorie!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

checkBothDatabases();
