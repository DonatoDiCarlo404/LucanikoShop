// Script veloce per resettare password venditori con problemi
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from './models/User.js';

const resetVendorPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB\n');

    // Lista di venditori da resettare (aggiungi qui le email)
    const vendorsToReset = [
      // { email: 'venditore@esempio.com', newPassword: 'NuovaPass123!' },
    ];

    if (vendorsToReset.length === 0) {
      console.log('📝 Nessun venditore da resettare.');
      console.log('   Modifica il file e aggiungi le email nella lista vendorsToReset');
      console.log('   Esempio:');
      console.log('   { email: "venditore@esempio.com", newPassword: "NuovaPass123!" }');
      process.exit(0);
    }

    console.log(`📋 Resetting passwords per ${vendorsToReset.length} venditori...\n`);

    for (const vendor of vendorsToReset) {
      try {
        const user = await User.findOne({ email: vendor.email }).select('+password');
        
        if (!user) {
          console.log(`❌ Utente non trovato: ${vendor.email}`);
          continue;
        }

        user.password = vendor.newPassword;
        await user.save();

        console.log(`✅ ${user.email} - Password resettata`);
      } catch (err) {
        console.log(`❌ ${vendor.email} - Errore: ${err.message}`);
      }
    }

    console.log(`\n✅ Operazione completata!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

resetVendorPasswords();
