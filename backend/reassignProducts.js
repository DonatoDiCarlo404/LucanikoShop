import mongoose from 'mongoose';
import Product from './models/Product.js';
import Category from './models/Category.js';
import dotenv from 'dotenv';

dotenv.config();

const reassignProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database MongoDB');

    // Nuovi ID categorie "Cibi e Bevande"
    const cibiCategory = await Category.findOne({ name: 'Cibi e Bevande', parent: null });
    const subcategories = await Category.find({ parent: cibiCategory._id });
    
    // Mappa sottocategorie per nome
    const subMap = {};
    subcategories.forEach(sub => {
      subMap[sub.name] = sub._id;
    });

    console.log(`\n📁 Categoria principale: ${cibiCategory.name} (${cibiCategory._id})`);
    console.log(`📂 Sottocategorie disponibili: ${Object.keys(subMap).length}`);

    // Pattern per determinare la sottocategoria dal nome prodotto
    const patterns = {
      'Salumi e formaggi': /formaggio|salum|cacioricotta|caciocavallo|pecorino|prosciutto|salsiccia/i,
      'Peperoni cruschi e prodotti tipici': /peperone|crusco|tipico|lucan/i,
      'Pasta, cereali e legumi': /pasta|cereale|legum|farro|orzo|lenticchi|fagioli/i,
      'Conserve e sottoli': /conserv|sottol|sottolio|melanzane|peperonc/i,
      'Olio e condimenti': /olio|condiment|aceto|sal[et]/i,
      'Dolci, biscotti e prodotti da forno': /dolc|biscott|torta|panettone|ciambella|forno/i,
      'Vini, spumanti e birre': /vino|spumante|birra|rosso|bianco|greco|aglianico|primitivo/i,
      'Liquori e distillati': /liquor|amaro|grappa|limoncello|distillat/i,
      'Bevande analcoliche': /succo|bibita|bevanda|acqua|tè|caffè/i,
      'Box': /box|confezione|regalo|cesto/i
    };

    const products = await Product.find({});
    console.log(`\n📦 Trovati ${products.length} prodotti da riassegnare\n`);

    let updated = 0;

    for (const product of products) {
      // Determina la sottocategoria dal nome del prodotto
      let subcategoryId = null;
      let subcategoryName = null;

      for (const [name, pattern] of Object.entries(patterns)) {
        if (pattern.test(product.name) || pattern.test(product.description || '')) {
          subcategoryId = subMap[name];
          subcategoryName = name;
          break;
        }
      }

      // Se non trova match, usa "Salumi e formaggi" come default
      if (!subcategoryId) {
        subcategoryName = 'Salumi e formaggi';
        subcategoryId = subMap[subcategoryName];
      }

      // Aggiorna il prodotto
      product.category = cibiCategory._id;
      product.subcategory = subcategoryId;
      await product.save();

      updated++;
      console.log(`✅ ${updated}. "${product.name}" → ${subcategoryName}`);
    }

    console.log(`\n🎉 Operazione completata!`);
    console.log(`✅ Prodotti riassegnati: ${updated}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

reassignProducts();
