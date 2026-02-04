import { body, param, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';

// Middleware per gestire errori di validazione
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Errore di validazione',
      errors: errors.array() 
    });
  }
  next();
};

// Validatore per MongoDB ObjectId
export const isValidObjectId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error('ID non valido');
  }
  return true;
};

// Validatori per Payout ID (usato in admin routes)
export const validatePayoutId = [
  param('payoutId')
    .trim()
    .notEmpty().withMessage('Payout ID richiesto')
    .custom(isValidObjectId).withMessage('Payout ID non valido'),
  handleValidationErrors
];

// Validatori per Order ID
export const validateOrderId = [
  param('id')
    .trim()
    .notEmpty().withMessage('Order ID richiesto')
    .custom(isValidObjectId).withMessage('Order ID non valido'),
  handleValidationErrors
];

// Validatori per query params paginazione
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page deve essere >= 1')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit deve essere tra 1 e 100')
    .toInt(),
  handleValidationErrors
];

// Validatori per date range
export const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601().withMessage('startDate deve essere una data valida (YYYY-MM-DD)')
    .toDate(),
  query('endDate')
    .optional()
    .isISO8601().withMessage('endDate deve essere una data valida (YYYY-MM-DD)')
    .toDate(),
  handleValidationErrors
];

// Validatori per vendor ID in query
export const validateVendorIdQuery = [
  query('vendorId')
    .optional()
    .trim()
    .custom(isValidObjectId).withMessage('Vendor ID non valido'),
  handleValidationErrors
];

// Validatori per status in query
export const validateStatusQuery = [
  query('status')
    .optional()
    .trim()
    .isIn(['pending', 'paid', 'failed', 'processing']).withMessage('Status non valido'),
  handleValidationErrors
];

// Validatore per nota pagamento manuale
export const validateMarkAsPaidBody = [
  body('note')
    .optional()
    .trim()
    .escape() // Sanitizza HTML/XSS
    .isLength({ max: 500 }).withMessage('Nota troppo lunga (max 500 caratteri)'),
  handleValidationErrors
];

// Validatori completi per admin payment routes
export const validateAdminPaymentFilters = [
  ...validatePagination,
  ...validateDateRange,
  ...validateVendorIdQuery,
  ...validateStatusQuery
];

// Validatori per vendor earnings routes
export const validateVendorEarningsFilters = [
  ...validatePagination,
  ...validateDateRange,
  validateStatusQuery[0],
  handleValidationErrors
];
