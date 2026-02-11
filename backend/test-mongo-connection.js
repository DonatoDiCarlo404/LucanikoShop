import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing MongoDB connection...');
console.log('📝 MONGODB_URI:', process.env.MONGODB_URI?.substring(0, 50) + '...');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connesso con successo!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Errore connessione MongoDB:', error.message);
    process.exit(1);
  });

// Timeout dopo 15 secondi
setTimeout(() => {
  console.error('⏱️ Timeout connessione MongoDB (15s)');
  process.exit(1);
}, 15000);
