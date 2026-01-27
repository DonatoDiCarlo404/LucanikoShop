import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Alert, Badge, Button } from 'react-bootstrap';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/authContext';
import { API_URL } from '../services/api';

const ShopPage = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shopData, setShopData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  console.log('🔵 ShopPage renderizzata, sellerId:', sellerId);
  console.log('🔵 shopData:', shopData);
  console.log('🔵 subcategories:', subcategories);

  useEffect(() => {
    console.log('🟢 useEffect loadShopData eseguito');
    loadShopData();
  }, [sellerId]);

  useEffect(() => {
    console.log('🟡 useEffect loadSubcategories eseguito, shopData:', shopData);
    if (shopData?.vendor?.businessCategories) {
      console.log('🟡 Chiamando loadSubcategories...');
      loadSubcategories();
    } else {
      console.log('🟡 Nessun businessCategories, shopData?.vendor?.businessCategories:', shopData?.vendor?.businessCategories);
    }
  }, [shopData]);

  const loadShopData = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${API_URL}/vendors/${sellerId}`);
      if (!res.ok) {
        throw new Error('Negozio non trovato');
      }
      const data = await res.json();
      setShopData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSubcategories = async () => {
    try {
      const businessCategories = shopData.vendor.businessCategories;
      console.log('📦 businessCategories del venditore:', businessCategories);
      
      if (!businessCategories || businessCategories.length === 0) {
        console.log('⚠️ Nessuna businessCategories trovata');
        setSubcategories([]);
        return;
      }

      // Carica tutte le categorie dal backend
      const res = await fetch(`${API_URL}/categories`);
      if (!res.ok) {
        throw new Error('Errore caricamento categorie');
      }
      const allCategories = await res.json();
      console.log('📚 Tutte le categorie:', allCategories.length);

      // Filtra le macrocategorie che corrispondono a businessCategories
      const relevantParents = allCategories.filter(
        cat => !cat.parent && businessCategories.includes(cat.name)
      );
      console.log('🏷️ Macrocategorie rilevanti:', relevantParents);

      // Estrai tutte le sottocategorie di queste macrocategorie
      const subs = [];
      relevantParents.forEach(parent => {
        const children = allCategories.filter(cat => 
          cat.parent && cat.parent.toString() === parent._id.toString()
        );
        console.log(`   ↳ Sottocategorie di "${parent.name}":`, children.length);
        subs.push(...children);
      });

      console.log('✅ Sottocategorie totali caricate:', subs.length, subs.map(s => s.name));
      setSubcategories(subs);
    } catch (err) {
      console.error('❌ Errore caricamento sottocategorie:', err);
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Caricamento negozio...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
        <Button onClick={() => navigate('/products')}>Torna al Catalogo</Button>
      </Container>
    );
  }

  if (!shopData) {
    return null;
  }

  const { vendor, products, stats } = shopData;
  
  // Normalizza i prodotti per assicurare compatibilità con ProductCard
  const normalizedProducts = products.map(p => ({
    ...p,
    // Assicura che category sia un oggetto con name, o una stringa
    category: typeof p.category === 'object' && p.category?.name 
      ? p.category.name 
      : (typeof p.category === 'string' ? p.category : 'N/A'),
    // NON forzare price se non definito, lascialo undefined per permettere a ProductCard di usare variants
    price: typeof p.price === 'number' ? p.price : undefined,
    // Assicura che stock sia un numero
    stock: typeof p.stock === 'number' ? p.stock : 0,
    // Assicura che isActive sia boolean (default true se non specificato)
    isActive: typeof p.isActive === 'boolean' ? p.isActive : true,
    // Assicura variants
    variants: Array.isArray(p.variants) ? p.variants : [],
    // Assicura rating e numReviews
    rating: typeof p.rating === 'number' ? p.rating : 0,
    numReviews: typeof p.numReviews === 'number' ? p.numReviews : 0,
    // Assicura seller per mostrare nome azienda
    seller: p.seller || vendor,
  }));
  
  // Filtra prodotti per nome e sottocategoria
  console.log('🔍 Filtro - selectedSubcategory:', selectedSubcategory);
  console.log('🔍 Filtro - normalizedProducts:', normalizedProducts.map(p => ({ 
    name: p.name, 
    subcategory: p.subcategory,
    subcategoryType: typeof p.subcategory,
    subcategoryId: typeof p.subcategory === 'object' ? p.subcategory?._id : p.subcategory
  })));
  
  const filteredProducts = normalizedProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubcategory = !selectedSubcategory || 
      (p.subcategory && 
       (typeof p.subcategory === 'object' 
         ? p.subcategory._id === selectedSubcategory 
         : p.subcategory === selectedSubcategory));
    
    if (selectedSubcategory) {
      console.log(`   → Prodotto "${p.name}": matchesSubcategory=${matchesSubcategory}, subcategory=`, p.subcategory);
    }
    
    return matchesSearch && matchesSubcategory;
  });
  
  console.log('🔍 Filtro - filteredProducts:', filteredProducts.length);

  // Proprietario autenticato?
  const isOwner = user && user._id === vendor._id;

  return (
    <Container className="py-5">
      {/* Header Negozio: logo, info pubbliche, contatti, social */}
      <Card className="mb-4 shadow">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={2} className="text-center mb-3 mb-md-0">
              {vendor.logo?.url ? (
                <img src={vendor.logo.url} alt="Logo" style={{ width: 140, height: 140, borderRadius: 18, border: '2.5px solid #eee', background: '#fff', objectFit: 'contain' }} />
              ) : (
                <div style={{ width: 140, height: 140, borderRadius: 18, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2.5px solid #eee' }}>
                  <span className="text-muted">Nessun logo</span>
                </div>
              )}
            </Col>
            <Col md={5}>
              <h2 className="mb-1">{vendor.businessName || vendor.name}</h2>
              {vendor.isApproved && (
                <Badge className='mt-2' bg="success" style={{ fontSize: '0.9rem' }}>
                  ✓ Verificato
                </Badge>
              )}
              {vendor.businessDescription && (
                <div className="text-muted mb-2 mt-2" style={{ fontSize: 15 }}>{vendor.businessDescription}</div>
              )}
              <div className="mb-2">
                <small className="text-muted">
                  Membro dal {new Date(vendor.memberSince).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                </small>
              </div>
              {/* CONTATTI PUBBLICI */}
              <div style={{ fontSize: 15 }}>
                {vendor.businessEmail && <div><strong>Email:</strong> <a href={`mailto:${vendor.businessEmail}`}>{vendor.businessEmail}</a></div>}
                {vendor.businessPhone && <div><strong>Telefono:</strong> <a href={`tel:${vendor.businessPhone}`}>{vendor.businessPhone}</a></div>}
                {/* SOCIAL ICONS: Facebook, Instagram, WhatsApp, Sito Web */}
                {(vendor.socialLinks || vendor.businessWhatsapp || vendor.website) && (
                  <div className="mt-1">
                    {vendor.socialLinks?.facebook && (
                      <a href={vendor.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="me-2" title="Facebook">
                        <i className="bi bi-facebook"></i>
                      </a>
                    )}
                    {vendor.socialLinks?.instagram && (
                      <a href={vendor.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="me-2" title="Instagram">
                        <i className="bi bi-instagram"></i>
                      </a>
                    )}
                    {vendor.businessWhatsapp && (
                      <a href={`https://wa.me/${vendor.businessWhatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="me-2" title="WhatsApp">
                        <i className="bi bi-whatsapp"></i>
                      </a>
                    )}
                    {vendor.website && (
                      <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="me-2" title="Sito Web">
                        <i className="bi bi-globe"></i>
                      </a>
                    )}
                    {vendor.socialLinks?.tiktok && (
                      <a href={vendor.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="me-2" title="TikTok">
                        <i className="bi bi-tiktok"></i>
                      </a>
                    )}
                  </div>
                )}
              </div>
              {/* INFO PRIVATE SOLO PER PROPRIETARIO */}
              {isOwner && (
                <div className="mt-3 p-2 bg-light border rounded">
                  <div className="mb-1"><strong>Questa sezione è visibile solo a te:</strong></div>
                  <div><strong>Email privata:</strong> {vendor.email || vendor.businessEmail}</div>
                  {/* Qui puoi aggiungere altre info private o pulsanti gestione */}
                  <Button variant="outline-primary" size="sm" className="mt-2" onClick={() => navigate('/vendor/profile')}>Vai al tuo profilo aziendale</Button>
                </div>
              )}
            </Col>
            <Col md={5}>
              <div className="d-flex flex-row gap-2 flex-wrap d-md-block">
                <Card className="border-0 bg-white mb-2 flex-fill" style={{ minWidth: 0 }}>
                  <Card.Body className="text-center p-2">
                    <div className="mb-2">
                      <span style={{ color: '#FFD700', fontSize: '1.5em' }}>
                        {'★'.repeat(Math.round(parseFloat(stats.avgRating)))}
                        {'☆'.repeat(5 - Math.round(parseFloat(stats.avgRating)))}
                      </span>
                    </div>
                    <h5 className="mb-1">{stats.avgRating}/5.0</h5>
                    <small className="text-muted">{stats.totalReviews} recensioni</small>
                  </Card.Body>
                </Card>
                <Card className="border-0 bg-white flex-fill" style={{ minWidth: 0 }}>
                  <Card.Body className="d-flex flex-column justify-content-center align-items-center text-center p-2" style={{ minHeight: '100%' }}>
                    <h3 className="mb-1" style={{ color: '#004b75' }}>{stats.totalProducts}</h3>
                    <p className="text-muted mb-0">Prodotti Disponibili</p>
                  </Card.Body>
                </Card>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* NEWS AZIENDALE (loop continuo responsive, fix) */}
      {vendor.news && (
        <div className="news-banner-responsive" style={{
          overflow: 'hidden',
          height: '40px',
          marginBottom: '1.5rem',
          position: 'relative',
          width: '100%',
          maxWidth: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
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
              minWidth: '100vw',
              animation: 'scrollNewsLoop 20s linear infinite',
            }}>
            <div className="news-banner-content" style={{
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
                <i className="bi bi-megaphone-fill me-2" style={{ color: '#861515' }}></i>
                <strong style={{ color: '#861515' }}>News:</strong>&nbsp;<span style={{ color: '#861515' }}>{vendor.news}</span>&nbsp;&nbsp;&nbsp;&nbsp;
              </Alert>
            </div>
            <div className="news-banner-content" style={{
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
                <i className="bi bi-megaphone-fill me-2" style={{ color: '#861515' }}></i>
                <strong style={{ color: '#861515' }}>News:</strong>&nbsp;<span style={{ color: '#861515' }}>{vendor.news}</span>&nbsp;&nbsp;&nbsp;&nbsp;
              </Alert>
            </div>
          </div>
          <style>{`
            @keyframes scrollNewsLoop {
              0% { transform: translateX(100vw); }
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
          `}</style>
        </div>
      )}

      {/* Prodotti del Negozio */}
      <div className="mb-4">
        <h3 className="mb-3" style={{ color: '#004b75', fontWeight: 700 }}>Prodotti di {vendor.businessName || vendor.name}</h3>
        <div className="mb-3">
          <div className="mb-4 d-flex flex-wrap justify-content-center align-items-center gap-3">
            <div style={{ maxWidth: 300, width: '100%' }}>
              <div className="input-group shadow" style={{ borderRadius: 10, border: '2px solid #004b75', overflow: 'hidden' }}>
                <span className="input-group-text" id="search-addon" style={{ background: '#004b75', color: '#fff', border: 'none' }}>
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cerca prodotto per nome..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ fontSize: 15, padding: '0.5rem 0.75rem', border: 'none', boxShadow: 'none' }}
                  aria-label="Cerca prodotto per nome"
                  aria-describedby="search-addon"
                />
              </div>
            </div>
            {/* Dropdown Sottocategorie */}
            {subcategories.length > 0 && (
              <div style={{ minWidth: 220 }}>
                <select
                  className="form-select shadow"
                  value={selectedSubcategory}
                  onChange={e => setSelectedSubcategory(e.target.value)}
                  style={{ 
                    fontSize: 15, 
                    padding: '0.5rem 2.5rem 0.5rem 1rem', // padding-right aumentato, padding-top/bottom come input
                    border: '2px solid #004b75',
                    borderRadius: 10,
                    color: '#004b75',
                    fontWeight: 500,
                    height: '38px' // stessa altezza dell'input
                  }}
                >
                  <option value="">Tutte le sottocategorie</option>
                  {subcategories.map(sub => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
        {filteredProducts.length === 0 ? (
          <Alert variant="info">
            Nessun prodotto trovato.
          </Alert>
        ) : (
          <Row>
            {filteredProducts.map((product) => (
              <Col key={product._id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* Pulsante Torna al Catalogo */}
      <div className="text-center mt-5">
        <Button variant="outline-primary" onClick={() => navigate('/products')}>
          ← Torna al Catalogo Completo
        </Button>
      </div>
    </Container>
  );
};

export default ShopPage;
