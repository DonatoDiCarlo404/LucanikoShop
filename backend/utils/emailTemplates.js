import sgMail from '../config/sendgrid.js';

// Email nuovo ordine ricevuto (venditore)
export const sendNewOrderToVendorEmail = async (vendorEmail, companyName, orderNumber, productsList, totalAmount, customerName, billingShippingData, loginLink = 'https://www.lucanikoshop.it/login') => {
  const msg = {
    to: vendorEmail,
    from: 'ordini@lucanikoshop.it',
    subject: 'Hai ricevuto un nuovo ordine 📦',
    text: `Ciao ${companyName},\n\nhai ricevuto un nuovo ordine su Lucaniko Shop.\n\nDettagli ordine:\n\nNumero ordine: #${orderNumber}\nProdotti: ${productsList}\nImporto totale: ${totalAmount}\nCliente: ${customerName}\nDati fatturazione e spedizione: ${billingShippingData}\n\nAccedi al tuo account: ${loginLink}\n\nTi ricordiamo di aggiornare lo stato dell’ordine una volta avviata la spedizione.\n\nBuon lavoro,\nIl team Lucaniko\n\nwww.lucanikoshop.it`,
    html: `Ciao <strong>${companyName}</strong>,<br><br>
hai ricevuto un nuovo ordine su <strong>Lucaniko Shop</strong>.<br><br>
<strong>Dettagli ordine:</strong><br>
<ul style="margin-top: 0.5em; margin-bottom: 0.5em;">
  <li><b>Numero ordine:</b> #${orderNumber}</li>
  <li><b>Prodotti:</b> ${productsList}</li>
  <li><b>Importo totale:</b> ${totalAmount}</li>
  <li><b>Cliente:</b> ${customerName}</li>
  <li><b>Dati fatturazione e spedizione:</b> ${billingShippingData}</li>
</ul>
<p style="margin: 1.5em 0;">
  <a href="${loginLink}" style="background: #004b75; color: #fff; padding: 10px 22px; border-radius: 6px; text-decoration: none; font-weight: bold;">👉 Accedi al tuo account</a>
</p>
Ti ricordiamo di aggiornare lo stato dell’ordine una volta avviata la spedizione.<br><br>
Buon lavoro,<br>
Il team Lucaniko<br><br>
<a href="https://www.lucanikoshop.it" style="color: #004b75; text-decoration: underline;">www.lucanikoshop.it</a>`
  };

  try {
    await sgMail.send(msg);
    console.log('Email nuovo ordine inviata al venditore:', vendorEmail);
  } catch (error) {
    console.error('Errore invio email nuovo ordine al venditore:', error);
    throw error;
  }
};

// Email di conferma ordine acquirente
export const sendOrderConfirmationEmail = async (userEmail, userName, orderNumber, productsList, totalAmount, shippingAddress) => {
  const msg = {
    to: userEmail,
    from: 'ordini@lucanikoshop.it',
    subject: 'Ordine confermato – Grazie per il tuo acquisto 🛒',
    text: `Ciao ${userName},\n\ngrazie per il tuo acquisto su Lucaniko Shop!\n\nIl tuo ordine #${orderNumber} è stato ricevuto correttamente ed è in fase di lavorazione da parte dell’azienda venditrice.\n\nRiepilogo ordine:\n\nProdotti: ${productsList}\n\nTotale: ${totalAmount}\n\nIndirizzo di spedizione e fatturazione: ${shippingAddress}\n\nGrazie per aver scelto Lucaniko Shop\ne per sostenere le aziende del territorio.\n\nIl team Lucaniko\n\nwww.lucanikoshop.it`,
    html: `Ciao <strong>${userName}</strong>,<br><br>
grazie per il tuo acquisto su <strong>Lucaniko Shop</strong>!<br><br>
Il tuo ordine <b>#${orderNumber}</b> è stato ricevuto correttamente ed è in fase di lavorazione da parte dell’azienda venditrice.<br><br>
<strong>Riepilogo ordine:</strong><br>
<ul style="margin-top: 0.5em; margin-bottom: 0.5em;">
  <li><b>Prodotti:</b> ${productsList}</li>
  <li><b>Totale:</b> ${totalAmount}</li>
  <li><b>Indirizzo di spedizione e fatturazione:</b> ${shippingAddress}</li>
</ul>
<br>
Grazie per aver scelto Lucaniko Shop<br>
e per sostenere le aziende del territorio.<br><br>
Il team Lucaniko<br><br>
<a href="https://www.lucanikoshop.it" style="color: #004b75; text-decoration: underline;">www.lucanikoshop.it</a>`
  };

  try {
    await sgMail.send(msg);
    console.log('Email di conferma ordine inviata a:', userEmail);
  } catch (error) {
    console.error('Errore invio email conferma ordine:', error);
    throw error;
  }
};

