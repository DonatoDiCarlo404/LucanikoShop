import dotenv from 'dotenv';
import { sendTransferFailedAlert, sendCronFailureAlert, sendLowBalanceAlert } from '../utils/alertService.js';

// Carica variabili ambiente
dotenv.config();

console.log('🧪 Test Alert Email - LucanikoShop\n');
console.log('📌 Configurazione:');
console.log(`   SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? '✅ Presente (inizia con ' + process.env.SENDGRID_API_KEY.substring(0, 8) + '...)' : '❌ NON TROVATA'}`);
console.log(`   ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || '❌ NON TROVATA'}`);
console.log(`   FROM_EMAIL: ${process.env.FROM_EMAIL || '❌ NON TROVATA'}\n`);

// Test 1: Transfer Fallito
console.log('📧 Test 1: Invio alert transfer fallito...');
const fakePayout = {
  _id: '65f1a2b3c4d5e6f7g8h9i0j1',
  amount: 125.50,
  saleDate: new Date('2026-01-20'),
  orderId: '65f1a2b3c4d5e6f7g8h9i0k3'
};

const fakeVendor = {
  _id: '65f1a2b3c4d5e6f7g8h9i0k2',
  name: 'Test Vendor S.r.l.',
  email: 'vendor@test.com',
  stripeConnectAccountId: 'acct_1AbCdEfGhIjKlMnO'
};

const fakeError = new Error('Insufficient funds in Stripe account');
fakeError.stack = `Error: Insufficient funds in Stripe account
    at processVendorPayouts (/app/jobs/processVendorPayouts.js:120:15)
    at runJob (/app/server.js:180:20)`;

try {
  await sendTransferFailedAlert(fakePayout, fakeVendor, fakeError);
  console.log('✅ Alert transfer fallito inviato con successo!\n');
} catch (error) {
  console.error('❌ Errore invio alert transfer:', error.message);
  console.error('   Stack:', error.stack);
  console.error('   Response:', error.response?.body || 'N/A');
}

// Test 2: Cron Job Fallito
console.log('📧 Test 2: Invio alert cron job fallito...');
const cronError = new Error('Database connection timeout');
cronError.stack = `Error: Database connection timeout
    at connectDB (/app/config/db.js:15:10)
    at processVendorPayouts (/app/jobs/processVendorPayouts.js:12:5)`;

try {
  await sendCronFailureAlert(cronError, 'Automatic Vendor Payouts');
  console.log('✅ Alert cron job fallito inviato con successo!\n');
} catch (error) {
  console.error('❌ Errore invio alert cron:', error.message);
}

// Test 3: Saldo Stripe Basso
console.log('📧 Test 3: Invio alert saldo Stripe basso...');
const fakeBalance = {
  available: [{
    amount: 35000, // €350 (sotto soglia €500)
    currency: 'eur'
  }],
  pending: [{
    amount: 12000,
    currency: 'eur'
  }],
  livemode: false
};

try {
  await sendLowBalanceAlert(fakeBalance);
  console.log('✅ Alert saldo basso inviato con successo!\n');
} catch (error) {
  console.error('❌ Errore invio alert saldo:', error.message);
}

console.log('🎉 Test completati! Controlla la tua email: info@lucanikoshop.it');
console.log('\n📌 Se non ricevi le email:');
console.log('   1. Verifica SENDGRID_API_KEY in .env');
console.log('   2. Verifica che info@lucanikoshop.it sia verificata in SendGrid');
console.log('   3. Controlla spam/promozioni');
console.log('   4. Verifica log per errori\n');

process.exit(0);
