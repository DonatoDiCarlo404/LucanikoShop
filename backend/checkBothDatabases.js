import mongoose from 'mongoose';
import Category from './models/Category.js';

/**
 * Script per verificare le sottocategorie su entrambi i database
 */

const checkBothDatabases = async () => {
  const DEV_URI = 'mongodb+srv://lucanikofood_db_user:m5Qvi9N2DsTHCgF3GZoY6zMuyr0SVEP4@lucanikoshop-developmen.kvj8tge.mongodb.net/lucanikoshop-dev?retryWrites=true&w=majority&appName=lucanikoshop-development';
  const PROD_URI = 'mongodb+srv://lucanikofood_db_user:m5Qvi9N2DsTHCgF3GZoY6zMuyr0SVEP4@lucanikoshop-production.vocyyy.mongodb.net/lucanikoshop?retryWrites=true&w=majority&appName=lucanikoshop-production';

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
