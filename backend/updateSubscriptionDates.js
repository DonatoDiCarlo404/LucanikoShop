import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script per aggiornare retroattivamente le date di scadenza abbonamento
 * per tutti i venditori che non hanno subscriptionEndDate impostata.
 */
const updateSubscriptionDates = async () => {
  try {
    // Connessione al database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database MongoDB');

    // Trova tutti i seller senza subscriptionEndDate
    const sellers = await User.find({
      role: 'seller',
      $or: [
        { subscriptionEndDate: { $exists: false } },
        { subscriptionEndDate: null }
      ]
    });

    console.log(`\n📊 Trovati ${sellers.length} venditori senza data di scadenza abbonamento`);

    let updated = 0;
    
    for (const seller of sellers) {
      // Determina la durata abbonamento (default 1 anno se non specificato)
      let years = 1;
      if (seller.subscriptionType) {
        if (String(seller.subscriptionType) === '2') years = 2;
        if (String(seller.subscriptionType) === '3') years = 3;
      }

      // Calcola data di scadenza
      // Se subscriptionPaidAt esiste, usa quella come base, altrimenti usa createdAt
      const baseDate = seller.subscriptionPaidAt || seller.createdAt;
      const endDate = new Date(baseDate);
      endDate.setFullYear(endDate.getFullYear() + years);

      // Aggiorna il venditore
      seller.subscriptionEndDate = endDate;
      
      // Se subscriptionSuspended non è definito, impostalo a false (default)
      if (seller.subscriptionSuspended === undefined || seller.subscriptionSuspended === null) {
        seller.subscriptionSuspended = false;
      }

      await seller.save();
      updated++;

      console.log(`✅ Aggiornato ${seller.businessName || seller.name} - Scadenza: ${endDate.toLocaleDateString('it-IT')}`);
    }

    console.log(`\n✅ Aggiornamento completato! ${updated} venditori aggiornati.`);
    
    // Disconnessione
    await mongoose.disconnect();
    console.log('✅ Disconnesso dal database');
    process.exit(0);

  } catch (error) {
    console.error('❌ Errore durante l\'aggiornamento:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Esegui lo script
updateSubscriptionDates();
