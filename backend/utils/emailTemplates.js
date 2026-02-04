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
  } catch (error) {
    console.error('Errore invio email registrazione venditore:', error);
    throw error;
  }
};

// Email di benvenuto alla registrazione acquirente
export const sendWelcomeEmail = async (userEmail, userName, loginLink = 'https://www.lucanikoshop.it/login') => {
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
    await sgMail.send(msg);
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
    await sgMail.send(msg);
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

// Email notifica pagamento ricevuto
export const sendPaymentReceivedEmail = async (vendorEmail, companyName, amount, paymentDate, orderNumber, stripeTransferId, dashboardLink = 'https://www.lucanikoshop.it/vendor-dashboard') => {
  const formattedAmount = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);

  const formattedDate = new Date(paymentDate).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const msg = {
    to: vendorEmail,
    from: 'pagamenti@lucanikoshop.it',
    subject: `💰 Pagamento ricevuto: ${formattedAmount}`,
    text: `Ciao ${companyName},\n\nabbiamo effettuato un bonifico sul tuo conto Stripe Connect.\n\nDettagli pagamento:\n\nImporto: ${formattedAmount}\nData pagamento: ${formattedDate}\nOrdine: #${orderNumber}\nID Trasferimento Stripe: ${stripeTransferId}\n\nAccedi al tuo pannello: ${dashboardLink}\n\nIl pagamento è stato accreditato sul tuo account Stripe. Puoi visualizzare tutti i dettagli nella sezione "Pagamenti Ricevuti" del tuo pannello venditore.\n\nContinua così,\nIl team Lucaniko\n\nwww.lucanikoshop.it`,
    html: `Ciao <strong>${companyName}</strong>,<br><br>
abbiamo effettuato un bonifico sul tuo conto <strong>Stripe Connect</strong>. 💸<br><br>
<div style="background: #f8f9fa; border-left: 4px solid #28a745; padding: 1.5em; margin: 1.5em 0; border-radius: 4px;">
  <h3 style="color: #28a745; margin-top: 0;">Dettagli pagamento</h3>
  <ul style="list-style: none; padding: 0; margin: 0;">
    <li style="padding: 0.5em 0;"><strong>Importo:</strong> <span style="color: #28a745; font-size: 1.2em; font-weight: bold;">${formattedAmount}</span></li>
    <li style="padding: 0.5em 0;"><strong>Data pagamento:</strong> ${formattedDate}</li>
    <li style="padding: 0.5em 0;"><strong>Ordine:</strong> #${orderNumber}</li>
    <li style="padding: 0.5em 0;"><strong>ID Trasferimento Stripe:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 3px; font-size: 0.9em;">${stripeTransferId}</code></li>
  </ul>
</div>
<p style="margin: 1.5em 0;">
  <a href="${dashboardLink}" style="background: #004b75; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">📊 Vai al Pannello Venditore</a>
</p>
<p>Il pagamento è stato accreditato sul tuo account Stripe. Puoi visualizzare tutti i dettagli nella sezione <strong>"Pagamenti Ricevuti"</strong> del tuo pannello venditore.</p>
<br>
Continua così,<br>
Il team Lucaniko<br><br>
<a href="https://www.lucanikoshop.it" style="color: #004b75; text-decoration: underline;">www.lucanikoshop.it</a>`
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('[EMAIL DEBUG] ❌ ERRORE invio email pagamento ricevuto:', error);
    console.error('[EMAIL DEBUG] Dettagli errore:', {
      message: error.message,
      code: error.code,
      response: error.response?.body
    });
    throw error;
  }
};

