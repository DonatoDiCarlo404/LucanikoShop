import { Container } from "react-bootstrap";

const PrivacyPolicy = () => (
  <Container className="py-5 text-center" style={{ maxWidth: 800 }}>
    <h2 className="mb-4">Privacy Policy – Lucaniko Shop</h2>
    <div className="mb-3 text-muted" style={{ fontSize: '0.98rem' }}>Ultimo aggiornamento: 4 febbraio 2026</div>
    <div className="mb-4" style={{ fontSize: '1.05rem', lineHeight: 1.7 }}>
      <strong>Titolare del trattamento</strong><br />
      INSIDE di Di Pietro Vito – P. IVA 02118850763<br />
      Sede: Via Monticchio 17/B, 85028 Rionero in Vulture (PZ)<br />
      Email privacy: <a href="mailto:info@dipietrodigital.it">info@dipietrodigital.it</a>
    </div>

    <div style={{ fontSize: '1.05rem', lineHeight: 1.7 }}>
      <div style={{ marginBottom: 28 }}>
        <strong>1.1 Marketplace: ruoli privacy</strong>
        <div style={{ marginTop: 6 }}>
          <strong>Lucaniko Shop:</strong> Titolare per dati necessari a piattaforma (account, sicurezza, log, gestione tecnica ordini, supporto, comunicazioni).<br /><br />
          <strong>Venditori:</strong> Titolari autonomi per dati necessari a evasione ordine, spedizione, resi, garanzie, fatturazione.<br /><br />
          <strong>Stripe:</strong> gestisce pagamenti secondo propri termini (ruolo come da contratti Stripe).
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <strong>1.2 Dati trattati</strong>
        <ul className="d-flex flex-column align-items-center" style={{ marginTop: 6 }}>
          <li>dati account acquirente (nome, contatti, indirizzi)</li>
          <li>dati ordine (prodotti acquistati, importi, stato)</li>
          <li>dati account venditore (azienda, P.IVA, SDI, referente, documentazione)</li>
          <li>dati assistenza (messaggi/allegati)</li>
          <li>dati tecnici (IP, log, eventi sicurezza)</li>
          <li>dati pagamento: Lucaniko Shop non conserva carte; riceve esiti/ID transazione</li>
        </ul>
      </div>

      <div style={{ marginBottom: 28 }}>
        <strong>1.3 Finalità e basi giuridiche</strong>
        <ul className="d-flex flex-column align-items-center" style={{ marginTop: 6 }}>
          <li>erogazione servizio e gestione account/ordini (art. 6(1)(b))</li>
          <li>sicurezza e prevenzione frodi (art. 6(1)(f))</li>
          <li>adempimenti legali (art. 6(1)(c))</li>
          <li>assistenza (art. 6(1)(b)/(f))</li>
          <li>marketing/newsletter (consenso art. 6(1)(a) o soft-spam dove lecito)</li>
          <li>analytics e miglioramento (legittimo interesse; consenso per cookie non tecnici)</li>
        </ul>
      </div>

      <div style={{ marginBottom: 28 }}>
        <strong>1.4 Destinatari</strong>
        <div style={{ marginTop: 6 }}>
          Fornitori tecnici (hosting, email, helpdesk) come responsabili; Stripe; Venditori per gestione ordini; autorità ove necessario.
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <strong>1.5 Trasferimenti extra SEE</strong>
        <div style={{ marginTop: 6 }}>
          Possibili per alcuni fornitori: con garanzie adeguate (SCC/adeguatezza).
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <strong>1.6 Conservazione</strong>
        <ul className="d-flex flex-column align-items-center" style={{ marginTop: 6 }}>
          <li>account: fino a cancellazione o inattività prolungata (salvo obblighi)</li>
          <li>ordini e dati amministrativi: secondo legge</li>
          <li>log sicurezza: per periodi limitati/proporzionati</li>
        </ul>
      </div>

      <div style={{ marginBottom: 28 }}>
        <strong>1.7 Diritti</strong>
        <div style={{ marginTop: 6 }}>
          Accesso, rettifica, cancellazione, limitazione, portabilità, opposizione, revoca consenso; reclamo al Garante.
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <strong>1.8 Minori</strong>
        <div style={{ marginTop: 6 }}>
          Piattaforma non destinata a minori di 18 anni.
        </div>
      </div>
    </div>
  </Container>
);

export default PrivacyPolicy;
