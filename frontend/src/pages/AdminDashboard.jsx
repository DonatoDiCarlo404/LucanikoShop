import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/authContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [pendingSellers, setPendingSellers] = useState([]);
  const [allSellers, setAllSellers] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
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

      // Carica prodotti in attesa
      const productsRes = await fetch('http://localhost:5000/api/products?isApproved=false', {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setPendingProducts(productsData.products || []);
      }
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

  const handleApproveProduct = async (productId) => {
    if (!confirm('Sei sicuro di voler approvare questo prodotto?')) return;

    try {
      setActionLoading(productId);
      const res = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ isApproved: true })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Errore approvazione prodotto');
      }

      alert('✅ Prodotto approvato con successo!');
      await loadData();
    } catch (err) {
      alert('❌ Errore: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectProduct = async (productId) => {
    if (!confirm('Sei sicuro di voler RIFIUTARE questo prodotto? Verrà eliminato definitivamente!')) return;

    try {
      setActionLoading(productId);
      const res = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Errore eliminazione prodotto');
      }

      alert('✅ Prodotto rifiutato ed eliminato');
      await loadData();
    } catch (err) {
      alert('❌ Errore: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

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
          <Col md={3} className="mb-3">
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-info">{pendingProducts.length}</h3>
                <p className="text-muted mb-0">Prodotti in Attesa</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Tabs per Venditori */}
      <Tabs defaultActiveKey="pending-sellers" className="mb-3">
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
              {allSellers.length === 0 ? (
                <Alert variant="info">Nessun venditore registrato</Alert>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Azienda</th>
                      <th>P.IVA</th>
                      <th>Stato</th>
                      <th>Data Registrazione</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allSellers.map((seller) => (
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
                        <td>
                          {seller.isApproved ? (
                            <Badge bg="success">✓ Approvato</Badge>
                          ) : (
                            <Badge bg="warning">⏳ In Attesa</Badge>
                          )}
                        </td>
                        <td>{new Date(seller.createdAt).toLocaleDateString('it-IT')}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Tab Prodotti in Attesa */}
        <Tab 
          eventKey="pending-products" 
          title={
            <span>
              <span><i className="bi bi-box-seam text-info"></i> Prodotti in Attesa</span>
              {pendingProducts.length > 0 && (
                <Badge bg="info" className="ms-2">{pendingProducts.length}</Badge>
              )}
            </span>
          }
        >
          <Card>
            <Card.Body>
              {pendingProducts.length === 0 ? (
                <Alert variant="info">Nessun prodotto in attesa di approvazione</Alert>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Immagine</th>
                      <th>Nome</th>
                      <th>Venditore</th>
                      <th>Categoria</th>
                      <th>Prezzo</th>
                      <th>Stock</th>
                      <th>Data Creazione</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingProducts.map((product) => (
                      <tr key={product._id}>
                        <td>
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '50px',
                                height: '50px',
                                backgroundColor: '#e9ecef',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <small>N/A</small>
                            </div>
                          )}
                        </td>
                        <td>{product.name}</td>
                        <td>{product.seller?.name || product.seller?.businessName || '-'}</td>
                        <td>{product.category}</td>
                        <td>€{product.price.toFixed(2)}</td>
                        <td>
                          <Badge bg={product.stock > 10 ? 'success' : product.stock > 0 ? 'warning' : 'danger'}>
                            {product.stock}
                          </Badge>
                        </td>
                        <td>{new Date(product.createdAt).toLocaleDateString('it-IT')}</td>
                        <td>
                          <Button
                            variant="success"
                            size="sm"
                            className="me-2"
                            onClick={() => handleApproveProduct(product._id)}
                            disabled={actionLoading === product._id}
                          >
                            {actionLoading === product._id ? <Spinner animation="border" size="sm" /> : '✓ Approva'}
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRejectProduct(product._id)}
                            disabled={actionLoading === product._id}
                          >
                            {actionLoading === product._id ? <Spinner animation="border" size="sm" /> : '✗ Rifiuta'}
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
      </Tabs>
    </Container>
  );
};

export default AdminDashboard;