// Email notifica rimborso ordine
export const sendRefundNotificationEmail = async (vendorEmail, companyName, orderNumber, refundAmount, refundReason, isPostPayment = false, debtInfo = null, dashboardLink = 'https://www.lucanikoshop.it/vendor-dashboard') => {
  const formattedAmount = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(refundAmount);

  // Testo diverso se il rimborso è pre o post-pagamento
  let bodyText = '';
  let bodyHtml = '';

  if (isPostPayment && debtInfo) {
    // Rimborso post-pagamento: venditore già pagato, viene creato un debito
    bodyText = `L'ordine #${orderNumber} è stato rimborsato al cliente.\n\n⚠️ ATTENZIONE: Hai già ricevuto il pagamento per questo ordine.\n\nAbbiamo registrato un debito di ${formattedAmount} che verrà automaticamente detratto dal tuo prossimo pagamento.\n\nMotivo rimborso: ${refundReason}\n\nIl debito verrà saldato al prossimo pagamento automatico (dopo 14 giorni dalla prossima vendita).\n\nAccedi al tuo pannello: ${dashboardLink}`;
    
    bodyHtml = `L'ordine <strong>#${orderNumber}</strong> è stato rimborsato al cliente.<br><br>
<div style="background: #fff3cd; border-left: 4px solid #ff6b6b; padding: 1.5em; margin: 1.5em 0; border-radius: 4px;">
  <h3 style="color: #ff6b6b; margin-top: 0;">⚠️ ATTENZIONE: Debito registrato</h3>
  <p style="margin: 0.5em 0;">Hai già ricevuto il pagamento per questo ordine.</p>
  <p style="margin: 0.5em 0;">Abbiamo registrato un debito di <strong style="color: #dc3545; font-size: 1.1em;">${formattedAmount}</strong> che verrà automaticamente detratto dal tuo prossimo pagamento.</p>
  <p style="margin: 0.5em 0;"><strong>Motivo rimborso:</strong> ${refundReason}</p>
</div>
<p>Il debito verrà saldato al prossimo pagamento automatico (dopo 14 giorni dalla prossima vendita).</p>
<p style="margin: 1.5em 0;">
  <a href="${dashboardLink}" style="background: #004b75; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">📊 Vai al Pannello Venditore</a>
</p>`;
  } else {
    // Rimborso pre-pagamento: earnings cancellati prima del pagamento
    bodyText = `L'ordine #${orderNumber} è stato rimborsato al cliente.\n\nL'importo di ${formattedAmount} che era in attesa di pagamento è stato cancellato e non verrà trasferito.\n\nMotivo rimborso: ${refundReason}\n\nAccedi al tuo pannello: ${dashboardLink}`;
    
    bodyHtml = `L'ordine <strong>#${orderNumber}</strong> è stato rimborsato al cliente.<br><br>
<div style="background: #f8f9fa; border-left: 4px solid #ffc107; padding: 1.5em; margin: 1.5em 0; border-radius: 4px;">
  <h3 style="color: #856404; margin-top: 0;">ℹ️ Earnings cancellati</h3>
  <p style="margin: 0.5em 0;">L'importo di <strong style="color: #856404; font-size: 1.1em;">${formattedAmount}</strong> che era in attesa di pagamento è stato cancellato e non verrà trasferito.</p>
  <p style="margin: 0.5em 0;"><strong>Motivo rimborso:</strong> ${refundReason}</p>
</div>
<p style="margin: 1.5em 0;">
  <a href="${dashboardLink}" style="background: #004b75; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">📊 Vai al Pannello Venditore</a>
</p>`;
  }

  const msg = {
    to: vendorEmail,
    from: 'ordini@lucanikoshop.it',
    subject: `🔄 Rimborso ordine #${orderNumber}`,
    text: `Ciao ${companyName},\n\n${bodyText}\n\nSe hai domande, contattaci tramite il Centro Assistenza.\n\nCordiali saluti,\nIl team Lucaniko\n\nwww.lucanikoshop.it`,
    html: `Ciao <strong>${companyName}</strong>,<br><br>
${bodyHtml}
<p>Se hai domande, contattaci tramite il Centro Assistenza.</p>
<br>
Cordiali saluti,<br>
Il team Lucaniko<br><br>
<a href="https://www.lucanikoshop.it" style="color: #004b75; text-decoration: underline;">www.lucanikoshop.it</a>`
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('[EMAIL DEBUG] ❌ ERRORE invio email notifica rimborso:', error);
    console.error('[EMAIL DEBUG] Dettagli errore:', {
      message: error.message,
      code: error.code,
      response: error.response?.body
    });
    throw error;
  }
};
