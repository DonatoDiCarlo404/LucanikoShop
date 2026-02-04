import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import VendorPayout from '../models/VendorPayout.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendPaymentReceivedEmail } from '../utils/emailTemplates.js';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connesso\n');
  } catch (error) {
    console.error(`❌ Errore connessione MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const simulatePaidPayout = async () => {
  console.log('🧪 SIMULA PAGAMENTO RICEVUTO (Test Fase 5.4)\n');
  
  // Trova un payout pending
  const pendingPayout = await VendorPayout.findOne({ status: 'pending' })
    .populate('vendorId', 'name companyName email');
  
  if (!pendingPayout) {
    console.log('❌ Nessun VendorPayout pending trovato');
    console.log('💡 Crea prima un ordine di test\n');
    process.exit(1);
  }

  console.log('📦 Payout trovato:');
  console.log(`   - ID: ${pendingPayout._id}`);
  console.log(`   - Venditore: ${pendingPayout.vendorId?.companyName || pendingPayout.vendorId?.name}`);
  console.log(`   - Importo: €${pendingPayout.amount.toFixed(2)}`);
  console.log(`   - Status attuale: ${pendingPayout.status}\n`);

  // Aggiorna a "paid"
  pendingPayout.status = 'paid';
  pendingPayout.paymentDate = new Date();
  pendingPayout.stripeTransferId = 'tr_test_' + Math.random().toString(36).substring(2, 15);
  await pendingPayout.save();

  console.log('✅ Payout aggiornato a "paid"!');
  console.log(`   - Payment Date: ${pendingPayout.paymentDate.toLocaleString('it-IT')}`);
  console.log(`   - Stripe Transfer ID: ${pendingPayout.stripeTransferId}\n`);

  // Aggiorna statistiche venditore
  const vendor = await User.findById(pendingPayout.vendorId._id);
  if (vendor) {
    vendor.paidEarnings = (vendor.paidEarnings || 0) + pendingPayout.amount;
    vendor.pendingEarnings = Math.max(0, (vendor.pendingEarnings || 0) - pendingPayout.amount);
    await vendor.save();

    console.log('✅ Statistiche venditore aggiornate:');
    console.log(`   - Paid Earnings: €${vendor.paidEarnings.toFixed(2)}`);
    console.log(`   - Pending Earnings: €${vendor.pendingEarnings.toFixed(2)}\n`);
  }

  // Invia email notifica pagamento
  try {
    await sendPaymentReceivedEmail(
      vendor.email,
      vendor.companyName || vendor.name,
      pendingPayout.amount,
      pendingPayout.paymentDate,
      pendingPayout.orderId?.toString().slice(-8) || 'N/A',
      pendingPayout.stripeTransferId
    );
    console.log('📧 Email notifica inviata al venditore\n');
  } catch (emailError) {
    console.error('⚠️  Errore invio email:', emailError.message);
  }

  // Crea notifica in-app
  try {
    await Notification.create({
      userId: vendor._id,
      type: 'payment_received',
      message: `Hai ricevuto un pagamento di €${pendingPayout.amount.toFixed(2)} per l'ordine #${pendingPayout.orderId?.toString().slice(-8) || 'N/A'}`,
      data: {
        amount: pendingPayout.amount,
        payoutId: pendingPayout._id,
        orderId: pendingPayout.orderId,
        stripeTransferId: pendingPayout.stripeTransferId
      }
    });
    console.log('🔔 Notifica in-app creata\n');
  } catch (notifError) {
    console.error('⚠️  Errore creazione notifica:', notifError.message);
  }

  console.log('🎉 Test completato! Ricarica la dashboard e vai al tab "Storico Pagamenti"\n');
  
  await mongoose.connection.close();
  process.exit(0);
};

connectDB().then(simulatePaidPayout);
