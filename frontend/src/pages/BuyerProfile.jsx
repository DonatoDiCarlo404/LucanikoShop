import React, { useEffect, useState } from 'react';
import { Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Card, Button, ListGroup, Spinner, Alert, Row, Col, Badge } from 'react-bootstrap';
import { useAuth } from '../context/authContext';
import { orderAPI, reviewAPI, wishlistAPI, authAPI } from '../services/api';

function paymentMethodLabel(method) {
  switch (method) {
    case 'carta': return 'Carta di credito/debito';
    case 'paypal': return 'PayPal';
    case 'bonifico': return 'Bonifico bancario';
    case 'contrassegno': return 'Contrassegno';
    case 'altro': return 'Altro';
    default: return method || '';
  }
}

const BuyerProfile = () => {
  const { user, setUser } = useAuth();
  const token = user?.token;
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [toRemove, setToRemove] = useState(null);
  
  // Stati separati per ogni sezione
  const [editPassword, setEditPassword] = useState(false);
  const [editAddress, setEditAddress] = useState(false);
  const [editPayment, setEditPayment] = useState(false);
  // Stati per nome/cognome
  const [editName, setEditName] = useState(false);
  // Fallback: se non esistono firstName/lastName, splitta name
  const getInitialFirstName = () => user?.firstName || (user?.name ? user.name.split(' ')[0] : '');
  const getInitialLastName = () => user?.lastName || (user?.name ? user.name.split(' ').slice(1).join(' ') : '');
  const [nameForm, setNameForm] = useState({
    firstName: getInitialFirstName(),
    lastName: getInitialLastName(),
    phone: user?.phone || ''
  });
    // Gestione input nome/cognome
    const handleNameChange = (e) => {
      const { name, value } = e.target;
      setNameForm((prev) => ({ ...prev, [name]: value }));
    };

    // Salva nome/cognome e aggiorna context utente
    const handleSaveName = async () => {
      setSaveLoading((prev) => ({ ...prev, name: true }));
      setSaveError((prev) => ({ ...prev, name: null }));
      setSaveSuccess((prev) => ({ ...prev, name: false }));
      try {
        if (!nameForm.firstName.trim() || !nameForm.lastName.trim()) throw new Error('Nome e cognome obbligatori');
        const fullName = `${nameForm.firstName} ${nameForm.lastName}`.trim();
        const updatedUser = await authAPI.updateProfile({
          firstName: nameForm.firstName,
          lastName: nameForm.lastName,
          name: fullName // retrocompatibilità
        }, token);
        setUser(prev => ({ ...prev, ...updatedUser }));
        setSaveSuccess((prev) => ({ ...prev, name: true }));
        setEditName(false);
      } catch (err) {
        setSaveError((prev) => ({ ...prev, name: err.message }));
      } finally {
        setSaveLoading((prev) => ({ ...prev, name: false }));
        setTimeout(() => setSaveSuccess((prev) => ({ ...prev, name: false })), 2000);
      }
    };
  
  const [passwordForm, setPasswordForm] = useState({ password: '' });
  const [addressForm, setAddressForm] = useState({
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zipCode: user?.address?.zipCode || '',
      country: user?.address?.country || '',
      taxCode: user?.address?.taxCode || ''
    },
    billingAddress: {
      street: user?.billingAddress?.street || '',
      city: user?.billingAddress?.city || '',
      state: user?.billingAddress?.state || '',
      zipCode: user?.billingAddress?.zipCode || '',
      country: user?.billingAddress?.country || '',
      taxCode: user?.billingAddress?.taxCode || ''
    },
    differentBillingAddress: !!user?.billingAddress?.street
  });
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: user?.paymentMethod || '',
    cardDetails: {
      cardHolder: user?.cardDetails?.cardHolder || '',
      cardNumber: user?.cardDetails?.cardNumber || '',
      expiryDate: user?.cardDetails?.expiryDate || '',
      cardType: user?.cardDetails?.cardType || ''
    }
  });
  
  const [saveLoading, setSaveLoading] = useState({ password: false, address: false, payment: false });
  const [saveError, setSaveError] = useState({ password: null, address: null, payment: null });
  const [saveSuccess, setSaveSuccess] = useState({ password: false, address: false, payment: false });
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [ordersData, reviewsData, wishlistData] = await Promise.all([
          orderAPI.getMyOrders(token),
          reviewAPI.getMyReviews(token),
          wishlistAPI.getWishlist(token),
        ]);
        setOrders(ordersData || []);
        setReviews(reviewsData || []);
        setWishlist(wishlistData || []);
      } catch (err) {
        console.error('Errore nel caricamento dei dati:', err);
        setError('Errore nel caricamento dei dati.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, token, navigate]);


  // Gestione input separati
  const handlePasswordChange = (e) => {
    setPasswordForm({ password: e.target.value });
  };

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('address.')) {
      const key = name.split('.')[1];
      setAddressForm((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }));
    } else if (name.startsWith('billingAddress.')) {
      const key = name.split('.')[1];
      setAddressForm((prev) => ({ ...prev, billingAddress: { ...prev.billingAddress, [key]: value } }));
    } else if (type === 'checkbox') {
      setAddressForm((prev) => ({ ...prev, [name]: checked }));
    }
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('cardDetails.')) {
      const key = name.split('.')[1];
      setPaymentForm((prev) => ({ ...prev, cardDetails: { ...prev.cardDetails, [key]: value } }));
    } else {
      setPaymentForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Salva password
  const handleSavePassword = async () => {
    setSaveLoading((prev) => ({ ...prev, password: true }));
    setSaveError((prev) => ({ ...prev, password: null }));
    setSaveSuccess((prev) => ({ ...prev, password: false }));
    try {
      if (!passwordForm.password || passwordForm.password.length < 8) {
        throw new Error('La password deve essere di almeno 8 caratteri');
      }
      await authAPI.updateProfile({ password: passwordForm.password }, token);
      setSaveSuccess((prev) => ({ ...prev, password: true }));
      setEditPassword(false);
      setPasswordForm({ password: '' });
    } catch (err) {
      setSaveError((prev) => ({ ...prev, password: err.message || 'Errore nel salvataggio' }));
    } finally {
      setSaveLoading((prev) => ({ ...prev, password: false }));
      setTimeout(() => setSaveSuccess((prev) => ({ ...prev, password: false })), 2000);
    }
  };

  // Salva indirizzo e aggiorna context utente
  const handleSaveAddress = async () => {
    setSaveLoading(l => ({ ...l, address: true }));
    setSaveError(e => ({ ...e, address: null }));
    setSaveSuccess(s => ({ ...s, address: false }));
    try {
      const updatedUser = await authAPI.updateProfile({
        address: addressForm.address,
        billingAddress: addressForm.differentBillingAddress ? addressForm.billingAddress : addressForm.address
      }, token);
      setUser(prev => ({ ...prev, ...updatedUser }));
      setSaveSuccess(s => ({ ...s, address: true }));
      setEditAddress(false);
    } catch (err) {
      setSaveError(e => ({ ...e, address: err.message }));
    } finally {
      setSaveLoading(l => ({ ...l, address: false }));
    }
  };

  // Salva metodo di pagamento
  const handleSavePayment = async () => {
    setSaveLoading((prev) => ({ ...prev, payment: true }));
    setSaveError((prev) => ({ ...prev, payment: null }));
    setSaveSuccess((prev) => ({ ...prev, payment: false }));
    try {
      const data = { paymentMethod: paymentForm.paymentMethod };
      if (paymentForm.paymentMethod === 'carta') {
        data.cardDetails = paymentForm.cardDetails;
      }
      const updated = await authAPI.updateProfile(data, token);
      setSaveSuccess((prev) => ({ ...prev, payment: true }));
      setEditPayment(false);
      setUser && setUser((prev) => ({ ...prev, ...updated }));
    } catch (err) {
      setSaveError((prev) => ({ ...prev, payment: err.message || 'Errore nel salvataggio' }));
    } finally {
      setSaveLoading((prev) => ({ ...prev, payment: false }));
      setTimeout(() => setSaveSuccess((prev) => ({ ...prev, payment: false })), 2000);
    }
  };

  if (!user) return null;

  return (
    <div className="container py-4">
      <h2 className="mb-4">Il mio Profilo</h2>

      {/* Sezione nome/cognome */}
      <Card className="mb-4" style={{ maxWidth: 500 }}>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div>
              <strong>Benvenuto</strong>
            </div>
            <Button size="sm" variant="outline-primary" onClick={() => setEditName(v => !v)}>
              {editName ? 'Annulla' : 'Modifica'}
            </Button>
          </div>
          {editName ? (
            <>
              <Form.Group className="mb-2">
                <Form.Label>Nome</Form.Label>
                <Form.Control
                  type="text"
                  name="firstName"
                  value={nameForm.firstName}
                  onChange={handleNameChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Cognome</Form.Label>
                <Form.Control
                  type="text"
                  name="lastName"
                  value={nameForm.lastName}
                  onChange={handleNameChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Numero di Telefono</Form.Label>
                <Form.Control
                  type="tel"
                  name="phone"
                  value={nameForm.phone}
                  onChange={handleNameChange}
                  required
                />
              </Form.Group>
              <Button size="sm" variant="success" onClick={handleSaveName} disabled={saveLoading.name}>
                {saveLoading.name ? 'Salvataggio...' : 'Salva'}
              </Button>
              {saveError.name && <Alert variant="danger" className="mt-2">{saveError.name}</Alert>}
              {saveSuccess.name && <Alert variant="success" className="mt-2">Salvato!</Alert>}
            </>
          ) : (
            <div>
              {user.firstName || user.lastName
                ? <>{user.firstName} {user.lastName}</>
                : user.name}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* ...existing code... */}
      <Row>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Informazioni personali</Card.Title>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Nome:</strong> {user.name || user.fullName || '-'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Email:</strong> {user.email}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Telefono:</strong> {user.phone || '-'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Ruolo:</strong> {user.role === 'buyer' || user.role === 'user' ? 'Acquirente' : user.role}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Data registrazione:</strong>{' '}
                  {user.memberSince
                    ? new Date(user.memberSince).toLocaleDateString()
                    : user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : '-'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Indirizzo di spedizione:</strong><br />
                  {user.address?.street && <>{user.address.street}, </>}
                  {user.address?.city && <>{user.address.city}, </>}
                  {user.address?.state && <>{user.address.state}, </>}
                  {user.address?.zipCode && <>{user.address.zipCode}, </>}
                  {user.address?.country && <>{user.address.country}</>}
                  {user.address?.taxCode && <><br /><strong>CF:</strong> {user.address.taxCode}</>}
                  {!(user.address?.street || user.address?.city || user.address?.state || user.address?.zipCode || user.address?.country) && <span className="text-muted">Non impostato</span>}
                </ListGroup.Item>
                {user.billingAddress?.street && (
                  <ListGroup.Item>
                    <strong>Indirizzo di fatturazione:</strong><br />
                    {user.billingAddress.street}, {user.billingAddress.city}, {user.billingAddress.state}, {user.billingAddress.zipCode}, {user.billingAddress.country}
                    {user.billingAddress.taxCode && <><br /><strong>CF:</strong> {user.billingAddress.taxCode}</>}
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>

          {/* Sezione 1: Password */}
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Password</h5>
                <Button size="sm" variant={editPassword ? 'secondary' : 'primary'} onClick={() => setEditPassword((v) => !v)}>
                  {editPassword ? 'Annulla' : 'Modifica'}
                </Button>
              </div>
              {editPassword && (
                <Form>
                  <Form.Group className="mb-3" controlId="formPassword">
                    <Form.Label>Nuova password</Form.Label>
                    <Form.Control
                      type="password"
                      value={passwordForm.password}
                      onChange={handlePasswordChange}
                      placeholder="Inserisci nuova password"
                      minLength={8}
                    />
                    <Form.Text muted>Almeno 8 caratteri, 1 maiuscola, 1 minuscola, 1 numero, 1 simbolo.</Form.Text>
                  </Form.Group>
                  <div className="d-flex gap-2 align-items-center">
                    <Button variant="success" onClick={handleSavePassword} disabled={saveLoading.password}>
                      {saveLoading.password ? 'Salvataggio...' : 'Salva password'}
                    </Button>
                    {saveSuccess.password && <span className="text-success">Salvato!</span>}
                    {saveError.password && <span className="text-danger">{saveError.password}</span>}
                  </div>
                </Form>
              )}
            </Card.Body>
          </Card>

          {/* Sezione 2: Indirizzi */}
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Indirizzi</h5>
                <Button size="sm" variant={editAddress ? 'secondary' : 'primary'} onClick={() => setEditAddress((v) => !v)}>
                  {editAddress ? 'Annulla' : 'Modifica'}
                </Button>
              </div>
              {editAddress && (
                <Form>
                  <h6 className="mb-2">Indirizzo di Spedizione</h6>
                  <Form.Group className="mb-2" controlId="formAddressStreet">
                    <Form.Label>Indirizzo</Form.Label>
                    <Form.Control
                      type="text"
                      name="address.street"
                      value={addressForm.address.street}
                      onChange={handleAddressChange}
                      placeholder="Via/Piazza"
                    />
                  </Form.Group>
                  <Row>
                    <Col md={8}>
                      <Form.Group className="mb-2" controlId="formAddressCity">
                        <Form.Label>Città</Form.Label>
                        <Form.Control
                          type="text"
                          name="address.city"
                          value={addressForm.address.city}
                          onChange={handleAddressChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-2" controlId="formAddressState">
                        <Form.Label>Provincia</Form.Label>
                        <Form.Control
                          type="text"
                          name="address.state"
                          value={addressForm.address.state}
                          onChange={handleAddressChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-2" controlId="formAddressZip">
                        <Form.Label>CAP</Form.Label>
                        <Form.Control
                          type="text"
                          name="address.zipCode"
                          value={addressForm.address.zipCode}
                          onChange={handleAddressChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={8}>
                      <Form.Group className="mb-2" controlId="formAddressCountry">
                        <Form.Label>Nazione</Form.Label>
                        <Form.Control
                          type="text"
                          name="address.country"
                          value={addressForm.address.country}
                          onChange={handleAddressChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3" controlId="formAddressTaxCode">
                    <Form.Label>Codice Fiscale</Form.Label>
                    <Form.Control
                      type="text"
                      name="address.taxCode"
                      value={addressForm.address.taxCode}
                      onChange={handleAddressChange}
                      placeholder="RSSMRA80A01H501U"
                      maxLength={16}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="formDifferentBilling">
                    <Form.Check
                      type="checkbox"
                      name="differentBillingAddress"
                      label="Indirizzo di fatturazione diverso da quello di spedizione"
                      checked={addressForm.differentBillingAddress}
                      onChange={handleAddressChange}
                    />
                  </Form.Group>
                  {addressForm.differentBillingAddress && (
                    <>
                      <h6 className="mb-2">Indirizzo di Fatturazione</h6>
                      <Form.Group className="mb-2" controlId="formBillingStreet">
                        <Form.Label>Indirizzo</Form.Label>
                        <Form.Control
                          type="text"
                          name="billingAddress.street"
                          value={addressForm.billingAddress.street}
                          onChange={handleAddressChange}
                          placeholder="Via/Piazza"
                        />
                      </Form.Group>
                      <Row>
                        <Col md={8}>
                          <Form.Group className="mb-2" controlId="formBillingCity">
                            <Form.Label>Città</Form.Label>
                            <Form.Control
                              type="text"
                              name="billingAddress.city"
                              value={addressForm.billingAddress.city}
                              onChange={handleAddressChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-2" controlId="formBillingState">
                            <Form.Label>Provincia</Form.Label>
                            <Form.Control
                              type="text"
                              name="billingAddress.state"
                              value={addressForm.billingAddress.state}
                              onChange={handleAddressChange}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-2" controlId="formBillingZip">
                            <Form.Label>CAP</Form.Label>
                            <Form.Control
                              type="text"
                              name="billingAddress.zipCode"
                              value={addressForm.billingAddress.zipCode}
                              onChange={handleAddressChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={8}>
                          <Form.Group className="mb-2" controlId="formBillingCountry">
                            <Form.Label>Nazione</Form.Label>
                            <Form.Control
                              type="text"
                              name="billingAddress.country"
                              value={addressForm.billingAddress.country}
                              onChange={handleAddressChange}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Form.Group className="mb-3" controlId="formBillingTaxCode">
                        <Form.Label>Codice Fiscale</Form.Label>
                        <Form.Control
                          type="text"
                          name="billingAddress.taxCode"
                          value={addressForm.billingAddress.taxCode}
                          onChange={handleAddressChange}
                          placeholder="RSSMRA80A01H501U"
                          maxLength={16}
                        />
                      </Form.Group>
                    </>
                  )}
                  <div className="d-flex gap-2 align-items-center">
                    <Button variant="success" onClick={handleSaveAddress} disabled={saveLoading.address}>
                      {saveLoading.address ? 'Salvataggio...' : 'Salva indirizzi'}
                    </Button>
                    {saveSuccess.address && <span className="text-success">Salvato!</span>}
                    {saveError.address && <span className="text-danger">{saveError.address}</span>}
                  </div>
                </Form>
              )}
            </Card.Body>
          </Card>

          {/* Sezione Metodo di Pagamento rimossa */}
        </Col>

        <Col md={8}>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : (
            <>
              <Card className="mb-4">
                <Card.Body>
                  <Card.Title>
                    <i className="bi bi-bag-check me-2"></i>I miei acquisti
                  </Card.Title>
                  {orders.length === 0 ? (
                    <Alert variant="info">Nessun ordine trovato.</Alert>
                  ) : (
                    <ListGroup variant="flush">
                      {orders.slice(0, 5).map((order) => (
                        <ListGroup.Item key={order._id} className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>Ordine #{order._id.slice(-8)}</strong>
                            <br />
                            <small className="text-muted">
                              {new Date(order.createdAt).toLocaleDateString()} - €{order.totalAmount || order.total}
                            </small>
                          </div>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => navigate(`/orders/${order._id}`)}
                          >
                            Dettagli
                          </Button>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                  {orders.length > 5 && (
                    <div className="text-center mt-3">
                      <Button variant="link" onClick={() => navigate('/orders')}>
                        Vedi tutti gli ordini
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>

              <Card className="mb-4">
                <Card.Body>
                  <Card.Title>
                    <i className="bi bi-star-fill me-2"></i>Le mie recensioni
                  </Card.Title>
                  {reviews.length === 0 ? (
                    <Alert variant="info">Nessuna recensione lasciata.</Alert>
                  ) : (
                    <ListGroup variant="flush">
                      {reviews.slice(0, 5).map((review) => (
                        <ListGroup.Item key={review._id}>
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <strong>{review.product?.name || 'Prodotto'}</strong>
                              <div className="mb-1">
                                {[...Array(5)].map((_, i) => (
                                  <i
                                    key={i}
                                    className={`bi bi-star${i < review.rating ? '-fill' : ''}`}
                                    style={{ color: '#ffc107' }}
                                  ></i>
                                ))}
                              </div>
                              <small className="text-muted">{review.comment}</small>
                              <br />
                              <small className="text-muted">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </small>
                            </div>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              onClick={() => navigate(`/products/${review.product?._id}`)}
                            >
                              Vedi prodotto
                            </Button>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>

              <Card className="mb-4">
                <Card.Body>
                  <Card.Title>
                    <i className="bi bi-heart-fill me-2"></i>Wishlist <Badge bg="secondary">{wishlist.length}</Badge>
                  </Card.Title>
                  {wishlist.length === 0 ? (
                    <Alert variant="info">La tua wishlist è vuota.</Alert>
                  ) : (
                    <ListGroup variant="flush">
                      {wishlist.slice(0, 5).map((item) => (
                        <ListGroup.Item key={item._id} className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            {item.product?.images?.[0]?.url && (
                              <img
                                src={item.product.images[0].url}
                                alt={item.product.name}
                                style={{ width: 50, height: 50, objectFit: 'cover', marginRight: 15, borderRadius: 5 }}
                              />
                            )}
                            <div>
                              <strong>{item.product?.name || 'Prodotto'}</strong>
                              <br />
                              <small className="text-muted">€{item.product?.price}</small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => navigate(`/products/${item.product?._id}`)}
                            >
                              Vedi
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => {
                                setToRemove(item.product._id);
                                setShowConfirm(true);
                              }}
                            >
                              Rimuovi
                            </Button>
                                {/* Modale conferma rimozione wishlist */}
                                <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered backdrop="static">
                                  <Modal.Body className="text-center">
                                    <div className="mb-3">Sei sicuro di voler rimuovere questo prodotto dalla wishlist?</div>
                                    <div className="d-flex justify-content-center gap-3">
                                      <Button
                                        variant="secondary"
                                        onClick={() => setShowConfirm(false)}
                                      >
                                        Annulla
                                      </Button>
                                      <Button
                                        variant="danger"
                                        onClick={async () => {
                                          if (!toRemove) return;
                                          setShowConfirm(false);
                                          setTimeout(async () => {
                                            try {
                                              await wishlistAPI.removeFromWishlist(toRemove, token);
                                              setWishlist(wishlist => wishlist.filter(w => w.product._id !== toRemove));
                                            } catch (err) {
                                              alert('Errore nella rimozione dalla wishlist');
                                            }
                                            setToRemove(null);
                                          }, 1000);
                                        }}
                                      >
                                        Conferma
                                      </Button>
                                    </div>
                                  </Modal.Body>
                                </Modal>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>
            </>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default BuyerProfile;
