import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../context/authContext';
import { useNavigate } from 'react-router-dom';
import SEOHelmet from '../components/SEOHelmet';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminCookieConsent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [consents, setConsents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    action: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 50
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    // Verifica che l'utente sia admin
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchConsents();
    fetchStats();
  }, [user, navigate, filters.page]);

  const fetchConsents = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        ...(filters.action && { action: filters.action }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      const response = await fetch(`${API_URL}/cookie-consent/admin/all?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Errore nel caricamento dei consensi');
      }

      const data = await response.json();
      setConsents(data.consents);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/cookie-consent/admin/stats`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Errore nel caricamento delle statistiche');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      console.error('Errore statistiche:', err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleApplyFilters = () => {
    fetchConsents();
  };

  const handleResetFilters = () => {
    setFilters({
      action: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 50
    });
    setTimeout(() => fetchConsents(), 100);
  };

  const getActionBadge = (action) => {
    const badges = {
      accept_all: { variant: 'success', text: 'Accetta Tutti' },
      reject_all: { variant: 'danger', text: 'Rifiuta Tutti' },
      customize: { variant: 'warning', text: 'Personalizza' },
      update: { variant: 'info', text: 'Aggiorna' },
      revoke: { variant: 'secondary', text: 'Revoca' }
    };
    const badge = badges[action] || { variant: 'light', text: action };
    return <Badge bg={badge.variant}>{badge.text}</Badge>;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('it-IT');
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <>
      <SEOHelmet 
        title="Registro Consensi Cookie - Admin"
        description="Area amministratore per visualizzare il registro dei consensi cookie"
        robots="noindex, nofollow"
      />
      
      <Container className="py-5">
        <Row>
          <Col>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="mb-0">
                <i className="bi bi-shield-lock-fill me-2"></i>
                Registro Consensi Cookie (INTERNO)
              </h1>
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate(-1)}
                className="d-flex align-items-center"
              >
                <i className="bi bi-arrow-left me-2"></i>
                Indietro
              </Button>
            </div>
            
            <Alert variant="info">
              <i className="bi bi-info-circle-fill me-2"></i>
              <strong>Registro Interno:</strong> Questa sezione è accessibile solo agli amministratori per 
              scopi di conformità GDPR e accountability. I dati sono conservati per dimostrare il consenso 
              valido in caso di controlli o contestazioni.
            </Alert>

            {/* Statistiche */}
            {stats && (
              <Row className="mb-4">
                <Col md={3}>
                  <Card className="text-center border-primary">
                    <Card.Body>
                      <h3 className="text-primary">{stats.total}</h3>
                      <small className="text-muted">Consensi Totali</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center border-success">
                    <Card.Body>
                      <h3 className="text-success">{stats.last30Days}</h3>
                      <small className="text-muted">Ultimi 30 Giorni</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center border-warning">
                    <Card.Body>
                      <h3 className="text-warning">{stats.preferences?.analyticsAccepted || 0}</h3>
                      <small className="text-muted">Analytics Accettati</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center border-danger">
                    <Card.Body>
                      <h3 className="text-danger">{stats.preferences?.marketingAccepted || 0}</h3>
                      <small className="text-muted">Marketing Accettati</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Filtri */}
            <Card className="mb-4">
              <Card.Body>
                <h5 className="mb-3">Filtri</h5>
                <Row>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Azione</Form.Label>
                      <Form.Select
                        name="action"
                        value={filters.action}
                        onChange={handleFilterChange}
                      >
                        <option value="">Tutte</option>
                        <option value="accept_all">Accetta Tutti</option>
                        <option value="reject_all">Rifiuta Tutti</option>
                        <option value="customize">Personalizza</option>
                        <option value="update">Aggiorna</option>
                        <option value="revoke">Revoca</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Data Inizio</Form.Label>
                      <Form.Control
                        type="date"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleFilterChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Data Fine</Form.Label>
                      <Form.Control
                        type="date"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleFilterChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3} className="d-flex align-items-end gap-2">
                    <Button variant="primary" onClick={handleApplyFilters}>
                      Applica
                    </Button>
                    <Button variant="outline-secondary" onClick={handleResetFilters}>
                      Reset
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Tabella Consensi */}
            <Card>
              <Card.Header className="bg-dark text-white">
                <h5 className="mb-0">
                  Registro Consensi
                  {pagination.total && ` (${pagination.total} record)`}
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Caricamento...</p>
                  </div>
                ) : error ? (
                  <Alert variant="danger" className="m-3">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                  </Alert>
                ) : consents.length === 0 ? (
                  <Alert variant="info" className="m-3">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    Nessun consenso trovato con i filtri selezionati.
                  </Alert>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '15%' }}>Data/Ora</th>
                          <th style={{ width: '15%' }}>Utente</th>
                          <th style={{ width: '12%' }}>Azione</th>
                          <th style={{ width: '8%' }}>Tecnici</th>
                          <th style={{ width: '10%' }}>Preferenze</th>
                          <th style={{ width: '10%' }}>Analytics</th>
                          <th style={{ width: '10%' }}>Marketing</th>
                          <th style={{ width: '10%' }}>Metodo</th>
                          <th style={{ width: '10%' }}>IP Hash</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consents.map((consent) => (
                          <tr key={consent._id}>
                            <td style={{ fontSize: '0.85rem' }}>
                              {formatDate(consent.consentDate)}
                            </td>
                            <td style={{ fontSize: '0.85rem' }}>
                              {consent.userId ? (
                                <>
                                  <div><strong>{consent.userId.businessName || consent.userId.name}</strong></div>
                                  <div className="text-muted small">{consent.userId.email}</div>
                                </>
                              ) : (
                                <span className="text-muted">
                                  <i className="bi bi-person-x me-1"></i>
                                  Anonimo
                                </span>
                              )}
                            </td>
                            <td>{getActionBadge(consent.action)}</td>
                            <td className="text-center">
                              <i className="bi bi-check-circle-fill text-success"></i>
                            </td>
                            <td className="text-center">
                              {consent.preferences?.preferences ? (
                                <i className="bi bi-check-circle-fill text-success"></i>
                              ) : (
                                <i className="bi bi-x-circle-fill text-danger"></i>
                              )}
                            </td>
                            <td className="text-center">
                              {consent.preferences?.analytics ? (
                                <i className="bi bi-check-circle-fill text-success"></i>
                              ) : (
                                <i className="bi bi-x-circle-fill text-danger"></i>
                              )}
                            </td>
                            <td className="text-center">
                              {consent.preferences?.marketing ? (
                                <i className="bi bi-check-circle-fill text-success"></i>
                              ) : (
                                <i className="bi bi-x-circle-fill text-danger"></i>
                              )}
                            </td>
                            <td>
                              <Badge bg={consent.consentMethod === 'banner' ? 'primary' : 'info'}>
                                {consent.consentMethod === 'banner' ? 'Banner' : 'Centro Preferenze'}
                              </Badge>
                            </td>
                            <td style={{ fontSize: '0.75rem' }} className="text-muted font-monospace">
                              {consent.ipAddress?.substring(0, 12)}...
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}

                {/* Paginazione */}
                {pagination.pages > 1 && (
                  <div className="d-flex justify-content-between align-items-center p-3 border-top">
                    <div className="text-muted">
                      Pagina {pagination.page} di {pagination.pages}
                    </div>
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        disabled={pagination.page === 1}
                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                      >
                        <i className="bi bi-chevron-left"></i> Precedente
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        disabled={pagination.page === pagination.pages}
                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                      >
                        Successivo <i className="bi bi-chevron-right"></i>
                      </Button>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>

            <Alert variant="warning" className="mt-4">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <strong>Conformità GDPR:</strong> I dati in questo registro devono essere conservati per almeno 
              12-24 mesi per dimostrare la conformità. L'IP è hashato per proteggere la privacy degli utenti.
            </Alert>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default AdminCookieConsent;
