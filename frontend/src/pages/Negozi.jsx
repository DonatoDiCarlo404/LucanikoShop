import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../services/api';

// Macrocategorie predefinite
const MACROCATEGORIES = [
  'Cibi e Bevande',
  'Abbigliamento e Accessori',
  'Benessere e Salute',
  'Calzature',
  'Casa, Arredi e Ufficio',
  'Elettronica e Informatica',
  'Industria, Ferramenta e Artigianato',
  'Libri, Media e Giocattoli',
  'Orologi e Gioielli',
  'Ricambi e accessori per auto e moto',
  'Sport, Hobby e Viaggi'
];

const Negozi = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [groupedVendors, setGroupedVendors] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/vendors/all`);
      
      if (!res.ok) {
        throw new Error('Errore nel caricamento dei negozi');
      }

      const data = await res.json();
      setVendors(data.vendors || []);
      
      // Raggruppa i venditori per macrocategoria
      const grouped = {};
      MACROCATEGORIES.forEach(category => {
        grouped[category] = [];
      });

      // Raggruppa ogni vendor nelle sue categorie
      (data.vendors || []).forEach(vendor => {
        if (vendor.businessCategories && Array.isArray(vendor.businessCategories)) {
          vendor.businessCategories.forEach(category => {
            if (grouped[category]) {
              grouped[category].push(vendor);
            }
          });
        }
      });

      setGroupedVendors(grouped);
      setError('');
    } catch (err) {
      console.error('Errore caricamento negozi:', err);
      setError(err.message || 'Errore nel caricamento dei negozi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Caricamento...</span>
        </Spinner>
        <p className="mt-3">Caricamento negozi...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <main>
      <Container className="py-5">
        <div className="mb-5 d-flex flex-wrap align-items-center justify-content-between" style={{ textAlign: 'left', gap: 16 }}>
        <div>
          <h1 style={{ color: '#004b75', fontWeight: 700, textAlign: 'left' }}>I Nostri Negozi</h1>
          <p className="text-muted" style={{ fontSize: '1.1rem', textAlign: 'left', marginBottom: 0 }}>
            Scopri i negozi partner di Lucaniko Shop e i loro prodotti artigianali.
          </p>
        </div>
        <div style={{ minWidth: 200, maxWidth: 300, width: '100%' }}>
          <div className="input-group shadow" style={{ borderRadius: 10, border: '2px solid #004b75', overflow: 'hidden' }}>
            <span className="input-group-text" style={{ background: '#004b75', color: '#fff', border: 'none' }}>
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Cerca negozio per nome o Città..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ fontSize: 14, padding: '0.5rem 0.75rem', border: 'none', boxShadow: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Filtro Macrocategorie */}
      <div className="mb-4">
        <h5 className="mb-3" style={{ color: '#004b75', fontWeight: 600, textAlign: 'left' }}>Filtra per categoria:</h5>
        <div className="negozi-category-buttons d-flex gap-2 justify-content-start" style={{maxWidth: 900}}>
          <style>{`
            .negozi-category-buttons {
              flex-wrap: wrap;
            }
            @media (max-width: 768px) {
              .negozi-category-buttons {
                overflow-x: auto;
                white-space: nowrap;
                flex-wrap: nowrap;
                padding-bottom: 8px;
              }
            }
          `}</style>
          <button
            className="btn"
            style={{
              backgroundColor: !selectedCategory ? '#004b75' : '#fff',
              color: !selectedCategory ? '#fff' : '#004b75',
              border: '2px solid #004b75',
              borderRadius: '16px',
              padding: '4px 12px',
              fontWeight: 600,
              fontSize: '0.95rem',
              transition: 'all 0.3s ease',
              minHeight: 0
            }}
            onClick={() => setSelectedCategory('')}
          >
            Tutte le categorie
          </button>
          {MACROCATEGORIES.map(category => {
            const count = (groupedVendors[category] || []).length;
            if (count === 0) return null;
            
            return (
              <button
                key={category}
                className="btn"
                style={{
                  backgroundColor: selectedCategory === category ? '#004b75' : '#fff',
                  color: selectedCategory === category ? '#fff' : '#004b75',
                  border: '2px solid #004b75',
                  borderRadius: '16px',
                  padding: '4px 12px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease',
                  minHeight: 0
                }}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Campo di ricerca spostato in alto a destra */}

      {vendors.length === 0 ? (
        <Alert variant="info" className="text-center">
          <i className="bi bi-info-circle me-2"></i>
          Nessun negozio registrato al momento
        </Alert>
      ) : (
        <>
          {MACROCATEGORIES.map(category => {
            // Se è selezionata una categoria, mostra solo quella
            if (selectedCategory && selectedCategory !== category) {
              return null;
            }
            
            const categoryVendors = groupedVendors[category] || [];
            
            // Filtra per nome azienda o città se c'è un termine di ricerca
            const filteredVendors = categoryVendors.filter(vendor => {
              if (!searchTerm) return true;
              const businessName = (vendor.businessName || vendor.name || '').toLowerCase();
              const city = (vendor.city || '').toLowerCase();
              const term = searchTerm.toLowerCase();
              return businessName.includes(term) || city.includes(term);
            });
            
            if (filteredVendors.length === 0) {
              return null; // Non mostrare categorie vuote
            }

            return (
              <div key={category} className="mb-5">
                <h3 
                  className="mb-4 pb-2" 
                  style={{ 
                    color: '#004b75', 
                    fontWeight: 700, 
                    borderBottom: '3px solid #004b75' 
                  }}
                >
                  {category}
                </h3>

                <Row xs={1} md={2} lg={3} className="g-4">
                  {filteredVendors.map(vendor => (
                    <Col key={vendor._id}>
                      <Card
                        className="h-100"
                        style={{
                          cursor: 'pointer',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          transition: 'all 0.3s ease',
                          maxWidth: '320px',
                          margin: '0 auto',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.18), 0 1.5px 6px rgba(0,0,0,0.12)',
                          border: '2px solid transparent'
                        }}
                        onClick={() => navigate(`/shop/${vendor.slug || vendor._id}`)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-8px)';
                          e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.16)';
                          e.currentTarget.style.borderColor = '#004b75';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18), 0 1.5px 6px rgba(0,0,0,0.12)';
                          e.currentTarget.style.borderColor = 'transparent';
                        }}
                      >
                        {vendor.logo?.url ? (
                          <Card.Img
                            variant="top"
                            src={vendor.logo.url}
                            alt={vendor.businessName || vendor.name}
                            style={{
                              height: '200px',
                              objectFit: 'contain',
                              padding: '1rem',
                              backgroundColor: '#fff'
                            }}
                            loading="lazy"
                          />
                        ) : (
                          <div
                            style={{
                              height: '200px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '1rem',
                              backgroundColor: '#fff'
                            }}
                          >
                            <i
                              className="bi bi-building"
                              style={{ fontSize: '4rem', color: '#6c757d' }}
                            ></i>
                          </div>
                        )}
                        <Card.Body className="d-flex flex-column">
                          <Card.Title style={{ color: '#004b75', fontWeight: 600 }}>
                            {vendor.businessName || vendor.name}
                          </Card.Title>
                          <Card.Text className="text-muted small mb-3" style={{ flexGrow: 1 }}>
                            {vendor.businessDescription || ''}
                          </Card.Text>
                          
                          <div className="mb-2">
                            {vendor.city && (
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <i className="bi bi-geo-alt-fill" style={{ color: '#00bf63' }}></i>
                                <small className="text-muted">{vendor.city}</small>
                              </div>
                            )}
                            {vendor.phone && (
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <i className="bi bi-telephone-fill" style={{ color: '#00bf63' }}></i>
                                <small className="text-muted">{vendor.phone}</small>
                              </div>
                            )}
                          </div>

                          <div
                            className="mt-auto d-inline-flex align-items-center justify-content-center"
                            style={{ fontSize: '1.5rem', color: '#004b75', textDecoration: 'none', borderRadius: '8px' }}
                            title="Visita Negozio"
                          >
                            <i className="bi bi-shop"></i>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            );
          })}
        </>
      )}
      </Container>
    </main>
  );
};

export default Negozi;
