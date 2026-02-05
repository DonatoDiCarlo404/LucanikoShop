import CookieConsent from '../models/CookieConsent.js';

// @desc    Salva il consenso cookie dell'utente
// @route   POST /api/cookie-consent
// @access  Public
export const saveCookieConsent = async (req, res) => {
  try {
    const { anonymousId, preferences, action, policyVersion, consentMethod } = req.body;

    // Ottieni IP (hashato per privacy)
    const ipAddress = CookieConsent.hashIP(
      req.headers['x-forwarded-for']?.split(',')[0] || 
      req.connection.remoteAddress || 
      req.socket.remoteAddress ||
      'unknown'
    );

    // User agent
    const userAgent = req.headers['user-agent'] || 'unknown';

    // userId se autenticato
    const userId = req.user?._id || null;

    // Crea il record del consenso
    const consent = await CookieConsent.create({
      userId,
      anonymousId: anonymousId || `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ipAddress,
      userAgent,
      preferences: {
        technical: true, // Sempre true
        preferences: preferences?.preferences || false,
        analytics: preferences?.analytics || false,
        marketing: preferences?.marketing || false
      },
      action: action || 'accept_all',
      policyVersion: policyVersion || '1.0',
      consentMethod: consentMethod || 'banner',
      consentDate: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Consenso registrato con successo',
      consentId: consent._id
    });
  } catch (error) {
    console.error('Errore nel salvare il consenso cookie:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel registrare il consenso',
      error: error.message
    });
  }
};

// @desc    Recupera l'ultimo consenso dell'utente (per verificare)
// @route   GET /api/cookie-consent/latest
// @access  Public
export const getLatestConsent = async (req, res) => {
  try {
    const { anonymousId } = req.query;
    const userId = req.user?._id;

    let query = {};
    
    if (userId) {
      query.userId = userId;
    } else if (anonymousId) {
      query.anonymousId = anonymousId;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Nessun identificativo fornito'
      });
    }

    const consent = await CookieConsent
      .findOne(query)
      .sort({ consentDate: -1 })
      .select('-ipAddress -userAgent'); // Non esporre dati sensibili

    if (!consent) {
      return res.status(404).json({
        success: false,
        message: 'Nessun consenso trovato'
      });
    }

    res.json({
      success: true,
      consent: {
        preferences: consent.preferences,
        action: consent.action,
        policyVersion: consent.policyVersion,
        consentDate: consent.consentDate,
        expiryDate: consent.expiryDate
      }
    });
  } catch (error) {
    console.error('Errore nel recuperare il consenso:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recuperare il consenso',
      error: error.message
    });
  }
};

// @desc    Ottieni tutti i consensi (SOLO ADMIN)
// @route   GET /api/cookie-consent/admin/all
// @access  Private/Admin
export const getAllConsents = async (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accesso negato. Solo amministratori.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Filtri opzionali
    const filters = {};
    if (req.query.action) filters.action = req.query.action;
    if (req.query.userId) filters.userId = req.query.userId;
    if (req.query.startDate) {
      filters.consentDate = { $gte: new Date(req.query.startDate) };
    }
    if (req.query.endDate) {
      filters.consentDate = { 
        ...filters.consentDate, 
        $lte: new Date(req.query.endDate) 
      };
    }

    const consents = await CookieConsent
      .find(filters)
      .populate('userId', 'name email businessName')
      .sort({ consentDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CookieConsent.countDocuments(filters);

    res.json({
      success: true,
      consents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Errore nel recuperare i consensi:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recuperare i consensi',
      error: error.message
    });
  }
};

// @desc    Ottieni statistiche consensi (SOLO ADMIN)
// @route   GET /api/cookie-consent/admin/stats
// @access  Private/Admin
export const getConsentStats = async (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accesso negato. Solo amministratori.'
      });
    }

    const totalConsents = await CookieConsent.countDocuments();
    
    const actionStats = await CookieConsent.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } }
    ]);

    const preferenceStats = await CookieConsent.aggregate([
      { $match: { isValid: true } },
      { $sort: { consentDate: -1 } },
      {
        $group: {
          _id: null,
          analyticsAccepted: {
            $sum: { $cond: ['$preferences.analytics', 1, 0] }
          },
          marketingAccepted: {
            $sum: { $cond: ['$preferences.marketing', 1, 0] }
          },
          preferencesAccepted: {
            $sum: { $cond: ['$preferences.preferences', 1, 0] }
          }
        }
      }
    ]);

    const last30Days = await CookieConsent.countDocuments({
      consentDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      stats: {
        total: totalConsents,
        actions: actionStats,
        preferences: preferenceStats[0] || {},
        last30Days
      }
    });
  } catch (error) {
    console.error('Errore nelle statistiche:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recuperare le statistiche',
      error: error.message
    });
  }
};

// @desc    Revoca consenso (utente può revocare)
// @route   POST /api/cookie-consent/revoke
// @access  Public
export const revokeConsent = async (req, res) => {
  try {
    const { anonymousId } = req.body;
    const userId = req.user?._id;

    // Registra la revoca come nuovo record
    await saveCookieConsent({
      ...req,
      body: {
        anonymousId,
        preferences: {
          technical: true,
          preferences: false,
          analytics: false,
          marketing: false
        },
        action: 'revoke',
        policyVersion: '1.0',
        consentMethod: 'preferences_center'
      }
    }, res);
  } catch (error) {
    console.error('Errore nella revoca:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella revoca del consenso',
      error: error.message
    });
  }
};
