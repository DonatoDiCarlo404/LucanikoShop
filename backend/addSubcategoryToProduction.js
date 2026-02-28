import mongoose from 'mongoose';
import Category from './models/Category.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script per aggiungere una sottocategoria SOLO al database di PRODUZIONE
 * ATTENZIONE: Questo script usa il database di PRODUZIONE!
 */

const addSubcategoryToProduction = async () => {
  try {
    // URI del database di PRODUZIONE (hardcoded per sicurezza)
    const PRODUCTION_URI = 'mongodb+srv://lucanikofood_db_user:m5Qvi9N2DsTHCgF3GZoY6zMuyr0SVEP4@lucanikoshop-production.vocyyy.mongodb.net/lucanikoshop?retryWrites=true&w=majority&appName=lucanikoshop-production';

    console.log('🚨 ATTENZIONE: Sto per modificare il DATABASE DI PRODUZIONE!');
    console.log('📡 Connessione in corso...\n');

    // Connessione al database di PRODUZIONE
    await mongoose.connect(PRODUCTION_URI);
    console.log('✅ Connesso al database MongoDB di PRODUZIONE\n');

    // Trova la macrocategoria "Casa, Arredi e Ufficio"
    const parentCategory = await Category.findOne({ 
      name: 'Casa, Arredi e Ufficio',
      parent: null 
    });

    if (!parentCategory) {
      console.error('❌ Macrocategoria "Casa, Arredi e Ufficio" non trovata in produzione');
      process.exit(1);
    }

    console.log(`📁 Trovata macrocategoria: ${parentCategory.name}`);
    console.log(`🆔 ID: ${parentCategory._id}\n`);

    // Verifica se la sottocategoria esiste già
    const existingSubcategory = await Category.findOne({
      name: 'Giardinaggio e outdoor',
      parent: parentCategory._id
    });

    if (existingSubcategory) {
      console.log('⚠️  La sottocategoria "Giardinaggio e outdoor" esiste già in produzione');
      console.log(`🆔 ID esistente: ${existingSubcategory._id}\n`);
      
      // Mostra tutte le sottocategorie
      const allSubcategories = await Category.find({ 
        parent: parentCategory._id 
      }).select('name').sort('name');
      
      console.log(`📂 Sottocategorie attuali (${allSubcategories.length}):`);
      allSubcategories.forEach(sub => console.log(`   - ${sub.name}`));
      
      process.exit(0);
    }

    // Crea la nuova sottocategoria
    const newSubcategory = await Category.create({
      name: 'Giardinaggio e outdoor',
      parent: parentCategory._id
    });

    console.log('✅ Sottocategoria "Giardinaggio e outdoor" aggiunta con successo in PRODUZIONE!');
    console.log(`🆔 Nuovo ID: ${newSubcategory._id}\n`);

    // Mostra tutte le sottocategorie
    const allSubcategories = await Category.find({ 
      parent: parentCategory._id 
    }).select('name').sort('name');
    
    console.log(`📂 Tutte le sottocategorie di "Casa, Arredi e Ufficio" (${allSubcategories.length}):`);
    allSubcategories.forEach(sub => console.log(`   - ${sub.name}`));

    console.log('\n🎉 Operazione completata con successo sul database di PRODUZIONE!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante l\'operazione:', error);
    process.exit(1);
  }
};

addSubcategoryToProduction();
