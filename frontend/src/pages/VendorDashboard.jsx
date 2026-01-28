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
import { API_URL } from '../services/api';

const VendorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);

  // Tab state for color switching
  const [activeTab, setActiveTab] = useState('orders');

  // Modal per aggiornamento stato ordine
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  // State per gestione sconti
  const [discounts, setDiscounts] = useState([]);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [categories, setCategories] = useState([]);
  
  // State per eliminazione prodotto
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [discountForm, setDiscountForm] = useState({
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    applicationType: 'coupon',
    products: [],
    categories: [],
    couponCode: '',
    startDate: '',
    endDate: '',
    usageLimit: '',
    minPurchaseAmount: '',
    maxDiscountAmount: ''
  });

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
      loadDiscounts();
      loadCategories();
    }
  }, [user]);

  // Carica categorie
  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Errore caricamento categorie:', err);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Carica ordini ricevuti
      const ordersRes = await fetch(`${API_URL}/orders/vendor/received`, {
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
      const statsRes = await fetch(`${API_URL}/orders/vendor/stats`, {
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
      const productsRes = await fetch(`${API_URL}/products/seller/my-products`, {
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

  // Gestione eliminazione prodotto
  const handleDeleteProduct = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`${API_URL}/products/${productToDelete._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Errore durante l\'eliminazione del prodotto');
      }

      // Rimuovi il prodotto dalla lista locale
      setProducts(products.filter(p => p._id !== productToDelete._id));
      setShowDeleteModal(false);
      setProductToDelete(null);
      
      // Opzionalmente potresti ricaricare i dati
      // loadDashboardData();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
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

      const res = await fetch(`${API_URL}/orders/${selectedOrder._id}/status`, {
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

  // === GESTIONE SCONTI ===

  // Carica lista sconti
  const loadDiscounts = async () => {
    try {
      setLoadingDiscounts(true);
      const res = await fetch(`${API_URL}/discounts`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      if (!res.ok) {
        throw new Error('Errore nel caricamento sconti');
      }

      const data = await res.json();
      setDiscounts(data.discounts || []);
    } catch (err) {
      console.error('Errore caricamento sconti:', err);
    } finally {
      setLoadingDiscounts(false);
    }
  };

  // Apri modal per nuovo sconto
  const handleNewDiscount = () => {
    setEditingDiscount(null);
    setDiscountForm({
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      applicationType: 'coupon',
      products: [],
      categories: [],
      couponCode: '',
      startDate: '',
      endDate: '',
      usageLimit: '',
      minPurchaseAmount: '',
      maxDiscountAmount: ''
    });
    setShowDiscountModal(true);
  };

  // Apri modal per modifica sconto
  const handleEditDiscount = (discount) => {
    setEditingDiscount(discount);
    setDiscountForm({
      name: discount.name || '',
      description: discount.description || '',
      discountType: discount.discountType || 'percentage',
      discountValue: discount.discountValue || '',
      applicationType: discount.applicationType || 'coupon',
      products: discount.products?.map(p => p._id || p) || [],
      categories: discount.categories || [],
      couponCode: discount.couponCode || '',
      startDate: discount.startDate ? discount.startDate.split('T')[0] : '',
      endDate: discount.endDate ? discount.endDate.split('T')[0] : '',
      usageLimit: discount.usageLimit || '',
      minPurchaseAmount: discount.minPurchaseAmount || '',
      maxDiscountAmount: discount.maxDiscountAmount || ''
    });
    setShowDiscountModal(true);
  };

  // Salva sconto (crea o aggiorna)
  const handleSaveDiscount = async () => {
    try {
      setUpdating(true);
      setUpdateError('');

      const body = {
        name: discountForm.name,
        description: discountForm.description,
        discountType: discountForm.discountType,
        discountValue: parseFloat(discountForm.discountValue),
        applicationType: discountForm.applicationType,
        products: discountForm.applicationType === 'product' ? discountForm.products : [],
        categories: discountForm.applicationType === 'category' ? discountForm.categories : [],
        couponCode: discountForm.applicationType === 'coupon' ? discountForm.couponCode.toUpperCase() : undefined,
        startDate: discountForm.startDate,
        endDate: discountForm.endDate,
        usageLimit: discountForm.usageLimit ? parseInt(discountForm.usageLimit) : undefined,
        minPurchaseAmount: discountForm.minPurchaseAmount ? parseFloat(discountForm.minPurchaseAmount) : 0,
        maxDiscountAmount: discountForm.maxDiscountAmount ? parseFloat(discountForm.maxDiscountAmount) : undefined
      };

      const url = editingDiscount
        ? `${API_URL}/discounts/${editingDiscount._id}`
        : `${API_URL}/discounts`;

      const method = editingDiscount ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Errore nel salvataggio dello sconto');
      }

      await loadDiscounts();
      setShowDiscountModal(false);
      setEditingDiscount(null);
    } catch (err) {
      setUpdateError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Elimina sconto
  const handleDeleteDiscount = async (discountId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo sconto?')) return;

    try {
      const res = await fetch(`${API_URL}/discounts/${discountId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Errore eliminazione sconto');
      }

      await loadDiscounts();
    } catch (err) {
      alert(err.message);
    }
  };

  // Toggle attivo/disattivo sconto
  const handleToggleDiscount = async (discountId) => {
    try {
      const res = await fetch(`${API_URL}/discounts/${discountId}/toggle`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Errore toggle sconto');
      }

      await loadDiscounts();
    } catch (err) {
      alert(err.message);
    }
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ color: '#004b75' }}>📊 Dashboard Venditore</h2>
        <Button variant="outline-primary" onClick={() => navigate('/vendor/profile')}>
          <i className="bi bi-person-badge me-2"></i>
          Profilo Aziendale
        </Button>
      </div>


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
      <Tabs defaultActiveKey="orders" className="mb-3" onSelect={setActiveTab} activeKey={activeTab}>
        <Tab eventKey="orders" title={<span style={{color: activeTab === 'orders' ? '#00bf63' : '#004b75'}}>{`Ordini Ricevuti (${orders.length})`}</span>}>
          <Card>
            <Card.Body>
              <div className="mb-3" style={{maxWidth: 350}}>
                <Form.Control
                  type="text"
                  placeholder="Cerca per nome o cognome cliente..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
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
                      {orders
                        .filter(order => {
                          const name = order.buyer?.name?.toLowerCase() || "";
                          const surname = order.buyer?.surname?.toLowerCase() || "";
                          const search = searchTerm.toLowerCase();
                          return (
                            name.includes(search) ||
                            surname.includes(search) ||
                            (name + " " + surname).includes(search) ||
                            (surname + " " + name).includes(search)
                          );
                        })
                        .map((order) => (
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

        <Tab eventKey="products" title={<span style={{color: activeTab === 'products' ? '#00bf63' : '#004b75'}}>{`I Miei Prodotti (${products.length})`}</span>}>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>Gestisci i tuoi prodotti</h5>
                <Button variant="success" onClick={() => navigate('/products/new')}>
                  + Nuovo Prodotto
                </Button>
              </div>

              <div className="mb-3" style={{maxWidth: 350}}>
                <Form.Control
                  type="text"
                  placeholder="Cerca per nome prodotto..."
                  value={searchProduct}
                  onChange={e => setSearchProduct(e.target.value)}
                />
              </div>

              {products.length === 0 ? (
                <Alert variant="info">Non hai ancora prodotti. Crea il tuo primo prodotto!</Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Categoria</th>
                        <th>Prezzo</th>
                        <th>Stock</th>
                        <th>Stato</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products
                        .filter(product => product.name.toLowerCase().includes(searchProduct.toLowerCase()))
                        .map((product) => (
                        <tr key={product._id}>
                          <td>{product.name}</td>
                          <td>{
                            typeof product.category === 'object' && product.category !== null
                              ? product.category.name
                              : (categories.find(cat => cat._id === product.category)?.name || product.category)
                          }</td>
                          <td>
                            {typeof product.price === 'number'
                              ? `€${product.price.toFixed(2)}`
                              : (Array.isArray(product.variants) && product.variants.length > 0
                                  ? `da €${Math.min(...product.variants.map(v => v.price || 0)).toFixed(2)}`
                                  : <span className="text-muted">N/A</span>
                                )
                            }
                          </td>
                          <td>
                            {(() => {
                              let totalStock = typeof product.stock === 'number' ? product.stock : 0;
                              if (Array.isArray(product.variants) && product.variants.length > 0) {
                                totalStock = product.variants
                                  .filter(v => typeof v.stock === 'number')
                                  .reduce((sum, v) => sum + v.stock, 0);
                              }
                              return (
                                <Badge bg={totalStock > 10 ? 'success' : totalStock > 0 ? 'warning' : 'danger'}>
                                  {totalStock}
                                </Badge>
                              );
                            })()}
                          </td>
                          <td>
                            {(() => {
                              let totalStock = typeof product.stock === 'number' ? product.stock : 0;
                              if (Array.isArray(product.variants) && product.variants.length > 0) {
                                totalStock = product.variants
                                  .filter(v => typeof v.stock === 'number')
                                  .reduce((sum, v) => sum + v.stock, 0);
                              }
                              return (
                                <Badge bg={totalStock > 10 ? 'success' : totalStock > 0 ? 'warning' : 'danger'}>
                                  {totalStock > 10 ? 'Disponibile' : totalStock > 0 ? 'Basso' : 'Esaurito'}
                                </Badge>
                              );
                            })()}
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
                              className="me-2"
                            >
                              Visualizza
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleDeleteProduct(product)}
                            >
                              Elimina
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

        <Tab eventKey="discounts" title={<span style={{color: activeTab === 'discounts' ? '#00bf63' : '#004b75'}}>{`Sconti e Coupon (${discounts.length})`}</span>}>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>Gestisci Sconti e Coupon</h5>
                <Button variant="success" onClick={handleNewDiscount}>
                  + Nuovo Sconto
                </Button>
              </div>

              {loadingDiscounts ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                </div>
              ) : discounts.length === 0 ? (
                <Alert variant="info">Non hai ancora creato sconti o coupon.</Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Tipo</th>
                        <th>Valore</th>
                        <th>Applicazione</th>
                        <th>Codice Coupon</th>
                        <th>Validità</th>
                        <th>Utilizzi</th>
                        <th>Stato</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discounts.map((discount) => (
                        <tr key={discount._id}>
                          <td>
                            <strong>{discount.name}</strong>
                            {discount.description && (
                              <div><small className="text-muted">{discount.description}</small></div>
                            )}
                          </td>
                          <td>
                            <Badge bg={discount.discountType === 'percentage' ? 'info' : 'warning'}>
                              {discount.discountType === 'percentage' ? 'Percentuale' : 'Fisso'}
                            </Badge>
                          </td>
                          <td>
                            <strong>
                              {discount.discountType === 'percentage' 
                                ? `${discount.discountValue}%` 
                                : `€${discount.discountValue}`}
                            </strong>
                          </td>
                          <td>
                            {discount.applicationType === 'coupon' && 'Coupon'}
                            {discount.applicationType === 'product' && 'Prodotto'}
                            {discount.applicationType === 'category' && 'Categoria'}
                          </td>
                          <td>
                            {discount.couponCode ? (
                              <Badge bg="primary">{discount.couponCode}</Badge>
                            ) : (
                              <small className="text-muted">-</small>
                            )}
                          </td>
                          <td>
                            <small>
                              {new Date(discount.startDate).toLocaleDateString('it-IT')} - {new Date(discount.endDate).toLocaleDateString('it-IT')}
                            </small>
                          </td>
                          <td>
                            {discount.usageCount || 0}
                            {discount.usageLimit && ` / ${discount.usageLimit}`}
                          </td>
                          <td>
                            <Badge bg={discount.isActive ? 'success' : 'secondary'}>
                              {discount.isActive ? 'Attivo' : 'Disattivo'}
                            </Badge>
                          </td>
                          <td>
                            <Button
                              size="sm"
                              variant={discount.isActive ? 'outline-warning' : 'outline-success'}
                              onClick={() => handleToggleDiscount(discount._id)}
                              className="me-2 mb-1"
                            >
                              {discount.isActive ? 'Disattiva' : 'Attiva'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => handleEditDiscount(discount)}
                              className="me-2 mb-1"
                            >
                              Modifica
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleDeleteDiscount(discount._id)}
                              className="mb-1"
                            >
                              Elimina
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
          <Tab eventKey="stats" title={<span style={{color: activeTab === 'stats' ? '#00bf63' : '#004b75'}}>Statistiche Dettagliate</span>}>
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

      {/* Modal Gestione Sconto */}
      <Modal show={showDiscountModal} onHide={() => setShowDiscountModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingDiscount ? 'Modifica Sconto' : 'Nuovo Sconto'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {updateError && <Alert variant="danger">{updateError}</Alert>}
          
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome Sconto *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Es: Sconto Natale 2025"
                    value={discountForm.name}
                    onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo Applicazione *</Form.Label>
                  <Form.Select
                    value={discountForm.applicationType}
                    onChange={(e) => setDiscountForm({ ...discountForm, applicationType: e.target.value })}
                  >
                    <option value="coupon">Coupon (con codice)</option>
                    <option value="product">Prodotto specifico</option>
                    <option value="category">Categoria</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Descrizione</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Breve descrizione dello sconto"
                value={discountForm.description}
                onChange={(e) => setDiscountForm({ ...discountForm, description: e.target.value })}
              />
            </Form.Group>

            {discountForm.applicationType === 'coupon' && (
              <Form.Group className="mb-3">
                <Form.Label>Codice Coupon *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Es: NATALE2025"
                  value={discountForm.couponCode}
                  onChange={(e) => setDiscountForm({ ...discountForm, couponCode: e.target.value.toUpperCase() })}
                  required
                />
                <Form.Text className="text-muted">
                  Codice univoco che gli utenti dovranno inserire per applicare lo sconto
                </Form.Text>
              </Form.Group>
            )}

            {discountForm.applicationType === 'product' && (
              <Form.Group className="mb-3">
                <Form.Label>Seleziona Prodotti *</Form.Label>
                <Form.Select
                  multiple
                  value={discountForm.products}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setDiscountForm({ ...discountForm, products: selected });
                  }}
                  style={{ minHeight: '150px' }}
                >
                  {products.map(product => (
                    <option key={product._id} value={product._id}>
                      {product.name} - €{typeof product.price === 'number' ? product.price.toFixed(2) : 'N/A'}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  Tieni premuto Ctrl (o Cmd su Mac) per selezionare più prodotti. Lo sconto verrà applicato automaticamente.
                </Form.Text>
              </Form.Group>
            )}

            {discountForm.applicationType === 'category' && (
              <Form.Group className="mb-3">
                <Form.Label>Seleziona Categorie *</Form.Label>
                <Form.Select
                  multiple
                  value={discountForm.categories}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setDiscountForm({ ...discountForm, categories: selected });
                  }}
                  style={{ minHeight: '150px' }}
                >
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  Tieni premuto Ctrl (o Cmd su Mac) per selezionare più categorie. Lo sconto verrà applicato automaticamente a tutti i tuoi prodotti in queste categorie.
                </Form.Text>
              </Form.Group>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo Sconto *</Form.Label>
                  <Form.Select
                    value={discountForm.discountType}
                    onChange={(e) => setDiscountForm({ ...discountForm, discountType: e.target.value })}
                  >
                    <option value="percentage">Percentuale (%)</option>
                    <option value="fixed">Importo Fisso (€)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Valore Sconto *</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={discountForm.discountType === 'percentage' ? 'Es: 20' : 'Es: 10.00'}
                    value={discountForm.discountValue}
                    onChange={(e) => setDiscountForm({ ...discountForm, discountValue: e.target.value })}
                    required
                  />
                  <Form.Text className="text-muted">
                    {discountForm.discountType === 'percentage' ? 'Percentuale (0-100)' : 'Importo in euro'}
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data Inizio *</Form.Label>
                  <Form.Control
                    type="date"
                    value={discountForm.startDate}
                    onChange={(e) => setDiscountForm({ ...discountForm, startDate: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data Fine *</Form.Label>
                  <Form.Control
                    type="date"
                    value={discountForm.endDate}
                    onChange={(e) => setDiscountForm({ ...discountForm, endDate: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Importo Minimo (€)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={discountForm.minPurchaseAmount}
                    onChange={(e) => setDiscountForm({ ...discountForm, minPurchaseAmount: e.target.value })}
                  />
                  <Form.Text className="text-muted">
                    Spesa minima richiesta
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Sconto Massimo (€)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Illimitato"
                    value={discountForm.maxDiscountAmount}
                    onChange={(e) => setDiscountForm({ ...discountForm, maxDiscountAmount: e.target.value })}
                  />
                  <Form.Text className="text-muted">
                    Per sconti percentuali
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Limite Utilizzi</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    placeholder="Illimitato"
                    value={discountForm.usageLimit}
                    onChange={(e) => setDiscountForm({ ...discountForm, usageLimit: e.target.value })}
                  />
                  <Form.Text className="text-muted">
                    Quante volte usabile
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDiscountModal(false)}>
            Annulla
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveDiscount}
            disabled={
              updating || 
              !discountForm.name || 
              !discountForm.discountValue || 
              !discountForm.startDate || 
              !discountForm.endDate || 
              (discountForm.applicationType === 'coupon' && !discountForm.couponCode) ||
              (discountForm.applicationType === 'product' && discountForm.products.length === 0) ||
              (discountForm.applicationType === 'category' && discountForm.categories.length === 0)
            }
          >
            {updating ? 'Salvataggio...' : 'Salva Sconto'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal conferma eliminazione prodotto */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Conferma Eliminazione</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {productToDelete && (
            <p>
              Sei sicuro di voler eliminare il prodotto <strong>{productToDelete.name}</strong>?
              <br />
              <span className="text-danger">Questa azione non può essere annullata.</span>
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
            Annulla
          </Button>
          <Button variant="danger" onClick={confirmDeleteProduct} disabled={deleting}>
            {deleting ? 'Eliminazione...' : 'Elimina'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default VendorDashboard;
