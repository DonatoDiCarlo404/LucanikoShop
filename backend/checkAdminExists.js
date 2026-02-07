import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const checkAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('MongoDB URI disponibile:', mongoUri ? 'SI' : 'NO');
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI non trovato nel file .env');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connesso a MongoDB');

    const admin = await User.findOne({ email: 'admin.test@lucanikoshop.it' }).select('+password');
    
    if (!admin) {
      console.log('❌ Admin NON TROVATO nel database!');
      console.log('\n🔧 Creo nuovo admin...');
      
      const newAdmin = new User({
        name: 'Admin Test',
        email: 'admin.test@lucanikoshop.it',
        password: 'Admin123!Test',
        role: 'admin',
        isApproved: true
      });
      
      await newAdmin.save();
      console.log('✅ Admin creato con successo!');
    } else {
      console.log('✅ Admin trovato:', admin.email);
      console.log('   Role:', admin.role);
      console.log('   Nome:', admin.name);
      console.log('   Approvato:', admin.isApproved);
      
      // Test password
      const testPassword = 'Admin123!Test';
      const isMatch = await bcrypt.compare(testPassword, admin.password);
      console.log(`\n🔐 Test password "${testPassword}":`, isMatch ? '✅ CORRETTA' : '❌ ERRATA');
      
      if (!isMatch) {
        console.log('\n🔧 Reset password admin...');
        admin.password = testPassword;
        admin.isApproved = true; // Assicura che l'admin sia approvato
        await admin.save();
        console.log('✅ Password resettata e admin approvato con successo!');
      } else if (!admin.isApproved) {
        console.log('\n🔧 Approvazione admin...');
        admin.isApproved = true;
        await admin.save();
        console.log('✅ Admin approvato con successo!');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

checkAdmin();
