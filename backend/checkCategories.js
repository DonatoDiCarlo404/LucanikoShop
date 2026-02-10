import mongoose from 'mongoose';
import Category from './models/Category.js';
import dotenv from 'dotenv';

dotenv.config();

const checkCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database MongoDB');

    const cibiCategory = await Category.findOne({ name: 'Cibi e Bevande', parent: null });
    console.log(`\n📁 Categoria "Cibi e Bevande": ${cibiCategory._id}`);

    const subcategories = await Category.find({ parent: cibiCategory._id });
    console.log(`\n📂 Sottocategorie (${subcategories.length}):`);
    subcategories.forEach(sub => {
      console.log(`  - ${sub.name}: ${sub._id}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

checkCategories();
