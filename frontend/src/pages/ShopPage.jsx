import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Alert, Badge, Button } from 'react-bootstrap';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/authContext';

const ShopPage = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shopData, setShopData] = useState(null);

  useEffect(() => {
    loadShopData();
  }, [sellerId]);

  const loadShopData = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`http://localhost:5000/api/vendors/${sellerId}`);
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
              <Card className="border-0 bg-white mb-2">
                <Card.Body className="text-center">
                  <div className="mb-2">
                    <span style={{ color: '#FFD700', fontSize: '1.5em' }}>
                      {'★'.repeat(Math.round(parseFloat(stats.avgRating)))}
                      {'☆'.repeat(5 - Math.round(parseFloat(stats.avgRating)))}
                    </span>
                  </div>
                  <h5>{stats.avgRating}/5.0</h5>
                  <small className="text-muted">{stats.totalReviews} recensioni</small>
                </Card.Body>
              </Card>
              <Card className="border-0 bg-white">
                <Card.Body className="text-center">
                  <h3 className="text-primary mb-0">{stats.totalProducts}</h3>
                  <p className="text-muted mb-0">Prodotti Disponibili</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>



      {/* Prodotti del Negozio */}
      <div className="mb-4">
        <h3 className="mb-3">Prodotti di {vendor.businessName || vendor.name}</h3>
        {products.length === 0 ? (
          <Alert variant="info">
            Questo negozio non ha ancora prodotti disponibili.
          </Alert>
        ) : (
          <Row>
            {products.map((product) => (
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
