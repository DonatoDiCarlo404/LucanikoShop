import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Form, Table, Badge, Spinner, Alert, InputGroup, Button } from 'react-bootstrap';
import ProductCard from '../components/ProductCard';
import styles from './OffersAndDiscounts.module.css';

const OffersAndDiscounts = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [filters, setFilters] = useState({
    name: '',
    category: '',
    subcategory: '',
    discountRanges: [] // array di stringhe: ['1-30', '31-50', '51-99']
  });

  useEffect(() => {
    fetchDiscountedProducts();
    fetchCategories();
  }, []);

  const fetchDiscountedProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/discounts/active-products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Errore caricamento prodotti scontati:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/categories/main');
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
        const res = await fetch(`http://localhost:5000/api/categories/${categoryId}/subcategories`);
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

  const filteredProducts = products.filter(product => {
    const nameMatch = filters.name === '' || product.name.toLowerCase().includes(filters.name.toLowerCase());
    const categoryMatch = !filters.category || (product.category && product.category._id === filters.category);
    const subcategoryMatch = !filters.subcategory || (product.subcategory && product.subcategory._id === filters.subcategory);
    const discountPerc = product.hasActiveDiscount && product.originalPrice ? Math.round(100 - (product.discountedPrice / product.originalPrice) * 100) : 0;
    let discountRangeMatch = true;
    if (filters.discountRanges.length > 0) {
      discountRangeMatch = false;
      for (const range of filters.discountRanges) {
        if (range === '1-30' && discountPerc >= 1 && discountPerc <= 30) discountRangeMatch = true;
        if (range === '31-50' && discountPerc >= 31 && discountPerc <= 50) discountRangeMatch = true;
        if (range === '51-99' && discountPerc >= 51 && discountPerc <= 99) discountRangeMatch = true;
      }
    }
    return nameMatch && categoryMatch && subcategoryMatch && discountRangeMatch;
  });

  return (
    <Container className="mt-4 mb-5">
      <h2 className="mb-2" style={{ color: '#004b75', fontWeight: 700 }}>Offerte e Sconti</h2>
      <div className="d-block d-md-none mb-3" style={{ fontSize: '1.1rem', color: '#861515', fontWeight: 500 }}>
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
          </Form>
        </Card.Body>
      </Card>
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <Alert variant="info">Nessun prodotto in offerta trovato.</Alert>
      ) : (
        <Row className="g-4">
          {filteredProducts.map(product => (
              <Col key={product._id} xs={6} sm={6} md={4} lg={3} className={styles['product-card-grid']}>
              <ProductCard product={product} />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default OffersAndDiscounts;
