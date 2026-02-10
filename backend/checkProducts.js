import mongoose from 'mongoose';
import Product from './models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

const checkProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database MongoDB');

    const products = await Product.find({});
    console.log(`\n📦 Totale prodotti nel database: ${products.length}`);

    if (products.length > 0) {
      console.log('\n🔍 Primi 3 prodotti:');
      products.slice(0, 3).forEach(p => {
        console.log(`- ${p.name} | Category ID: ${p.category} | Subcategory ID: ${p.subcategory}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

checkProducts();
