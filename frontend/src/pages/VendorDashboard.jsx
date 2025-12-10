import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  Spinner,
  Alert,
  Modal,
  Form,
  Tabs,
  Tab
} from 'react-bootstrap';
import { useAuth } from '../context/authContext';

const VendorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);

  // Modal per aggiornamento stato ordine
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  // Verifica autorizzazione
  useEffect(() => {
    if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
      navigate('/');
    }
  }, [user, navigate]);

  // Carica dati dashboard
  useEffect(() => {
    if (user && (user.role === 'seller' || user.role === 'admin')) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Carica ordini ricevuti
      const ordersRes = await fetch('http://localhost:5000/api/orders/vendor/received', {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      if (!ordersRes.ok) {
        throw new Error('Errore nel caricamento ordini');
      }

      const ordersData = await ordersRes.json();
      setOrders(ordersData);

      // Carica statistiche
      const statsRes = await fetch('http://localhost:5000/api/orders/vendor/stats', {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      if (!statsRes.ok) {
        throw new Error('Errore nel caricamento statistiche');
      }

      const statsData = await statsRes.json();
      setStats(statsData);

      // Carica prodotti del venditore
      const productsRes = await fetch('http://localhost:5000/api/products/seller/my-products', {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      if (!productsRes.ok) {
        throw new Error('Errore nel caricamento prodotti');
      }

      const productsData = await productsRes.json();
      setProducts(productsData);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Apri modal per aggiornamento stato
  const handleUpdateStatus = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setTrackingNumber(order.trackingInfo?.trackingNumber || '');
    setCarrier(order.trackingInfo?.carrier || '');
    setUpdateError('');
    setShowModal(true);
  };

  // Salva aggiornamento stato
  const handleSaveStatus = async () => {
    try {
      setUpdating(true);
      setUpdateError('');

      const res = await fetch(`http://localhost:5000/api/orders/${selectedOrder._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          status: newStatus,
          trackingNumber: trackingNumber || undefined,
          carrier: carrier || undefined
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Errore aggiornamento ordine');
      }

      // Ricarica dati
      await loadDashboardData();
      setShowModal(false);
      setSelectedOrder(null);

    } catch (err) {
      setUpdateError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Funzione per ottenere badge colore stato
  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { variant: 'warning', text: 'In attesa' },
      processing: { variant: 'info', text: 'In lavorazione' },
      shipped: { variant: 'primary', text: 'Spedito' },
      delivered: { variant: 'success', text: 'Consegnato' },
      cancelled: { variant: 'danger', text: 'Annullato' }
    };
    const { variant, text } = statusMap[status] || { variant: 'secondary', text: status };
    return <Badge bg={variant}>{text}</Badge>;
  };

  // Calcola totale ordine per il venditore
  const calculateVendorTotal = (order) => {
    return order.items
      .filter(item => item.seller._id === user._id || user.role === 'admin')
      .reduce((sum, item) => sum + (item.price * item.quantity), 0)
      .toFixed(2);
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
        <p className="mt-3">Caricamento dashboard...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4 mb-5">
      <h2 className="mb-4">📊 Dashboard Venditore</h2>

      {/* Notifica prodotti in attesa di approvazione */}
      {user.role === 'seller' && products.some(p => !p.isApproved) && (
        <Alert variant="info" className="mb-4">
          <Alert.Heading>
            <i className="bi bi-info-circle"></i> Prodotti in attesa di approvazione
          </Alert.Heading>
          <p className="mb-0">
            Hai <strong>{products.filter(p => !p.isApproved).length}</strong> prodotto/i in attesa di approvazione da parte dell'admin. 
            Una volta approvati, saranno visibili nel catalogo pubblico.
          </p>
        </Alert>
      )}

      {/* Statistiche */}
      {stats && (
        <Row className="mb-4">
          <Col md={3} sm={6} className="mb-3">
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-success">€{stats.totalRevenue.toFixed(2)}</h3>
                <p className="text-muted mb-0">Fatturato Totale</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6} className="mb-3">
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-primary">{stats.totalOrders}</h3>
                <p className="text-muted mb-0">Ordini Ricevuti</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6} className="mb-3">
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-info">{stats.totalProducts}</h3>
                <p className="text-muted mb-0">Prodotti Venduti</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6} className="mb-3">
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-warning">{stats.statusCount.pending + stats.statusCount.processing}</h3>
                <p className="text-muted mb-0">Ordini da Evadere</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Tabs per ordini e prodotti */}
      <Tabs defaultActiveKey="orders" className="mb-3">
        <Tab eventKey="orders" title={`Ordini Ricevuti (${orders.length})`}>
          <Card>
            <Card.Body>
              {orders.length === 0 ? (
                <Alert variant="info">Nessun ordine ricevuto al momento.</Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>ID Ordine</th>
                        <th>Data</th>
                        <th>Cliente</th>
                        <th>Prodotti</th>
                        <th>Totale</th>
                        <th>Stato</th>
                        <th>Pagato</th>
                        <th>Tracking</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order._id}>
                          <td><small>{order._id.slice(-8)}</small></td>
                          <td>{new Date(order.createdAt).toLocaleDateString('it-IT')}</td>
                          <td>{order.buyer?.name || 'N/A'}</td>
                          <td>
                            {order.items
                              .filter(item => item.seller._id === user._id || user.role === 'admin')
                              .map((item, idx) => (
                                <div key={idx}>
                                  <small>{item.name} x{item.quantity}</small>
                                </div>
                              ))}
                          </td>
                          <td>€{calculateVendorTotal(order)}</td>
                          <td>{getStatusBadge(order.status)}</td>
                          <td>
                            {order.isPaid ? (
                              <Badge bg="success">Sì</Badge>
                            ) : (
                              <Badge bg="danger">No</Badge>
                            )}
                          </td>
                          <td>
                            {order.trackingInfo?.trackingNumber ? (
                              <small>{order.trackingInfo.trackingNumber}</small>
                            ) : (
                              <small className="text-muted">-</small>
                            )}
                          </td>
                          <td>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => handleUpdateStatus(order)}
                            >
                              Aggiorna
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="products" title={`I Miei Prodotti (${products.length})`}>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>Gestisci i tuoi prodotti</h5>
                <Button variant="success" onClick={() => navigate('/products/new')}>
                  + Nuovo Prodotto
                </Button>
              </div>

              {products.length === 0 ? (
                <Alert variant="info">Non hai ancora prodotti. Crea il tuo primo prodotto!</Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Immagine</th>
                        <th>Nome</th>
                        <th>Categoria</th>
                        <th>Prezzo</th>
                        <th>Stock</th>
                        <th>Stato</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
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
                          <td>{product.category}</td>
                          <td>€{product.price.toFixed(2)}</td>
                          <td>
                            <Badge bg={product.stock > 10 ? 'success' : product.stock > 0 ? 'warning' : 'danger'}>
                              {product.stock}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={product.isApproved ? 'success' : 'warning'}>
                              {product.isApproved ? 'Approvato' : 'In attesa'}
                            </Badge>
                          </td>
                          <td>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => navigate(`/products/edit/${product._id}`)}
                              className="me-2"
                            >
                              Modifica
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-info"
                              onClick={() => navigate(`/products/${product._id}`)}
                            >
                              Visualizza
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {stats && (
          <Tab eventKey="stats" title="Statistiche Dettagliate">
            <Card>
              <Card.Body>
                <h5 className="mb-4">Riepilogo Ordini per Stato</h5>
                <Row>
                  <Col md={4} className="mb-3">
                    <Card className="text-center">
                      <Card.Body>
                        <h4 className="text-warning">{stats.statusCount.pending}</h4>
                        <p className="mb-0">In Attesa</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4} className="mb-3">
                    <Card className="text-center">
                      <Card.Body>
                        <h4 className="text-info">{stats.statusCount.processing}</h4>
                        <p className="mb-0">In Lavorazione</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4} className="mb-3">
                    <Card className="text-center">
                      <Card.Body>
                        <h4 className="text-primary">{stats.statusCount.shipped}</h4>
                        <p className="mb-0">Spediti</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4} className="mb-3">
                    <Card className="text-center">
                      <Card.Body>
                        <h4 className="text-success">{stats.statusCount.delivered}</h4>
                        <p className="mb-0">Consegnati</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4} className="mb-3">
                    <Card className="text-center">
                      <Card.Body>
                        <h4 className="text-danger">{stats.statusCount.cancelled}</h4>
                        <p className="mb-0">Annullati</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Tab>
        )}
      </Tabs>

      {/* Modal Aggiornamento Stato Ordine */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Aggiorna Stato Ordine</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {updateError && <Alert variant="danger">{updateError}</Alert>}
          
          {selectedOrder && (
            <>
              <p><strong>Ordine ID:</strong> {selectedOrder._id.slice(-8)}</p>
              <p><strong>Cliente:</strong> {selectedOrder.buyer?.name}</p>
              <p><strong>Totale:</strong> €{calculateVendorTotal(selectedOrder)}</p>
              
              <hr />
              
              <Form.Group className="mb-3">
                <Form.Label>Stato Ordine</Form.Label>
                <Form.Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="pending">In Attesa</option>
                  <option value="processing">In Lavorazione</option>
                  <option value="shipped">Spedito</option>
                  <option value="delivered">Consegnato</option>
                  <option value="cancelled">Annullato</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Corriere (opzionale)</Form.Label>
                <Form.Select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                >
                  <option value="">Seleziona corriere</option>
                  <option value="DHL">DHL</option>
                  <option value="FedEx">FedEx</option>
                  <option value="UPS">UPS</option>
                  <option value="Poste Italiane">Poste Italiane</option>
                  <option value="BRT">BRT</option>
                  <option value="GLS">GLS</option>
                  <option value="Altro">Altro</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Numero di Tracciamento (opzionale)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Es: 1Z999AA10123456784"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
                <Form.Text className="text-muted">
                  Inserisci il tracking number per permettere al cliente di tracciare la spedizione
                </Form.Text>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Annulla
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveStatus}
            disabled={updating}
          >
            {updating ? 'Salvataggio...' : 'Salva Modifiche'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default VendorDashboard;
