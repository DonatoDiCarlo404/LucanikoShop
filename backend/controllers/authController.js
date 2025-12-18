import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { sendWelcomeEmail } from '../utils/emailTemplates.js';

// @desc    Registra un nuovo utente
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Verifica se l'utente esiste già
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'Utente già registrato' });
    }

    // Crea nuovo utente
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'buyer'
    });

    if (user) {
      // Invia email di benvenuto (non blocca la registrazione se fallisce)
      try {
        await sendWelcomeEmail(user.email, user.name);
      } catch (emailError) {
        console.error('Errore invio email di benvenuto:', emailError);
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Dati utente non validi' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login utente
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Trova l'utente e includi la password
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Email o password non validi' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Ottieni profilo utente
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar
      });
    } else {
      res.status(404).json({ message: 'Utente non trovato' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
export const googleCallback = async (req, res) => {
  try {
    // L'utente è già stato autenticato da Passport
    const token = generateToken(req.user._id);
    
    // Reindirizza al frontend con il token
    res.redirect(`http://localhost:5173/auth/success?token=${token}`);
  } catch (error) {
    res.redirect('http://localhost:5173/auth/error');
  }
};