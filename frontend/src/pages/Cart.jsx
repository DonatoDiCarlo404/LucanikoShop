import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, ListGroup, Alert, Badge, Form, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/authContext';
import { checkoutAPI } from '../services/api';

const Cart = () => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { cartItems, cartCount, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();

  // State per gestione coupon
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  // State per gestione spedizione
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingDetails, setShippingDetails] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

  // Calcola costo spedizione
  const calculateShipping = async () => {
    if (cartCount === 0 || !user) return;

    setLoadingShipping(true);
    try {
      const res = await fetch('http://localhost:5000/api/orders/calculate-shipping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            product: item._id,
            quantity: item.quantity
          })),
          shippingAddress: {
            country: 'Italia',
            state: ''
          }
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setShippingCost(data.totalShipping || 0);
        setShippingDetails(data.vendorShippingCosts || null);
      } else {
        console.error('Errore calcolo spedizione:', data.message);
        setShippingCost(0);
        setShippingDetails(null);
      }
    } catch (error) {
      console.error('Errore nella richiesta calcolo spedizione:', error);
      setShippingCost(0);
      setShippingDetails(null);
    } finally {
      setLoadingShipping(false);
    }
  };

  // Ricalcola spedizione quando il carrello cambia
  useEffect(() => {
    calculateShipping();
  }, [cartItems, user]);

  const handleCheckout = async () => {
    if (cartCount === 0) return;

    setIsCheckingOut(true);
    try {
      const { sessionId, url } = await checkoutAPI.createSession(cartItems, user.token);

      // Salva esplicitamente il carrello prima del redirect
      localStorage.setItem('cart', JSON.stringify(cartItems));
      await new Promise(resolve => setTimeout(resolve, 100));

      // Reindirizza a Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Errore durante il checkout:', error);
      alert('Errore durante il checkout. Riprova.');
      setIsCheckingOut(false);
    }
  };


  // Funzione per applicare il coupon (simulazione calcolo lato client)
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Inserisci un codice coupon');
      return;
    }

    setApplyingCoupon(true);
    setCouponError('');

    try {
      // Verifica coupon tramite API
      const res = await fetch('http://localhost:5000/api/discounts/validate-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          couponCode: couponCode.toUpperCase(),
          cartTotal
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Codice coupon non valido');
      }

      // Calcola lo sconto
      let discount = 0;
      if (data.discount.discountType === 'percentage') {
        discount = (cartTotal * data.discount.discountValue) / 100;
        
        // Applica limite massimo se presente
        if (data.discount.maxDiscountAmount && discount > data.discount.maxDiscountAmount) {
          discount = data.discount.maxDiscountAmount;
        }
      } else if (data.discount.discountType === 'fixed') {
        discount = data.discount.discountValue;
        
        // Lo sconto non può essere maggiore del totale
        if (discount > cartTotal) {
          discount = cartTotal;
        }
      }

      setAppliedCoupon(data.discount);
      setDiscountAmount(parseFloat(discount.toFixed(2)));
      setCouponError('');
    } catch (err) {
      setCouponError(err.message);
      setAppliedCoupon(null);
      setDiscountAmount(0);
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Rimuovi coupon applicato
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode('');
    setCouponError('');
  };

  // Calcola il totale finale con sconto e spedizione
  const finalTotal = cartTotal + shippingCost - discountAmount;


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
                  {loadingShipping ? (
                    <Spinner animation="border" size="sm" />
                  ) : shippingCost === 0 ? (
                    <Badge bg="success">GRATIS</Badge>
                  ) : (
                    <strong>€{shippingCost.toFixed(2)}</strong>
                  )}
                </ListGroup.Item>
                
                {/* Sconto applicato */}
                {appliedCoupon && discountAmount > 0 && (
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <div>
                      <span className="text-success">Sconto ({appliedCoupon.couponCode})</span>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger p-0 ms-2"
                        onClick={handleRemoveCoupon}
                        style={{ textDecoration: 'none' }}
                      >
                        ✕
                      </Button>
                    </div>
                    <strong className="text-success">-€{discountAmount.toFixed(2)}</strong>
                  </ListGroup.Item>
                )}

                <ListGroup.Item className="d-flex justify-content-between">
                  <h5 className="mb-0">Totale</h5>
                  <h5 className="mb-0 text-primary">€{finalTotal.toFixed(2)}</h5>
                </ListGroup.Item>
              </ListGroup>

              {/* Campo Coupon */}
              {!appliedCoupon && (
                <div className="mt-3">
                  <Form.Group>
                    <Form.Label className="small">Hai un codice sconto?</Form.Label>
                    <div className="d-flex gap-2">
                      <Form.Control
                        type="text"
                        placeholder="Inserisci codice"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      />
                      <Button
                        variant="outline-primary"
                        onClick={handleApplyCoupon}
                        disabled={applyingCoupon || !couponCode.trim()}
                      >
                        {applyingCoupon ? 'Verifica...' : 'Applica'}
                      </Button>
                    </div>
                    {couponError && (
                      <Form.Text className="text-danger">
                        {couponError}
                      </Form.Text>
                    )}
                  </Form.Group>
                </div>
              )}

              <div className="d-grid gap-2 mt-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                >
                  {isCheckingOut ? 'Caricamento...' : 'Procedi al Checkout'}
                </Button>
                <Button variant="outline-secondary" onClick={() => navigate('/products')}>
                  ← Continua lo shopping
                </Button>
              </div>

              {shippingCost === 0 ? (
                <Alert variant="success" className="mt-3 small mb-0">
                  <strong>🎉 Spedizione gratuita</strong> per questo ordine!
                </Alert>
              ) : (
                <Alert variant="info" className="mt-3 small mb-0">
                  <strong>📦 Spedizione:</strong> I costi variano in base al peso e alla destinazione.
                  {shippingDetails && (
                    <div className="mt-2">
                      {Object.entries(shippingDetails).map(([vendorId, details]) => (
                        <div key={vendorId} className="small text-muted">
                          • {details.message}
                        </div>
                      ))}
                    </div>
                  )}
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Cart;