
import { Container } from "react-bootstrap";
import { Link } from "react-router-dom";

const HelpCenterBuyer = () => (
  <Container className="policy-container py-4">
    <h2 className="mb-4">Centro Assistenza Acquirente</h2>
    <p className="mb-3">Benvenuto nel Centro Assistenza Acquirente di Lucaniko Shop.</p>
    <p className="mb-4">
      Lucaniko Shop è un marketplace che mette in contatto venditori indipendenti e acquirenti. Tutti i prodotti presenti sulla piattaforma sono venduti direttamente dai singoli venditori, che ne sono gli unici responsabili.
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
    </ul>
    <p className="mb-3">
      L’acquirente deve contattare direttamente il venditore presso il quale ha effettuato l’acquisto.
    </p>
    <p className="mb-4">
      I contatti del venditore (email, telefono o altri canali di comunicazione) sono sempre disponibili nella pagina profilo del venditore all’interno del marketplace.
    </p>

    <h5 className="mt-4 mb-2">Ruolo di Lucaniko Shop</h5>
    <ul>
      <li>non vende direttamente i prodotti presenti sulla piattaforma</li>
      <li>non gestisce spedizioni, resi o rimborsi</li>
      <li>non garantisce la qualità, la sicurezza o la conformità dei prodotti</li>
      <li>non è responsabile delle descrizioni, dei prezzi o delle immagini pubblicate dai venditori</li>
    </ul>
    <p className="mb-4">
      Ogni venditore opera in piena autonomia ed è l’unico responsabile dei prodotti offerti e del rapporto contrattuale con l’acquirente.
    </p>

    <h5 className="mt-4 mb-2">Pagamenti e transazioni</h5>
    <p className="mb-4">
      Le modalità di pagamento e le condizioni di vendita sono stabilite dal venditore e indicate nella relativa pagina prodotto. Ti invitiamo a leggere attentamente tutte le informazioni prima di completare un acquisto.
    </p>

    <h5 className="mt-4 mb-2">Consigli per un acquisto sicuro</h5>
    <ul>
      <li>Consulta sempre il profilo del venditore</li>
      <li>Leggi le descrizioni del prodotto e le condizioni di vendita</li>
      <li>Contatta il venditore per qualsiasi dubbio prima dell’acquisto</li>
    </ul>
    <p className="mt-4">
      Per informazioni generali sul funzionamento del marketplace puoi consultare le nostre {" "}
      <Link to="/terms-buyers">Condizioni di utilizzo</Link> e la {" "}
      <Link to="/privacy">Privacy Policy</Link>.
    </p>
  </Container>
);

export default HelpCenterBuyer;
