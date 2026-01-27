import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Button, Badge, Spinner, Alert, Tabs, Tab, Form } from 'react-bootstrap';
import { adminAPI, uploadVendorDocument } from '../services/api';
// Espone la funzione uploadVendorDocument su window per uso inline
window.uploadVendorDocument = uploadVendorDocument;
import { useAuth } from '../context/authContext';
import RegisterCompanyForm from '../components/RegisterCompanyForm';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pendingSellers, setPendingSellers] = useState([]);
  const [allSellers, setAllSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  // Stato per i documenti allegati
  const [vendorDocs, setVendorDocs] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  
  // Stato per le News
  const [adminNews, setAdminNews] = useState([]);
  // Rimosso newsTitle
  const [newsContent, setNewsContent] = useState('');
  const [savingNews, setSavingNews] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState(null);

  useEffect(() => {
    loadData();
    loadNews();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [statsData, pendingData, allData] = await Promise.all([
        adminAPI.getStats(user.token),
        adminAPI.getPendingSellers(user.token),
        adminAPI.getAllSellers(user.token),
      ]);

      setStats(statsData);
      setPendingSellers(pendingData.sellers);
      setAllSellers(allData.sellers);
      // Carica la lista dei documenti per ogni venditore
      const docs = {};
      for (const seller of allData.sellers) {
        try {
          // Chiamata API per ottenere lista file PDF per venditore
          const res = await adminAPI.getVendorDocuments(seller._id, user.token);
          docs[seller._id] = res.files || [];
        } catch {
          docs[seller._id] = [];
        }
      }
      setVendorDocs(docs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sellerId) => {
    if (!confirm('Sei sicuro di voler approvare questo venditore?')) return;

    try {
      setActionLoading(sellerId);
      await adminAPI.approveSeller(sellerId, user.token);
      alert('✅ Venditore approvato con successo!');
      await loadData();
    } catch (err) {
      alert('❌ Errore: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (sellerId) => {
    if (!confirm('Sei sicuro di voler RIFIUTARE ed ELIMINARE questo venditore? Questa azione è irreversibile!')) return;

    try {
      setActionLoading(sellerId);
      await adminAPI.rejectSeller(sellerId, user.token);
      alert('✅ Venditore rifiutato ed eliminato');
      await loadData();
    } catch (err) {
      alert('❌ Errore: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleRenewal = async (sellerId, currentStatus) => {
    try {
      const res = await fetch(`${API_URL}/admin/sellers/${sellerId}/subscription`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Errore toggle rinnovo');
      }

      // Aggiorna localmente lo stato
      setAllSellers(prev => prev.map(seller => 
        seller._id === sellerId 
          ? { ...seller, subscriptionSuspended: !currentStatus }
          : seller
      ));
    } catch (err) {
      alert('❌ Errore: ' + err.message);
    }
  };

  // Funzioni per gestione News
  const loadNews = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/news/all`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAdminNews(data);
      }
    } catch (err) {
      console.error('Errore caricamento news:', err);
    }
  };

  const handleSaveNews = async (e) => {
    e.preventDefault();
    try {
      setSavingNews(true);
      const method = editingNewsId ? 'PUT' : 'POST';
      const url = editingNewsId 
        ? `http://localhost:5000/api/admin/news/${editingNewsId}`
        : 'http://localhost:5000/api/admin/news';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ content: newsContent })
      });

      if (response.ok) {
        alert(editingNewsId ? '✅ News aggiornata!' : '✅ News creata!');
        setNewsContent('');
        setEditingNewsId(null);
        await loadNews();
      } else {
        const data = await response.json();
        alert('❌ Errore: ' + data.message);
      }
    } catch (err) {
      alert('❌ Errore: ' + err.message);
    } finally {
      setSavingNews(false);
    }
  };

  const handleEditNews = (news) => {
    setNewsContent(news.content);
    setEditingNewsId(news._id);
  };

  const handleDeleteNews = async (newsId) => {
    if (!confirm('Sei sicuro di voler eliminare questa news?')) return;

    try {
      const response = await fetch(`${API_URL}/admin/news/${newsId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        alert('✅ News eliminata!');
        await loadNews();
      } else {
        const data = await response.json();
        alert('❌ Errore: ' + data.message);
      }
    } catch (err) {
      alert('❌ Errore: ' + err.message);
    }
  };

  const handleToggleNewsActive = async (newsId, currentStatus) => {
    try {
      const response = await fetch(`${API_URL}/admin/news/${newsId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        await loadNews();
      }
    } catch (err) {
      alert('❌ Errore: ' + err.message);
    }
  };

  // Filtro venditori per nome o nome azienda
  const filteredSellers = allSellers.filter(seller => {
    const name = seller.name?.toLowerCase() || "";
    const business = seller.businessName?.toLowerCase() || "";
    return (
      name.includes(searchTerm.toLowerCase()) ||
      business.includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Caricamento dashboard...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="mb-4">
        <span><i className="bi bi-shield-shaded text-primary"></i> Dashboard Admin</span>
      </h2>



      {error && <Alert variant="danger">{error}</Alert>}

      {/* Statistiche */}
      {stats && (
        <Row className="mb-4">
          <Col md={3} className="mb-3">
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-primary">{stats.totalUsers}</h3>
                <p className="text-muted mb-0">Utenti Totali</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-warning">{stats.pendingSellers}</h3>
                <p className="text-muted mb-0">Venditori in Attesa</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-success">{stats.approvedSellers}</h3>
                <p className="text-muted mb-0">Venditori Approvati</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Tabs per Venditori */}
      <Tabs defaultActiveKey="pending-sellers" className="mb-3">
        {/* Tab Registra Azienda */}
        <Tab 
          eventKey="register-company" 
          title={<span><i className="bi bi-building-add text-primary"></i> Registra Azienda</span>}
        >
          <Card>
            <Card.Body>
              <RegisterCompanyForm />
            </Card.Body>
          </Card>
        </Tab>
        {/* Tab Venditori in Attesa */}
        <Tab 
          eventKey="pending-sellers" 
          title={
            <span>
              <span><i className="bi bi-hourglass-split text-warning"></i> Venditori in Attesa</span> 
              {pendingSellers.length > 0 && (
                <Badge bg="warning" className="ms-2">{pendingSellers.length}</Badge>
              )}
            </span>
          }
        >
          <Card>
            <Card.Body>
              {pendingSellers.length === 0 ? (
                <Alert variant="info">Nessun venditore in attesa di approvazione</Alert>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Azienda</th>
                      <th>P.IVA</th>
                      <th>Data Registrazione</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingSellers.map((seller) => (
                      <tr key={seller._id}>
                        <td>{seller.name}</td>
                        <td>{seller.email}</td>
                        <td>
                          {seller.businessName ? (
                            <span 
                              style={{ 
                                color: '#0d6efd', 
                                cursor: 'pointer',
                                textDecoration: 'underline'
                              }}
                              onClick={() => navigate(`/shop/${seller._id}`)}
                            >
                              {seller.businessName}
                            </span>
                          ) : '-'}
                        </td>
                        <td>{seller.vatNumber || '-'}</td>
                        <td>{new Date(seller.createdAt).toLocaleDateString('it-IT')}</td>
                        <td>
                          <Button
                            variant="success"
                            size="sm"
                            className="me-2"
                            onClick={() => handleApprove(seller._id)}
                            disabled={actionLoading === seller._id}
                          >
                            {actionLoading === seller._id ? <Spinner animation="border" size="sm" /> : '✓ Approva'}
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleReject(seller._id)}
                            disabled={actionLoading === seller._id}
                          >
                            {actionLoading === seller._id ? <Spinner animation="border" size="sm" /> : '✗ Rifiuta'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Tab Tutti i Venditori */}
        <Tab eventKey="all" title={<span><i className="bi bi-person-lines-fill text-success"></i> Tutti i Venditori</span>}>
          <Card>
            <Card.Body>
              <div className="mb-3 d-flex align-items-center justify-content-between flex-wrap">
                <div className="mb-2 mb-md-0">
                  <strong>Ricerca per nome o azienda:</strong>
                  <input
                    type="text"
                    className="form-control d-inline-block ms-2"
                    style={{ width: 260, maxWidth: '100%' }}
                    placeholder="Cerca venditore..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              {filteredSellers.length === 0 ? (
                <Alert variant="info">Nessun venditore trovato</Alert>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Azienda</th>
                      <th>P.IVA</th>
                      <th>Stato</th>
                      <th>Stato Abbonamento</th>
                      <th>Rinnovo Automatico</th>
                      <th>Documenti Allegati</th>
                      <th>Data Registrazione</th>
                      <th>Data Scadenza Abbonamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSellers.map((seller) => (
                      <tr key={seller._id}>
                        <td>{seller.name}</td>
                        <td>{seller.email}</td>
                        <td>
                          {seller.businessName ? (
                            <span 
                              style={{ 
                                color: '#0d6efd', 
                                cursor: 'pointer',
                                textDecoration: 'underline'
                              }}
                              onClick={() => navigate(`/vendor/profile?sellerId=${seller._id}`)}
                            >
                              {seller.businessName}
                            </span>
                          ) : '-'}
                        </td>
                        <td>{seller.vatNumber || '-'}</td>
                        <td>
                          {seller.isApproved ? (
                            <Badge bg="success">✓ Approvato</Badge>
                          ) : (
                            <Badge bg="warning">⏳ In Attesa</Badge>
                          )}
                        </td>
                        <td>
                          {/* Stato Abbonamento: pallino verde se subscriptionPaid true, rosso altrimenti */}
                          {seller.subscriptionPaid ? (
                            <span title="Abbonamento attivo" style={{ color: 'green', fontSize: '1.5em' }}>●</span>
                          ) : (
                            <span title="Abbonamento non attivo" style={{ color: 'red', fontSize: '1.5em' }}>●</span>
                          )}
                        </td>
                        <td>
                          {/* Switch Rinnovo Automatico */}
                          <div className="form-check form-switch" style={{ fontSize: '1.2em' }}>
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              checked={!seller.subscriptionSuspended}
                              onChange={() => handleToggleRenewal(seller._id, seller.subscriptionSuspended)}
                              style={{ cursor: 'pointer' }}
                              title={seller.subscriptionSuspended ? 'Rinnovo sospeso - Clicca per attivare' : 'Rinnovo attivo - Clicca per sospendere'}
                            />
                            <label className="form-check-label" style={{ fontSize: '0.85em', marginLeft: '0.3em' }}>
                              {seller.subscriptionSuspended ? 'OFF' : 'ON'}
                            </label>
                          </div>
                        </td>
                        <td>
                          {/* Documenti Allegati: upload PDF + lista file */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                const files = e.target.elements[`pdf_${seller._id}`].files;
                                if (!files.length) return alert('Seleziona almeno un file PDF');
                                try {
                                  for (let i = 0; i < files.length; i++) {
                                    await window.uploadVendorDocument(seller._id, files[i]);
                                  }
                                  alert('✅ Documenti caricati!');
                                  // Aggiorna la lista documenti dopo upload
                                  try {
                                    const res = await adminAPI.getVendorDocuments(seller._id, user.token);
                                    setVendorDocs((prev) => ({ ...prev, [seller._id]: res.files || [] }));
                                  } catch {}
                                } catch (err) {
                                  alert('❌ Errore upload: ' + err.message);
                                }
                              }}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}
                            >
                              <input
                                type="file"
                                accept="application/pdf"
                                name={`pdf_${seller._id}`}
                                style={{ width: '180px' }}
                                multiple
                              />
                              <Button type="submit" size="sm" variant="secondary">Carica</Button>
                            </form>
                            {/* Lista file PDF allegati */}
                            {vendorDocs[seller._id] && vendorDocs[seller._id].length > 0 ? (
                              <ul style={{ margin: 0, paddingLeft: '1em', fontSize: '0.95em' }}>
                                {vendorDocs[seller._id].map((file, idx) => (
                                  <li key={idx}>
                                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                                      {file.name || file.url.split('/').pop()}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span style={{ color: '#888', fontSize: '0.95em' }}>Nessun documento</span>
                            )}
                          </div>
                        </td>
                        <td>{new Date(seller.createdAt).toLocaleDateString('it-IT')}</td>
                        <td>{seller.subscriptionEndDate ? new Date(seller.subscriptionEndDate).toLocaleDateString('it-IT') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Tab News */}
        <Tab eventKey="news" title={<span><i className="bi bi-megaphone text-info"></i> News</span>}>
          <Card>
            <Card.Header>
              <h5><i className="bi bi-megaphone me-2"></i>Gestione News</h5>
              <small className="text-muted">Le news attive verranno mostrate nella pagina Catalogo</small>
            </Card.Header>
            <Card.Body>
              {/* Form creazione/modifica news */}
              <Form onSubmit={handleSaveNews} className="mb-4 p-3 border rounded">
                <h6>{editingNewsId ? 'Modifica News' : 'Crea Nuova News'}</h6>
                <Form.Group className="mb-3">
                  <Form.Label>Contenuto</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={newsContent}
                    onChange={(e) => setNewsContent(e.target.value)}
                    placeholder="Contenuto della news (max 500 caratteri)"
                    maxLength={500}
                  />
                  <Form.Text className="text-muted">
                    {newsContent.length}/500 caratteri
                  </Form.Text>
                </Form.Group>
                <div className="d-flex gap-2">
                  <Button type="submit" variant="primary" disabled={savingNews}>
                    {savingNews ? <Spinner size="sm" /> : (editingNewsId ? 'Aggiorna' : 'Crea')}
                  </Button>
                  {editingNewsId && (
                    <Button 
                      variant="secondary" 
                      onClick={() => {
                        setEditingNewsId(null);
                        setNewsContent('');
                      }}
                    >
                      Annulla
                    </Button>
                  )}
                </div>
              </Form>

              {/* Lista news esistenti */}
              <h6 className="mb-3">News Esistenti ({adminNews.length})</h6>
              {adminNews.length === 0 ? (
                <Alert variant="info">Nessuna news presente. Creane una!</Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Contenuto</th>
                      <th>Stato</th>
                      <th>Creata il</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminNews.map(news => (
                      <tr key={news._id}>
                        <td>{news.content}</td>
                        <td>
                          <Badge bg={news.isActive ? 'success' : 'secondary'}>
                            {news.isActive ? 'Attiva' : 'Inattiva'}
                          </Badge>
                        </td>
                        <td>{new Date(news.createdAt).toLocaleDateString('it-IT')}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              size="sm"
                              variant={news.isActive ? 'warning' : 'success'}
                              onClick={() => handleToggleNewsActive(news._id, news.isActive)}
                              title={news.isActive ? 'Disattiva' : 'Attiva'}
                            >
                              <i className={`bi bi-${news.isActive ? 'eye-slash' : 'eye'}`}></i>
                            </Button>
                            <Button
                              size="sm"
                              variant="info"
                              onClick={() => handleEditNews(news)}
                              title="Modifica"
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleDeleteNews(news._id)}
                              title="Elimina"
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default AdminDashboard;
