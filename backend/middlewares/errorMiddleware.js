// middleware/errorMiddleware.js

// Gestione rotte non trovate (404)
export const notFound = (req, res, next) => {
  const error = new Error(`❌ Route non trovata: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Middleware generale cattura errori
export const errorHandler = (err, req, res, next) => {
  console.error("🔥 ERRORE:", err);

  // Se l’errore viene dopo un 404 mantiene lo status, altrimenti 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

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
