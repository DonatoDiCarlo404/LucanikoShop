import dotenv from 'dotenv';
dotenv.config();
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'lucanikofood@gmail.com',
  from: 'info@lucanikoshop.it',
  subject: 'Test SendGrid',
  text: 'Questo è un test per verificare se SendGrid funziona',
  html: '<strong>Questo è un test per verificare se SendGrid funziona</strong>',
};

console.log('🔍 Test invio email SendGrid...');
console.log('📧 Da:', msg.from);
console.log('📧 A:', msg.to);
console.log('🔑 API Key:', process.env.SENDGRID_API_KEY ? 'Configurata' : 'NON configurata');

sgMail
  .send(msg)
  .then((response) => {
    console.log('✅ Email inviata con successo!');
    console.log('Status Code:', response[0].statusCode);
  })
  .catch((error) => {
    console.error('❌ ERRORE:', error.message);
    console.error('Code:', error.code);
    if (error.response) {
      console.error('Response Body:', error.response.body);
    }
  });
