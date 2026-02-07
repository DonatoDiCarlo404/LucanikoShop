import rateLimit from 'express-rate-limit';

// Rate limiter per login/registrazione - previene brute force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 5, // 5 tentativi per IP
  message: 'Troppi tentativi di login. Riprova tra 15 minuti.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false // Conta anche i login riusciti
});

// Rate limiter per operazioni di pagamento - previene abusi
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 richieste per minuto per IP
  message: 'Troppe richieste di pagamento. Riprova tra un minuto.',
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter per API pubbliche generiche
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // 100 richieste per IP
  message: 'Troppe richieste. Riprova tra 15 minuti.',
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter per export/download - previene sovraccarico
export const exportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5, // 5 download per minuto
  message: 'Troppi download. Riprova tra un minuto.',
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter per operazioni admin - limiti più permissivi
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 50, // 50 richieste per IP (permette registrazioni multiple)
  message: 'Troppe richieste admin. Riprova tra 15 minuti.',
  standardHeaders: true,
  legacyHeaders: false
});
