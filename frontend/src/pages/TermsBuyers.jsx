import { Container } from "react-bootstrap";

const TermsBuyers = () => (
  <Container className="py-5" style={{ maxWidth: 800 }}>
    <h2 className="mb-4">Termini & Condizioni Acquirenti – Lucaniko Shop</h2>
    <div style={{ fontSize: '1.05rem', lineHeight: 1.7 }}>
      <div style={{ marginBottom: 28 }}>
        <strong>1.1 Oggetto</strong>
        <div style={{ marginTop: 6 }}>
          Lucaniko Shop consente agli Acquirenti di acquistare prodotti venduti da Venditori terzi.
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <strong>1.2 Ruolo della Piattaforma</strong>
        <div style={{ marginTop: 6 }}>
          Lucaniko Shop non è parte del contratto di vendita (salvo diversa indicazione). Il contratto è tra Acquirente e Venditore.
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <strong>1.3 Ordini multi-venditore</strong>
        <div style={{ marginTop: 6 }}>
          Checkout unico, ma vendite separate per Venditore: spedizioni/resi/rimborsi/documenti fiscali separati.
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <strong>1.4 Informazioni su prodotti e prezzi</strong>
        <div style={{ marginTop: 6 }}>
          Responsabilità del Venditore. Immagini indicative. Prezzi e IVA come indicato dal Venditore.
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <strong>1.5 Spedizioni</strong>
        <div style={{ marginTop: 6 }}>
          Gestite dal Venditore; costi e tempi visibili prima della conferma.
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <strong>1.6 Recesso (consumatori) e eccezioni – deperibili</strong>
        <div style={{ marginTop: 6 }}>
          Il consumatore può recedere entro 14 giorni salvo eccezioni previste dal Codice del Consumo, tra cui (a titolo esemplificativo):
          <ul className="d-flex flex-column align-items-center" style={{ marginTop: 8 }}>
            <li>beni deperibili o che rischiano di deteriorarsi rapidamente (molti alimentari)</li>
            <li>beni sigillati non restituibili per motivi igienici/sanitari se aperti</li>
            <li>beni personalizzati</li>
          </ul>
          La gestione del recesso/resi è in capo al Venditore.
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <strong>1.7 Garanzia legale</strong>
        <div style={{ marginTop: 6 }}>
          Per consumatori: garanzia legale di conformità ove applicabile.
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <strong>1.8 Pagamenti</strong>
        <div style={{ marginTop: 6 }}>
          Gestiti da Stripe. L'Acquirente può avviare contestazioni tramite canali bancari; il Venditore gestisce evidenze di consegna/servizio.
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <strong>1.9 Foro competente (SAFE)</strong>
        <div style={{ marginTop: 6 }}>
          Per Acquirenti consumatori, è competente in via inderogabile il foro del luogo di residenza o domicilio del consumatore (normativa consumer).<br />
          Per Acquirenti non consumatori, foro di Potenza.
        </div>
      </div>
    </div>
  </Container>
);

export default TermsBuyers;
