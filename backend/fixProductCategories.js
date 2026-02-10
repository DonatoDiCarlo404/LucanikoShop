import mongoose from 'mongoose';
import Product from './models/Product.js';
import Category from './models/Category.js';
import dotenv from 'dotenv';

dotenv.config();

const fixProductCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database MongoDB');

    // Prendi tutti i prodotti
    const products = await Product.find({});
    console.log(`📦 Trovati ${products.length} prodotti da verificare`);

    let fixed = 0;
    let skipped = 0;

    for (const product of products) {
      // Verifica se le categorie esistono già con gli ObjectId corretti
      const categoryExists = await Category.findById(product.category);
      const subcategoryExists = product.subcategory ? await Category.findById(product.subcategory) : true;

      if (categoryExists && subcategoryExists) {
        skipped++;
        continue; // Prodotto già corretto
      }

      // Trova le categorie corrette per nome (fallback)
      let categoryUpdated = false;
      
      // Se manca la categoria principale
      if (!categoryExists && product.category) {
        const oldCategory = await Category.findOne({ _id: product.category }).lean();
        if (oldCategory) {
          const newCategory = await Category.findOne({ name: oldCategory.name, parent: null });
          if (newCategory) {
            product.category = newCategory._id;
            categoryUpdated = true;
          }
        }
      }

      // Se manca la sottocategoria
      if (!subcategoryExists && product.subcategory) {
        const oldSubcategory = await Category.findOne({ _id: product.subcategory }).lean();
        if (oldSubcategory) {
          const newSubcategory = await Category.findOne({ 
            name: oldSubcategory.name, 
            parent: { $ne: null } 
          });
          if (newSubcategory) {
            product.subcategory = newSubcategory._id;
            categoryUpdated = true;
          }
        }
      }

      if (categoryUpdated) {
        await product.save();
        fixed++;
        console.log(`✅ Aggiornato prodotto: ${product.name}`);
      }
    }

    console.log('\n🎉 Operazione completata!');
    console.log(`✅ Prodotti aggiornati: ${fixed}`);
    console.log(`⏭️  Prodotti già corretti: ${skipped}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

fixProductCategories();
