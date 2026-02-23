import * as Sentry from '@sentry/react';

/**
 * Inizializza Sentry per il monitoraggio errori in produzione
 * 
 * Configurazione:
 * - VITE_SENTRY_DSN: URL del progetto Sentry (obbligatorio)
 * - VITE_SENTRY_ENVIRONMENT: ambiente (development/production)
 * - VITE_APP_VERSION: versione app per tracciare errori per release
 */
export const initSentry = () => {
  // Verifica se Sentry è configurato
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.log('ℹ️ [Sentry] DSN non configurato - Sentry disabilitato');
    return;
  }

  // Determina l'ambiente
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || 
                      (import.meta.env.MODE === 'production' ? 'production' : 'development');
  
  // Non inizializzare in sviluppo locale (opzionale)
  if (environment === 'development' && window.location.hostname === 'localhost') {
    console.log('ℹ️ [Sentry] Disabilitato in sviluppo locale');
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment,
      
      // Release tracking - utile per sapere quale versione ha generato l'errore
      release: import.meta.env.VITE_APP_VERSION || 'unknown',
      
      // Integrations base (BrowserTracing e Replay rimossi - non disponibili in questa versione)
      integrations: [],
      
      // Performance Monitoring - disabilitato per compatibilità
      tracesSampleRate: 0,
      
      // Session Replay - disabilitato (feature non disponibile in questa versione di Sentry)
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      
      // Filtra errori noti/non rilevanti
      beforeSend(event, hint) {
        const error = hint.originalException;
        
        // Ignora errori da estensioni browser
        if (error && error.message && (
          error.message.includes('chrome-extension://') ||
          error.message.includes('moz-extension://') ||
          error.message.includes('safari-extension://')
        )) {
          return null; // Non inviare
        }
        
        // Ignora errori di rete temporanei
        if (error && error.message && error.message.includes('NetworkError')) {
          return null;
        }
        
        return event;
      },
      
      // Ignora breadcrumbs console in produzione (per privacy)
      beforeBreadcrumb(breadcrumb) {
        if (breadcrumb.category === 'console' && environment === 'production') {
          return null;
        }
        return breadcrumb;
      },
      
      // Debug in development
      debug: environment === 'development',
      
      // Limita numero di breadcrumbs per performance
      maxBreadcrumbs: 50,
    });

    console.log(`✅ [Sentry] Inizializzato in ambiente: ${environment}`);
  } catch (error) {
    console.error('❌ [Sentry] Errore inizializzazione:', error);
  }
};

/**
 * Utility per tracciare eventi custom (opzionale)
 */
export const captureMessage = (message, level = 'info') => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  }
};

/**
 * Utility per catturare eccezioni manualmente
 */
export const captureException = (error, context = {}) => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
};

/**
 * Imposta informazioni utente per tracciare errori per utente
 */
export const setUser = (user) => {
  if (import.meta.env.VITE_SENTRY_DSN && user) {
    Sentry.setUser({
      id: user._id,
      email: user.email,
      role: user.role,
      // Non inviare dati sensibili
    });
  }
};

/**
 * Rimuove informazioni utente (al logout)
 */
export const clearUser = () => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser(null);
  }
};

export default Sentry;
