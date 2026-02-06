import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Carica variabili ambiente
dotenv.config();

const updateUserSubscription = async () => {
  try {
    // Connetti al database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB');

    // Email dell'utente da aggiornare
    const userEmail = 'vito.dipietro92@gmail.com';
    
    // Trova l'utente
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log('❌ Utente non trovato');
      process.exit(1);
    }

    console.log('📋 Utente trovato:', {
      name: user.name,
      email: user.email,
      role: user.role,
      subscriptionEndDate: user.subscriptionEndDate,
      subscriptionPaymentId: user.subscriptionPaymentId
    });

    // Aggiorna i campi dell'abbonamento
    user.subscriptionPaid = true;
    user.subscriptionPaidAt = new Date('2026-02-05T17:05:25.585Z'); // Data del pagamento reale
    
    // Se non ha già questi campi, impostali
    if (!user.subscriptionPaymentId) {
      user.subscriptionPaymentId = 'pi_3SxVyhK9Lxisu9UD0iomMi40'; // Sostituisci con l'ID reale da Stripe
    }
    
    if (!user.subscriptionType) {
      user.subscriptionType = '1anno'; // Piano unico
    }

    await user.save();

    console.log('✅ Utente aggiornato con successo:', {
      subscriptionPaid: user.subscriptionPaid,
      subscriptionPaidAt: user.subscriptionPaidAt,
      subscriptionPaymentId: user.subscriptionPaymentId,
      subscriptionType: user.subscriptionType,
      subscriptionEndDate: user.subscriptionEndDate
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

updateUserSubscription();
