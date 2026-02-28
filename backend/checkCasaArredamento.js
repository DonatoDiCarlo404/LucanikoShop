import mongoose from 'mongoose';
import Category from './models/Category.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script per verificare le sottocategorie di "Casa, Arredi e Ufficio"
 */

const checkCasaArredamento = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database MongoDB\n');

    const parentCategory = await Category.findOne({ 
      name: 'Casa, Arredi e Ufficio',
      parent: null 
    });

    if (!parentCategory) {
      console.error('❌ Categoria "Casa, Arredi e Ufficio" non trovata');
      process.exit(1);
    }

    console.log(`📁 Categoria "Casa, Arredi e Ufficio": ${parentCategory._id}\n`);

    const subcategories = await Category.find({ 
      parent: parentCategory._id 
    }).select('name _id').sort('name');

    console.log(`📂 Sottocategorie (${subcategories.length}):`);
    subcategories.forEach(sub => {
      console.log(`  - ${sub.name}: ${sub._id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

checkCasaArredamento();
