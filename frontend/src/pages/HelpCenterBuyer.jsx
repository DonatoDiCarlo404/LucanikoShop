
import { Container } from "react-bootstrap";
import { Link } from "react-router-dom";

const HelpCenterBuyer = () => (
  <Container className="policy-container py-4 text-center">
    <h2 className="mb-4">Centro Assistenza Acquirente – Lucaniko Shop</h2>
    <p className="mb-4">
      Benvenuto nel Centro Assistenza Acquirente di Lucaniko Shop ("Piattaforma").
    </p>
    <p className="mb-4">
      Lucaniko Shop è un marketplace multi-venditore che mette in contatto Acquirenti e Venditori indipendenti ("Venditori"), i quali pubblicano e vendono i propri prodotti in autonomia. 
      Salvo diversa indicazione espressa, Lucaniko Shop non è il venditore dei prodotti presenti sulla Piattaforma.
    </p>

    <h5 className="mt-4 mb-3">1.1 Chi è il venditore e con chi concludi il contratto</h5>
    <p className="mb-2">Per ogni prodotto acquistato:</p>
    <ul className="d-flex flex-column align-items-center">
      <li>il Venditore indicato nella scheda prodotto è il soggetto che vende il bene e con cui l'Acquirente conclude il contratto di compravendita;</li>
      <li>il Venditore è l'unico responsabile di prezzi, descrizioni, disponibilità, conformità legale, sicurezza e qualità del prodotto;</li>
      <li>il Venditore è responsabile di spedizione, assistenza, garanzia, resi e rimborsi, nei limiti di legge e delle proprie condizioni.</li>
    </ul>
    <p className="mb-4">
      Lucaniko Shop fornisce l'infrastruttura tecnica della Piattaforma e i servizi digitali di supporto (catalogo, carrello multi-venditore, gestione tecnica degli ordini e pagamenti).
    </p>

    <h5 className="mt-4 mb-3">1.2 Carrello multi-venditore: cosa significa "checkout unico"</h5>
    <p className="mb-2">
      Lucaniko Shop consente di acquistare prodotti di più Venditori con un unico checkout. 
      Tuttavia, anche se l'Acquirente effettua un solo pagamento e riceve una sola conferma di ordine complessiva, l'ordine può includere più vendite distinte, una per ciascun Venditore coinvolto. Di conseguenza:
    </p>
    <ul className="d-flex flex-column align-items-center">
      <li>possono esserci spedizioni separate (pacco/i diversi, tempi diversi);</li>
      <li>possono esserci costi di spedizione diversi per ciascun Venditore (mostrati prima della conferma ordine);</li>
      <li>i resi/rimborsi vengono gestiti separatamente da ciascun Venditore;</li>
      <li>i documenti fiscali (fattura/scontrino) sono emessi dal Venditore, non dalla Piattaforma.</li>
    </ul>

    <h5 className="mt-4 mb-3">1.3 A chi rivolgersi per assistenza</h5>
    <p className="mb-2">Per qualsiasi informazione relativa a:</p>
    <ul className="d-flex flex-column align-items-center">
      <li>caratteristiche del prodotto (ingredienti, taglie, compatibilità, certificazioni, scadenze, allergeni, ecc.)</li>
      <li>disponibilità e tempi di preparazione</li>
      <li>spedizione, tracciamento, consegna</li>
      <li>diritto di recesso (se applicabile) e modalità di reso</li>
      <li>rimborsi e sostituzioni</li>
      <li>prodotti difettosi/non conformi</li>
      <li>garanzia legale e assistenza post-vendita</li>
      <li>fatture o documenti fiscali</li>
      <li>reclami relativi al prodotto/servizio del Venditore</li>
    </ul>
    <p className="mb-3">
      l'Acquirente deve contattare direttamente il Venditore.
    </p>
    <p className="mb-4">
      I contatti del Venditore (email/telefono/altro) sono indicati nel profilo Venditore.
    </p>

    <h5 className="mt-4 mb-3">1.4 Ruolo di Lucaniko Shop e limiti di responsabilità</h5>
    <p className="mb-2">Lucaniko Shop, in quanto marketplace:</p>
    <ul className="d-flex flex-column align-items-center">
      <li>non produce e normalmente non detiene i prodotti in magazzino;</li>
      <li>non gestisce direttamente spedizioni, resi e rimborsi;</li>
      <li>non garantisce la conformità dei prodotti (obbligo del Venditore);</li>
      <li>non è responsabile delle informazioni inserite dal Venditore nelle schede prodotto.</li>
    </ul>
    <p className="mb-2">Lucaniko Shop può svolgere:</p>
    <ul className="d-flex flex-column align-items-center">
      <li>supporto tecnico su accesso, account, checkout, problemi di pagamento, funzionamento piattaforma;</li>
      <li>attività di tutela della Piattaforma (es. rimozione contenuti, sospensione account) in caso di violazioni dei Termini o segnalazioni attendibili.</li>
    </ul>

    <h5 className="mt-4 mb-3">1.5 Segnalazioni di sicurezza</h5>
    <p className="mb-4">
      Se ritieni che un prodotto sia pericoloso, illecito o contraffatto, puoi segnalarlo a Lucaniko Shop tramite i contatti indicati sul sito. La segnalazione non sostituisce i tuoi diritti verso il Venditore, ma aiuta la Piattaforma a tutelare gli utenti.
    </p>

    <p className="mt-4">
      Per informazioni generali sul funzionamento del marketplace puoi consultare le nostre {" "}
      <Link to="/terms-buyers">Condizioni di utilizzo</Link> e la {" "}
      <Link to="/privacy">Privacy Policy</Link>.
    </p>
  </Container>
);

export default HelpCenterBuyer;