// Email di conferma approvazione account venditore
export const sendVendorApprovalEmail = async (userEmail, companyName, loginLink = 'https://www.lucanikoshop.it/login') => {
  const msg = {
    to: userEmail,
    from: 'info@lucanikoshop.it',
    subject: 'Il tuo account venditore è attivo 🚀',
    text: `Ciao ${companyName},\n\nottime notizie: il tuo account venditore su Lucaniko Shop è stato approvato.\n\nDa ora puoi:\n\n- accedere al pannello venditore,\n- inserire i tuoi prodotti,\n- gestire ordini e spedizioni,\n- iniziare a vendere online all’interno dell’ecosistema Lucaniko.\n\nAccedi al tuo account: ${loginLink}\n\nBenvenuto ufficialmente in Lucaniko Shop,\ninsieme costruiamo valore per le aziende della Basilicata.\n\nIl team Lucaniko\n\nwww.lucanikoshop.it`,
    html: `Ciao <strong>${companyName}</strong>,<br><br>
ottime notizie: il tuo account venditore su <strong>Lucaniko Shop</strong> è stato approvato.<br><br>
Da ora puoi:<br>
<ul style="margin-top: 0.5em; margin-bottom: 0.5em;">
  <li>accedere al pannello venditore,</li>
  <li>inserire i tuoi prodotti,</li>
  <li>gestire ordini e spedizioni,</li>
  <li>iniziare a vendere online all’interno dell’ecosistema Lucaniko.</li>
</ul>
<p style="margin: 1.5em 0;">
  <a href="${loginLink}" style="background: #004b75; color: #fff; padding: 10px 22px; border-radius: 6px; text-decoration: none; font-weight: bold;">👉 Accedi al tuo account</a>
</p>
Benvenuto ufficialmente in Lucaniko Shop,<br>
insieme costruiamo valore per le aziende della Basilicata.<br><br>
Il team Lucaniko<br><br>
<a href="https://www.lucanikoshop.it" style="color: #004b75; text-decoration: underline;">www.lucanikoshop.it</a>`
  };

  try {
    await sgMail.send(msg);
    console.log('Email di approvazione venditore inviata a:', userEmail);
  } catch (error) {
    console.error('Errore invio email approvazione venditore:', error);
    throw error;
  }
};

// Email di registrazione venditore (in attesa di approvazione)
export const sendVendorRegistrationEmail = async (userEmail, companyName) => {
  const msg = {
    to: userEmail,
    from: 'info@lucanikoshop.it',
    subject: 'Registrazione ricevuta – Lucaniko Shop',
    text: `Ciao ${companyName},\n\nabbiamo ricevuto correttamente la tua richiesta di registrazione come Venditore su Lucaniko Shop.\n\nIl nostro team sta verificando i dati inseriti per completare l’attivazione del tuo account.\nRiceverai una comunicazione non appena la registrazione sarà approvata.\n\nGrazie per aver scelto di far parte di Lucaniko Shop.\nIl team Lucaniko\n\nwww.lucanikoshop.it`,
    html: `Ciao <strong>${companyName}</strong>,<br><br>
abbiamo ricevuto correttamente la tua richiesta di registrazione come <strong>Venditore</strong> su Lucaniko Shop.<br><br>
Il nostro team sta verificando i dati inseriti per completare l’attivazione del tuo account.<br>
Riceverai una comunicazione non appena la registrazione sarà approvata.<br><br>
Grazie per aver scelto di far parte di Lucaniko Shop.<br>
Il team Lucaniko<br><br>
<a href="https://www.lucanikoshop.it" style="color: #004b75; text-decoration: underline;">www.lucanikoshop.it</a>`
  };

  try {
    await sgMail.send(msg);
    console.log('Email di registrazione venditore inviata a:', userEmail);
  } catch (error) {
    console.error('Errore invio email registrazione venditore:', error);
    throw error;
  }
};

