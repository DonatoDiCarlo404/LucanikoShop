import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protegge le route che richiedono autenticazione
export const protect = async (req, res, next) => {
  let token;

  console.log('[AUTH] Richiesta:', req.method, req.path);
  console.log('[AUTH] Headers authorization:', req.headers.authorization ? 'presente' : 'mancante');

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Estrai il token dall'header
      token = req.headers.authorization.split(' ')[1];

      // Verifica il token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Aggiungi l'utente alla request (senza password)
      req.user = await User.findById(decoded.id).select('-password');

      console.log('[AUTH] User autenticato:', req.user._id, req.user.role);
      next();
    } catch (error) {
      console.error('[AUTH] Errore verifica token:', error.message);
      return res.status(401).json({ message: 'Non autorizzato, token non valido' });
    }
  }

  if (!token) {
    console.log('[AUTH] Token mancante');
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
  console.log('[SELLER MIDDLEWARE] User role:', req.user?.role, 'isApproved:', req.user?.isApproved);
  
  if (req.user && (req.user.role === 'seller' || req.user.role === 'admin')) {
    // Gli admin bypassano sempre il controllo isApproved
    if (req.user.role === 'admin') {
      console.log('[SELLER MIDDLEWARE] Admin bypass');
      return next();
    }
    // I seller devono essere approvati
    if (req.user.role === 'seller' && !req.user.isApproved) {
      console.log('[SELLER MIDDLEWARE] Seller non approvato');
      return res.status(403).json({ 
        message: 'Account in attesa di approvazione',
        needsApproval: true 
      });
    }
    next();
  } else {
    console.log('[SELLER MIDDLEWARE] Accesso negato - ruolo:', req.user?.role);
    res.status(403).json({ message: 'Accesso negato, solo seller' });
  }
};

// Middleware per autorizzare uno o più ruoli
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accesso negato, ruolo non autorizzato' });
    }
    next();
  };
};

// Middleware opzionale per autenticazione (non blocca se token mancante)
// Utile per route che supportano sia utenti loggati che guest
export const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Estrai il token dall'header
      token = req.headers.authorization.split(' ')[1];

      // Verifica il token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Aggiungi l'utente alla request (senza password)
      req.user = await User.findById(decoded.id).select('-password');
      
      console.log('🔐 [optionalAuth] Utente autenticato:', { id: req.user._id, email: req.user.email });
    } catch (error) {
      console.error('⚠️ [optionalAuth] Token non valido, continua come guest:', error.message);
      req.user = null;
    }
  } else {
    console.log('🔐 [optionalAuth] Nessun token, continua come guest');
    req.user = null;
  }

  next();
};