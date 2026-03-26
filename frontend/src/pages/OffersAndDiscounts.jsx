import { API_URL } from '../services/api';
import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Form, Table, Badge, Spinner, Alert, InputGroup, Button } from 'react-bootstrap';
import ProductCard from '../components/ProductCard';
import styles from './OffersAndDiscounts.module.css';

const OffersAndDiscounts = () => {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    name: '',
    category: '',
    subcategory: '',
    discountRanges: [], // array di stringhe: ['1-30', '31-50', '51-99']
    sortBy: 'random' // random | discount-desc | discount-asc
  });

  useEffect(() => {
    fetchDiscountedProducts(true); // true = reset
    // eslint-disable-next-line
  }, [filters.category, filters.subcategory, filters.discountRanges, filters.sortBy]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Debounce per ricerca nome
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.name !== undefined) {
        fetchDiscountedProducts(true);
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [filters.name]);

  const fetchDiscountedProducts = async (reset = false) => {
    const currentPage = reset ? 1 : page;
    reset ? setLoading(true) : setLoadingMore(true);
    
    try {
      // Costruisci query params
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12,
        sortBy: filters.sortBy
      });

      if (filters.category) params.append('category', filters.category);
      if (filters.subcategory) params.append('subcategory', filters.subcategory);
      if (filters.name) params.append('search', filters.name);

      // Converti range sconti in min/max
      if (filters.discountRanges.length > 0) {
        const minValues = [];
        const maxValues = [];
        filters.discountRanges.forEach(range => {
          const [min, max] = range.split('-').map(Number);
          minValues.push(min);
          maxValues.push(max);
        });
        if (minValues.length > 0) {
          params.append('minDiscount', Math.min(...minValues));
          params.append('maxDiscount', Math.max(...maxValues));
        }
      }

      const res = await fetch(`${API_URL}/discounts/active-products?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (reset) {
          setProducts(data.products || []);
          setPage(1);
        } else {
          setProducts(prev => [...prev, ...(data.products || [])]);
        }
        setTotalPages(data.pages || 1);
        setTotal(data.total || 0);
      } else {
        setProducts([]);
        setTotal(0);
      }
    } catch (err) {
      console.error('Errore caricamento prodotti scontati:', err);
      if (reset) {
        setProducts([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    setPage(p => p + 1);
    fetchDiscountedProducts(false);
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories/main`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setCategories([]);
    }
  };

  const handleCategoryChange = async (e) => {
    const categoryId = e.target.value;
    setFilters(f => ({ ...f, category: categoryId, subcategory: '' }));
    if (categoryId) {
      try {
        const res = await fetch(`${API_URL}/categories/${categoryId}/subcategories`);
        const data = await res.json();
        setSubcategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Errore caricamento sottocategorie:', err);
        setSubcategories([]);
      }
    } else {
      setSubcategories([]);
    }
  };


  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(f => ({ ...f, [name]: value }));
  };

  const handleDiscountRangeChange = (e) => {
    const { value, checked } = e.target;
    setFilters(f => {
      let newRanges = f.discountRanges.slice();
      if (checked) {
        if (!newRanges.includes(value)) newRanges.push(value);
      } else {
        newRanges = newRanges.filter(r => r !== value);
      }
      return { ...f, discountRanges: newRanges };
    });
  };

  const handleSortChange = (e) => {
    setFilters(f => ({ ...f, sortBy: e.target.value }));
  };

  return (
    <Container className="mt-4 mb-5">
      <div className="d-flex align-items-center mb-2">
        <h2 style={{ color: '#004b75', fontWeight: 700, marginBottom: 0 }}>Offerte e Sconti</h2>
        <span className="ms-2 d-none d-md-inline" style={{ fontSize: '1.1rem', color: '#00bf63', fontWeight: 500 }}>(Sparagn e Cumbarisc)</span>
      </div>
      <div className="d-block d-md-none mb-3" style={{ fontSize: '1.1rem', color: '#00bf63', fontWeight: 500 }}>
        (Sparagn e Cumbarisc)
      </div>
      <Card className="mb-4">
        <Card.Body>
          <Form>
            <Row className="g-3 align-items-end">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Nome Prodotto</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={filters.name}
                    onChange={handleFilterChange}
                    placeholder="Cerca per nome..."
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Categoria</Form.Label>
                  <Form.Select name="category" value={filters.category} onChange={handleCategoryChange}>
                    <option value="">Tutte</option>
                    {/* Cibi e Bevande sempre prima */}
                    {categories
                      .filter(cat => cat.name === 'Cibi e Bevande')
                      .map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    {categories
                      .filter(cat => cat.name !== 'Cibi e Bevande')
                      .map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Sottocategoria</Form.Label>
                  <Form.Select name="subcategory" value={filters.subcategory} onChange={handleFilterChange} disabled={!subcategories.length}>
                    <option value="">Tutte</option>
                    {subcategories.map(sub => (
                      <option key={sub._id} value={sub._id}>{sub.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Percentuale Sconto</Form.Label>
                  <div className="d-flex flex-column gap-1">
                    <Form.Check
                      type="checkbox"
                      id="discount-1-30"
                      label="1% - 30%"
                      value="1-30"
                      checked={filters.discountRanges.includes('1-30')}
                      onChange={handleDiscountRangeChange}
                    />
                    <Form.Check
                      type="checkbox"
                      id="discount-31-50"
                      label="31% - 50%"
                      value="31-50"
                      checked={filters.discountRanges.includes('31-50')}
                      onChange={handleDiscountRangeChange}
                    />
                    <Form.Check
                      type="checkbox"
                      id="discount-51-99"
                      label="51% - 99%"
                      value="51-99"
                      checked={filters.discountRanges.includes('51-99')}
                      onChange={handleDiscountRangeChange}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Ordina per</Form.Label>
                  <Form.Select value={filters.sortBy} onChange={handleSortChange}>
                    <option value="random">Casuale (Varietà)</option>
                    <option value="discount-desc">Sconto: Alto → Basso</option>
                    <option value="discount-asc">Sconto: Basso → Alto</option>
                    <option value="date-desc">Più Recenti</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Risultati */}
      {total > 0 && (
        <div className="mb-3 text-muted">
          <small>Trovati {total} prodotti in offerta</small>
        </div>
      )}

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" />
        </div>
      ) : products.length === 0 ? (
        <Alert variant="info">Nessun prodotto in offerta trovato.</Alert>
      ) : (
        <>
          <Row className="g-4">
            {products.map(product => (
              <Col key={product._id} xs={6} sm={6} md={4} lg={3} className={styles['product-card-grid']}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>

          {/* Bottone Carica Altri */}
          {page < totalPages && (
            <div className="text-center mt-4 mb-3">
              <Button 
                variant="outline-primary" 
                onClick={handleLoadMore}
                disabled={loadingMore}
                size="lg"
              >
                {loadingMore ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Caricamento...
                  </>
                ) : (
                  'Carica Altri Prodotti'
                )}
              </Button>
              <div className="mt-2 text-muted">
                <small>Pagina {page} di {totalPages}</small>
              </div>
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default OffersAndDiscounts;
