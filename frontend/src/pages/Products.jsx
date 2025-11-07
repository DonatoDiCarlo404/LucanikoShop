import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Form, InputGroup, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, [category]); // Rimuovi 'search' da qui!

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      
      const data = await productsAPI.getAll(params);
      setProducts(data.products);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadProducts();
  };

  const categories = [
    'Frutta e Verdura',
    'Carne e Pesce',
    'Latticini',
    'Pane e Dolci',
    'Pasta e Cereali',
    'Bevande',
    'Condimenti',
    'Snack',
    'Surgelati',
    'Altro',
  ];

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
      <h2 className="mb-4">Prodotti</h2>

      {/* Filtri */}
      <Row className="mb-4">
        <Col md={6}>
          <Form onSubmit={handleSearch}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Cerca prodotti..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button variant="primary" type="submit">
                Cerca
              </Button>
            </InputGroup>
          </Form>
        </Col>
        <Col md={4}>
          <Form.Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Tutte le categorie</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {products.length === 0 ? (
        <Alert variant="info">Nessun prodotto trovato.</Alert>
      ) : (
        <Row>
          {products.map((product) => (
            <Col key={product._id} md={3} sm={6} className="mb-4">
              <Card
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/products/${product._id}`)}
              >
                {product.images.length > 0 ? (
                  <Card.Img
                    variant="top"
                    src={product.images[product.images.length - 1].url}
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      height: '200px',
                      backgroundColor: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span className="text-muted">Nessuna immagine</span>
                  </div>
                )}
                <Card.Body>
                  <Card.Title style={{ fontSize: '1rem', height: '48px', overflow: 'hidden' }}>
                    {product.name}
                  </Card.Title>
                  
                  <Badge bg="secondary" className="mb-2">
                    {product.category}
                  </Badge>
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="text-primary mb-0">€{product.price}</h5>
                    <small className="text-muted">
                      {product.stock > 0 ? `${product.stock} ${product.unit}` : 'Esaurito'}
                    </small>
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

export default Products;