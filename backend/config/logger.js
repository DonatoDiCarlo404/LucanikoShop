import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Definisci livelli custom per priorità
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Colori per console (development)
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Formato per file JSON (production)
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Formato per console (development)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Transports
const transports = [
  // Console (sempre attivo)
  new winston.transports.Console({
    format: consoleFormat,
  }),

  // File per errori (solo livello error)
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/error.log'),
    level: 'error',
    format: jsonFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // File per warning
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/warn.log'),
    level: 'warn',
    format: jsonFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 3,
  }),

  // File per tutti i log
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/combined.log'),
    format: jsonFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 7,
  }),

  // File separato per transfer (critical per audit)
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/transfers.log'),
    format: jsonFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 30, // 30 file per compliance/audit
  }),
];

// Crea logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  transports,
  exitOnError: false,
});

// Helper per log transfer specifici
logger.logTransfer = (action, payoutId, vendorId, amount, status, metadata = {}) => {
  logger.info('TRANSFER_EVENT', {
    component: 'PAYMENT',
    action, // 'ATTEMPT', 'SUCCESS', 'FAILED', 'RETRY'
    payoutId,
    vendorId,
    amount,
    status,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

// Helper per log cron job
logger.logCron = (message, metadata = {}) => {
  logger.info(`[CRON] ${message}`, {
    component: 'CRON',
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

// Helper per log webhook
logger.logWebhook = (event, status, metadata = {}) => {
  logger.info(`[WEBHOOK] ${event} - ${status}`, {
    component: 'WEBHOOK',
    event,
    status,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

// Helper per errori critici che richiedono alert
logger.critical = (message, error, metadata = {}) => {
  logger.error(`CRITICAL: ${message}`, {
    component: 'CRITICAL',
    message,
    error: error?.message,
    stack: error?.stack,
    timestamp: new Date().toISOString(),
    requiresAlert: true, // Flag per email alert
    ...metadata
  });
};

export default logger;
