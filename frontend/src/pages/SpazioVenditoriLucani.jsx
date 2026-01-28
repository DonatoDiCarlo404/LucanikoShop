import { Container } from "react-bootstrap";
import { Link } from "react-router-dom";

const categories = [
  "Abbigliamento e Accessori",
  "Benessere e Salute",
  "Calzature",
  "Casa, Arredi e Ufficio",
  "Cibi e Bevande",
  "Elettronica e Informatica",
  "Industria, Ferramenta e Artigianato",
  "Libri, Media e Giocattoli",
  "Orologi e Gioielli",
  "Ricambi e accessori per auto e moto",
  "Sport, Hobby e Viaggi"
];

const benefits = [
  "Nessuna commissione sulle vendite",
  "Pagamenti diretti tramite Stripe",
  "Pagina aziendale dedicata",
  "Massima visibilità all’interno del progetto Lucaniko"
];

const steps = [
  "registrazione e inserimento dati aziendali",
  "Pagamento online, verifica e approvazione",
  "attivazione adesione",
  "configurazione store e caricamento prodotti",
  "vendite con pagamenti gestiti da Stripe"
];

const plans = [
  "€299 (IVA inclusa) / 1 anno",
  "€499 (IVA inclusa) / 2 anni",
  "€599 (IVA inclusa) / 3 anni"
];

const SpazioVenditoriLucani = () => (
  <Container className="policy-container py-4">
    <h2 className="mb-4 text-center">Spazio Venditori Lucani</h2>
    <p className="mb-3 text-center">Entra a far parte del primo marketplace dedicato alle aziende lucane.</p>
    <p className="mb-2 text-center">Tutte le imprese della Basilicata possono vendere i propri prodotti in numerose categorie:</p>
    <ul className="mb-4" style={{ maxWidth: 600, margin: '0 auto' }}>
      {categories.map((cat, idx) => <li key={idx}>{cat}</li>)}
    </ul>

    <h5 className="mt-4 mb-2 text-center">Vantaggi per i venditori</h5>
    <ul className="mb-4" style={{ maxWidth: 600, margin: '0 auto' }}>
      {benefits.map((b, idx) => <li key={idx}>{b}</li>)}
    </ul>

    <h5 className="mt-4 mb-2 text-center">Come funziona</h5>
    <ul className="mb-4" style={{ maxWidth: 600, margin: '0 auto' }}>
      {steps.map((s, idx) => <li key={idx}>{s}</li>)}
    </ul>

    <h5 className="mt-4 mb-2 text-center">Piano di Adesione e attivazione</h5>
    <p className="mb-2 text-center">Piano di Adesione 2026 (come da offerta in piattaforma):</p>
    <ul className="mb-4" style={{ maxWidth: 400, margin: '0 auto' }}>
      {plans.map((p, idx) => <li key={idx}>{p}</li>)}
    </ul>
    <li className="mb-4" style={{ maxWidth: 600, margin: '0 auto' }}><b>INCLUDE:</b><br />- Registrazione e accesso alla piattaforma<br />- Onboarding e formazione iniziale<br />- Supporto operativo <br />- Accesso alla community WhatsApp aziende Lucaniko Shop (guide pratiche, best pratices, aggiornamenti, news)</li>

    <p className="mt-4 text-center">
      Per ulteriori informazioni consulta i <Link to="/terms-vendors">termini e condizioni venditore</Link>
    </p>
  </Container>
);

export default SpazioVenditoriLucani;
