import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Alert, Button } from 'react-bootstrap';
import { API_URL } from '../services/api';
import { CloudinaryPresets } from '../utils/cloudinaryOptimizer';

// Categorie delle esperienze
const EXPERIENCE_CATEGORIES = [
  'Enogastronomiche',
  'Outdoor & Natura',
  'Cultura & Tradizioni',
  'Sport & Benessere',
  'Family & Educational',
  'Tour & Attività speciali',
  'Ospitalità'
];

const Esperienze = () => {
  const navigate = useNavigate();
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadExperiences();
  }, []);

  const loadExperiences = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/experiences`);
      
      if (!res.ok) {
        throw new Error('Errore nel caricamento delle esperienze');
      }

      const data = await res.json();
      setExperiences(data || []);
      setError('');
    } catch (err) {
      console.error('Errore caricamento esperienze:', err);
      setError(err.message || 'Errore nel caricamento delle esperienze');
    } finally {
      setLoading(false);
    }
  };

  // Raggruppa esperienze per categoria
  const groupedExperiences = EXPERIENCE_CATEGORIES.reduce((acc, category) => {
    acc[category] = experiences.filter(exp => 
      exp.categories && Array.isArray(exp.categories) && exp.categories.includes(category)
    );
    return acc;
  }, {});

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Caricamento...</span>
        </Spinner>
        <p className="mt-3">Caricamento esperienze...</p>
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
          <h1 style={{ color: '#004b75', fontWeight: 700, textAlign: 'left' }}>Esperienze</h1>
          <p className="text-muted" style={{ fontSize: '1.1rem', textAlign: 'left', marginBottom: 0 }}>
            Scopri le esperienze organizzate dalle aziende del territorio: degustazioni, escursioni, tour, attrazioni e tante attività per vivere la Basilicata tra natura, cultura e avventura. 
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
              placeholder="Cerca per parola chiave o città..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ fontSize: 16, padding: '0.5rem 0.75rem', border: 'none', boxShadow: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Filtro Categorie */}
      <div className="mb-4">
        <h5 className="mb-3" style={{ color: '#004b75', fontWeight: 600, textAlign: 'left' }}>Filtra per categoria:</h5>
        <div className="d-flex gap-1 justify-content-start" style={{overflowX: 'auto', overflowY: 'hidden', maxWidth: '100%', paddingBottom: '4px'}}>
          <button
            className="btn"
            style={{
              backgroundColor: !selectedCategory ? '#004b75' : '#fff',
              color: !selectedCategory ? '#fff' : '#004b75',
              border: '2px solid #004b75',
              borderRadius: '16px',
              padding: '4px 10px',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all 0.3s ease',
              minHeight: 0,
              whiteSpace: 'nowrap'
            }}
            onClick={() => setSelectedCategory('')}
          >
            Tutte
          </button>
          {EXPERIENCE_CATEGORIES.map(category => (
            <button
              key={category}
              className="btn"
              style={{
                backgroundColor: selectedCategory === category ? '#004b75' : '#fff',
                color: selectedCategory === category ? '#fff' : '#004b75',
                border: '2px solid #004b75',
                borderRadius: '16px',
                padding: '4px 10px',
                fontWeight: 600,
                fontSize: '0.85rem',
                transition: 'all 0.3s ease',
                minHeight: 0,
                whiteSpace: 'nowrap'
              }}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Lista Esperienze */}
      <div className="mt-4">
        {EXPERIENCE_CATEGORIES.map(category => {
          // Filtra per categoria selezionata
          if (selectedCategory && selectedCategory !== category) {
            return null;
          }

          const categoryExperiences = groupedExperiences[category] || [];

          // Filtra per titolo, città o descrizione
          const filteredExperiences = categoryExperiences.filter(experience => {
            if (!searchTerm) return true;
            const title = (experience.title || '').toLowerCase();
            const city = (experience.city || '').toLowerCase();
            const description = (experience.description || '').toLowerCase();
            const company = (experience.company || '').toLowerCase();
            const term = searchTerm.toLowerCase();
            return title.includes(term) || city.includes(term) || description.includes(term) || company.includes(term);
          });

          if (filteredExperiences.length === 0) {
            return null;
          }

          return (
            <div key={category} className="mb-5">
              <h3
                className="mb-4 pb-2"
                style={{
                  color: '#004b75',
                  fontWeight: 700,
                  borderBottom: '2px solid #004b75',
                  textAlign: 'left'
                }}
              >
                {category}
              </h3>
              <Row xs={1} md={2} lg={3} className="g-4">
                {filteredExperiences.map(experience => (
                  <Col key={experience._id}>
                    <Card
                      className="h-100"
                      style={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        maxWidth: '320px',
                        margin: '0 auto',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.18), 0 1.5px 6px rgba(0,0,0,0.12)',
                        border: '2px solid transparent',
                        cursor: 'pointer'
                      }}
                      onClick={() => navigate(`/esperienze/${experience._id}`)}
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
                      {experience.images && experience.images.length > 0 ? (
                        <img
                          src={CloudinaryPresets.productCard(experience.images[0].url)}
                          srcSet={`
                            ${CloudinaryPresets.thumbnail(experience.images[0].url)} 200w,
                            ${CloudinaryPresets.productCard(experience.images[0].url)} 400w
                          `}
                          sizes="(max-width: 576px) 200px, 400px"
                          alt={experience.title}
                          loading="lazy"
                          style={{
                            height: '200px',
                            width: '100%',
                            objectFit: 'cover',
                            padding: '0',
                            backgroundColor: '#f8f9fa'
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            height: '200px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f8f9fa'
                          }}
                        >
                          <i className="bi bi-calendar-event" style={{ fontSize: '4rem', color: '#6c757d' }}></i>
                        </div>
                      )}
                      <Card.Body className="d-flex flex-column">
                        <Card.Title style={{ color: '#004b75', fontWeight: 600 }}>
                          {experience.title}
                        </Card.Title>
                        <Card.Text 
                          className="text-muted small mb-3" 
                          style={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: '1.4rem',
                            height: '4.2rem',
                            wordWrap: 'break-word',
                            whiteSpace: 'normal'
                          }}
                        >
                          {experience.description}
                        </Card.Text>
                        
                        <div className="mb-3">
                          {experience.company && (
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <i className="bi bi-building-fill" style={{ color: '#004b75' }}></i>
                              <small className="text-muted"><strong>{experience.company}</strong></small>
                            </div>
                          )}
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <i className="bi bi-geo-alt-fill" style={{ color: '#00bf63' }}></i>
                            <small className="text-muted">{experience.city}</small>
                          </div>
                          {experience.phone && (
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <i className="bi bi-telephone-fill" style={{ color: '#00bf63' }}></i>
                              <small className="text-muted">{experience.phone}</small>
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/esperienze/${experience._id}`);
                          }}
                          variant="primary"
                          className="mt-auto w-100"
                          style={{
                            backgroundColor: '#004b75',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.6rem',
                            fontWeight: 600,
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#00bf63';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#004b75';
                          }}
                        >
                          <i className="bi bi-eye me-2"></i>
                          Scopri di più
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          );
        })}

        {/* Nessun risultato */}
        {EXPERIENCE_CATEGORIES.every(category => {
          if (selectedCategory && selectedCategory !== category) return true;
          
          const categoryExperiences = groupedExperiences[category] || [];
          const filteredExperiences = categoryExperiences.filter(experience => {
            if (!searchTerm) return true;
            const title = (experience.title || '').toLowerCase();
            const city = (experience.city || '').toLowerCase();
            const description = (experience.description || '').toLowerCase();
            const company = (experience.company || '').toLowerCase();
            const term = searchTerm.toLowerCase();
            return title.includes(term) || city.includes(term) || description.includes(term) || company.includes(term);
          });
          
          return filteredExperiences.length === 0;
        }) && (
          <Alert variant="info" className="text-center">
            <i className="bi bi-info-circle me-2"></i>
            {searchTerm ? 'Nessuna esperienza trovata per la ricerca' : 'Nessuna esperienza disponibile al momento'}
          </Alert>
        )}
      </div>
    </Container>
  );
};

export default Esperienze;
