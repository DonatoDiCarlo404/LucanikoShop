import { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const COOKIE_KEY = "lucaniko_cookie_consent";

const defaultPrefs = {
  technical: true,
  preferences: false,
  analytics: false,
  marketing: false,
};

const policyPoints = [
  {
    title: "1) Cosa sono i cookie",
    text: `I cookie sono piccoli file di testo che il sito invia al browser dell'utente per memorizzare informazioni (es. preferenze, sessione) e migliorare l'esperienza di navigazione.`
  },
  {
    title: "2) Tipologie di cookie utilizzati",
    text: `2.1 Cookie tecnici (necessari)\nServono al funzionamento del sito (sessione, autenticazione, sicurezza). Non richiedono consenso.\n\n2.2 Cookie di preferenza/funzionalità\nMemorizzano impostazioni (es. lingua). Possono richiedere consenso se non strettamente necessari.\n\n2.3 Cookie analitici\nMisurano traffico e uso del sito. Se non anonimizzati o se di terze parti, possono richiedere consenso.\n\n2.4 Cookie di profilazione/marketing\nTracciano la navigazione per mostrare contenuti o annunci personalizzati. Richiedono consenso esplicito.`
  },
  {
    title: "3) Cookie di terze parti",
    text: `Sul sito possono essere presenti servizi di terze parti (es. social, video, strumenti pubblicitari) che installano cookie. Le terze parti operano come titolari autonomi. (lucaniko.it)\n\nEsempi tipici (verificare quelli effettivamente attivi):\nMeta/Facebook\nGoogle (Analytics/Ads)\nYouTube\nInstagram\nX (Twitter)\nLinkedIn`
  },
  {
    title: "4) Gestione del consenso",
    text: `All'accesso, un banner consente di:\n- accettare tutti\n- rifiutare non necessari\n- personalizzare le preferenze\n\nPuoi modificare le scelte in qualsiasi momento tramite il link "Gestione cookie" (se presente) o dalle impostazioni del browser.`
  },
  {
    title: "5) Come disabilitare i cookie dal browser",
    text: `Puoi gestire o eliminare i cookie dalle impostazioni del browser (Chrome, Firefox, Safari, Edge, Opera).`
  },
  {
    title: "6) Aggiornamenti",
    text: `La Cookie Policy può essere aggiornata per adeguamenti normativi o modifiche dei servizi attivi.`
  }
];

const CookieBanner = () => {
  const [show, setShow] = useState(() => !localStorage.getItem(COOKIE_KEY));
  const [showPrefs, setShowPrefs] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [prefs, setPrefs] = useState(defaultPrefs);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ ...prefs, accepted: true }));
    setShow(false);
  };
  const handleReject = () => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ technical: true, preferences: false, analytics: false, marketing: false, accepted: false }));
    setShow(false);
  };
  const handleSavePrefs = () => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ ...prefs, accepted: true }));
    setShow(false);
    setShowPrefs(false);
  };

  if (!show) return null;

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 2000, background: "#fff", borderTop: "1px solid #ddd", boxShadow: "0 -2px 12px rgba(0,0,0,0.07)", padding: "1.2rem 1rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ maxWidth: 700, textAlign: "center", marginBottom: 12 }}>
        Questo sito utilizza cookie tecnici e, previo consenso, cookie di preferenza, analitici e marketing per migliorare l’esperienza. Consulta la nostra {" "}
        <span onClick={() => setShowPolicy(true)} style={{ textDecoration: "underline", cursor: "pointer", color: "#0d6efd" }}>Cookie Policy</span>.
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

      <Modal show={showPolicy} onHide={() => setShowPolicy(false)} size="lg" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>Cookie Policy – Lucaniko Shop</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-2 text-muted" style={{ fontSize: '0.98rem' }}>Ultimo aggiornamento: 15 gennaio 2026</div>
          <div style={{ fontSize: '1.05rem', lineHeight: 1.7 }}>
            {policyPoints.map((p, i) => (
              <div key={i} style={{ marginBottom: 28 }}>
                <strong>{p.title}</strong>
                <div style={{ whiteSpace: 'pre-line', marginTop: 6 }}>{p.text}</div>
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPolicy(false)}>
            Chiudi
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CookieBanner;
