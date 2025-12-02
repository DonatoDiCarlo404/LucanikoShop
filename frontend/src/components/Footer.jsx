import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-light border-top mt-5">
      <Container className="py-5">
        <Row className="gy-4">

          {/* Colonna 1 */}
          <Col xs={6} md={3}>
            <h6 className="fw-bold text-dark mb-3">Assistenza</h6>
            <ul className="list-unstyled">
              <li><Link className="text-muted text-decoration-none" to="/help">Centro Assistenza</Link></li>
              <li><Link className="text-muted text-decoration-none" to="/contact">Contatti</Link></li>
              <li><Link className="text-muted text-decoration-none" to="/cancellation-policy">Politica di cancellazione</Link></li>
              <li><Link className="text-muted text-decoration-none" to="/report">Segnala un problema</Link></li>
            </ul>
          </Col>

          {/* Colonna 2 */}
          <Col xs={6} md={3}>
            <h6 className="fw-bold text-dark mb-3">Community</h6>
            <ul className="list-unstyled">
              <li><Link className="text-muted text-decoration-none" to="/blog">Blog</Link></li>
              <li><Link className="text-muted text-decoration-none" to="/sustainability">Sostenibilità</Link></li>
              <li><Link className="text-muted text-decoration-none" to="/affiliates">Affiliati</Link></li>
            </ul>
          </Col>

          {/* Colonna 3 */}
          <Col xs={6} md={3}>
            <h6 className="fw-bold text-dark mb-3">Il tuo Marketplace</h6>
            <ul className="list-unstyled">
              <li><Link className="text-muted text-decoration-none" to="/sell">Diventa venditore</Link></li>
              <li><Link className="text-muted text-decoration-none" to="/seller-rules">Regole per i venditori</Link></li>
              <li><Link className="text-muted text-decoration-none" to="/fees">Commissioni</Link></li>
            </ul>
          </Col>

          {/* Colonna 4 */}
          <Col xs={6} md={3}>
            <h6 className="fw-bold text-dark mb-3">Legale</h6>
            <ul className="list-unstyled">
              <li><Link className="text-muted text-decoration-none" to="/terms">Termini e condizioni</Link></li>
              <li><Link className="text-muted text-decoration-none" to="/privacy">Privacy</Link></li>
              <li><Link className="text-muted text-decoration-none" to="/cookies">Cookie policy</Link></li>
            </ul>
          </Col>

        </Row>
      </Container>

      <div className="border-top py-3 text-center">
        <small className="text-muted">
          © {new Date().getFullYear()} LucanikoShop — Tutti i diritti riservati.
        </small>
      </div>
    </footer>
  );
};

export default Footer;
