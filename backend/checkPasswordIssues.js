// Script per verificare utenti con problemi di password
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcryptjs';

const checkPasswordIssues = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB\n');

    // Trova tutti gli utenti
    const users = await User.find({}).select('+password');
    
    console.log(`📊 Totale utenti nel database: ${users.length}\n`);

    let corruptedCount = 0;
    const corruptedUsers = [];

    for (const user of users) {
      // Verifica se la password è doppiamente hashata (inizia con $2a$10$$2a$10$)
      // oppure controlla la lunghezza anomala
      const passwordStr = user.password || '';
      
      // Una password bcrypt normale è ~60 caratteri
      // Se è doppiamente hashata sarà molto più lunga o con pattern strani
      const isDuplicated = passwordStr.includes('$2a$10$$2a$10$') || 
                          passwordStr.includes('$2b$10$$2b$10$') ||
                          passwordStr.length > 80;

      if (isDuplicated) {
        corruptedCount++;
        corruptedUsers.push({
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
          passwordLength: passwordStr.length
        });
        console.log(`❌ Password corrotta: ${user.email} (${user.role})`);
      }
    }

    console.log(`\n📈 Riepilogo:`);
    console.log(`   Totale utenti: ${users.length}`);
    console.log(`   Password corrotte: ${corruptedCount}`);
    console.log(`   Password OK: ${users.length - corruptedCount}`);

    if (corruptedCount > 0) {
      console.log(`\n⚠️  AZIONE NECESSARIA:`);
      console.log(`   Esegui "node resetAllPasswords.js" per generare password temporanee`);
      console.log(`   oppure contatta gli utenti per il reset password.`);
      
      console.log(`\n📋 Utenti da contattare:`);
      corruptedUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.role})`);
      });
    } else {
      console.log(`\n✅ Tutte le password sono OK!`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

checkPasswordIssues();
