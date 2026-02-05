import mongoose from 'mongoose';

const cookieConsentSchema = new mongoose.Schema(
  {
    // Identificativo utente (può essere null per anonimi)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    // Identificativo anonimo (fingerprint browser)
    anonymousId: {
      type: String,
      index: true
    },
    // IP address (hashato per privacy)
    ipAddress: {
      type: String,
      required: true
    },
    // User agent
    userAgent: {
      type: String
    },
    // Preferenze espresse
    preferences: {
      technical: {
        type: Boolean,
        default: true // Sempre true
      },
      preferences: {
        type: Boolean,
        default: false
      },
      analytics: {
        type: Boolean,
        default: false
      },
      marketing: {
        type: Boolean,
        default: false
      }
    },
    // Azione compiuta
    action: {
      type: String,
      enum: ['accept_all', 'reject_all', 'customize', 'revoke', 'update'],
      required: true
    },
    // Versione della Cookie Policy accettata
    policyVersion: {
      type: String,
      default: '1.0'
    },
    // Data e ora del consenso
    consentDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    // Metodo di consenso (banner, preferences_center)
    consentMethod: {
      type: String,
      enum: ['banner', 'preferences_center'],
      default: 'banner'
    },
    // Flag per consenso valido
    isValid: {
      type: Boolean,
      default: true
    },
    // Data di scadenza consenso (opzionale, 12 mesi dalla data)
    expiryDate: {
      type: Date
    },
    // Note aggiuntive
    notes: {
      type: String
    }
  },
  {
    timestamps: true // Aggiunge createdAt e updatedAt automaticamente
  }
);

// Indici per ottimizzare le query
cookieConsentSchema.index({ userId: 1, consentDate: -1 });
cookieConsentSchema.index({ anonymousId: 1, consentDate: -1 });
cookieConsentSchema.index({ ipAddress: 1, consentDate: -1 });
cookieConsentSchema.index({ consentDate: -1 });

// Metodo per hashare l'IP (privacy)
cookieConsentSchema.statics.hashIP = function(ip) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(ip).digest('hex');
};

// Imposta data di scadenza automatica a 12 mesi
cookieConsentSchema.pre('save', function(next) {
  if (!this.expiryDate) {
    this.expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 12 mesi
  }
  next();
});

const CookieConsent = mongoose.model('CookieConsent', cookieConsentSchema);

export default CookieConsent;
