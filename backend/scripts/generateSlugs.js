import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

// Funzione per generare slug
function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Spazi in trattini
    .replace(/[^\w\-]+/g, '')       // Rimuovi caratteri non alfanumerici
    .replace(/\-\-+/g, '-')         // Trattini multipli in uno solo
    .replace(/^-+/, '')             // Rimuovi trattini all'inizio
    .replace(/-+$/, '');            // Rimuovi trattini alla fine
}

async function generateSlugsForExistingVendors() {
  try {
    console.log('🔗 Connessione al database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database');

    // Trova tutti i venditori senza slug
    const vendors = await User.find({ 
      role: 'seller',
      businessName: { $exists: true, $ne: '' },
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    });

    console.log(`📊 Trovati ${vendors.length} venditori senza slug`);

    for (const vendor of vendors) {
      let slug = generateSlug(vendor.businessName);
      
      // Verifica unicità dello slug
      let slugExists = true;
      let counter = 1;
      let uniqueSlug = slug;
      
      while (slugExists) {
        const existingUser = await User.findOne({ 
          slug: uniqueSlug,
          _id: { $ne: vendor._id }
        });
        
        if (!existingUser) {
          slugExists = false;
        } else {
          uniqueSlug = `${slug}-${counter}`;
          counter++;
        }
      }
      
      // Aggiorna il venditore con lo slug
      vendor.slug = uniqueSlug;
      await vendor.save();
      
      console.log(`✅ ${vendor.businessName} → slug: "${uniqueSlug}"`);
    }

    console.log('\n🎉 Slug generati con successo per tutti i venditori!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

generateSlugsForExistingVendors();
