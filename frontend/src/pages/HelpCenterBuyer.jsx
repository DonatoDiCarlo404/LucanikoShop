
import { Container } from "react-bootstrap";
import { Link } from "react-router-dom";

const HelpCenterBuyer = () => (
  <Container className="policy-container py-4">
    <h2 className="mb-4">Centro Assistenza Acquirente</h2>
    <p className="mb-3">Benvenuto nel Centro Assistenza Acquirente di Lucaniko Shop.</p>
    <p className="mb-4">
      Lucaniko Shop è un marketplace che mette in contatto venditori indipendenti (ciascuno titolare di partita IVA) con acquirenti. Tutti i prodotti presenti sulla piattaforma sono venduti direttamente dai singoli venditori, che ne sono gli unici responsabili.
    </p>

    <h5 className="mt-4 mb-2">Assistenza e informazioni sugli ordini</h5>
    <p>Per qualsiasi informazione relativa a:</p>
    <ul>
      <li>prodotti</li>
      <li>disponibilità</li>
      <li>spedizioni</li>
      <li>resi</li>
      <li>rimborsi</li>
      <li>garanzie</li>
      <li>fatturazione</li>
      <li>reclami</li>
      <li>informazioni contrattuali (Termini e Condizioni di vendita del venditore)</li>
    </ul>
    <p className="mb-3">
      L'acquirente deve contattare direttamente il venditore presso il quale ha effettuato l'acquisto. Lucaniko Shop non gestisce in alcun modo i rapporti tra acquirente e venditore in merito a prodotti, ordini o spedizioni.
    </p>
    <p className="mb-4">
      I contatti del venditore (email, telefono o altri canali di comunicazione) sono sempre disponibili nella pagina profilo del venditore all'interno del marketplace.
    </p>

    <h5 className="mt-4 mb-2">Ruolo di Lucaniko Shop</h5>
    <p className="mb-2">Lucaniko Shop è un marketplace che fornisce esclusivamente un'infrastruttura tecnica per consentire ai venditori di pubblicare i propri prodotti e agli acquirenti di visualizzarli e acquistarli.</p>
    <p className="mb-2">In quanto marketplace:</p>
    <ul>
      <li>non vende direttamente i prodotti presenti sulla piattaforma</li>
      <li>non gestisce spedizioni, resi o rimborsi</li>
      <li>non garantisce la qualità, la sicurezza o la conformità dei prodotti</li>
      <li>non è responsabile delle descrizioni, dei prezzi o delle immagini pubblicate dai venditori</li>
      <li>non fissa i prezzi né interviene sulle condizioni di vendita stabilite dai venditori</li>
      <li>non prende parte a nessun contratto tra acquirente e venditore</li>
    </ul>
    <p className="mb-4">
      Ogni venditore opera in piena autonomia ed è l'unico responsabile dei prodotti offerti, del rapporto contrattuale con l'acquirente, della corretta applicazione delle norme fiscali e di tutte le obbligazioni derivanti dalla vendita (spedizione, garanzia, resi, rimborsi).
    </p>

    <h5 className="mt-4 mb-2">Pagamenti e fatturazione</h5>
    <p className="mb-2">
      I pagamenti effettuati su Lucaniko Shop sono gestiti attraverso Stripe Connect per garantire la massima sicurezza nelle transazioni. Il denaro viene trasferito direttamente al venditore (o ai venditori) al quale hai acquistato il prodotto.
    </p>
    <p className="mb-4">
      <strong>Attenzione agli acquisti multi-venditore:</strong> Se nel tuo carrello sono presenti prodotti di venditori diversi, alla conferma dell'ordine verranno generati più addebiti separati, uno per ciascun venditore. Questa separazione è necessaria perché ogni venditore gestisce la propria attività in autonomia.
    </p>
    <p className="mb-4">
      Per la fatturazione e per tutte le questioni fiscali relative all'acquisto, rivolgiti direttamente al venditore da cui hai comprato il prodotto.
    </p>

    <h5 className="mt-4 mb-2">Consigli per un acquisto sicuro</h5>
    <ul>
      <li>Consulta sempre il profilo del venditore</li>
      <li>Leggi le descrizioni del prodotto e le condizioni di vendita</li>
      <li>Contatta il venditore per qualsiasi dubbio prima dell'acquisto</li>
      <li>In caso di carrello con più venditori, verifica i costi di spedizione per ciascun venditore prima di confermare l'ordine</li>
    </ul>

    <h5 className="mt-4 mb-2">Diritti dell'acquirente</h5>
    <p className="mb-4">
      In qualità di acquirente, hai diritto a ricevere informazioni complete e trasparenti sui prodotti prima dell'acquisto, nonché di esercitare il diritto di recesso secondo le modalità stabilite dal venditore. Per conoscere i tuoi diritti specifici, consulta le informazioni fornite dal venditore nella pagina prodotto.
    </p>

    <h5 className="mt-4 mb-2">Assistenza tecnica sulla piattaforma</h5>
    <p className="mb-4">
      Per problemi di accesso, difficoltà nell'uso della piattaforma o questioni tecniche non legate ai singoli ordini o prodotti, puoi contattarci all'indirizzo email: <a href="mailto:info@lucanikoshop.it">info@lucanikoshop.it</a>
    </p>

    <p className="mt-4">
      Per informazioni generali sul funzionamento del marketplace puoi consultare le nostre {" "}
      <Link to="/terms-buyers">Condizioni di utilizzo</Link> e la {" "}
      <Link to="/privacy">Privacy Policy</Link>.
    </p>
  </Container>
);

export default HelpCenterBuyer;
