import mongoose from 'mongoose';
import Category from './models/Category.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script sicuro per aggiungere una nuova sottocategoria senza intaccare le esistenti
 * Uso: node addSubcategory.js "Nome Macrocategoria" "Nome Sottocategoria"
 */

const addSubcategory = async () => {
  try {
    const parentCategoryName = process.argv[2];
    const subcategoryName = process.argv[3];

    if (!parentCategoryName || !subcategoryName) {
      console.error('❌ Errore: Specificare sia la macrocategoria che la sottocategoria');
      console.log('Uso: node addSubcategory.js "Nome Macrocategoria" "Nome Sottocategoria"');
      console.log('Esempio: node addSubcategory.js "Casa, Arredi e Ufficio" "Bricolage"');
      process.exit(1);
    }

    // Connessione al database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database MongoDB');

    // Trova la macrocategoria
    const parentCategory = await Category.findOne({ 
      name: parentCategoryName,
      parent: null 
    });

    if (!parentCategory) {
      console.error(`❌ Macrocategoria "${parentCategoryName}" non trovata`);
      console.log('\n📁 Macrocategorie disponibili:');
      const allParents = await Category.find({ parent: null }).select('name');
      allParents.forEach(cat => console.log(`   - ${cat.name}`));
      process.exit(1);
    }

    // Verifica se la sottocategoria esiste già
    const existingSubcategory = await Category.findOne({
      name: subcategoryName,
      parent: parentCategory._id
    });

    if (existingSubcategory) {
      console.log(`⚠️  La sottocategoria "${subcategoryName}" esiste già sotto "${parentCategoryName}"`);
      process.exit(0);
    }

    // Crea la nuova sottocategoria
    const newSubcategory = await Category.create({
      name: subcategoryName,
      parent: parentCategory._id
    });

    console.log(`✅ Sottocategoria "${subcategoryName}" aggiunta con successo!`);
    console.log(`📁 Macrocategoria: ${parentCategoryName}`);
    console.log(`🆔 ID: ${newSubcategory._id}`);

    // Mostra tutte le sottocategorie della macrocategoria
    const allSubcategories = await Category.find({ 
      parent: parentCategory._id 
    }).select('name');
    
    console.log(`\n📂 Tutte le sottocategorie di "${parentCategoryName}" (${allSubcategories.length}):`);
    allSubcategories.forEach(sub => console.log(`   - ${sub.name}`));

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante l\'aggiunta della sottocategoria:', error);
    process.exit(1);
  }
};

addSubcategory();
