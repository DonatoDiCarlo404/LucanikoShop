import { Container, Row, Col, Card, Button, ListGroup, Alert, Badge, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, cartCount, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();

  if (cartCount === 0) {
    return (
      <Container className="py-5">
        <Card className="text-center p-5">
          <Card.Body>
            <div style={{ fontSize: '5rem' }}>🛒</div>
            <h3 className="mt-3">Il tuo carrello è vuoto</h3>
            <p className="text-muted">Aggiungi prodotti per iniziare!</p>
            <Button variant="primary" onClick={() => navigate('/products')}>
              Vai al Catalogo
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row>
        <Col md={8}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Il tuo Carrello</h2>
            <Button variant="outline-danger" size="sm" onClick={clearCart}>
              Svuota Carrello
            </Button>
          </div>

          <ListGroup>
            {cartItems.map((item) => (
              <ListGroup.Item key={item._id} className="p-3">
                <Row className="align-items-center">
                  <Col md={2}>
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images[item.images.length - 1].url}
                        alt={item.name}
                        style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '80px', backgroundColor: '#f0f0f0', borderRadius: '8px' }} />
                    )}
                  </Col>

                  <Col md={4}>
                    <h5 className="mb-1">{item.name}</h5>
                    <Badge bg="secondary">{item.category}</Badge>
                  </Col>

                  <Col md={2}>
                    <strong>€{item.price.toFixed(2)}</strong>
                    <small className="text-muted d-block">/{item.unit}</small>
                  </Col>

                  <Col md={2}>
                    <Form.Group>
                      <Form.Label className="small">Quantità</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max={item.stock}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item._id, parseInt(e.target.value))}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={2} className="text-end">
                    <div className="mb-2">
                      <strong>€{(item.price * item.quantity).toFixed(2)}</strong>
                    </div>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeFromCart(item._id)}
                    >
                      Rimuovi
                    </Button>
                  </Col>
                </Row>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>

        <Col md={4}>
          <Card className="sticky-top" style={{ top: '100px' }}>
            <Card.Header>
              <h5 className="mb-0">Riepilogo Ordine</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between">
                  <span>Prodotti ({cartCount})</span>
                  <strong>€{cartTotal.toFixed(2)}</strong>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <span>Spedizione</span>
                  <Badge bg="success">GRATIS</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <h5 className="mb-0">Totale</h5>
                  <h5 className="mb-0 text-primary">€{cartTotal.toFixed(2)}</h5>
                </ListGroup.Item>
              </ListGroup>

              <div className="d-grid gap-2 mt-3">
                <Button variant="primary" size="lg">
                  Procedi al Checkout
                </Button>
                <Button variant="outline-secondary" onClick={() => navigate('/products')}>
                  ← Continua lo shopping
                </Button>
              </div>

              <Alert variant="info" className="mt-3 small mb-0">
                <strong>Spedizione gratuita</strong> su tutti gli ordini!
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Cart;