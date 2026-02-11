import logger from '../config/logger.js';

/**
 * Middleware per loggare tutte le richieste HTTP
 * Include: method, URL, status code, response time, IP, user
 */
export const httpLogger = (req, res, next) => {
  const startTime = Date.now();

  // Genera requestId univoco per tracciare la richiesta
  req.requestId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // Cattura la fine della risposta
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
      userId: req.user?._id,
      userRole: req.user?.role,
    };

    // Log basato sul status code
    if (res.statusCode >= 500) {
      logger.error('HTTP Request Error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request Client Error', logData);
    } else {
      logger.http('HTTP Request', logData);
    }
  });

  next();
};

/**
 * Middleware per loggare operazioni di autenticazione
 */
export const logAuth = (action, userId, email, metadata = {}) => {
  logger.info(`AUTH: ${action}`, {
    component: 'AUTH',
    action,
    userId,
    email,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

/**
 * Middleware per loggare operazioni su ordini
 */
export const logOrder = (action, orderId, userId, amount, metadata = {}) => {
  logger.info(`ORDER: ${action}`, {
    component: 'ORDER',
    action,
    orderId,
    userId,
    amount,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

/**
 * Middleware per loggare operazioni di pagamento
 */
export const logPayment = (action, paymentId, amount, status, metadata = {}) => {
  logger.info(`PAYMENT: ${action}`, {
    component: 'PAYMENT',
    action,
    paymentId,
    amount,
    status,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

/**
 * Middleware per loggare operazioni CRUD su prodotti
 */
export const logProduct = (action, productId, sellerId, metadata = {}) => {
  logger.info(`PRODUCT: ${action}`, {
    component: 'PRODUCT',
    action,
    productId,
    sellerId,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

/**
 * Middleware per loggare tentativi di accesso sospetti
 */
export const logSecurityEvent = (event, severity, metadata = {}) => {
  const logMethod = severity === 'critical' ? logger.critical : logger.warn;
  logMethod(`SECURITY: ${event}`, {
    component: 'SECURITY',
    event,
    severity,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

export default {
  httpLogger,
  logAuth,
  logOrder,
  logPayment,
  logProduct,
  logSecurityEvent
};
