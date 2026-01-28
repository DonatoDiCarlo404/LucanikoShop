import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { productsAPI } from '../services/api';
import ProductCard from '../components/ProductCard';

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
            <Col key={product._id} md={4} className="mb-4 d-flex flex-column">
              <ProductCard product={product} />
              <div className="d-flex gap-2 mt-2 justify-content-center">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => navigate(`/products/edit/${product._id}`)}
                >
                  <span><i className="bi bi-pencil-square"> Modifica</i></span>
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDelete(product._id)}
                >
                  <span><i className="bi bi-trash3"> Elimina</i></span>
                </Button>
              </div>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default MyProducts;
