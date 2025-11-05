import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protegge le route che richiedono autenticazione
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Estrai il token dall'header
      token = req.headers.authorization.split(' ')[1];

      // Verifica il token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Aggiungi l'utente alla request (senza password)
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Non autorizzato, token non valido' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Non autorizzato, token mancante' });
  }
};

// Middleware per verificare se l'utente è admin
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Accesso negato, solo admin' });
  }
};

// Middleware per verificare se l'utente è seller
export const seller = (req, res, next) => {
  if (req.user && (req.user.role === 'seller' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Accesso negato, solo seller' });
  }
};