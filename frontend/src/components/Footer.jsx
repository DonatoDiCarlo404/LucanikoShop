import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import './Footer.css';

const Footer = () => {
  return (
    <footer className="bg-light border-top mt-5">
      <Container className="pt-5 pb-1">
        {/* Prime 4 colonne */}
        <Row className="gy-4">
          {/* Colonna 1 */}
          <Col xs={6} md={3}>
            <h6 className="fw-bold text-dark mb-3">Compra</h6>
            <ul className="list-unstyled">
              <li><Link className="text-dark text-decoration-none" to="/login" onClick={() => window.scrollTo(0,0)}>Login/Registrati</Link></li>
              <li><Link className="text-dark text-decoration-none" to="/help-center-buyers" onClick={() => window.scrollTo(0,0)}>Centro Assistenza Acquirenti</Link></li>
              <li><Link className="text-dark text-decoration-none" to="/cancellation-policy" onClick={() => window.scrollTo(0,0)}>Spedizioni e Metodi di Pagamento</Link></li>
              <li><Link className="text-dark text-decoration-none" to="/categories" onClick={() => window.scrollTo(0,0)}>Categorie</Link></li>
              <li><Link className="text-dark text-decoration-none" to="/products" onClick={() => window.scrollTo(0,0)}>Prodotti</Link></li>
              <li><Link className="text-dark text-decoration-none" to="/offers" onClick={() => window.scrollTo(0,0)}>Offerte</Link></li>
            </ul>
          </Col>

          {/* Colonna 2 */}
          <Col xs={6} md={3}>
            <h6 className="fw-bold text-dark mb-3">Vendi su Lucaniko Shop</h6>
            <ul className="list-unstyled">
              <li><Link className="text-dark text-decoration-none" to="/login" onClick={() => window.scrollTo(0,0)}>Login/Registrati</Link></li>
              <li><Link className="text-dark text-decoration-none" to="/help-center-vendors" onClick={() => window.scrollTo(0,0)}>Centro Assistenza Venditori</Link></li>
              <li><Link className="text-dark text-decoration-none" to="/spazio-venditori-lucani" onClick={() => window.scrollTo(0,0)}>Spazio Venditori Lucani</Link></li>
            </ul>
          </Col>

          {/* Colonna 3 */}
          <Col xs={6} md={3}>
            <h6 className="fw-bold text-dark mb-3">Legal Area</h6>
            <ul className="list-unstyled">
              <li><Link className="text-dark text-decoration-none" to="/privacy" onClick={() => window.scrollTo(0,0)}>Privacy Policy</Link></li>
              <li><Link className="text-dark text-decoration-none" to="/cookies" onClick={() => window.scrollTo(0,0)}>Cookie Policy</Link></li>
              <li><Link className="text-dark text-decoration-none" to="/terms-buyers" onClick={() => window.scrollTo(0,0)}>Termini & Condizioni Acquirenti</Link></li>
              <li><Link className="text-dark text-decoration-none" to="/terms-vendors" onClick={() => window.scrollTo(0,0)}>Termini & Condizioni Venditori</Link></li>
            </ul>
          </Col>

          {/* Colonna 4 */}
          <Col xs={6} md={3}>
            <h6 className="fw-bold text-dark mb-3">Community Lucaniko.it</h6>
            <ul className="list-unstyled">
              <li><a className="text-dark text-decoration-none" href="https://www.instagram.com/lucaniko.it?igsh=ZmFpc2FsNWp6N2Nt&utm_source=qr" target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a className="text-dark text-decoration-none" href="https://www.facebook.com/share/1AfmHyH7tD/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer">Facebook</a></li>
              <li><a className="text-dark text-decoration-none" href="https://www.tiktok.com/@lucaniko.it?_r=1&_t=ZN-935zwrCWLJ8" target="_blank" rel="noopener noreferrer">TikTok</a></li>
            </ul>
          </Col>
        </Row>

        {/* Quinta colonna centrata sotto */}
        <Row className="mt-1 justify-content-center">
          <Col xs={12} md={3} className="text-center">
            <img src="/Lucaniko Shop PNG solo testo-01.png" alt="Logo Altro" style={{ maxWidth: 250, marginBottom: 12 }} />
            <ul className="list-unstyled">
              <li>
                <a href="https://www.instagram.com/lucaniko.it?igsh=cGlyaTNoNzc3cWEw" target="_blank" rel="noopener noreferrer" className="footer-social-icon" style={{ marginLeft: 8, verticalAlign: 'middle' }}>
                  <i className="bi bi-instagram" style={{ fontSize: '1rem' }}></i>
                </a>
                <a href="https://www.facebook.com/share/1AfmHyH7tD/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="footer-social-icon" style={{ marginLeft: 8, verticalAlign: 'middle' }}>
                  <i className="bi bi-facebook" style={{ fontSize: '1rem' }}></i>
                </a>
                <a href="https://www.tiktok.com/@lucaniko.it?_r=1&_t=ZN-935zwrCWLJ8" target="_blank" rel="noopener noreferrer" className="footer-social-icon" style={{ marginLeft: 8, verticalAlign: 'middle' }}>
                  <i className="bi bi-tiktok" style={{ fontSize: '1rem' }}></i>
                </a>
              </li>
            </ul>
          </Col>
        </Row>
      </Container>

      <div className="border-top py-3 text-center">
        <small className="text-muted footer-legal">
          <span style={{ color: '#000' }}>
            © {new Date().getFullYear()} Inside di Di Pietro Vito
            {' '}
            <a href="https://www.dipietrodigital.it" target="_blank" rel="noopener noreferrer" style={{ color: '#004b75', textDecoration: 'underline', fontWeight: 500 }}>
              www.dipietrodigital.it
            </a>
            {' '} - P.iva 02118850763 - via Monticchio 17/b Rionero in Vulture (PZ) — Tutti i diritti riservati.
          </span>
        </small>
      </div>
    </footer>
  );
};

export default Footer;
