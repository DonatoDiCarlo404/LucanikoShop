import express from 'express';
import { register, login, getProfile, googleCallback } from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';
import passport from '../config/passport.js';

const router = express.Router();

// Rotte pubbliche
router.post('/register', register);
router.post('/login', login);

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

export default router;