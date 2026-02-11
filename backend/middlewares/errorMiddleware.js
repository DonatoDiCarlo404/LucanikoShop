// middleware/errorMiddleware.js
import logger from '../config/logger.js';

// Gestione rotte non trovate (404)
export const notFound = (req, res, next) => {
  const error = new Error(`❌ Route non trovata: ${req.originalUrl}`);
  res.status(404);
  
  logger.warn('Route not found', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  next(error);
};

// Middleware generale cattura errori
export const errorHandler = (err, req, res, next) => {
  // Se l'errore viene dopo un 404 mantiene lo status, altrimenti 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Prepara dati log
  const errorData = {
    requestId: req.requestId,
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
    userId: req.user?._id,
    statusCode,
    errorType: err.name
  };

  // Log in base alla severità
  if (statusCode >= 500) {
    logger.error('Server Error', errorData);
  } else if (statusCode >= 400) {
    logger.warn('Client Error', errorData);
  }

  // CastError = ObjectId non valido
  if (err.name === "CastError") {
    return res.status(400).json({
      message: `ID non valido: ${err.value}`,
    });
  }

  // ValidationError (mongoose)
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: Object.values(err.errors).map((e) => e.message),
    });
  }

  // Gestione errori personalizzati
  res.status(statusCode).json({
    message: err.message || "Errore del server",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
