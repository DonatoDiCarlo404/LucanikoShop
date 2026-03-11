import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Experience from './models/Experience.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URI_PRODUCTION;

async function checkExperiencesCategories() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connesso al database\n');

    console.log('═══════════════════════════════════════');
    console.log('📊 ANALISI ESPERIENZE - CATEGORIE');
    console.log('═══════════════════════════════════════\n');

    const allExperiences = await Experience.find({});
    console.log(`Totale esperienze: ${allExperiences.length}\n`);

    if (allExperiences.length === 0) {
      console.log('❌ Nessuna esperienza trovata!');
      await mongoose.connection.close();
      return;
    }

    let withCategories = 0;
    let withoutCategories = 0;
    let withEmptyCategories = 0;

    console.log('📋 DETTAGLI ESPERIENZE:\n');

    allExperiences.forEach((exp, i) => {
      console.log(`${i+1}. "${exp.title}" (${exp.city})`);
      console.log(`   ID: ${exp._id}`);
      console.log(`   Status: ${exp.status}`);
      
      if (exp.categories && exp.categories.length > 0) {
        console.log(`   ✅ Categories: [${exp.categories.join(', ')}]`);
        withCategories++;
      } else if (exp.categories && exp.categories.length === 0) {
        console.log(`   ⚠️  Categories: [] (array vuoto)`);
        withEmptyCategories++;
      } else {
        console.log(`   ❌ Categories: NON DEFINITO`);
        withoutCategories++;
      }
      
      // Controlla se ha il vecchio campo 'category' (non dovrebbe)
      if (exp.category) {
        console.log(`   ⚠️  OLD category field: "${exp.category}"`);
      }
      
      console.log('');
    });

    console.log('═══════════════════════════════════════');
    console.log('📊 RIEPILOGO:');
    console.log('═══════════════════════════════════════\n');
    console.log(`✅ Con categories popolate: ${withCategories}`);
    console.log(`⚠️  Con categories vuote: ${withEmptyCategories}`);
    console.log(`❌ Senza categories: ${withoutCategories}\n`);

    if (withEmptyCategories > 0 || withoutCategories > 0) {
      console.log('⚠️  ATTENZIONE: Ci sono esperienze senza categorie!');
      console.log('   Queste NON verranno mostrate nella pagina pubblica.');
      console.log('   Assegna almeno una categoria a ciascuna esperienza.');
    }

    await mongoose.connection.close();
    console.log('\n✅ Analisi completata');
    
  } catch (error) {
    console.error('❌ Errore:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

checkExperiencesCategories();
