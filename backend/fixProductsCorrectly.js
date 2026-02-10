import mongoose from 'mongoose';
import Product from './models/Product.js';
import Category from './models/Category.js';
import dotenv from 'dotenv';

dotenv.config();

const fixProductsCorrectly = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database MongoDB\n');

    // Carica tutte le categorie necessarie
    const cibi = await Category.findOne({ name: 'Cibi e Bevande', parent: null });
    const abbigliamento = await Category.findOne({ name: 'Abbigliamento e Accessori', parent: null });
    const calzature = await Category.findOne({ name: 'Calzature', parent: null });
    const elettronica = await Category.findOne({ name: 'Elettronica e Informatica', parent: null });

    // Sottocategorie Cibi
    const viniSub = await Category.findOne({ name: 'Vini, spumanti e birre', parent: cibi._id });
    const boxSub = await Category.findOne({ name: 'Box', parent: cibi._id });

    // Sottocategorie Abbigliamento
    const abbigliamentoUomoSub = await Category.findOne({ name: 'Abbigliamento uomo', parent: abbigliamento._id });

    // Sottocategorie Calzature
    const sneakersSub = await Category.findOne({ name: 'Sneakers', parent: calzature._id });

    // Sottocategorie Elettronica
    const smartphoneSub = await Category.findOne({ name: 'Smartphone e accessori', parent: elettronica._id });

    console.log('📋 CATEGORIE CARICATE:');
    console.log(`   Vini: ${viniSub._id}`);
    console.log(`   Box: ${boxSub._id}`);
    console.log(`   Abbigliamento uomo: ${abbigliamentoUomoSub._id}`);
    console.log(`   Sneakers: ${sneakersSub._id}`);
    console.log(`   Smartphone: ${smartphoneSub._id}\n`);

    // Mappa correzioni specifiche
    const corrections = [
      {
        name: /Greco di Matera DOC/i,
        category: cibi._id,
        subcategory: viniSub._id,
        label: 'Vini, spumanti e birre'
      },
      {
        name: /Box Aperitivo Lucano/i,
        category: cibi._id,
        subcategory: boxSub._id,
        label: 'Box'
      },
      {
        name: /Sneakers/i,
        category: calzature._id,
        subcategory: sneakersSub._id,
        label: 'Calzature > Sneakers'
      },
      {
        name: /Felpa.*Uomo/i,
        category: abbigliamento._id,
        subcategory: abbigliamentoUomoSub._id,
        label: 'Abbigliamento > Abbigliamento uomo'
      },
      {
        name: /Smartphone/i,
        category: elettronica._id,
        subcategory: smartphoneSub._id,
        label: 'Elettronica > Smartphone e accessori'
      }
    ];

    const products = await Product.find({});
    let corrected = 0;

    console.log('🔧 CORREZIONI IN CORSO:\n');

    for (const product of products) {
      let updated = false;

      for (const correction of corrections) {
        if (correction.name.test(product.name)) {
          product.category = correction.category;
          product.subcategory = correction.subcategory;
          await product.save();
          corrected++;
          console.log(`✅ ${corrected}. "${product.name}"`);
          console.log(`   → ${correction.label}\n`);
          updated = true;
          break;
        }
      }

      if (!updated) {
        // Prodotto già corretto o da lasciare invariato
        console.log(`⏭️  "${product.name}" - già corretto`);
      }
    }

    console.log(`\n🎉 Correzioni completate!`);
    console.log(`✅ Prodotti corretti: ${corrected}`);
    console.log(`📦 Totale prodotti: ${products.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

fixProductsCorrectly();
