import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { productsAPI } from '../services/api';

const MyProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      loadMyProducts();
    }
  }, [authLoading, user]);

  const loadMyProducts = async () => {
    try {
      setLoading(true);
      const data = await productsAPI.getMyProducts(user.token);
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questo prodotto?')) {
      try {
        await productsAPI.delete(id, user.token);
        setProducts(products.filter((p) => p._id !== id));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Caricamento prodotti...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>I Miei Prodotti</h2>
        <Button variant="primary" onClick={() => navigate('/products/new')}>
          + Nuovo Prodotto
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {products.length === 0 ? (
        <Alert variant="info">
          Non hai ancora caricato prodotti. Clicca su "Nuovo Prodotto" per iniziare!
        </Alert>
      ) : (
        <Row>
          {products.map((product) => (
            <Col key={product._id} md={4} className="mb-4">
              <Card>
                {product.images.length > 0 && (
                  <Card.Img
                    variant="top"
                    src={product.images[product.images.length - 1].url}
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                )}
                <Card.Body>
                  <Card.Title>{product.name}</Card.Title>
                  <Card.Text className="text-muted" style={{ height: '60px', overflow: 'hidden' }}>
                    {product.description}
                  </Card.Text>
                  
                  <div className="mb-2">
                    <Badge bg="secondary" className="me-2">
                      {product.category}
                    </Badge>
                    <Badge bg={product.stock > 0 ? 'success' : 'danger'}>
                      Stock: {product.stock} {product.unit}
                    </Badge>
                  </div>

                  <h4 className="text-primary">€{product.price}</h4>

                  <div className="d-flex gap-2 mt-3">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => navigate(`/products/edit/${product._id}`)}
                    >
                      Modifica
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(product._id)}
                    >
                      Elimina
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default MyProducts;