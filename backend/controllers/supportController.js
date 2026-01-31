import { sendVendorSupportEmail } from '../utils/emailTemplates.js';

// Invia richiesta di supporto per venditori
export const sendVendorSupport = async (req, res) => {
  console.log('[SUPPORT CONTROLLER] Richiesta supporto venditore ricevuta');
  console.log('[SUPPORT CONTROLLER] Dati ricevuti:', req.body);
  console.log('[SUPPORT CONTROLLER] Utente autenticato:', req.user?.email, 'Ruolo:', req.user?.role);
  
  try {
    const { nome, azienda, email, telefono, descrizione } = req.body;

    // Validazione campi
    if (!nome || !email || !descrizione) {
      console.log('[SUPPORT CONTROLLER] ❌ Validazione fallita: campi mancanti');
      return res.status(400).json({ message: 'Nome, email e descrizione sono obbligatori' });
    }

    // Verifica che l'utente sia un venditore o admin
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accesso negato. Solo venditori e admin possono richiedere supporto.' });
    }

    // Invia email
    console.log('[SUPPORT CONTROLLER] Invio email in corso...');
    await sendVendorSupportEmail(nome, azienda, email, telefono, descrizione);
    console.log('[SUPPORT CONTROLLER] ✅ Email inviata con successo');

    res.status(200).json({ message: 'Richiesta di supporto inviata con successo' });
  } catch (error) {
    console.error('[SUPPORT CONTROLLER] ❌ ERRORE invio richiesta supporto:', error);
    console.error('[SUPPORT CONTROLLER] Stack trace:', error.stack);
    console.error('[SUPPORT CONTROLLER] Dettagli errore:', {
      message: error.message,
      code: error.code,
      response: error.response?.body
    });
    
    // Gestione errore SendGrid
    if (error.code === 401) {
      console.error('[SUPPORT CONTROLLER] Errore 401: API Key SendGrid non valida o mancante');
      return res.status(500).json({ 
        message: 'Errore di configurazione email. Contatta l\'amministratore del sistema.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Errore durante l\'invio della richiesta di supporto',
      error: error.message 
    });
  }
};
