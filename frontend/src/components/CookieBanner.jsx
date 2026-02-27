import { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const COOKIE_KEY = "lucaniko_cookie_consent";
const ANONYMOUS_ID_KEY = "lucaniko_anonymous_id";

// Genera ID anonimo univoco
const getOrCreateAnonymousId = () => {
  let id = localStorage.getItem(ANONYMOUS_ID_KEY);
  if (!id) {
    id = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(ANONYMOUS_ID_KEY, id);
  }
  return id;
};

const defaultPrefs = {
  technical: true,
  preferences: false,
  analytics: false,
  marketing: false,
};

const CookieBanner = () => {
  const [show, setShow] = useState(() => !localStorage.getItem(COOKIE_KEY));
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState(defaultPrefs);

  // Funzione per salvare il consenso nel backend
  const saveConsentToBackend = async (preferences, action, method = 'banner') => {
    try {
      const anonymousId = getOrCreateAnonymousId();
      
      await fetch(`${API_URL}/cookie-consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          anonymousId,
          preferences,
          action,
          policyVersion: '1.0',
          consentMethod: method
        })
      });
    } catch (error) {
      console.error('Errore nel salvare il consenso:', error);
      // Non bloccare l'utente se il salvataggio fallisce
    }
  };

  const handleAccept = async () => {
    const allAccepted = {
      technical: true,
      preferences: true,
      analytics: true,
      marketing: true
    };
    
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ ...allAccepted, accepted: true }));
    await saveConsentToBackend(allAccepted, 'accept_all', 'banner');
    setShow(false);
  };

  const handleReject = async () => {
    const onlyTechnical = {
      technical: true,
      preferences: false,
      analytics: false,
      marketing: false
    };
    
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ ...onlyTechnical, accepted: false }));
    await saveConsentToBackend(onlyTechnical, 'reject_all', 'banner');
    setShow(false);
  };

  const handleSavePrefs = async () => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ ...prefs, accepted: true }));
    await saveConsentToBackend(prefs, 'customize', 'preferences_center');
    setShow(false);
    setShowPrefs(false);
  };

  if (!show) return null;

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 2000, background: "#fff", borderTop: "1px solid #ddd", boxShadow: "0 -2px 12px rgba(0,0,0,0.07)", padding: "1.2rem 1rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ maxWidth: 700, textAlign: "center", marginBottom: 12 }}>
        Questo sito utilizza cookie tecnici e, previo consenso, cookie di preferenza, analitici e marketing per migliorare l’esperienza. Consulta la nostra {" "}
        <a href="/cookie-policy" style={{ textDecoration: "underline", color: "#0d6efd" }}>Cookie Policy</a>
        {" "}o il nostro{" "}
        <a href="/cookie-list" style={{ textDecoration: "underline", color: "#0d6efd" }}>Elenco Cookie</a>.
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Button variant="secondary" size="sm" onClick={() => setShowPrefs(true)}>
          Preferenze
        </Button>
        <Button variant="success" size="sm" onClick={handleAccept}>
          Accetta
        </Button>
        <Button variant="outline-secondary" size="sm" onClick={handleReject}>
          Rifiuta
        </Button>
      </div>
      <Modal show={showPrefs} onHide={() => setShowPrefs(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Preferenze Cookie</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Check
              type="switch"
              id="cookie-tech"
              label="Cookie tecnici (necessari)"
              checked
              disabled
            />
            <Form.Check
              type="switch"
              id="cookie-pref"
              label="Cookie di preferenza/funzionalità"
              checked={prefs.preferences}
              onChange={e => setPrefs(p => ({ ...p, preferences: e.target.checked }))}
            />
            <Form.Check
              type="switch"
              id="cookie-analytics"
              label="Cookie analitici"
              checked={prefs.analytics}
              onChange={e => setPrefs(p => ({ ...p, analytics: e.target.checked }))}
            />
            <Form.Check
              type="switch"
              id="cookie-marketing"
              label="Cookie di marketing/profilazione"
              checked={prefs.marketing}
              onChange={e => setPrefs(p => ({ ...p, marketing: e.target.checked }))}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPrefs(false)}>
            Annulla
          </Button>
          <Button variant="primary" onClick={handleSavePrefs}>
            Salva preferenze
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CookieBanner;
