import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Badge, Button } from 'react-bootstrap';
import { API_URL } from '../services/api';

// Tier dei partner
const PARTNER_TIERS = ['Main', 'Premium', 'Official', 'Support'];

const Partners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/sponsors`);
      
      if (!res.ok) {
        throw new Error('Errore nel caricamento dei partner');
      }

      const data = await res.json();
      setPartners(data || []);
      setError('');
    } catch (err) {
      console.error('Errore caricamento partner:', err);
      setError(err.message || 'Errore nel caricamento dei partner');
    } finally {
      setLoading(false);
    }
  };

  // Raggruppa partner per tier
  const groupedPartners = PARTNER_TIERS.reduce((acc, tier) => {
    acc[tier] = partners.filter(s => s.tier === tier);
    return acc;
  }, {});

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Caricamento...</span>
        </Spinner>
        <p className="mt-3">Caricamento partner...</p>
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
    <Container className="py-5">
      <div className="mb-5 d-flex flex-wrap align-items-center justify-content-between" style={{ textAlign: 'left', gap: 16 }}>
        <div>
          <h1 style={{ color: '#004b75', fontWeight: 700, textAlign: 'left' }}>I Nostri Partners</h1>
          <p className="text-muted" style={{ fontSize: '1.1rem', textAlign: 'left', marginBottom: 0 }}>
            Scopri le aziende che supportano Lucaniko Shop
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
              placeholder="Cerca partner per nome o città..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ fontSize: 14, padding: '0.5rem 0.75rem', border: 'none', boxShadow: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Filtro Tier */}
      <div className="mb-4">
        <h5 className="mb-3" style={{ color: '#004b75', fontWeight: 600, textAlign: 'left' }}>Filtra per livello:</h5>
        <div className="d-flex flex-wrap gap-1 justify-content-start" style={{maxWidth: 900}}>
          <button
            className="btn"
            style={{
              backgroundColor: !selectedTier ? '#004b75' : '#fff',
              color: !selectedTier ? '#fff' : '#004b75',
              border: '2px solid #004b75',
              borderRadius: '16px',
              padding: '4px 12px',
              fontWeight: 600,
              fontSize: '0.95rem',
              transition: 'all 0.3s ease',
              minHeight: 0
            }}
            onClick={() => setSelectedTier('')}
          >
            Tutti
          </button>
          {PARTNER_TIERS.map(tier => (
            <button
              key={tier}
              className="btn"
              style={{
                backgroundColor: selectedTier === tier ? '#004b75' : '#fff',
                color: selectedTier === tier ? '#fff' : '#004b75',
                border: '2px solid #004b75',
                borderRadius: '16px',
                padding: '4px 12px',
                fontWeight: 600,
                fontSize: '0.95rem',
                transition: 'all 0.3s ease',
                minHeight: 0
              }}
              onClick={() => setSelectedTier(tier)}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Lista Partner */}
      <div className="mt-4">
        {PARTNER_TIERS.map(tier => {
          // Filtra per tier selezionato
          if (selectedTier && selectedTier !== tier) {
            return null;
          }

          const tierPartners = groupedPartners[tier] || [];

          // Filtra per nome, città o descrizione
          const filteredPartners = tierPartners.filter(partner => {
            if (!searchTerm) return true;
            const name = (partner.name || '').toLowerCase();
            const city = (partner.city || '').toLowerCase();
            const description = (partner.description || '').toLowerCase();
            const term = searchTerm.toLowerCase();
            return name.includes(term) || city.includes(term) || description.includes(term);
          });

          if (filteredPartners.length === 0) {
            return null;
          }

          return (
            <div key={tier} className="mb-5">
              <h3
                className="mb-4 pb-2"
                style={{
                  color: '#004b75',
                  fontWeight: 700,
                  borderBottom: '2px solid #004b75',
                  textAlign: 'left'
                }}
              >
                {tier}
              </h3>
              <Row xs={1} md={2} lg={3} className="g-4">
                {filteredPartners.map(partner => (
                  <Col key={partner._id}>
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
                      {partner.logo && (
                        <Card.Img
                          variant="top"
                          src={partner.logo}
                          alt={partner.name}
                          style={{
                            height: '200px',
                            objectFit: 'contain',
                            padding: '1rem',
                            backgroundColor: '#fff'
                          }}
                        />
                      )}
                      <Card.Body className="d-flex flex-column">
                        <Card.Title style={{ color: '#004b75', fontWeight: 600 }}>
                          {partner.name}
                        </Card.Title>
                        <Card.Text className="text-muted small mb-3" style={{ flexGrow: 1 }}>
                          {partner.description}
                        </Card.Text>
                        
                        <div className="mb-2">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <i className="bi bi-geo-alt-fill" style={{ color: '#00bf63' }}></i>
                            <small className="text-muted">{partner.city}</small>
                          </div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <i className="bi bi-telephone-fill" style={{ color: '#00bf63' }}></i>
                            <small className="text-muted">{partner.phone}</small>
                          </div>
                        </div>

                        <a
                          href={partner.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-auto d-inline-flex align-items-center justify-content-center"
                          style={{ fontSize: '1.5rem', color: '#004b75', textDecoration: 'none', borderRadius: '8px' }}
                          title="Visita Ora"
                        >
                          <i className="bi bi-link"></i>
                        </a>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          );
        })}

        {/* Nessun risultato */}
        {PARTNER_TIERS.every(tier => {
          if (selectedTier && selectedTier !== tier) return true;
          const tierPartners = groupedPartners[tier] || [];
          const filteredPartners = tierPartners.filter(partner => {
            if (!searchTerm) return true;
            const name = (partner.name || '').toLowerCase();
            const city = (partner.city || '').toLowerCase();
            const term = searchTerm.toLowerCase();
            return name.includes(term) || city.includes(term);
          });
          return filteredPartners.length === 0;
        }) && (
          <Alert variant="info">
            Nessun partner trovato per i criteri selezionati.
          </Alert>
        )}
      </div>
    </Container>
  );
};

export default Partners;
