
import { Container } from "react-bootstrap";

const shippingPoints = [
  "I costi di spedizione sono stabiliti da ciascun venditore",
  "Le modalità, i tempi di consegna e le aree servite possono variare in base all’azienda",
  "Eventuali promozioni o spedizioni gratuite sono decise autonomamente dal venditore"
];

const paymentPoints = [
  "Carte di credito e debito (Visa, Mastercard, ecc.)",
  "Wallet digitali (es. Apple Pay, Google Pay)",
  "Altri metodi supportati da Stripe, variabili in base al paese o al venditore"
];

const ShippingAndPayments = () => (
  <Container className="policy-container py-4">
    <h2 className="mb-4 text-center">Spedizioni</h2>
    <p className="mb-3 text-center">Le spedizioni su Lucaniko Shop sono gestite direttamente dalle aziende venditrici.</p>
    <ul className="mb-3" style={{ maxWidth: 600, margin: '0 auto' }}>
      {shippingPoints.map((point, idx) => (
        <li key={idx}>{point}</li>
      ))}
    </ul>
    <p className="mb-4 text-center">I dettagli relativi a spedizione e consegna sono sempre visibili prima della conferma dell’ordine.</p>

    <h2 className="mb-4 mt-5 text-center">Metodi di pagamento</h2>
    <p className="mb-3 text-center">Lucaniko Shop utilizza il circuito Stripe per garantire pagamenti sicuri e affidabili.</p>
    <p className="mb-2 text-center">I metodi di pagamento disponibili possono includere:</p>
    <ul className="mb-3" style={{ maxWidth: 600, margin: '0 auto' }}>
      {paymentPoints.map((point, idx) => (
        <li key={idx}>{point}</li>
      ))}
    </ul>
    <p className="mb-3 text-center">Il pagamento viene gestito direttamente da Stripe e l’importo viene trasferito all’azienda venditrice.</p>

    <p className="mt-4 text-center">Per maggiori informazioni, contatta direttamente il venditore.</p>
  </Container>
);

export default ShippingAndPayments;