// Email di benvenuto alla registrazione acquirente
export const sendWelcomeEmail = async (userEmail, userName, loginLink = 'https://www.lucanikoshop.it/login') => {
  console.log('[EMAIL DEBUG] Invio email di benvenuto a:', userEmail);
  console.log('[EMAIL DEBUG] SendGrid API Key configurata:', !!process.env.SENDGRID_API_KEY);
  
  const msg = {
    to: userEmail,
    from: 'info@lucanikoshop.it',
    subject: 'Benvenuto su Lucaniko Shop',
    text: `Ciao ${userName},\n\nbenvenuto su Lucaniko Shop, il primo marketplace dedicato alle eccellenze della Basilicata.\n\nIl tuo account acquirente è stato creato con successo.\nDa questo momento puoi:\n\n- scoprire aziende e prodotti del territorio,\n- acquistare in modo semplice e sicuro,\n- sostenere le imprese lucane, direttamente online.\n\nAccedi al tuo account: ${loginLink}\n\nBuona esperienza su Lucaniko Shop,\nIl team Lucaniko\n\nwww.lucanikoshop.it`,
    html: `Ciao <strong>${userName}</strong>,<br><br>
benvenuto su <strong>Lucaniko Shop</strong>, il primo marketplace dedicato alle eccellenze della Basilicata.<br><br>
Il tuo account acquirente è stato creato con successo.<br>
Da questo momento puoi:<br>
<ul style="margin-top: 0.5em; margin-bottom: 0.5em;">
  <li>scoprire aziende e prodotti del territorio,</li>
  <li>acquistare in modo semplice e sicuro,</li>
  <li>sostenere le imprese lucane, direttamente online.</li>
</ul>
<p style="margin: 1.5em 0;">
  <a href="${loginLink}" style="background: #004b75; color: #fff; padding: 10px 22px; border-radius: 6px; text-decoration: none; font-weight: bold;">👉 Accedi al tuo account</a>
</p>
Buona esperienza su Lucaniko Shop,<br>
Il team Lucaniko<br><br>
<a href="https://www.lucanikoshop.it" style="color: #004b75; text-decoration: underline;">www.lucanikoshop.it</a>`
  };

  try {
    console.log('[EMAIL DEBUG] Tentativo invio email di benvenuto...');
    const result = await sgMail.send(msg);
    console.log('[EMAIL DEBUG] ✅ Email di benvenuto inviata con successo a:', userEmail);
    console.log('[EMAIL DEBUG] Risposta SendGrid:', result?.[0]?.statusCode);
  } catch (error) {
    console.error('[EMAIL DEBUG] ❌ ERRORE invio email di benvenuto:', error);
    console.error('[EMAIL DEBUG] Dettagli errore:', {
      message: error.message,
      code: error.code,
      response: error.response?.body
    });
    throw error;
  }
};

// Email richiesta supporto venditori
export const sendVendorSupportEmail = async (nome, azienda, email, telefono, descrizione) => {
  console.log('[EMAIL DEBUG] Invio email supporto venditore da:', email);
  console.log('[EMAIL DEBUG] Destinatario: lucanikofood@gmail.com');
  console.log('[EMAIL DEBUG] SendGrid API Key configurata:', !!process.env.SENDGRID_API_KEY);
  
  const msg = {
    to: 'lucanikofood@gmail.com',
    from: 'info@lucanikoshop.it',
    subject: `Richiesta supporto venditore - ${azienda || nome}`,
    text: `Nuova richiesta di supporto da un venditore:\n\nNome: ${nome}\nAzienda: ${azienda}\nEmail: ${email}\nTelefono: ${telefono}\n\nDescrizione richiesta:\n${descrizione}`,
    html: `
      <h2 style="color: #004b75;">Nuova richiesta di supporto da un venditore</h2>
      <p><strong>Nome:</strong> ${nome}</p>
      <p><strong>Azienda:</strong> ${azienda}</p>
      <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
      <p><strong>Telefono:</strong> ${telefono}</p>
      <hr style="border: 1px solid #e0e0e0; margin: 1.5em 0;">
      <h3 style="color: #004b75;">Descrizione richiesta:</h3>
      <p style="white-space: pre-wrap;">${descrizione}</p>
      <hr style="border: 1px solid #e0e0e0; margin: 1.5em 0;">
      <p style="color: #666; font-size: 0.9em;">Questa email è stata inviata automaticamente dal Centro Assistenza Venditori di Lucaniko Shop.</p>
      <a href="https://www.lucanikoshop.it" style="color: #004b75; text-decoration: underline;">www.lucanikoshop.it</a>
    `
  };

  try {
    console.log('[EMAIL DEBUG] Tentativo invio email supporto venditore...');
    const result = await sgMail.send(msg);
    console.log('[EMAIL DEBUG] ✅ Email supporto venditori inviata con successo a: lucanikofood@gmail.com');
    console.log('[EMAIL DEBUG] Risposta SendGrid:', result?.[0]?.statusCode);
  } catch (error) {
    console.error('[EMAIL DEBUG] ❌ ERRORE invio email supporto venditori:', error);
    console.error('[EMAIL DEBUG] Dettagli errore:', {
      message: error.message,
      code: error.code,
      response: error.response?.body
    });
    throw error;
  }
};
