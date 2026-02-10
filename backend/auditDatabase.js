import mongoose from 'mongoose';
import Product from './models/Product.js';
import Category from './models/Category.js';
import dotenv from 'dotenv';

dotenv.config();

const auditDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database MongoDB\n');

    // 1. VERIFICA MACROCATEGORIE
    const mainCategories = await Category.find({ parent: null }).sort({ name: 1 });
    console.log('📁 MACROCATEGORIE DISPONIBILI:');
    mainCategories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat._id})`);
    });

    // 2. VERIFICA CATEGORIE NECESSARIE
    console.log('\n🔍 VERIFICA CATEGORIE NECESSARIE PER I PRODOTTI:');
    const abbigliamento = await Category.findOne({ name: 'Abbigliamento e Accessori', parent: null });
    const calzature = await Category.findOne({ name: 'Calzature', parent: null });
    const elettronica = await Category.findOne({ name: 'Elettronica e Informatica', parent: null });
    const cibi = await Category.findOne({ name: 'Cibi e Bevande', parent: null });

    console.log(`   Abbigliamento e Accessori: ${abbigliamento ? '✅ ESISTE' : '❌ MANCA'}`);
    console.log(`   Calzature: ${calzature ? '✅ ESISTE' : '❌ MANCA'}`);
    console.log(`   Elettronica e Informatica: ${elettronica ? '✅ ESISTE' : '❌ MANCA'}`);
    console.log(`   Cibi e Bevande: ${cibi ? '✅ ESISTE' : '❌ MANCA'}`);

    // 3. VERIFICA SOTTOCATEGORIE NECESSARIE
    if (abbigliamento) {
      const subAbbigliamento = await Category.find({ parent: abbigliamento._id });
      console.log(`\n📂 Sottocategorie Abbigliamento (${subAbbigliamento.length}):`);
      subAbbigliamento.slice(0, 3).forEach(s => console.log(`      - ${s.name}`));
    }

    if (calzature) {
      const subCalzature = await Category.find({ parent: calzature._id });
      console.log(`\n📂 Sottocategorie Calzature (${subCalzature.length}):`);
      subCalzature.slice(0, 3).forEach(s => console.log(`      - ${s.name}`));
    }

    if (elettronica) {
      const subElettronica = await Category.find({ parent: elettronica._id });
      console.log(`\n📂 Sottocategorie Elettronica (${subElettronica.length}):`);
      subElettronica.slice(0, 3).forEach(s => console.log(`      - ${s.name}`));
    }

    if (cibi) {
      const subCibi = await Category.find({ parent: cibi._id });
      const boxSub = subCibi.find(s => s.name === 'Box');
      console.log(`\n📂 Sottocategorie Cibi e Bevande (${subCibi.length}):`);
      console.log(`      - Sottocategoria "Box": ${boxSub ? '✅ ESISTE (' + boxSub._id + ')' : '❌ MANCA'}`);
    }

    // 4. LISTA TUTTI I PRODOTTI
    const products = await Product.find({}).select('name category subcategory vendor');
    console.log(`\n📦 PRODOTTI NEL DATABASE (${products.length}):`);
    products.forEach((p, i) => {
      console.log(`   ${i + 1}. "${p.name}"`);
      console.log(`      Category ID: ${p.category}`);
      console.log(`      Subcategory ID: ${p.subcategory}`);
      console.log(`      Vendor: ${p.vendor}`);
    });

    console.log('\n✅ AUDIT COMPLETATO');
    console.log('\n⚠️  RISCHI:');
    console.log('   - Se le categorie Abbigliamento/Calzature/Elettronica esistono: NESSUN RISCHIO');
    console.log('   - Se mancano: i prodotti rimarrebbero orfani (ma sono recuperabili)');
    console.log('\n💡 RACCOMANDAZIONE:');
    if (abbigliamento && calzature && elettronica && cibi) {
      console.log('   ✅ TUTTO OK - Possiamo procedere con le correzioni');
    } else {
      console.log('   ⚠️  ATTENZIONE - Alcune categorie mancano, verifica prima di procedere');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

auditDatabase();
