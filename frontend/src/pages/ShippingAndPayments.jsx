
import { Container } from "react-bootstrap";

const ShippingAndPayments = () => (
  <Container className="policy-container py-4 text-center">
    <h2 className="mb-4 text-center">Spedizioni – Lucaniko Shop</h2>
    <p className="mb-4">Le spedizioni su Lucaniko Shop sono gestite direttamente dai Venditori.</p>

    <h5 className="mt-4 mb-2">1.1 Costi e modalità</h5>
    <p className="mb-2">Ogni Venditore stabilisce in autonomia:</p>
    <ul className="mb-3 d-flex flex-column align-items-center">
      <li>costo di spedizione e soglie di spedizione gratuita (se previste)</li>
      <li>corrieri utilizzati</li>
      <li>tempi medi di preparazione e consegna</li>
      <li>aree servite</li>
      <li>condizioni speciali (imballaggio, fragile, refrigerato, voluminoso)</li>
    </ul>

    <h5 className="mt-4 mb-2">1.2 Ordini multi-venditore</h5>
    <p className="mb-2">Se il carrello contiene prodotti di più Venditori:</p>
    <ul className="mb-3 d-flex flex-column align-items-center">
      <li>l'Acquirente può ricevere più spedizioni e tracking differenti;</li>
      <li>tempi e modalità possono variare per ciascun Venditore;</li>
      <li>eventuali promozioni o spedizioni gratuite sono decise singolarmente dal Venditore.</li>
    </ul>

    <h5 className="mt-4 mb-2">1.3 Problemi di consegna</h5>
    <p className="mb-2">In caso di ritardo, mancata consegna, pacco danneggiato o manomesso:</p>
    <ul className="mb-3 d-flex flex-column align-items-center">
      <li>l'Acquirente deve contattare il Venditore che ha spedito il pacco;</li>
      <li>il Venditore gestirà la pratica con il corriere secondo le proprie condizioni e la normativa applicabile.</li>
    </ul>
    <p className="mb-4">Lucaniko Shop non gestisce direttamente i corrieri dei Venditori.</p>

    <h5 className="mt-4 mb-2">1.4 Cibi, bevande e deperibili</h5>
    <p className="mb-2">Per prodotti alimentari o deperibili possono applicarsi:</p>
    <ul className="mb-3 d-flex flex-column align-items-center">
      <li>finestre di consegna specifiche</li>
      <li>requisiti di conservazione</li>
      <li>limitazioni per il recesso (vedi Termini Acquirenti)</li>
    </ul>
    <p className="mb-4">Il Venditore è responsabile di informare correttamente l'Acquirente e di rispettare la normativa (etichettatura, allergeni, scadenze, lotto, ecc.).</p>

    <h2 className="mb-4 mt-5 text-center">Metodi di pagamento – Lucaniko Shop</h2>
    <p className="mb-4">Lucaniko Shop utilizza Stripe per gestire pagamenti sicuri e affidabili.</p>

    <h5 className="mt-4 mb-2">2.1 Metodi disponibili</h5>
    <p className="mb-2">A seconda di paese/configurazione, possono essere disponibili:</p>
    <ul className="mb-3 d-flex flex-column align-items-center">
      <li>carte di credito/debito (Visa, Mastercard, ecc.)</li>
      <li>wallet (Apple Pay, Google Pay)</li>
      <li>altri metodi supportati da Stripe</li>
    </ul>

    <h5 className="mt-4 mb-2">2.2 Sicurezza e dati carta</h5>
    <p className="mb-3">Lucaniko Shop non memorizza i dati completi delle carte.</p>
    <p className="mb-4">Stripe elabora il pagamento e Lucaniko Shop riceve soltanto esiti e identificativi tecnici utili alla gestione dell'ordine.</p>

    <h5 className="mt-4 mb-2">2.3 Importo e conferma</h5>
    <p className="mb-2">L'Acquirente visualizza sempre:</p>
    <ul className="mb-3 d-flex flex-column align-items-center">
      <li>importo prodotti</li>
      <li>costi di spedizione (anche per singolo Venditore)</li>
      <li>totale ordine</li>
    </ul>
    <p className="mb-4">prima della conferma finale.</p>
  </Container>
);

export default ShippingAndPayments;
