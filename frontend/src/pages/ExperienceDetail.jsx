import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Spinner,
  Alert,
  Carousel,
  ListGroup,
} from 'react-bootstrap';
import { API_URL } from '../services/api';
import SEOHelmet from '../components/SEOHelmet';
import { CloudinaryPresets } from '../utils/cloudinaryOptimizer';

const ExperienceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Carica esperienza
  const loadExperience = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/experiences/${id}`);
      
      if (!res.ok) {
        throw new Error('Esperienza non trovata');
      }

      const data = await res.json();
      setExperience(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Errore caricamento esperienza');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExperience();
  }, [id]);

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Caricamento...</span>
        </Spinner>
        <p className="mt-3">Caricamento esperienza...</p>
      </Container>
    );
  }

  if (error || !experience) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error || 'Esperienza non trovata'}</Alert>
        <Button variant="primary" onClick={() => navigate('/esperienze')}>
          Torna alle Esperienze
        </Button>
      </Container>
    );
  }

  return (
    <>
      <SEOHelmet
        title={`${experience.title} - Esperienze`}
        description={experience.description}
        keywords={`esperienza, ${experience.categories ? experience.categories.join(', ') : experience.category || ''}, ${experience.city}, ${experience.company}`}
        type="article"
      />

      <Container className="py-5">
        <Button 
          variant="link" 
          className="mb-3 p-0" 
          onClick={() => navigate('/esperienze')}
          style={{ color: '#004b75', textDecoration: 'none', fontWeight: 600 }}
        >
          <i className="bi bi-arrow-left"></i> Torna alle Esperienze
        </Button>

        <Row>
          {/* COLONNA IMMAGINI */}
          <Col lg={6} className="mb-4">
            {experience.images && experience.images.length > 0 ? (
              experience.images.length === 1 ? (
                <img
                  className="d-block w-100"
                  src={CloudinaryPresets.productDetail(experience.images[0].url)}
                  alt={experience.title}
                  loading="lazy"
                  style={{ 
                    maxHeight: '500px', 
                    width: '100%',
                    objectFit: 'contain', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)' 
                  }}
                />
              ) : (
                <Carousel indicators={false} interval={null}>
                  {experience.images.map((image, index) => (
                    <Carousel.Item key={index}>
                      <img
                        className="d-block w-100"
                        src={CloudinaryPresets.productDetail(image.url)}
                        alt={`${experience.title} - ${index + 1}`}
                        loading="lazy"
                        style={{ 
                          maxHeight: '500px',
                          width: '100%', 
                          objectFit: 'contain', 
                          borderRadius: '8px' 
                        }}
                      />
                    </Carousel.Item>
                  ))}
                </Carousel>
              )
            ) : (
              <div
                style={{
                  height: '400px',
                  backgroundColor: '#f8f9fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                }}
              >
                <i className="bi bi-calendar-event" style={{ fontSize: '5rem', color: '#6c757d' }}></i>
              </div>
            )}
          </Col>

          {/* COLONNA DETTAGLI */}
          <Col lg={6}>
            <div className="mb-3">
              <div className="mb-2">
                {experience.categories && experience.categories.length > 0 ? (
                  experience.categories.map((cat) => (
                    <Badge 
                      key={cat}
                      className="me-2 mb-1" 
                      style={{ fontSize: '0.85rem', padding: '6px 12px', backgroundColor: '#004b75', color: '#fff' }}
                    >
                      {cat}
                    </Badge>
                  ))
                ) : experience.category ? (
                  <Badge 
                    className="mb-1" 
                    style={{ fontSize: '0.9rem', padding: '8px 14px', backgroundColor: '#004b75', color: '#fff' }}
                  >
                    {experience.category}
                  </Badge>
                ) : null}
              </div>
              <h1 style={{ color: '#004b75', fontWeight: 700, fontSize: '2.2rem' }}>
                {experience.title}
              </h1>
            </div>

            {/* INFO ORGANIZZATORE */}
            <Card className="mb-3 shadow-sm">
              <Card.Body>
                <h5 style={{ color: '#00bf63', fontWeight: 700, marginBottom: '1rem' }}>
                  <i className="bi bi-building-fill me-2"></i>
                  Informazioni
                </h5>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <div className="d-flex align-items-start gap-2">
                      <i className="bi bi-building-fill mt-1" style={{ color: '#004b75', fontSize: '1.2rem' }}></i>
                      <div>
                        <small className="text-muted d-block">Organizzatore</small>
                        <strong style={{ fontSize: '1.1rem' }}>{experience.company}</strong>
                      </div>
                    </div>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <div className="d-flex align-items-start gap-2">
                      <i className="bi bi-geo-alt-fill mt-1" style={{ color: '#00bf63', fontSize: '1.2rem' }}></i>
                      <div>
                        <small className="text-muted d-block">Località</small>
                        <strong style={{ fontSize: '1.1rem' }}>{experience.city}</strong>
                      </div>
                    </div>
                  </ListGroup.Item>
                  {experience.address && (
                    <ListGroup.Item>
                      <div className="d-flex align-items-start gap-2">
                        <i className="bi bi-signpost-fill mt-1" style={{ color: '#00bf63', fontSize: '1.2rem' }}></i>
                        <div>
                          <small className="text-muted d-block">Indirizzo</small>
                          <strong style={{ fontSize: '1.1rem' }}>{experience.address}</strong>
                        </div>
                      </div>
                    </ListGroup.Item>
                  )}
                  <ListGroup.Item>
                    <div className="d-flex align-items-start gap-2">
                      <i className="bi bi-telephone-fill mt-1" style={{ color: '#00bf63', fontSize: '1.2rem' }}></i>
                      <div>
                        <small className="text-muted d-block">Contatti</small>
                        <strong style={{ fontSize: '1.1rem' }}>{experience.phone}</strong>
                      </div>
                    </div>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>

            {/* DESCRIZIONE */}
            <Card className="mb-3 shadow-sm">
              <Card.Body>
                <h5 style={{ color: '#004b75', fontWeight: 700, marginBottom: '1rem' }}>
                  <i className="bi bi-info-circle-fill me-2"></i>
                  Descrizione
                </h5>
                <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#333', whiteSpace: 'pre-wrap' }}>
                  {experience.description}
                </p>
              </Card.Body>
            </Card>

            {/* PULSANTE SITO WEB */}
            {experience.website && (
              <div className="d-grid gap-2">
                <Button
                  href={experience.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="primary"
                  size="lg"
                  style={{
                    backgroundColor: '#004b75',
                    borderColor: '#004b75',
                    fontWeight: 600,
                    padding: '14px 24px',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                >
                  <i className="bi bi-box-arrow-up-right"></i>
                  Visita il Sito Web
                </Button>
              </div>
            )}
          </Col>
        </Row>

        {/* ALTRE ESPERIENZE DELLA STESSA CATEGORIA */}
        <Row className="mt-5">
          <Col>
            <hr style={{ margin: '3rem 0 2rem 0', border: 'none', borderTop: '2px solid #e0e0e0' }} />
            <h3 style={{ color: '#004b75', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>
              Altre esperienze simili
            </h3>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default ExperienceDetail;
