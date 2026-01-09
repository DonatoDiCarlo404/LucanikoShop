import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getProfile, googleCallback, getVendorProfile, updateVendorProfile } from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';
import passport from '../config/passport.js';

const router = express.Router();

// Rate limiting per la login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 5, // massimo 5 tentativi per IP
  message: 'Troppi tentativi di accesso. Riprova tra 15 minuti.'
});

// Rotte pubbliche
router.post('/register', register);
router.post('/login', loginLimiter, login);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: 'http://localhost:3000/auth/error'
  }),
  googleCallback
);

// Rotte protette
router.get('/profile', protect, getProfile);
router.get('/vendor-profile', protect, getVendorProfile);
router.put('/vendor-profile', protect, updateVendorProfile);

export default router;