import { Container } from "react-bootstrap";
import { Link } from "react-router-dom";

const SpazioVenditoriLucani = () => (
  <Container className="policy-container py-4 text-center">
    <h2 className="mb-4">Spazio Venditori Lucani – Lucaniko Shop</h2>
    <p className="mb-3">Lucaniko Shop è un progetto dedicato alle imprese lucane per offrire:</p>
    <ul className="mb-4 d-flex flex-column align-items-center">
      <li>uno store digitale</li>
      <li>strumenti di vendita online</li>
      <li>pagamenti digitali sicuri</li>
      <li>visibilità in un ecosistema dedicato</li>
    </ul>

    <h5 className="mt-4 mb-2">1.1 Requisiti di partecipazione</h5>
    <p className="mb-2">Possono candidarsi aziende che:</p>
    <ul className="mb-3 d-flex flex-column align-items-center">
      <li>hanno sede legale/operativa in Basilicata e/o</li>
      <li>vendono prodotti riconducibili al territorio lucano secondo criteri indicati nei Termini Venditori.</li>
    </ul>
    <p className="mb-4">Lucaniko Shop può richiedere documentazione e approvare/rifiutare candidature.</p>

    <h5 className="mt-4 mb-2">1.2 Categorie</h5>
    <p className="mb-4">Categorie disponibili (esemplificative): abbigliamento, casa, cibi e bevande, artigianato, elettronica, ricambi, ecc.</p>

    <h5 className="mt-4 mb-2">1.3 Vantaggi</h5>
    <ul className="mb-4 d-flex flex-column align-items-center">
      <li>nessuna commissione percentuale sulle vendite (ad eccezione di Stripe)</li>
      <li>pagamenti con Stripe Connect</li>
      <li>pagina aziendale dedicata</li>
      <li>onboarding e supporto</li>
      <li>community e aggiornamenti</li>
    </ul>

    <h5 className="mt-4 mb-2">Piano di Adesione 2026</h5>
    <ul className="mb-3 d-flex flex-column align-items-center">
      <li>€299 (IVA inclusa) / 1 anno</li>
      <li>€499 (IVA inclusa) / 2 anni</li>
      <li>€599 (IVA inclusa) / 3 anni</li>
    </ul>
    <p className="mb-2"><strong>Include:</strong> accesso piattaforma, onboarding, supporto, community WhatsApp.</p>
    <p className="mb-4">
      Attivazione dopo approvazione candidatura + pagamento + emissione fattura da INSIDE di Di Pietro Vito.
    </p>
    <p className="mb-4"><strong>Rinnovo e disdetta:</strong> se previsto rinnovo automatico, le modalità e i termini (es. 60 giorni) sono indicati nei Termini Venditori. In mancanza di disdetta nei termini, il rinnovo potrà essere applicato.</p>

    <p className="mt-4">
      Per ulteriori informazioni consulta i <Link to="/terms-vendors">termini e condizioni venditore</Link>
    </p>
  </Container>
);

export default SpazioVenditoriLucani;
