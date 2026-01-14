import sgMail from '../config/sendgrid.js';

// Email di benvenuto alla registrazione
export const sendWelcomeEmail = async (userEmail, userName) => {
  const msg = {
    to: userEmail,
    from: 'donato.dicarlo404@gmail.com',
    subject: 'Benvenuto su LucanikoShop!',
    text: `Ciao ${userName}, benvenuto su LucanikoShop! Siamo felici di averti con noi.`,
    html: `<strong>Ciao ${userName}</strong>,<br><br>Benvenuto su LucanikoShop! Siamo felici di averti con noi.<br><br>Buono shopping!`,
  };

  try {
    await sgMail.send(msg);
    console.log('Email di benvenuto inviata a:', userEmail);
  } catch (error) {
    console.error('Errore invio email di benvenuto:', error);
    throw error;
  }
};


// Email di conferma acquisto
export const sendPurchaseConfirmationEmail = async (userEmail, userName, orderDetails) => {
  const msg = {
    to: userEmail,
    from: 'donato.dicarlo404@gmail.com',
    subject: 'Conferma Acquisto - LucanikoShop',
    text: `Ciao ${userName}, il tuo ordine #${orderDetails.orderId} è stato confermato!`,
    html: `<strong>Ciao ${userName}</strong>,<br><br>Il tuo ordine #${orderDetails.orderId} è stato confermato!<br>Totale: €${orderDetails.total}<br><br>Grazie per il tuo acquisto!`,
  };

  try {
    await sgMail.send(msg);
    console.log('Email di conferma acquisto inviata a:', userEmail);
  } catch (error) {
    console.error('Errore invio email conferma acquisto:', error);
    throw error;
  }
};

// Email di conferma approvazione venditore
export const sendApprovalEmail = async (userEmail, userName) => {
  const msg = {
    to: userEmail,
    from: 'donato.dicarlo404@gmail.com',
    subject: 'Account Venditore Approvato - LucanikoShop',
    text: `Ciao ${userName}, il tuo account venditore è stato approvato! Ora puoi accedere e iniziare a vendere su LucanikoShop.`,
    html: `<strong>Ciao ${userName}</strong>,<br><br>Il tuo account venditore è stato <span style='color:green'>approvato</span>!<br>Ora puoi accedere e iniziare a vendere su <b>LucanikoShop</b>.<br><br>Buone vendite!`,
  };
  try {
    await sgMail.send(msg);
    console.log('Email di approvazione inviata a:', userEmail);
  } catch (error) {
    console.error('Errore invio email approvazione:', error);
    throw error;
  }
};

