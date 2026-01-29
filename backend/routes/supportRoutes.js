import express from 'express';
import { sendVendorSupport } from '../controllers/supportController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// POST /api/support/vendor - Invia richiesta supporto (protetto, solo seller/admin)
router.post('/vendor', protect, sendVendorSupport);

export default router;
