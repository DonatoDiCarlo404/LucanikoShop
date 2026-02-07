// Script per resettare admin
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from './models/User.js';

const resetAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB');

    const adminEmail = 'admin.test@lucanikoshop.it';
    
    // Elimina admin esistente
    await User.deleteOne({ email: adminEmail });
    console.log('🗑️  Admin precedente eliminato');

    // Crea nuovo admin con password corretta
    const admin = await User.create({
      name: 'Admin Test',
      email: adminEmail,
      password: 'Admin123!Test',
      isAdmin: true,
      role: 'admin',
      isVerified: true
    });

    console.log('✅ Admin ricreato con successo!');
    console.log('   Email:', adminEmail);
    console.log('   Password: Admin123!Test');
    console.log('\n👉 Ora puoi fare login su https://www.lucanikoshop.it/login');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

resetAdmin();
