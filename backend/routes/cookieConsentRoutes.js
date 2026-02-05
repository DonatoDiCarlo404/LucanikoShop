import express from 'express';
import {
  saveCookieConsent,
  getLatestConsent,
  getAllConsents,
  getConsentStats,
  revokeConsent
} from '../controllers/cookieConsentController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// Rotte pubbliche (senza autenticazione)
router.post('/', saveCookieConsent); // Salva consenso
router.get('/latest', getLatestConsent); // Recupera ultimo consenso
router.post('/revoke', revokeConsent); // Revoca consenso

// Rotte admin (con autenticazione e verifica ruolo admin)
router.get('/admin/all', protect, getAllConsents); // Tutti i consensi (solo admin)
router.get('/admin/stats', protect, getConsentStats); // Statistiche (solo admin)

export default router;
