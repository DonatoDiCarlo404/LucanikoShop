import { Container } from "react-bootstrap";

const points = [
  {
    title: "1) Oggetto",
    text: `Lucaniko Shop è un marketplace che consente agli utenti (“Acquirenti”) di acquistare prodotti offerti da aziende terze (“Venditori”) registrate sulla Piattaforma.`
  },
  {
    title: "2) Ruolo di Lucaniko Shop",
    text: `Lucaniko Shop non è il venditore dei prodotti, salvo diversa indicazione.\nIl contratto di vendita si conclude direttamente tra Acquirente e Venditore.\nLucaniko Shop fornisce infrastruttura tecnica, vetrina e strumenti di pagamento/gestione ordini.`
  },
  {
    title: "3) Registrazione e acquisti",
    text: `L’Acquirente può registrarsi o acquistare come ospite (quando disponibile).\nL’Acquirente garantisce che i dati inseriti sono veritieri e aggiornati.\nLe credenziali sono personali; l’Acquirente è responsabile dell’uso del proprio account.`
  },
  {
    title: "4) Informazioni su prodotti e prezzi",
    text: `Le schede prodotto, disponibilità, conformità e descrizioni sono predisposte dal Venditore.\nImmagini e colori possono differire dal reale.\nI prezzi sono esposti in euro e includono/imputano IVA secondo quanto indicato dal Venditore.`
  },
  {
    title: "5) Ordine e conclusione del contratto",
    text: `L’ordine si considera effettuato quando l’Acquirente riceve conferma (email o area personale).\nIl Venditore può rifiutare/annullare l’ordine per indisponibilità o cause legittime; in tal caso, l’Acquirente non subisce addebiti o riceve rimborso secondo i flussi di pagamento.`
  },
  {
    title: "6) Spedizioni e consegna",
    text: `Costi, tempi, aree servite e vettori sono stabiliti da ciascun Venditore.\nL’Acquirente visualizza i costi di spedizione prima della conferma dell’ordine.\nEventuali ritardi del corriere o cause di forza maggiore non imputabili a Lucaniko Shop non generano responsabilità diretta della Piattaforma.`
  },
  {
    title: "7) Pagamenti (Stripe)",
    text: `I pagamenti sono elaborati tramite Stripe.\nI metodi disponibili (carte, wallet, altri) possono variare per Paese e/o configurazione del Venditore.\nL’addebito può essere immediato o secondo logiche del provider; l’importo viene trasferito al Venditore al netto delle commissioni del circuito.`
  },
  {
    title: "8) Coupon e promozioni",
    text: `I Venditori possono attivare coupon/sconti su prodotti, categorie o periodi.\nLe promozioni possono essere soggette a condizioni (validità, quantità, categorie, cumulabilità).`
  },
  {
    title: "9) Diritto di recesso (consumatori)",
    text: `Se l’Acquirente è un “consumatore” ai sensi del D.Lgs. 206/2005 (“Codice del Consumo”), può esercitare il recesso entro 14 giorni dalla consegna, salvo eccezioni di legge (es. prodotti deperibili, sigillati aperti, personalizzati, ecc.).\nLa richiesta di recesso va inviata al Venditore tramite i canali indicati nella pagina del Venditore e/o tramite Centro Assistenza.\nI costi di restituzione possono essere a carico dell’Acquirente salvo diversa indicazione del Venditore.\nIl rimborso avviene secondo i tempi e le modalità previste dalla legge e dal Venditore.`
  },
  {
    title: "10) Resi, rimborsi, prodotti difettosi e garanzia legale",
    text: `La gestione di resi/rimborsi è in capo al Venditore.\nPer prodotti difettosi o non conformi, si applica la garanzia legale di conformità (quando applicabile) e l’Acquirente deve contattare il Venditore.`
  },
  {
    title: "11) Limitazione di responsabilità",
    text: `Lucaniko Shop non risponde di:\nqualità, conformità e sicurezza dei prodotti venduti da terzi\ninadempimenti del Venditore\nritardi imputabili a corrieri o cause di forza maggiore\nResta fermo il rispetto delle norme inderogabili a tutela del consumatore.`
  },
  {
    title: "12) Recensioni e contenuti degli utenti",
    text: `L’Acquirente può lasciare recensioni o contenuti rispettosi e veritieri. È vietato pubblicare contenuti illeciti, offensivi, diffamatori o che violino diritti di terzi.`
  },
  {
    title: "13) Assistenza e reclami",
    text: `L’Acquirente, per qualsiasi genere di informazione sui prodotti in vendita, dovrà contattare esclusivamente il Venditore (i contatti di ciascun Venditore sono disponibili nel profilo).`
  },
  {
    title: "14) Legge applicabile e foro",
    text: `Il contratto è regolato dalla legge italiana. Per i consumatori, il foro competente è quello di Potenza.`
  },
  {
    title: "15) Piattaforma ODR (solo consumatori UE)",
    text: `Se applicabile, l’Acquirente può utilizzare la piattaforma europea ODR per la risoluzione online delle controversie.`
  }
];

const TermsBuyers = () => (
  <Container className="py-5" style={{ maxWidth: 800 }}>
    <h2 className="mb-4">Termini & Condizioni Acquirenti</h2>
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

export default TermsBuyers;
