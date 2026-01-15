import { Container } from "react-bootstrap";

const points = [
  {
    title: "1) Titolare del trattamento",
    text: `INSIDE di Di Pietro Vito\nP. IVA: 02118850763\nSede/indirizzo: Via Monticchio 17/B, 85028 Rionero in Vulture (PZ), Italia\nEmail di contatto privacy: info@dipietrodigital.it`
  },
  {
    title: "2) Dati personali trattati",
    text: `A seconda dell'uso della Piattaforma, possiamo trattare:\n\n2.1 Dati forniti direttamente dall'utente\nAccount acquirente: nome, cognome, email, metodo di pagamento, indirizzo di spedizione/fatturazione, telefono, ecc.\nCheckout come ospite: dati necessari alla conclusione dell'ordine\nRichieste al Centro Assistenza: contenuto del messaggio, dati di contatto, eventuali allegati.\nAccount venditore (aziende): dati del referente, ragione sociale, P. IVA, sede, recapiti, codice univoco SDI, metodo di pagamento, documentazione e informazioni per la pubblicazione del negozio e dei prodotti.\n\n2.2 Dati di navigazione e uso della Piattaforma\nIndirizzo IP, log tecnici, identificativi dispositivo/browser, pagine visitate, eventi di utilizzo (es. accessi, preferenze). (lucaniko.it)\n\n2.3 Dati relativi ai pagamenti\nI pagamenti sono gestiti tramite Stripe. Lucaniko Shop non memorizza i dati completi delle carte; può ricevere esiti e identificativi di transazione. (I metodi disponibili possono variare per Paese e/o venditore.)`
  },
  {
    title: "3) Finalità e basi giuridiche del trattamento",
    text: `Trattiamo i dati per le seguenti finalità:\n\nErogazione della Piattaforma e gestione account (registrazione, accesso, sicurezza).\nBase giuridica: esecuzione di un contratto (art. 6(1)(b) GDPR) e legittimo interesse alla sicurezza (art. 6(1)(f)).\n\nGestione ordini e assistenza (richieste, comunicazioni operative, prevenzione frodi).\nBase giuridica: art. 6(1)(b) e 6(1)(f).\n\nAdempimenti legali (obblighi contabili/amministrativi, gestione contestazioni e richieste autorità).\nBase giuridica: obbligo legale (art. 6(1)(c)).\n\nComunicazioni promozionali/newsletter (se attivate).\nBase giuridica: consenso (art. 6(1)(a)) oppure legittimo interesse in caso di soft-spam nei limiti di legge.\n\nStatistiche e miglioramento del servizio (analisi aggregate, performance, funzionalità).\nBase giuridica: legittimo interesse; per strumenti di tracciamento non tecnici, consenso tramite banner cookie.`
  },
  {
    title: "4) Modalità del trattamento e misure di sicurezza",
    text: `Il trattamento avviene con strumenti elettronici e misure tecniche/organizzative adeguate (controlli accessi, backup, logging, cifratura ove possibile) per ridurre i rischi di perdita, uso illecito o accesso non autorizzato.`
  },
  {
    title: "5) Destinatari dei dati",
    text: `I dati possono essere comunicati a:\nFornitori tecnici (hosting, manutenzione, email, CRM/helpdesk) che operano come responsabili del trattamento.\nStripe (pagamenti) come autonomo titolare o responsabile a seconda dei ruoli contrattuali.\nVenditori: per evasione ordine, spedizione, resi/garanzia, fatturazione (titolari autonomi).\nCorrieri/Logistica: tipicamente selezionati dal venditore.\nAutorità: se richiesto dalla legge.`
  },
  {
    title: "6) Trasferimenti extra SEE",
    text: `Alcuni fornitori (es. piattaforme email, analytics, social) potrebbero trattare dati fuori dallo Spazio Economico Europeo. In tali casi il trasferimento avverrà con garanzie adeguate (es. decisioni di adeguatezza, SCC).`
  },
  {
    title: "7) Conservazione dei dati",
    text: `Dati account: fino a richiesta di cancellazione o inattività prolungata (salvo obblighi di conservazione).\nDati ordini/assistenza: per il tempo necessario alla gestione e secondo termini di legge (es. contabilità/fiscale).\nLog tecnici: per periodi limitati, salvo esigenze di sicurezza.`
  },
  {
    title: "8) Diritti dell'interessato",
    text: `L'utente può esercitare i diritti di cui agli artt. 15-22 GDPR: accesso, rettifica, cancellazione, limitazione, portabilità, opposizione, revoca del consenso (senza pregiudicare i trattamenti pregressi).\nÈ possibile presentare reclamo al Garante per la Protezione dei Dati Personali.`
  },
  {
    title: "9) Cookie e strumenti di tracciamento",
    text: `Per informazioni dettagliate consultare la Cookie Policy.`
  },
  {
    title: "10) Dati di minori",
    text: `La Piattaforma non è destinata a minori di 18 anni. Se ritieni che un minore ci abbia fornito dati, contattaci per la rimozione.`
  },
  {
    title: "11) Aggiornamenti della presente informativa",
    text: `Potremmo aggiornare questa Privacy Policy per adeguamenti normativi o modifiche del servizio. La versione aggiornata sarà pubblicata sul sito con la data di aggiornamento.`
  }
];

const PrivacyPolicy = () => (
  <Container className="py-5" style={{ maxWidth: 800 }}>
    <h2 className="mb-4">Privacy Policy – Lucaniko Shop</h2>
    <div className="mb-3 text-muted" style={{ fontSize: '0.98rem' }}>Ultimo aggiornamento: 15 gennaio 2026</div>
    <div className="mb-4" style={{ fontSize: '1.05rem', lineHeight: 1.7 }}>
      La presente informativa è resa ai sensi degli artt. 13 e 14 del Regolamento (UE) 2016/679 ("GDPR") e descrive come vengono trattati i dati personali degli utenti che visitano e utilizzano il marketplace Lucaniko Shop (di seguito anche "Piattaforma").
    </div>
    <div className="mb-4 p-3" style={{ background: '#f8f9fa', borderLeft: '3px solid #0d6efd', fontSize: '1rem', lineHeight: 1.6 }}>
      <strong>Nota:</strong> Lucaniko Shop è un marketplace. Le vendite sono concluse tra Acquirente e Venditore (azienda lucana). Il Venditore, per i dati trattati per l'evasione degli ordini e gli obblighi fiscali, opera normalmente come titolare autonomo.
    </div>
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

export default PrivacyPolicy;
