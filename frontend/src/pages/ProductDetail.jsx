import { useState, useEffect } from 'react';
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
  ListGroup
} from 'react-bootstrap';
import { productsAPI } from '../services/api';
import { useAuth } from '../context/authContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await productsAPI.getById(id);
      setProduct(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    // TODO: implementare carrello (Giorno 10-11)
    alert('Funzionalità carrello disponibile prossimamente! 🛒');
  };

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
        <Alert variant="danger">
          {error}
        </Alert>
        <Button onClick={() => navigate('/products')}>
          Torna al catalogo
        </Button>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          Prodotto non trovato
        </Alert>
        <Button onClick={() => navigate('/products')}>
          Torna al catalogo
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Button 
        variant="outline-secondary" 
        className="mb-4"
        onClick={() => navigate('/products')}
      >
        ← Torna al catalogo
      </Button>

      <Row>
        {/* Galleria Immagini */}
        <Col md={6}>
          {product.images && product.images.length > 0 ? (
            <Carousel>
              {product.images.map((image, index) => (
                <Carousel.Item key={index}>
                  <img
                    className="d-block w-100"
                    src={image.url}
                    alt={`${product.name} - ${index + 1}`}
                    style={{ 
                      height: '400px', 
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
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
                borderRadius: '8px'
              }}
            >
              <span className="text-muted">Nessuna immagine disponibile</span>
            </div>
          )}
        </Col>

        {/* Informazioni Prodotto */}
        <Col md={6}>
          <div className="mb-3">
            <Badge bg="secondary" className="mb-2">
              {product.category}
            </Badge>
            <h2>{product.name}</h2>
          </div>

          <Card className="mb-3">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h3 className="text-primary mb-0">
                    €{product.price.toFixed(2)}
                    <small className="text-muted" style={{ fontSize: '1rem' }}>
                      /{product.unit}
                    </small>
                  </h3>
                </div>
                
                {product.stock > 0 ? (
                  <Badge bg="success" style={{ fontSize: '1rem', padding: '8px 16px' }}>
                    ✓ Disponibile
                  </Badge>
                ) : (
                  <Badge bg="danger" style={{ fontSize: '1rem', padding: '8px 16px' }}>
                    ✗ Esaurito
                  </Badge>
                )}
              </div>

              {product.stock > 0 && (
                <p className="text-muted mb-0">
                  <strong>{product.stock}</strong> {product.unit} disponibili
                </p>
              )}
            </Card.Body>
          </Card>

          {/* Descrizione */}
          {product.description && (
            <Card className="mb-3">
              <Card.Body>
                <h5>Descrizione</h5>
                <p style={{ whiteSpace: 'pre-wrap' }}>{product.description}</p>
              </Card.Body>
            </Card>
          )}

          {/* Informazioni Venditore */}
          {product.seller && (
            <Card className="mb-3">
              <Card.Body>
                <h5>Venduto da</h5>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <strong>Azienda:</strong> {product.seller.businessName || product.seller.name}
                  </ListGroup.Item>
                  {product.seller.email && (
                    <ListGroup.Item>
                      <strong>Email:</strong> {product.seller.email}
                    </ListGroup.Item>
                  )}
                </ListGroup>
              </Card.Body>
            </Card>
          )}

          {/* Pulsante Acquisto */}
          <div className="d-grid gap-2">
            <Button
              variant="primary"
              size="lg"
              disabled={product.stock === 0}
              onClick={handleAddToCart}
            >
              {product.stock > 0 ? '🛒 Aggiungi al carrello' : 'Non disponibile'}
            </Button>
            
            {user && (user.role === 'admin' || (user.role === 'seller' && product.seller && product.seller._id === user.id)) && (
              <Button
                variant="outline-secondary"
                onClick={() => navigate(`/products/edit/${product._id}`)}
              >
                ✏️ Modifica prodotto
              </Button>
            )}
          </div>

          {/* Info Aggiuntive */}
          <Card className="mt-3 bg-light">
            <Card.Body>
              <small className="text-muted">
                <p className="mb-1">📦 Spedizione disponibile in tutta Italia</p>
                <p className="mb-1">💳 Pagamenti sicuri</p>
                <p className="mb-0">🔄 Reso entro 14 giorni</p>
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductDetail;
