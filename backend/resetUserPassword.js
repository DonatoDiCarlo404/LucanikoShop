// Script per resettare password di un utente specifico
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from './models/User.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const resetUserPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB\n');

    const email = await question('📧 Email utente da resettare: ');
    
    if (!email || !email.trim()) {
      console.log('❌ Email non valida');
      rl.close();
      process.exit(1);
    }

    const user = await User.findOne({ email: email.trim() }).select('+password');
    
    if (!user) {
      console.log(`❌ Utente non trovato: ${email}`);
      rl.close();
      process.exit(1);
    }

    console.log(`\n✅ Utente trovato:`);
    console.log(`   Nome: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Ruolo: ${user.role}`);
    console.log(`   Creato: ${user.createdAt}`);

    const newPassword = await question('\n🔑 Nuova password (min 8 caratteri, 1 maiuscola, 1 minuscola, 1 numero, 1 simbolo): ');
    
    if (!newPassword || newPassword.length < 8) {
      console.log('❌ Password troppo corta');
      rl.close();
      process.exit(1);
    }

    // Valida password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      console.log('❌ La password deve contenere almeno una maiuscola, una minuscola, un numero e un simbolo');
      rl.close();
      process.exit(1);
    }

    const confirm = await question(`\n⚠️  Confermi il reset della password per ${email}? (si/no): `);
    
    if (confirm.toLowerCase() !== 'si' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ Operazione annullata');
      rl.close();
      process.exit(0);
    }

    // Aggiorna password (verrà hashata automaticamente dal pre-save hook)
    user.password = newPassword;
    await user.save();

    console.log(`\n✅ Password resettata con successo per ${email}!`);
    console.log(`   Nuova password: ${newPassword}`);
    console.log(`\n👉 L'utente può ora fare login con la nuova password.`);

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    rl.close();
    process.exit(1);
  }
};

resetUserPassword();
