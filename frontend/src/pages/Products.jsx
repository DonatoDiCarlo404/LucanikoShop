import { useState, useEffect } from 'react';
import SplashScreen from '../components/SplashScreen';
import { Container, Row, Col, Spinner, Alert, Form, InputGroup, Button } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { productsAPI, categoriesAPI, API_URL } from '../services/api';
import ProductCard from '../components/ProductCard';

const Products = () => {
  const [searchParams] = useSearchParams();
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [adminNews, setAdminNews] = useState([]);

  // Carica le news attive all'avvio e ogni 30 secondi
  useEffect(() => {
    const loadNews = async () => {
      try {
        const response = await fetch(`${API_URL}/admin/news`);
        if (!response.ok) throw new Error('Errore caricamento news');
        const data = await response.json();
        setAdminNews(data);
      } catch (err) {
        console.error('Errore caricamento news:', err);
      }
    };
    loadNews();
    // Polling ogni 30 secondi per aggiornare le news
    const interval = setInterval(loadNews, 30000);
    return () => clearInterval(interval);
  }, []);

  // Inizializzazione: carica categorie e leggi parametri URL
  useEffect(() => {
    const init = async () => {
      await loadCategories();
      const categoryParam = searchParams.get('category');
      if (categoryParam) {
        setCategory(decodeURIComponent(categoryParam));
      }
      setIsInitialized(true);
    };
    init();
  }, [searchParams]);

  // Carica prodotti solo dopo l'inizializzazione
  useEffect(() => {
    if (isInitialized) {
      loadProducts();
    }
  }, [category, subcategory, sortBy, page, resetTrigger, isInitialized]);

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories/main`);
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
      const response = await fetch(`${API_URL}/categories/${categoryId}/subcategories`);
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
    setResetTrigger(prev => prev + 1);
  };


  // Splash per Cibi e Bevande
  if (showSplash) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <SplashScreen phrase="Non avevi fame? E mò la tin!" />
      </div>
    );
  }

  // Mostra loading solo se non ancora inizializzato
  if (!isInitialized || loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Caricamento prodotti...</p>
      </Container>
    );
  }

  return (
    <main>
      <Container className="pt-2 pb-5">
      <div className="text-center mb-4 payoff-custom">
        <span style={{ fontSize: '1.5rem', fontWeight: 500, letterSpacing: 1 }}>
          <span style={{ color: '#004b75' }}>La Basilicata</span>
          <span style={{ color: '#00bf63' }}> in un click!</span>
        </span>
      </div>


      {/* News Admin - stile identico a ShopPage.jsx */}
      {adminNews.length > 0 && (
        <div className="news-banner-responsive" style={{
          overflow: 'hidden',
          height: '40px',
          marginBottom: '1.5rem',
          position: 'relative',
          width: '100%',
          background: '#fff',
        }}>
          <div className="news-banner-track" style={{
            display: 'flex',
            alignItems: 'center',
            height: '48px',
            whiteSpace: 'nowrap',
            position: 'absolute',
            left: 0,
            top: 0,
            minWidth: '100%',
            animation: 'scrollNewsLoop 20s linear infinite',
          }}>
            {adminNews.map(news => (
              <div className="news-banner-content" key={news._id} style={{
                display: 'inline-flex',
                minWidth: 'max-content',
              }}>
                <Alert variant="info" className="mb-0 p-2" style={{
                  borderLeft: '4px solid #0d6efd',
                  fontSize: '20px',
                  height: '48px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  paddingLeft: '1.2rem',
                  boxShadow: 'none',
                  border: 'none',
                  background: '#fff',
                  marginRight: '60px',
                }}>
                  <i className="bi bi-megaphone-fill me-2" style={{ color: '#004b75' }}></i>
                  <strong style={{ color: '#004b75' }}>News:</strong>&nbsp;
                  <span style={{ color: '#004b75' }}>{news.content}</span>&nbsp;&nbsp;&nbsp;&nbsp;
                </Alert>
              </div>
            ))}
          </div>
          <style>{`
            @keyframes scrollNewsLoop {
              0% { transform: translateX(100%); }
              100% { transform: translateX(-100%); }
            }
            @media (max-width: 600px) {
              .news-banner-responsive {
                height: 44px !important;
              }
              .news-banner-track {
                height: 44px !important;
                animation-duration: 14s !important;
              }
              .alert-info {
                font-size: 18px !important;
                height: 44px !important;
                padding-left: 1.2rem !important;
              }
            }
            
            /* Mobile: Ordina per e Reset Filtri affiancati */
            @media (max-width: 576px) {
              .catalog-controls-row .catalog-sort-col,
              .catalog-controls-row .catalog-reset-col {
                padding-left: 8px;
                padding-right: 8px;
              }
              .catalog-controls-row .catalog-reset-col .btn {
                margin-top: 0 !important;
                font-size: 0.85rem;
                padding: 0.5rem 0.3rem;
              }
              .catalog-controls-row .catalog-count-col {
                margin-top: 0.75rem;
                text-align: center;
              }
            }
          `}</style>
        </div>
      )}

      {/* Filtro Categorie con pulsanti */}
      <div className="mb-4">
        <style>{`
          .category-buttons-container {
            flex-wrap: wrap;
            justify-content: center;
          }
          .category-buttons-container .btn {
            font-size: 0.75rem;
            padding: 2px 10px;
            border-radius: 14px;
          }
          @media (max-width: 768px) {
            .category-buttons-container {
              overflow-x: auto;
              white-space: nowrap;
              flex-wrap: nowrap;
              padding-bottom: 8px;
              justify-content: flex-start;
            }
            .category-buttons-container .btn {
              font-size: 0.95rem;
              padding: 4px 12px;
              border-radius: 16px;
            }
          }
        `}</style>
        
        {/* Prima riga: 7 categorie */}
        <div className="category-buttons-container d-flex gap-2 mb-2">
          <button
            className="btn"
            style={{
              backgroundColor: !category ? '#004b75' : '#fff',
              color: !category ? '#fff' : '#004b75',
              border: '2px solid #004b75',
              fontWeight: 600,
              transition: 'all 0.3s ease',
              minHeight: 0
            }}
            onClick={() => {
              setCategory('');
              setSubcategory('');
            }}
          >
            Tutte le categorie
          </button>
          {/* Cibi e Bevande sempre prima */}
          {categories
            .filter(cat => cat.name === 'Cibi e Bevande')
            .map(cat => (
              <button
                key={cat._id}
                className="btn"
                style={{
                  backgroundColor: category === cat.name ? '#004b75' : '#fff',
                  color: category === cat.name ? '#fff' : '#004b75',
                  border: '2px solid #004b75',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  minHeight: 0
                }}
                onClick={() => {
                  if (cat.name === 'Cibi e Bevande') {
                    setShowSplash(true);
                    setTimeout(() => {
                      setShowSplash(false);
                      setCategory(cat.name);
                      setSubcategory('');
                    }, 2000);
                  } else {
                    setCategory(cat.name);
                    setSubcategory('');
                  }
                }}
              >
                {cat.name}
              </button>
            ))}
          {/* Prime 5 categorie alfabeticamente (esclusi Cibi e Bevande e Industria) */}
          {categories
            .filter(cat => 
              cat.name !== 'Cibi e Bevande' && 
              cat.name !== 'Industria, Ferramenta e Artigianato'
            )
            .slice(0, 5)
            .map(cat => (
              <button
                key={cat._id}
                className="btn"
                style={{
                  backgroundColor: category === cat.name ? '#004b75' : '#fff',
                  color: category === cat.name ? '#fff' : '#004b75',
                  border: '2px solid #004b75',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  minHeight: 0
                }}
                onClick={() => {
                  setCategory(cat.name);
                  setSubcategory('');
                }}
              >
                {cat.name}
              </button>
            ))}
        </div>

        {/* Seconda riga: 5 categorie */}
        <div className="category-buttons-container d-flex gap-2">
          {/* Industria, Ferramenta e Artigianato */}
          {categories
            .filter(cat => cat.name === 'Industria, Ferramenta e Artigianato')
            .map(cat => (
              <button
                key={cat._id}
                className="btn"
                style={{
                  backgroundColor: category === cat.name ? '#004b75' : '#fff',
                  color: category === cat.name ? '#fff' : '#004b75',
                  border: '2px solid #004b75',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  minHeight: 0
                }}
                onClick={() => {
                  setCategory(cat.name);
                  setSubcategory('');
                }}
              >
                {cat.name}
              </button>
            ))}
          {/* Restanti categorie (dalla 6 in poi, escluse Cibi e Bevande e Industria) */}
          {categories
            .filter(cat => 
              cat.name !== 'Cibi e Bevande' && 
              cat.name !== 'Industria, Ferramenta e Artigianato'
            )
            .slice(5)
            .map(cat => (
              <button
                key={cat._id}
                className="btn"
                style={{
                  backgroundColor: category === cat.name ? '#004b75' : '#fff',
                  color: category === cat.name ? '#fff' : '#004b75',
                  border: '2px solid #004b75',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  minHeight: 0
                }}
                onClick={() => {
                  setCategory(cat.name);
                  setSubcategory('');
                }}
              >
                {cat.name}
              </button>
            ))}
        </div>
      </div>

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
        <Col md={7}>
          <Form.Select
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            className="my-2 my-md-0"
            disabled={!category || subcategories.length === 0}
            style={{ maxWidth: 320, minWidth: 180, display: 'inline-block' }}
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
      </Row>

      {/* Ordinamento e Reset */}
      <Row className="mb-3 catalog-controls-row">
        <Col md={4} xs={6} className="catalog-sort-col">
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
        <Col md={4} xs={6} className="catalog-reset-col">
          <Button variant="outline-secondary" onClick={handleResetFilters} className="w-100 mt-2 mt-md-0">
            <span><i className="bi bi-x-octagon"> Reset filtri</i></span>
          </Button>
        </Col>
        <Col md={4} xs={12} className="catalog-count-col">
          <div className="pt-2" style={{ color: '#198754', fontWeight: 500 }}>
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
                className="pagination-btn"
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
                className="pagination-btn"
            >
              Successiva →
            </Button>
          </Col>
        </Row>
      )}
    </Container>
    </main>
  );
};

export default Products;
