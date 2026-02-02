import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Componente per il tracciamento di Google Analytics 4
 * Traccia automaticamente le page views quando cambia la route
 */
const GoogleAnalytics = ({ measurementId }) => {
  const location = useLocation();

  useEffect(() => {
    // Carica lo script di Google Analytics solo se measurementId è fornito
    if (!measurementId || typeof window === 'undefined') return;

    // Carica gtag.js script
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.async = true;
    document.head.appendChild(script);

    // Inizializza gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', measurementId, {
      page_path: location.pathname + location.search,
      send_page_view: true
    });

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [measurementId]);

  // Traccia cambio pagina
  useEffect(() => {
    if (!measurementId || typeof window === 'undefined' || !window.gtag) return;

    window.gtag('config', measurementId, {
      page_path: location.pathname + location.search,
    });
  }, [location, measurementId]);

  return null; // Componente invisibile
};

export default GoogleAnalytics;
