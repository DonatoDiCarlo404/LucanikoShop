import { useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const COOKIE_KEY = "lucaniko_cookie_consent";
const ANONYMOUS_ID_KEY = "lucaniko_anonymous_id";

const getOrCreateAnonymousId = () => {
  let id = localStorage.getItem(ANONYMOUS_ID_KEY);
  if (!id) {
    id = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(ANONYMOUS_ID_KEY, id);
  }
  return id;
};

const CookiePreferences = ({ show, onHide }) => {
  // Carica le preferenze attuali dal localStorage
  const currentPrefs = JSON.parse(localStorage.getItem(COOKIE_KEY) || '{"technical": true, "preferences": false, "analytics": false, "marketing": false}');
  
  const [prefs, setPrefs] = useState({
    technical: true,
    preferences: currentPrefs.preferences || false,
    analytics: currentPrefs.analytics || false,
    marketing: currentPrefs.marketing || false
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Salva nel backend
  const saveConsentToBackend = async (preferences, action) => {
    try {
      const anonymousId = getOrCreateAnonymousId();
      
      const response = await fetch(`${API_URL}/cookie-consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          anonymousId,
          preferences,
          action,
          policyVersion: '1.0',
          consentMethod: 'preferences_center'
        })
      });

      if (!response.ok) {
        throw new Error('Errore nel salvare il consenso');
      }
    } catch (error) {
      console.error('Errore nel salvare il consenso:', error);
      throw error;
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      // Salva in localStorage
      localStorage.setItem(COOKIE_KEY, JSON.stringify({ ...prefs, accepted: true }));
      
      // Salva nel backend
      await saveConsentToBackend(prefs, 'update');
      
      setMessage({ type: 'success', text: 'Preferenze salvate con successo!' });
      
      // Chiudi dopo 2 secondi
      setTimeout(() => {
        onHide();
        // Ricarica per applicare i cambiamenti
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage({ type: 'danger', text: 'Errore nel salvare le preferenze. Riprova.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeAll = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const onlyTechnical = {
        technical: true,
        preferences: false,
        analytics: false,
        marketing: false
      };
      
      localStorage.setItem(COOKIE_KEY, JSON.stringify({ ...onlyTechnical, accepted: false }));
      await saveConsentToBackend(onlyTechnical, 'revoke');
      
      setMessage({ type: 'success', text: 'Tutti i consensi sono stati revocati!' });
      
      setTimeout(() => {
        onHide();
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage({ type: 'danger', text: 'Errore nella revoca. Riprova.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAcceptAll = async () => {
    const allPrefs = {
      technical: true,
      preferences: true,
      analytics: true,
      marketing: true
    };
    setPrefs(allPrefs);
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-gear-fill me-2"></i>
          Centro Preferenze Cookie
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {message && (
          <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}
        
        <p className="mb-4">
          Gestisci le tue preferenze cookie. Puoi modificare o revocare il tuo consenso in qualsiasi momento.
        </p>

        <Form>
          <div className="mb-4 p-3 border rounded">
            <Form.Check
              type="switch"
              id="cookie-tech"
              className="mb-2"
            >
              <Form.Check.Input type="checkbox" checked disabled />
              <Form.Check.Label>
                <strong>Cookie Tecnici (Necessari)</strong>
                <div className="small text-muted">
                  Essenziali per il funzionamento del sito (login, carrello, sicurezza). 
                  Sempre attivi e non richiedono consenso.
                </div>
              </Form.Check.Label>
            </Form.Check>
          </div>

          <div className="mb-4 p-3 border rounded">
            <Form.Check
              type="switch"
              id="cookie-pref"
              className="mb-2"
              checked={prefs.preferences}
              onChange={e => setPrefs(p => ({ ...p, preferences: e.target.checked }))}
            >
              <Form.Check.Input type="checkbox" />
              <Form.Check.Label>
                <strong>Cookie di Preferenza/Funzionalità</strong>
                <div className="small text-muted">
                  Memorizzano le tue preferenze (lingua, tema, visualizzazione) per migliorare l'esperienza.
                </div>
              </Form.Check.Label>
            </Form.Check>
          </div>

          <div className="mb-4 p-3 border rounded">
            <Form.Check
              type="switch"
              id="cookie-analytics"
              className="mb-2"
              checked={prefs.analytics}
              onChange={e => setPrefs(p => ({ ...p, analytics: e.target.checked }))}
            >
              <Form.Check.Input type="checkbox" />
              <Form.Check.Label>
                <strong>Cookie Analitici</strong>
                <div className="small text-muted">
                  Ci aiutano a capire come usi il sito per migliorare le prestazioni 
                  (es. Google Analytics).
                </div>
              </Form.Check.Label>
            </Form.Check>
          </div>

          <div className="mb-3 p-3 border rounded">
            <Form.Check
              type="switch"
              id="cookie-marketing"
              checked={prefs.marketing}
              onChange={e => setPrefs(p => ({ ...p, marketing: e.target.checked }))}
            >
              <Form.Check.Input type="checkbox" />
              <Form.Check.Label>
                <strong>Cookie di Marketing/Profilazione</strong>
                <div className="small text-muted">
                  Utilizzati per mostrarti contenuti e pubblicità personalizzati 
                  (es. Facebook Pixel, Google Ads).
                </div>
              </Form.Check.Label>
            </Form.Check>
          </div>
        </Form>

        <div className="alert alert-info mt-4">
          <i className="bi bi-info-circle-fill me-2"></i>
          <small>
            Puoi cambiare queste impostazioni in qualsiasi momento dal footer del sito.
          </small>
        </div>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <div>
          <Button 
            variant="outline-danger" 
            size="sm" 
            onClick={handleRevokeAll}
            disabled={saving}
          >
            <i className="bi bi-x-circle me-1"></i>
            Revoca Tutti
          </Button>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-success" 
            size="sm" 
            onClick={handleAcceptAll}
            disabled={saving}
          >
            Accetta Tutti
          </Button>
          <Button 
            variant="secondary" 
            onClick={onHide}
            disabled={saving}
          >
            Annulla
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSavePreferences}
            disabled={saving}
          >
            {saving ? 'Salvataggio...' : 'Salva Preferenze'}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default CookiePreferences;
