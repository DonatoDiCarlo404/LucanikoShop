import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const activateVendor = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB');

    // Chiedi l'email del venditore da aggiornare
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Inserisci email del venditore da attivare: ', async (email) => {
      rl.question('Durata abbonamento (1anno): ', async (subscription) => {
        try {
          const vendor = await User.findOne({ email, role: 'seller' });

          if (!vendor) {
            console.log('❌ Venditore non trovato');
            process.exit(1);
          }

          console.log('\n📋 Venditore trovato:');
          console.log(`Nome: ${vendor.name}`);
          console.log(`Email: ${vendor.email}`);
          console.log(`Azienda: ${vendor.businessName}`);
          console.log(`Approvato: ${vendor.isApproved ? '✅' : '❌'}`);
          console.log(`Abbonamento attivo: ${vendor.subscriptionPaid ? '✅' : '❌'}`);

          // Calcola scadenza abbonamento (Piano unico: 1 anno)
          const now = new Date();
          const endDate = new Date(now.setFullYear(now.getFullYear() + 1));

          // Aggiorna dati
          vendor.isApproved = true;
          vendor.subscriptionPaid = true;
          vendor.subscriptionPaidAt = new Date();
          vendor.subscriptionPaymentId = `ADMIN_REG_${Date.now()}`;
          vendor.subscriptionType = subscription;
          vendor.subscriptionEndDate = endDate;

          await vendor.save();

          console.log('\n✅ Venditore aggiornato con successo!');
          console.log(`Abbonamento: ${subscription}`);
          console.log(`Scadenza: ${endDate.toLocaleDateString('it-IT')}`);
          console.log(`Pagamento ID: ${vendor.subscriptionPaymentId}`);

          process.exit(0);
        } catch (err) {
          console.error('❌ Errore:', err);
          process.exit(1);
        }
      });
    });
  } catch (error) {
    console.error('❌ Errore connessione MongoDB:', error);
    process.exit(1);
  }
};

activateVendor();
