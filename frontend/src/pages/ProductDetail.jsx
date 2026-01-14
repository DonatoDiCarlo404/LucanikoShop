import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Spinner,
  Alert,
  Carousel,
  ListGroup,
} from 'react-bootstrap';

import { productsAPI } from '../services/api';
import { useAuth } from '../context/authContext';
import { useCart } from '../context/CartContext';


const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const { addToCart, cartItems } = useCart() || {};

  // STATE
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewError, setReviewError] = useState('');
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  // Se il prodotto ha varianti, seleziona la prima combinazione valida all'apertura
  useEffect(() => {
    if (!product || !Array.isArray(product.variants) || product.variants.length === 0) return;
    if (Object.keys(selectedOptions).length > 0) return;
    const firstVariant = product.variants.find(v => v.active !== false) || product.variants[0];
    if (!firstVariant) return;
    const initialOptions = {};
    for (const attr of firstVariant.attributes) {
      initialOptions[attr.key] = attr.value;
    }
    setSelectedOptions(initialOptions);
  }, [product]);


  // Aggiorna selectedVariant quando cambia prodotto o selezione
  useEffect(() => {
    if (!product || !Array.isArray(product.variants) || product.variants.length === 0) {
      setSelectedVariant(null);
      return;
    }
    // Trova la variante che corrisponde alla selezione
    const found = product.variants.find(variant =>
      variant.attributes.every(attr => selectedOptions[attr.key] === attr.value)
    );
    setSelectedVariant(found || null);
  }, [product, selectedOptions]);

  // LOAD PRODUCT
  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await productsAPI.getById(id);
      setProduct(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Errore caricamento prodotto');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [id]);

  // LOAD REVIEWS
  const loadReviews = async () => {
    try {
      setReviewLoading(true);
      setReviewError('');
      setDeleteSuccess('');
      setEditSuccess('');

      const res = await fetch(`http://localhost:5000/api/reviews/${id}`);
      if (!res.ok) {
        throw new Error(`Errore caricamento recensioni: status ${res.status}`);
      }

      const data = await res.json();
      setReviews(data);
    } catch (err) {
      console.error(err);
      setReviewError('Errore nel caricamento delle recensioni');
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [id]);

  // CHECK ACQUISTO
  const checkIfPurchased = async () => {
    if (!user) return setHasPurchased(false);

    try {
      const res = await fetch(`http://localhost:5000/api/orders/check-purchased/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      const data = await res.json();
      setHasPurchased(!!data.purchased);
    } catch (err) {
      console.error(err);
      setHasPurchased(false);
    }
  };

  useEffect(() => {
    checkIfPurchased();
  }, [id, user]);

  // HANDLERS RECENSIONI
  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setSubmitError('Devi essere loggato.');
      return;
    }
    if (!myComment.trim()) {
      setSubmitError('Il commento non può essere vuoto.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');

      const res = await fetch(`http://localhost:5000/api/reviews/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ rating: myRating, comment: myComment }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Errore invio recensione');

      setMyComment('');
      setMyRating(5);
      await loadReviews();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setEditRating(review.rating || 5);
    setEditComment(review.comment || '');
    setEditError('');
    setEditSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
    setEditRating(5);
    setEditComment('');
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setEditError('Devi essere loggato.');
      return;
    }
    if (!editComment.trim()) {
      setEditError('Il commento non può essere vuoto.');
      return;
    }

    try {
      setEditSubmitting(true);

      const res = await fetch(`http://localhost:5000/api/reviews/${editingReview._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ rating: editRating, comment: editComment }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setEditSuccess('Recensione aggiornata.');
      setEditingReview(null);
      await loadReviews();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete review
  const handleDeleteReview = async (reviewId) => {
    if (!user) {
      alert('Devi essere loggato.');
      return;
    }

    if (!window.confirm('Sei sicuro di voler eliminare questa recensione?')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setDeleteSuccess('Recensione eliminata.');
      await loadReviews();
    } catch (err) {
      alert(err.message);
    }
  };


  // ADD TO CART
  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, 1);
    alert(`✅ ${product.name} aggiunto al carrello!`);
  };

  // ACQUISTA ORA
  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product, 1);
    // Attendi che il carrello sia aggiornato, poi vai al checkout
    setTimeout(() => {
      navigate('/cart');
    }, 100);
  };

  // RENDER
  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Caricamento prodotto...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Button onClick={() => navigate('/products')}>Torna al catalogo</Button>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="py-5">
        <Alert variant="warning">Prodotto non trovato</Alert>
        <Button onClick={() => navigate('/products')}>Torna al catalogo</Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Button variant="outline-secondary" className="mb-4" onClick={() => navigate('/products')}>
        ← Torna al catalogo
      </Button>


      <Row>
        {/* COLONNA IMMAGINI */}
        <Col md={6}>
          {product.images?.length > 0 ? (
            <Carousel>
              {product.images.map((image, index) => (
                <Carousel.Item key={index}>
                  <img
                    className="d-block w-100"
                    src={image.url}
                    alt={`${product.name} - ${index + 1}`}
                    style={{ height: '400px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                </Carousel.Item>
              ))}
            </Carousel>
          ) : (
            <div
              style={{
                height: '400px',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
              }}
            >
              <span className="text-muted">Nessuna immagine disponibile</span>
            </div>
          )}
        </Col>

        {/* COLONNA DETTAGLI */}

        <Col md={6}>
          <div className="mb-3">
            <Badge bg="secondary" className="mb-2">
              {typeof product.category === 'string' ? product.category : product.category?.name || 'N/A'}
            </Badge>
            <h2>{product.name}</h2>
          </div>

          {/* VENDITORE */}
          {product.seller && (
            <Card className="mb-3">
              <Card.Body>
                <h5>Venduto da</h5>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <strong>Azienda:</strong>{' '}
                    <span 
                      style={{ 
                        color: '#0d6efd', 
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                      onClick={() => navigate(`/shop/${product.seller._id}`)}
                    >
                      {product.seller.businessName || product.seller.name}
                    </span>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => navigate(`/shop/${product.seller._id}`)}
                    >
                      Vedi tutti i prodotti di questo venditore →
                    </Button>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          )}

          {/* VARIANTI: Selezione e prezzo dinamico */}
          <Card className="mb-3">
            <Card.Body>
              {Array.isArray(product.variants) && product.variants.length > 0 && product.customAttributes ? (
                <>
                  {/* Selettori per ogni attributo variante */}
                  {product.customAttributes.filter(a => a.allowVariants && a.options?.length > 0).map(attr => (
                    <div key={attr.key} className="mb-2">
                      <strong>{attr.name}:</strong>{' '}
                      <select
                        value={selectedOptions[attr.key] || ''}
                        onChange={e => setSelectedOptions(opts => ({ ...opts, [attr.key]: e.target.value }))}
                        style={{ minWidth: 120, padding: '4px 8px' }}
                      >
                        <option value="">Seleziona...</option>
                        {attr.options.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {/* Prezzo e disponibilità variante selezionata */}
                  {selectedVariant ? (
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        {product.hasActiveDiscount && product.discountedPrice && product.originalPrice ? (
                          <>
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <h3 className="text-primary mb-0">
                                €{typeof selectedVariant.price === 'number' ? selectedVariant.price.toFixed(2) : product.discountedPrice.toFixed(2)}
                                <small className="text-muted">/{product.unit}</small>
                              </h3>
                              <Badge bg="danger" className="ms-2">
                                -{product.discountPercentage}%
                              </Badge>
                            </div>
                            <div>
                              <small className="text-muted" style={{ textDecoration: 'line-through' }}>
                                €{product.originalPrice.toFixed(2)}
                              </small>
                            </div>
                          </>
                        ) : (
                          <h3 className="text-primary mb-0">
                            €{typeof selectedVariant.price === 'number' ? selectedVariant.price.toFixed(2) : (typeof product.price === 'number' ? product.price.toFixed(2) : '—')}
                            <small className="text-muted">/{product.unit}</small>
                          </h3>
                        )}
                      </div>
                      {selectedVariant.stock > 0 ? (
                        <Badge bg="success">✓ Disponibile ({selectedVariant.stock})</Badge>
                      ) : (
                        <Badge bg="danger">✗ Esaurito</Badge>
                      )}
                    </div>
                  ) : (
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <h5 className="text-muted mb-0">Seleziona una variante per vedere prezzo e disponibilità</h5>
                      <Badge bg="secondary">—</Badge>
                    </div>
                  )}
                </>
              ) : (
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    {product.hasActiveDiscount && product.discountedPrice && product.originalPrice ? (
                      <>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <h3 className="text-primary mb-0">
                            €{product.discountedPrice.toFixed(2)}
                            <small className="text-muted">/{product.unit}</small>
                          </h3>
                          <Badge bg="danger" className="ms-2">
                            -{product.discountPercentage}%
                          </Badge>
                        </div>
                        <div>
                          <small className="text-muted" style={{ textDecoration: 'line-through' }}>
                            €{product.originalPrice.toFixed(2)}
                          </small>
                        </div>
                      </>
                    ) : (
                      <h3 className="text-primary mb-0">
                        €{typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
                        <small className="text-muted">/{product.unit}</small>
                      </h3>
                    )}
                  </div>
                  {product.stock > 0 ? (
                    <Badge bg="success">✓ Disponibile</Badge>
                  ) : (
                    <Badge bg="danger">✗ Esaurito</Badge>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* DESCRIZIONE */}
          {product.description && (
            <Card className="mb-3">
              <Card.Body>
                <h5>Descrizione</h5>
                <p>{product.description}</p>
              </Card.Body>
            </Card>
          )}

          {/* RECENSIONI */}
          <Card className="mb-3">
            <Card.Body>
              <h5>Recensioni</h5>
              {deleteSuccess && <Alert variant="success">{deleteSuccess}</Alert>}
              {editSuccess && <Alert variant="success">{editSuccess}</Alert>}

              {reviewLoading ? (
                <Spinner animation="border" size="sm" />
              ) : reviewError ? (
                <Alert variant="danger">{reviewError}</Alert>
              ) : reviews.length === 0 ? (
                <p>Nessuna recensione per questo prodotto.</p>
              ) : (
                <ListGroup variant="flush">
                  {reviews.map((r) => (
                    <ListGroup.Item key={r._id}>
                      <div className="d-flex align-items-center mb-1">
                        <span style={{ color: '#FFD700' }}>
                          {'★'.repeat(r.rating)}
                          {'☆'.repeat(5 - r.rating)}
                        </span>

                        <strong className="ms-2">{r.user?.name}</strong>

                        <small className="text-muted ms-2">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </small>
                      </div>

                      <div>{r.comment}</div>

                      {r.updatedAt && r.updatedAt !== r.createdAt && (
                        <div className="text-muted" style={{ fontSize: '0.9em' }}>
                          Recensione modificata il {new Date(r.updatedAt).toLocaleDateString()}
                        </div>
                      )}

                      {/* Pulsante modifica */}
                      {user && r.user?._id === user._id && !editingReview && (() => {
                        const created = new Date(r.createdAt);
                        const now = new Date();
                        const diffDays = (now - created) / (1000 * 60 * 60 * 24);
                        if (diffDays <= 30) {
                          return (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="mt-2 me-2"
                              onClick={() => handleEditReview(r)}
                            >
                              Modifica
                            </Button>
                          );
                        } else {
                          return (
                            <div className="text-muted mt-2" style={{ fontSize: '0.9em' }}>
                              Modifica non più consentita
                            </div>
                          );
                        }
                      })()}

                      {/* Pulsante elimina */}
                      {user &&
                        ((r.user?._id === user._id &&
                          (() => {
                            const created = new Date(r.createdAt);
                            const now = new Date();
                            const diffDays = (now - created) / (1000 * 60 * 60 * 24);
                            return diffDays <= 30;
                          })()) ||
                          user.role === 'admin') && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="mt-2"
                            onClick={() => handleDeleteReview(r._id)}
                          >
                            Elimina
                          </Button>
                        )}

                      {/* FORM modifica */}
                      {editingReview && editingReview._id === r._id && (
                        <form onSubmit={handleEditSubmit} className="mt-2">
                          {/* VARIANTI: Selezione e prezzo dinamico */}
                          <Card className="mb-3">
                            <Card.Body>
                              {Array.isArray(product.variants) && product.variants.length > 0 && product.customAttributes ? (
                                <>
                                  {/* Selettori per ogni attributo variante */}
                                  {product.customAttributes.filter(a => a.allowVariants && a.options?.length > 0).map(attr => (
                                    <div key={attr.key} className="mb-2">
                                      <strong>{attr.name}:</strong>{' '}
                                      <select
                                        value={selectedOptions[attr.key] || ''}
                                        onChange={e => setSelectedOptions(opts => ({ ...opts, [attr.key]: e.target.value }))}
                                        style={{ minWidth: 120 }}
                                      >
                                        <option value="">Seleziona...</option>
                                        {attr.options.map(opt => (
                                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                  ))}
                                  {/* Prezzo e disponibilità variante selezionata */}
                                  {selectedVariant ? (
                                    <div className="d-flex justify-content-between align-items-center mt-3">
                                      <h3 className="text-primary mb-0">
                                        €{typeof selectedVariant.price === 'number' ? selectedVariant.price.toFixed(2) : (typeof product.price === 'number' ? product.price.toFixed(2) : '—')}
                                        <small className="text-muted">/{product.unit}</small>
                                      </h3>
                                      {selectedVariant.stock > 0 ? (
                                        <Badge bg="success">✓ Disponibile</Badge>
                                      ) : (
                                        <Badge bg="danger">✗ Esaurito</Badge>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="d-flex justify-content-between align-items-center mt-3">
                                      <h5 className="text-muted mb-0">Seleziona una variante</h5>
                                      <Badge bg="secondary">—</Badge>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="d-flex justify-content-between">
                                  <h3 className="text-primary mb-0">
                                    €{Number(product.price).toFixed(2)}
                                    <small className="text-muted">/{product.unit}</small>
                                  </h3>
                                  {product.stock > 0 ? (
                                    <Badge bg="success">✓ Disponibile</Badge>
                                  ) : (
                                    <Badge bg="danger">✗ Esaurito</Badge>
                                  )}
                                </div>
                              )}
                            </Card.Body>
                          </Card>
                        </form>
                      )}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>

          {/* FORM RECENSIONE SOLO SE ACQUISTATO */}

          {user &&
            hasPurchased &&
            !reviews.some((r) => r.user?._id === user._id) && (
              <Card className="mb-3">
                <Card.Body>
                  <h6>Lascia una recensione</h6>
                  <form onSubmit={handleReviewSubmit}>
                    <div className="mb-2">
                      <label>Rating:</label>
                      <select
                        className="ms-2"
                        value={myRating}
                        onChange={(e) => setMyRating(Number(e.target.value))}
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      className="form-control mb-2"
                      rows={2}
                      value={myComment}
                      onChange={(e) => setMyComment(e.target.value)}
                      placeholder="Scrivi un commento..."
                      required
                    />
                    {submitError && <Alert variant="danger">{submitError}</Alert>}
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Invio...' : 'Invia recensione'}
                    </Button>
                  </form>
                </Card.Body>
              </Card>
            )}

          {/* MESSAGGIO SE NON HA ACQUISTATO */}
          {user && !hasPurchased && (
            <Alert variant="info">
              Puoi lasciare una recensione solo dopo aver acquistato questo prodotto.
            </Alert>
          )}

          {/* BOTTONI */}
          <div className="d-grid gap-2">
            <Button
              variant="primary"
              size="lg"
              disabled={
                (Array.isArray(product.variants) && product.variants.length > 0)
                  ? !(selectedVariant && selectedVariant.stock > 0)
                  : product.stock === 0
              }
              onClick={handleAddToCart}
            >
              {(Array.isArray(product.variants) && product.variants.length > 0)
                ? (selectedVariant && selectedVariant.stock > 0
                    ? '🛒 Aggiungi al carrello'
                    : 'Non disponibile')
                : (product.stock > 0 ? '🛒 Aggiungi al carrello' : 'Non disponibile')}
            </Button>
            <Button
              variant="success"
              size="lg"
              className="mt-2"
              disabled={
                (Array.isArray(product.variants) && product.variants.length > 0)
                  ? !(selectedVariant && selectedVariant.stock > 0)
                  : product.stock === 0
              }
              onClick={handleBuyNow}
            >
              🚀 Acquista Ora
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductDetail;
