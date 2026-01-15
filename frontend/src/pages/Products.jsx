import { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert, Form, InputGroup, Button } from 'react-bootstrap';
import { productsAPI, categoriesAPI } from '../services/api';
import ProductCard from '../components/ProductCard';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  useEffect(() => {
    loadProducts();
  }, [category, subcategory, sortBy, page, resetTrigger]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories/main');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Errore caricamento categorie:', err);
      setCategories([]);
    }
  };

  // Carica sottocategorie quando cambia la categoria
  const loadSubcategories = async (categoryId) => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/categories/${categoryId}/subcategories`);
      const data = await response.json();
      setSubcategories(data);
    } catch (err) {
      console.error('Errore caricamento sottocategorie:', err);
      setSubcategories([]);
    }
  };

  // Effect per caricare sottocategorie quando cambia la categoria
  useEffect(() => {
    if (category) {
      const categoryObj = categories.find(cat => cat.name === category);
      if (categoryObj) {
        loadSubcategories(categoryObj._id);
      }
    } else {
      setSubcategories([]);
      setSubcategory('');
    }
  }, [category, categories]);

  const handleApplyPriceFilter = () => {
    setPage(1); // Reset alla pagina 1
    loadProducts();
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = { page };
      if (search) params.search = search;
      if (category) params.category = category;
      if (subcategory) params.subcategory = subcategory;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (sortBy) params.sortBy = sortBy;

      const data = await productsAPI.getAll(params);
      setProducts(data.products);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
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

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setSubcategory('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('');
    setPage(1);
    // Incrementa il trigger per forzare il reload
    setResetTrigger(prev => prev + 1);
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
      <div className="text-center mb-4">
        <span style={{ fontSize: '1.5rem', fontWeight: 500, color: '#7c4d1e', letterSpacing: 1 }}>
          La Basilicata, tutta qui.
        </span>
      </div>
      <h2 className="mb-4">Catalogo Prodotti</h2>

      {/* Filtri */}
      <Row className="mb-3">
        <Col md={5}>
          <Form onSubmit={handleSearch}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Cerca prodotti..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button variant="danger" type="submit">
                <span><i className="bi bi-search"> Cerca</i></span>
              </Button>
            </InputGroup>
          </Form>
        </Col>
        <Col md={3}>
          <Form.Select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setSubcategory(''); // Reset subcategory quando cambia categoria
            }}
            className="my-2 my-md-0"
          >
            <option value="">Tutte le categorie</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Select
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            className="my-2 my-md-0"
            disabled={!category || subcategories.length === 0}
          >
            <option value="">
              {!category 
                ? 'Seleziona prima una categoria' 
                : subcategories.length === 0 
                ? 'Nessuna sottocategoria'
                : 'Tutte le sottocategorie'}
            </option>
            {subcategories.map(subcat => (
              <option key={subcat._id} value={subcat.name}>
                {subcat.name}
              </option>
            ))}
          </Form.Select>
        </Col>
        {/* Campo ricerca prezzo min/max rimosso su richiesta */}
      </Row>

      {/* Ordinamento e Reset */}
      <Row className="mb-3">
        <Col md={4}>
          <Form.Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="">Ordina per...</option>
            <option value="date-desc">Più recenti</option>
            <option value="date-asc">Meno recenti</option>
            <option value="price-asc">Prezzo: basso → alto</option>
            <option value="price-desc">Prezzo: alto → basso</option>
            <option value="name">Nome A-Z</option>
          </Form.Select>
        </Col>
        <Col md={4}>
          <Button variant="outline-secondary" onClick={handleResetFilters} className="w-100 mt-2 mt-md-0">
            <span><i className="bi bi-x-octagon"> Reset filtri</i></span>
          </Button>
        </Col>
        <Col md={4}>
          <div className="text-muted pt-2">
            <strong>{total}</strong> prodotti trovati
          </div>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {products.length === 0 ? (
        <Alert variant="info">Nessun prodotto trovato.</Alert>
      ) : (
        <Row>
          {products.map((product) => (
            <Col key={product._id} md={3} sm={6} xs={6} className="mb-4">
              <ProductCard product={product} />
            </Col>
          ))}
        </Row>
      )}

      {/* Paginazione */}
      {pages > 1 && (
        <Row className="mt-4">
          <Col className="d-flex justify-content-center align-items-center gap-3">
            <Button
              variant="outline-primary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              ← Precedente
            </Button>
            <span className="text-muted">
              Pagina <strong>{page}</strong> di <strong>{pages}</strong>
            </span>
            <Button
              variant="outline-primary"
              disabled={page >= pages}
              onClick={() => setPage(page + 1)}
            >
              Successiva →
            </Button>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Products;