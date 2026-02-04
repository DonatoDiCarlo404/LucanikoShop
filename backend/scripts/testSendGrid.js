import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';

dotenv.config();

console.log('🔍 Test SendGrid API Key\n');

if (!process.env.SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY non trovata in .env');
  process.exit(1);
}

console.log(`✅ API Key presente: ${process.env.SENDGRID_API_KEY.substring(0, 10)}...`);

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'info@lucanikoshop.it',
  from: 'info@lucanikoshop.it', // Deve essere verificato in SendGrid
  subject: '🧪 Test SendGrid - LucanikoShop',
  text: 'Questo è un test di invio email da SendGrid.',
  html: '<h1>Test Funzionante!</h1><p>Se ricevi questa email, SendGrid è configurato correttamente.</p>',
};

console.log('\n📧 Tentativo invio email test...');
console.log(`   To: ${msg.to}`);
console.log(`   From: ${msg.from}\n`);

try {
  const response = await sgMail.send(msg);
  console.log('✅ Email inviata con successo!');
  console.log(`   Status Code: ${response[0].statusCode}`);
  console.log(`   Message ID: ${response[0].headers['x-message-id']}\n`);
  console.log('📬 Controlla la tua inbox: info@lucanikoshop.it');
  console.log('   (Potrebbe finire in spam/promozioni)');
} catch (error) {
  console.error('❌ Errore invio email:\n');
  
  if (error.response) {
    console.error('   Status Code:', error.response.statusCode);
    console.error('   Body:', JSON.stringify(error.response.body, null, 2));
    
    if (error.response.body.errors) {
      console.error('\n   Errori specifici:');
      error.response.body.errors.forEach((err, i) => {
        console.error(`   ${i + 1}. ${err.message}`);
        if (err.field) console.error(`      Campo: ${err.field}`);
        if (err.help) console.error(`      Aiuto: ${err.help}`);
      });
    }
  } else {
    console.error('   Messaggio:', error.message);
  }
  
  console.error('\n💡 Possibili cause:');
  console.error('   1. API Key non valida (scaduta o sbagliata)');
  console.error('   2. Email sender (info@lucanikoshop.it) NON verificata in SendGrid');
  console.error('   3. Account SendGrid sospeso o non attivo');
  console.error('\n📌 Verifica in SendGrid Dashboard:');
  console.error('   Settings → Sender Authentication → info@lucanikoshop.it deve avere ✅ verde');
  
  process.exit(1);
}

process.exit(0);
