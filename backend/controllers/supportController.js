import { sendVendorSupportEmail } from '../utils/emailTemplates.js';

// Invia richiesta di supporto per venditori
export const sendVendorSupport = async (req, res) => {
  try {
    const { nome, azienda, email, telefono, descrizione } = req.body;

    // Validazione campi
    if (!nome || !email || !descrizione) {
      return res.status(400).json({ message: 'Nome, email e descrizione sono obbligatori' });
    }

    // Verifica che l'utente sia un venditore o admin
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accesso negato. Solo venditori e admin possono richiedere supporto.' });
    }

    // Invia email
    await sendVendorSupportEmail(nome, azienda, email, telefono, descrizione);

    res.status(200).json({ message: 'Richiesta di supporto inviata con successo' });
  } catch (error) {
    console.error('Errore invio richiesta supporto:', error);
    
    // Gestione errore SendGrid
    if (error.code === 401) {
      return res.status(500).json({ 
        message: 'Errore di configurazione email. Contatta l\'amministratore del sistema.' 
      });
    }
    
    res.status(500).json({ message: 'Errore durante l\'invio della richiesta di supporto' });
  }
};
