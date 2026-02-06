// Script per creare admin con email/password
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from './models/User.js';

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB');

    const adminEmail = 'admin.test@lucanikoshop.it';
    
    // Verifica se esiste già
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      console.log('⚠️  Admin già esistente:', adminEmail);
      console.log('   Password: Admin123!Test');
      process.exit(0);
    }

    // Crea nuovo admin
    const admin = await User.create({
      name: 'Admin Test',
      email: adminEmail,
      password: 'Admin123!Test', // Verrà hashata automaticamente dal pre-save hook
      isAdmin: true,
      role: 'admin',
      isVerified: true
    });

    console.log('✅ Admin creato con successo!');
    console.log('   Email:', adminEmail);
    console.log('   Password: Admin123!Test');
    console.log('\n👉 Ora puoi fare login su https://www.lucanikoshop.it/login');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

createAdmin();
