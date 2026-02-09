import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, ListGroup, Alert, Badge, Form, Spinner, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/authContext';
import { checkoutAPI, API_URL } from '../services/api';
import { toast } from 'react-toastify';
import SuggestedProductsCarousel from '../components/SuggestedProductsCarousel';
import SEOHelmet from '../components/SEOHelmet';

const Cart = () => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    cartItems, 
    cartCount, 
    cartTotal, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    appliedCoupon,
    discountAmount,
    applyCoupon,
    removeCoupon
  } = useCart();

  // State per gestione guest checkout
  const [guestEmail, setGuestEmail] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);

  // State per gestione coupon
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // State per gestione spedizione
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingDetails, setShippingDetails] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState(null);

  // State per gestione termini e condizioni venditore
  const [vendorTerms, setVendorTerms] = useState({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [loadingTerms, setLoadingTerms] = useState(false);

  // State per modale privacy policy
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Stato per il paese e la regione di spedizione
  const [shippingCountry, setShippingCountry] = useState('Italia');
  const [shippingRegion, setShippingRegion] = useState('');

  // Calcola costo spedizione
  const calculateShipping = async () => {
    if (cartCount === 0) return;

    setLoadingShipping(true);
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      if (user) {
        headers.Authorization = `Bearer ${user.token}`;
      }

      const res = await fetch(`${API_URL}/orders/calculate-shipping`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: cartItems.map(item => ({
            product: item._id,
            quantity: item.quantity,
            price: item.price
          })),
          shippingAddress: {
            country: shippingCountry,
            state: shippingCountry === 'Italia' ? shippingRegion : ''
          }
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setShippingCost(data.totalShipping || 0);
        setShippingDetails(data.vendorShippingCosts || null);
        
        // Estrai le opzioni di spedizione disponibili
        const allOptions = [];
        if (data.vendorShippingCosts) {
          Object.values(data.vendorShippingCosts).forEach(vendorShipping => {
            if (vendorShipping.shippingOptions && vendorShipping.shippingOptions.length > 0) {
              allOptions.push(...vendorShipping.shippingOptions);
            }
          });
        }
        setShippingOptions(allOptions);
        
        // Seleziona automaticamente l'opzione più economica se disponibile
        if (allOptions.length > 0) {
          const cheapest = allOptions.reduce((min, opt) => opt.price < min.price ? opt : min, allOptions[0]);
          setSelectedShippingOption(cheapest);
          setShippingCost(cheapest.price);
        }
      } else {
        console.error('Errore calcolo spedizione:', data.message);
        setShippingCost(0);
        setShippingDetails(null);
        setShippingOptions([]);
        setSelectedShippingOption(null);
      }
    } catch (error) {
      console.error('Errore nella richiesta calcolo spedizione:', error);
      setShippingCost(0);
      setShippingDetails(null);
    } finally {
      setLoadingShipping(false);
    }
  };

  // Ricalcola spedizione quando il carrello, il paese o la regione cambiano
  useEffect(() => {
    calculateShipping();
  }, [cartItems, user, shippingCountry, shippingRegion]);

  // Recupera i termini e condizioni del venditore
  useEffect(() => {
    const fetchVendorTerms = async () => {
      if (cartItems.length === 0) return;

      setLoadingTerms(true);
      try {
        const vendorId = cartItems[0]?.seller?._id || cartItems[0]?.seller;
        
        if (vendorId) {
          const res = await fetch(`${API_URL}/vendors/${vendorId}`);
          const data = await res.json();
          
          const vendorData = data.vendor || data;

          if (res.ok && vendorData.shopSettings?.termsAndConditions?.content) {
            setVendorTerms({
              vendorId,
              vendorName: vendorData.businessName || 'Venditore',
              termsText: vendorData.shopSettings.termsAndConditions.content
            });
          }
        }
      } catch (error) {
        console.error('Errore recupero termini venditore:', error);
      } finally {
        setLoadingTerms(false);
      }
    };

    fetchVendorTerms();
  }, [cartItems]);

  const handleCheckout = async () => {
    if (cartCount === 0) return;

    if (vendorTerms.termsText && !acceptedTerms) {
      alert('Devi accettare i Termini e Condizioni del Venditore per procedere.');
      return;
    }

    if (!user && !guestEmail) {
      setShowGuestForm(true);
      return;
    }

    setIsCheckingOut(true);
    try {
      const { sessionId, url } = await checkoutAPI.createSession(
        cartItems,
        user ? user.token : null,
        guestEmail,
        appliedCoupon,
        discountAmount
      );

      localStorage.setItem('cart', JSON.stringify(cartItems));
      await new Promise(resolve => setTimeout(resolve, 100));

      window.location.href = url;
    } catch (error) {
      console.error('Errore durante il checkout:', error);
      toast.error('Errore durante il checkout. Riprova.');
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
      const res = await fetch(`${API_URL}/discounts/validate-coupon`, {
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

      applyCoupon(data.discount, parseFloat(discount.toFixed(2)));
      setCouponError('');
    } catch (err) {
      setCouponError(err.message);
      removeCoupon();
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Rimuovi coupon applicato
  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCode('');
    setCouponError('');
  };

  // ...existing code...

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
    <>
      <SEOHelmet
        title="Carrello - Lucaniko Shop"
        description="Completa il tuo ordine su Lucaniko Shop. Prodotti tipici lucani selezionati per te."
        keywords="carrello, checkout, ordine, lucaniko shop"
        url="https://lucanikoshop.it/cart"
      />
      <Container className="py-5">
        <Row>
        <Col md={8}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 style={{ color: '#004b75', fontWeight: 700 }}>Il tuo Carrello</h2>
            <div>
              {/* ...rimosso Fix Prezzi... */}
              <Button variant="outline-danger" size="sm" onClick={clearCart}>
                Svuota Carrello
              </Button>
            </div>
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
                        loading="lazy"
                      />
                    ) : (
                      <div style={{ width: '100%', height: '80px', backgroundColor: '#f0f0f0', borderRadius: '8px' }} />
                    )}
                  </Col>

                  <Col md={4}>
                    <h5 className="mb-1">{item.name}</h5>
                    <Badge className="badge-category-product">{typeof item.category === 'string' ? item.category : item.category?.name || 'N/A'}</Badge>
                  </Col>

                  <Col md={2}>
                    {item.hasActiveDiscount && item.discountedPrice && item.originalPrice ? (
                      <>
                        <div className="d-flex align-items-center gap-1">
                          <strong style={{ color: '#004b75' }}>€{item.discountedPrice.toFixed(2)}</strong>
                          <Badge className="badge-discount-small">
                            -{item.discountPercentage}%
                          </Badge>
                        </div>
                        <small className="text-muted d-block" style={{ textDecoration: 'line-through' }}>
                          €{item.originalPrice.toFixed(2)}
                        </small>
                        <small className="text-muted d-block">/{item.unit}</small>
                      </>
                    ) : (
                      <>
                        <strong>€{typeof item.price === 'number' && !isNaN(item.price) ? item.price.toFixed(2) : '0.00'}</strong>
                        <small className="text-muted d-block">/{item.unit}</small>
                      </>
                    )}
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
                      {item.hasActiveDiscount && item.discountedPrice ? (
                        <>
                          <strong style={{ color: '#004b75' }}>€{(item.discountedPrice * item.quantity).toFixed(2)}</strong>
                          <small className="d-block text-muted" style={{ textDecoration: 'line-through', fontSize: '0.8rem' }}>
                            €{(item.originalPrice * item.quantity).toFixed(2)}
                          </small>
                        </>
                      ) : (
                        <strong>€{(typeof item.price === 'number' && typeof item.quantity === 'number' && !isNaN(item.price * item.quantity)) ? (item.price * item.quantity).toFixed(2) : '0.00'}</strong>
                      )}
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
              <h5 className="mb-0" style={{ color: '#004b75', fontWeight: 700 }}>Riepilogo Ordine</h5>
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
                

                

                {/* Dropdown selezione paese di spedizione */}

                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <Form.Group className="w-100 mb-0">
                    <Form.Label className="small mb-1">Spedisci in</Form.Label>
                    <Form.Select
                      value={shippingCountry}
                      onChange={e => setShippingCountry(e.target.value)}
                      aria-label="Seleziona paese di spedizione"
                    >
                      <option value="Italia">Italia</option>
                      <option value="Francia">Francia</option>
                      <option value="Germania">Germania</option>
                      <option value="Spagna">Spagna</option>
                      <option value="Portogallo">Portogallo</option>
                      <option value="Paesi Bassi">Paesi Bassi</option>
                      <option value="Belgio">Belgio</option>
                      <option value="Albania">Albania</option>
                      <option value="Austria">Austria</option>
                      <option value="Svizzera">Svizzera</option>
                      <option value="Polonia">Polonia</option>
                      <option value="Grecia">Grecia</option>
                      <option value="Svezia">Svezia</option>
                      <option value="Danimarca">Danimarca</option>
                      <option value="Finlandia">Finlandia</option>
                      <option value="Repubblica Ceca">Repubblica Ceca</option>
                      <option value="Ungheria">Ungheria</option>
                      <option value="Romania">Romania</option>
                      <option value="Bulgaria">Bulgaria</option>
                    </Form.Select>
                  </Form.Group>
                </ListGroup.Item>

                {/* Dropdown regione se Italia */}
                {shippingCountry === 'Italia' && (
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <Form.Group className="w-100 mb-0">
                      <Form.Label className="small mb-1">Regione</Form.Label>
                      <Form.Select
                        value={shippingRegion}
                        onChange={e => setShippingRegion(e.target.value)}
                        aria-label="Seleziona regione"
                      >
                        <option value="">Seleziona regione</option>
                        <option value="Abruzzo">Abruzzo</option>
                        <option value="Basilicata">Basilicata</option>
                        <option value="Calabria">Calabria</option>
                        <option value="Campania">Campania</option>
                        <option value="Emilia-Romagna">Emilia-Romagna</option>
                        <option value="Friuli-Venezia Giulia">Friuli-Venezia Giulia</option>
                        <option value="Lazio">Lazio</option>
                        <option value="Liguria">Liguria</option>
                        <option value="Lombardia">Lombardia</option>
                        <option value="Marche">Marche</option>
                        <option value="Molise">Molise</option>
                        <option value="Piemonte">Piemonte</option>
                        <option value="Puglia">Puglia</option>
                        <option value="Sardegna">Sardegna</option>
                        <option value="Sicilia">Sicilia</option>
                        <option value="Toscana">Toscana</option>
                        <option value="Trentino-Alto Adige">Trentino-Alto Adige</option>
                        <option value="Umbria">Umbria</option>
                        <option value="Valle d'Aosta">Valle d'Aosta</option>
                        <option value="Veneto">Veneto</option>
                      </Form.Select>
                    </Form.Group>
                  </ListGroup.Item>
                )}

                {/* Sconto applicato */}
                {appliedCoupon && discountAmount > 0 && (
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <div>
                      <span className="text-success">Sconto ({appliedCoupon.couponCode})</span>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 ms-2 border-0 shadow-none remove-discount-x-mobile"
                        onClick={handleRemoveCoupon}
                        style={{ textDecoration: 'none', border: 'none', boxShadow: 'none' }}
                      >
                        ✕
                      </Button>
                    </div>
                    <strong className="text-success">-€{discountAmount.toFixed(2)}</strong>
                  </ListGroup.Item>
                )}



                <ListGroup.Item className="d-flex justify-content-between">
                  <h5 className="mb-0">Totale</h5>
                  <h5 className="mb-0" style={{ color: '#004b75' }}>€{finalTotal.toFixed(2)}</h5>
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

              {/* Form Email Guest se non loggato */}
              {!user && showGuestForm && (
                <Alert variant="info" className="mt-3">
                  <h6>Procedi come ospite</h6>
                  <p className="small mb-2">Inserisci la tua email per ricevere la conferma d'ordine. Non è necessario registrarsi!</p>
                  <Form.Group>
                    <Form.Control
                      type="email"
                      placeholder="La tua email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <div className="d-flex gap-2 mt-2">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={handleCheckout}
                      disabled={!guestEmail || !/\S+@\S+\.\S+/.test(guestEmail)}
                    >
                      Conferma e procedi
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setShowGuestForm(false)}
                    >
                      Annulla
                    </Button>
                  </div>
                  <div className="text-center mt-2">
                    <small>Oppure <Button variant="link" size="sm" className="p-0" onClick={() => navigate('/login')}>accedi</Button> / <Button variant="link" size="sm" className="p-0" onClick={() => navigate('/register')}>registrati</Button></small>
                  </div>
                </Alert>
              )}

              {/* Checkbox Termini e Condizioni Venditore */}
              {vendorTerms.termsText && (
                <Form.Group className="mt-3">
                  <Form.Check
                    type="checkbox"
                    id="accept-vendor-terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    label={
                      <span>
                        Confermando l'ordine dichiaro di aver letto e accettato i{' '}
                        <Button
                          variant="link"
                          className="p-0 text-decoration-underline border-0 shadow-none no-hover-effect"
                          style={{ fontSize: '0.9rem', verticalAlign: 'baseline', border: 'none', boxShadow: 'none', cursor: 'pointer', background: 'none' }}
                          onClick={(e) => {
                            e.preventDefault();
                            setShowTermsModal(true);
                          }}
                        >
                          Termini
                        </Button>
                        {' '}e la{' '}
                        <Button
                          variant="link"
                          className="p-0 text-decoration-underline border-0 shadow-none no-hover-effect"
                          style={{ fontSize: '0.9rem', verticalAlign: 'baseline', border: 'none', boxShadow: 'none', cursor: 'pointer', background: 'none' }}
                          onClick={(e) => {
                            e.preventDefault();
                            setShowPrivacyModal(true);
                          }}
                        >
                          Privacy Policy
                        </Button>
                        {' '}di Lucaniko Shop e le Condizioni Generali di Vendita dei Venditori presenti nel mio carrello, con i quali concludo separati contratti di vendita (consultabili nelle rispettive pagine Venditore).
                      </span>
                    }
                    required
                  />
                </Form.Group>
              )}

              <div className="d-grid gap-2 mt-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/billing-info')}
                  disabled={isCheckingOut || (vendorTerms.termsText && !acceptedTerms)}
                >
                  {isCheckingOut ? 'Caricamento...' : 'Procedi all\'acquisto (Na cos r iurn!)'}
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
                  {shippingDetails && Object.keys(shippingDetails).length > 1 && (
                    <div className="mt-2">
                      <div className="small fw-bold mb-1">Dettaglio spedizioni per venditore:</div>
                      {Object.entries(shippingDetails).map(([vendorId, details]) => (
                        <div key={vendorId} className="small d-flex justify-content-between align-items-center mb-1">
                          <span className="text-muted">• {details.vendorName || 'Venditore'}</span>
                          <span className="fw-bold">€{(details.shippingCost || 0).toFixed(2)}</span>
                        </div>
                      ))}
                      <hr className="my-2" />
                      <div className="small d-flex justify-content-between align-items-center">
                        <span className="fw-bold">Totale Spedizione:</span>
                        <span className="fw-bold text-primary">€{shippingCost.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Caroselli prodotti suggeriti - mostrati solo se ci sono prodotti nel carrello */}
      {cartItems && cartItems.length > 0 && (
        <>
          <SuggestedProductsCarousel 
            cartItems={cartItems}
            sameVendor={true}
            title="🏪 Altri prodotti dello stesso venditore"
            titleColor="#004b75"
          />
          
          <SuggestedProductsCarousel 
            cartItems={cartItems}
            sameVendor={false}
            title="✨ Prodotti simili da altre aziende lucane"
            titleColor="#004b75"
          />
        </>
      )}

      {/* Modale Termini Acquirenti */}
      <Modal show={showTermsModal} onHide={() => setShowTermsModal(false)} size="lg" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>Termini & Condizioni Acquirenti – Lucaniko Shop</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTermsModal(false)}>
            Chiudi
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setAcceptedTerms(true);
              setShowTermsModal(false);
            }}
          >
            Accetta e Chiudi
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modale Privacy Policy */}
      <Modal show={showPrivacyModal} onHide={() => setShowPrivacyModal(false)} size="lg" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>Privacy Policy – Lucaniko Shop</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3 text-muted" style={{ fontSize: '0.98rem' }}>Ultimo aggiornamento: 4 febbraio 2026</div>
          <div className="mb-4" style={{ fontSize: '1.05rem', lineHeight: 1.7 }}>
            <strong>Titolare del trattamento</strong><br />
            INSIDE di Di Pietro Vito – P. IVA 02118850763<br />
            Sede: Via Monticchio 17/B, 85028 Rionero in Vulture (PZ)<br />
            Email privacy: <a href="mailto:info@dipietrodigital.it">info@dipietrodigital.it</a>
          </div>

          <div style={{ fontSize: '1.05rem', lineHeight: 1.7 }}>
            <div style={{ marginBottom: 28 }}>
              <strong>7.1 Marketplace: ruoli privacy</strong>
              <div style={{ marginTop: 6 }}>
                <strong>Lucaniko Shop:</strong> Titolare per dati necessari a piattaforma (account, sicurezza, log, gestione tecnica ordini, supporto, comunicazioni).<br /><br />
                <strong>Venditori:</strong> Titolari autonomi per dati necessari a evasione ordine, spedizione, resi, garanzie, fatturazione.<br /><br />
                <strong>Stripe:</strong> gestisce pagamenti secondo propri termini (ruolo come da contratti Stripe).
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <strong>7.2 Dati trattati</strong>
              <ul style={{ marginTop: 6 }}>
                <li>dati account acquirente (nome, contatti, indirizzi)</li>
                <li>dati ordine (prodotti acquistati, importi, stato)</li>
                <li>dati account venditore (azienda, P.IVA, SDI, referente, documentazione)</li>
                <li>dati assistenza (messaggi/allegati)</li>
                <li>dati tecnici (IP, log, eventi sicurezza)</li>
                <li>dati pagamento: Lucaniko Shop non conserva carte; riceve esiti/ID transazione</li>
              </ul>
            </div>

            <div style={{ marginBottom: 28 }}>
              <strong>7.3 Finalità e basi giuridiche</strong>
              <ul style={{ marginTop: 6 }}>
                <li>erogazione servizio e gestione account/ordini (art. 6(1)(b))</li>
                <li>sicurezza e prevenzione frodi (art. 6(1)(f))</li>
                <li>adempimenti legali (art. 6(1)(c))</li>
                <li>assistenza (art. 6(1)(b)/(f))</li>
                <li>marketing/newsletter (consenso art. 6(1)(a) o soft-spam dove lecito)</li>
                <li>analytics e miglioramento (legittimo interesse; consenso per cookie non tecnici)</li>
              </ul>
            </div>

            <div style={{ marginBottom: 28 }}>
              <strong>7.4 Destinatari</strong>
              <div style={{ marginTop: 6 }}>
                Fornitori tecnici (hosting, email, helpdesk) come responsabili; Stripe; Venditori per gestione ordini; autorità ove necessario.
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <strong>7.5 Trasferimenti extra SEE</strong>
              <div style={{ marginTop: 6 }}>
                Possibili per alcuni fornitori: con garanzie adeguate (SCC/adeguatezza).
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <strong>7.6 Conservazione</strong>
              <ul style={{ marginTop: 6 }}>
                <li>account: fino a cancellazione o inattività prolungata (salvo obblighi)</li>
                <li>ordini e dati amministrativi: secondo legge</li>
                <li>log sicurezza: per periodi limitati/proporzionati</li>
              </ul>
            </div>

            <div style={{ marginBottom: 28 }}>
              <strong>7.7 Diritti</strong>
              <div style={{ marginTop: 6 }}>
                Accesso, rettifica, cancellazione, limitazione, portabilità, opposizione, revoca consenso; reclamo al Garante.
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <strong>7.8 Minori</strong>
              <div style={{ marginTop: 6 }}>
                Piattaforma non destinata a minori di 18 anni.
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPrivacyModal(false)}>
            Chiudi
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setAcceptedTerms(true);
              setShowPrivacyModal(false);
            }}
          >
            Accetta e Chiudi
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
    </>
  );
};

export default Cart;
