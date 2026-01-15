import { Container } from "react-bootstrap";

const points = [
  {
    title: "1) Cosa sono i cookie",
    text: `I cookie sono piccoli file di testo che il sito invia al browser dell’utente per memorizzare informazioni (es. preferenze, sessione) e migliorare l’esperienza di navigazione.`
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
    text: `All’accesso, un banner consente di:\n- accettare tutti\n- rifiutare non necessari\n- personalizzare le preferenze\n\nPuoi modificare le scelte in qualsiasi momento tramite il link “Gestione cookie” (se presente) o dalle impostazioni del browser.`
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

const CookiePolicy = () => (
  <Container className="py-5" style={{ maxWidth: 800 }}>
    <h2 className="mb-4">Cookie Policy – Lucaniko Shop</h2>
    <div className="mb-2 text-muted" style={{ fontSize: '0.98rem' }}>Ultimo aggiornamento: 15 gennaio 2026</div>
    <div style={{ fontSize: '1.05rem', lineHeight: 1.7 }}>
      {points.map((p, i) => (
        <div key={i} style={{ marginBottom: 28 }}>
          <strong>{p.title}</strong>
          <div style={{ whiteSpace: 'pre-line', marginTop: 6 }}>{p.text}</div>
        </div>
      ))}
    </div>
  </Container>
);

export default CookiePolicy;
