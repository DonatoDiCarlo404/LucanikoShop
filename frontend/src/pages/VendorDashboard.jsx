import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { getEarningsSummary } from '../services/earningsService';
import { getNotifications, markNotificationAsRead } from '../services/notificationService';
import AlertModal from '../components/AlertModal';

const VendorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sellerId = searchParams.get('sellerId'); // ID del venditore da visualizzare (solo admin)

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);

  // State per earnings
  const [earnings, setEarnings] = useState(null);
  const [loadingEarnings, setLoadingEarnings] = useState(false);

  // State per notifiche (Fase 5.5)
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Tab state for color switching
  
  // Stato per AlertModal
  const [alertModal, setAlertModal] = useState({ show: false, message: '', type: 'info' });
  
  // Funzione helper per mostrare alert modal
  const showAlert = (message, type = 'info') => {
    setAlertModal({ show: true, message, type });
  };
  const [activeTab, setActiveTab] = useState('orders');

  // Modal per aggiornamento stato ordine
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  // State per eliminazione prodotto
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // State per categorie (necessario per visualizzazione prodotti)
  const [categories, setCategories] = useState([]);

  // Verifica autorizzazione
  useEffect(() => {
    if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
      navigate('/');
    }
  }, [user, navigate]);

  // Helper function: Costruisce query params per admin che visualizza un venditore
  const getVendorQueryParams = () => {
    if (user?.role === 'admin' && sellerId) {
      return `?vendorId=${sellerId}`;
    }
    return '';
  };

  // Carica dati dashboard
  useEffect(() => {
    if (user && (user.role === 'seller' || user.role === 'admin')) {
      loadDashboardData();
      loadCategories();
      loadNotifications();
    }
  }, [user, sellerId]); // Ricarica se cambia il venditore visualizzato

  // Polling notifiche ogni 30 secondi
  useEffect(() => {
    if (!user || (user.role !== 'seller' && user.role !== 'admin')) return;

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000); // 30 secondi

    return () => clearInterval(interval);
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
      const queryParams = getVendorQueryParams();
      const ordersRes = await fetch(`${API_URL}/orders/vendor/received${queryParams}`, {
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
      const statsRes = await fetch(`${API_URL}/orders/vendor/stats${queryParams}`, {
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
      const productsRes = await fetch(`${API_URL}/products/seller/my-products${queryParams}`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      if (!productsRes.ok) {
        throw new Error('Errore nel caricamento prodotti');
      }

      const productsData = await productsRes.json();
      setProducts(productsData);

      // Carica earnings (nuova sezione Fase 5.2)
      await loadEarningsData();

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Carica dati earnings
  const loadEarningsData = async () => {
    try {
      setLoadingEarnings(true);

      // Carica riepilogo earnings (passa sellerId se admin visualizza altro venditore)
      const earningsData = await getEarningsSummary(user.token, sellerId);
      setEarnings(earningsData);

    } catch (err) {
      console.error('Errore caricamento earnings:', err);
      // Non blocchiamo la dashboard per errori earnings
    } finally {
      setLoadingEarnings(false);
    }
  };

  // Carica notifiche (Fase 5.5)
  const loadNotifications = async () => {
    try {
      const { notifications, unreadCount } = await getNotifications();
      setNotifications(notifications);
      setUnreadCount(unreadCount);
    } catch (err) {
      console.error('Errore caricamento notifiche:', err);
    }
  };

  // Segna notifica come letta
  const handleMarkAsRead = async (notificationId) => {
    try {
      const { unreadCount } = await markNotificationAsRead(notificationId);
      setUnreadCount(unreadCount);
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      ));
    } catch (err) {
      console.error('Errore aggiornamento notifica:', err);
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
      showAlert(err.message, 'error');
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

  // Traduce i codici delle varianti (custom_xxx/opt_xxx) in nomi leggibili
  const getVariantDisplayText = (item, selectedVariantAttributes) => {
    if (!selectedVariantAttributes || !Array.isArray(selectedVariantAttributes) || selectedVariantAttributes.length === 0) {
      return '';
    }

    // item.product è già popolato dal backend con customAttributes
    const product = item.product;

    // Se non troviamo customAttributes, mostra i codici originali
    if (!product || !product.customAttributes || product.customAttributes.length === 0) {
      return selectedVariantAttributes
        .map(attr => `${attr.key}: ${attr.value}`)
        .join(', ');
    }

    // Traduciamo i codici in nomi leggibili
    const translatedVariants = selectedVariantAttributes.map(selectedAttr => {
      // Trova l'attributo nel prodotto usando il codice key
      const attribute = product.customAttributes.find(attr => attr.key === selectedAttr.key);
      
      if (!attribute) {
        return `${selectedAttr.key}: ${selectedAttr.value}`;
      }

      // Trova l'opzione usando il codice value (le options hanno { label, value } non { key, value })
      const option = attribute.options?.find(opt => opt.value === selectedAttr.value);
      
      const attributeName = attribute.name || selectedAttr.key;
      const optionName = option?.label || selectedAttr.value;  // usa 'label' non 'value'
      
      return `${attributeName}: ${optionName}`;
    });

    return translatedVariants.join(', ');
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
    // Determina quale venditore stiamo visualizzando
    const currentVendorId = (user.role === 'admin' && sellerId) ? sellerId : user._id;
    
    return order.items
      .filter(item => {
        const itemSellerId = item.seller?._id || item.seller;
        return itemSellerId && currentVendorId && itemSellerId.toString() === currentVendorId.toString();
      })
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ color: '#004b75' }}>📊 Dashboard Venditore</h2>
        <div className="d-flex align-items-center gap-3">
          {/* Badge Notifiche */}
          <div className="position-relative">
            <Button 
              variant="outline-secondary" 
              onClick={() => setShowNotifications(!showNotifications)}
              className="position-relative"
            >
              <i className="bi bi-bell fs-5"></i>
              {unreadCount > 0 && (
                <Badge 
                  bg="danger" 
                  pill 
                  className="position-absolute top-0 start-100 translate-middle"
                  style={{ fontSize: '0.7rem' }}
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
            
            {/* Dropdown notifiche */}
            {showNotifications && (
              <Card 
                className="position-absolute mt-2 shadow-lg" 
                style={{ 
                  right: 'unset',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 'min(350px, calc(100vw - 2rem))',
                  maxHeight: '400px', 
                  overflowY: 'auto',
                  zIndex: 1000 
                }}
              >
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <strong>Notifiche</strong>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => setShowNotifications(false)}
                    className="text-decoration-none"
                  >
                    ✕
                  </Button>
                </Card.Header>
                <Card.Body className="p-0">
                  {notifications.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <i className="bi bi-bell-slash fs-1 d-block mb-2"></i>
                      Nessuna notifica
                    </div>
                  ) : (
                    <div>
                      {notifications.map((notif) => (
                        <div 
                          key={notif._id}
                          className={`p-3 border-bottom ${!notif.read ? 'bg-light' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleMarkAsRead(notif._id)}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <p className="mb-1 small">
                                {notif.type === 'payment_received' && '💰 '}
                                {notif.message}
                              </p>
                              <small className="text-muted">
                                {new Date(notif.createdAt).toLocaleString('it-IT', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </small>
                            </div>
                            {!notif.read && (
                              <Badge bg="primary" pill className="ms-2">
                                Nuovo
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}
          </div>
          
          <Button 
            variant="outline-primary" 
            onClick={() => navigate(user.role === 'admin' && sellerId ? `/vendor/profile?sellerId=${sellerId}` : '/vendor/profile')}
          >
            <i className="bi bi-person-badge me-2"></i>
            Profilo Aziendale
          </Button>
        </div>
      </div>


      {/* Statistiche */}
      {stats && (
        <Row className="mb-4">
          <Col md={3} sm={6} className="mb-3">
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-success">€{earnings ? earnings.totalEarnings.toFixed(2) : stats.totalRevenue.toFixed(2)}</h3>
                <p className="text-muted mb-0">Ricavi totali (Vendita prodotti + spedizione - commissioni Stripe)</p>
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

      {/* Sezione Guadagni */}
      {earnings && stats && (
        <Row className="mb-4 mt-4">
          <Col md={4} sm={6}>
            <Card className="text-center border-success">
              <Card.Body>
                <div className="mb-2">
                  <i className="bi bi-cash-stack fs-2 text-success"></i>
                </div>
                <h3 className="text-success mb-1">€{stats.totalRevenue.toFixed(2)}</h3>
                <p className="text-muted mb-0 small">Ricavi Prodotti (Solo incasso vendita prodotti)</p>
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
                          const guestName = order.guestName?.toLowerCase() || "";
                          const shippingName = order.shippingAddress?.firstName?.toLowerCase() || "";
                          const shippingSurname = order.shippingAddress?.lastName?.toLowerCase() || "";
                          const search = searchTerm.toLowerCase();
                          return (
                            name.includes(search) ||
                            surname.includes(search) ||
                            guestName.includes(search) ||
                            shippingName.includes(search) ||
                            shippingSurname.includes(search) ||
                            (name + " " + surname).includes(search) ||
                            (surname + " " + name).includes(search) ||
                            (shippingName + " " + shippingSurname).includes(search)
                          );
                        })
                        .map((order) => {
                          // Determina il nome del cliente
                          const customerName = order.buyer?.name 
                            || order.guestName 
                            || (order.shippingAddress?.firstName && order.shippingAddress?.lastName 
                                ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`
                                : 'N/A');
                          
                          return (
                            <tr key={order._id}>
                              <td><small>{order._id.slice(-8)}</small></td>
                              <td>{new Date(order.createdAt).toLocaleDateString('it-IT')}</td>
                              <td>{customerName}</td>
                              <td>
                                {order.items
                                  .filter(item => {
                                    // Determina quale venditore stiamo visualizzando
                                    const currentVendorId = (user.role === 'admin' && sellerId) ? sellerId : user._id;
                                    const itemSellerId = item.seller?._id || item.seller;
                                    return itemSellerId && currentVendorId && itemSellerId.toString() === currentVendorId.toString();
                                  })
                                  .map((item, idx) => {
                                    const variantText = getVariantDisplayText(item, item.selectedVariantAttributes);
                                    return (
                                      <div key={idx}>
                                        <small>{item.name}{variantText ? ` (${variantText})` : ''} x{item.quantity}</small>
                                      </div>
                                    );
                                  })}
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
                          );
                        })}
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
                            {Array.isArray(product.variants) && product.variants.length > 0 ? (
                              <div style={{ fontSize: '0.85rem' }}>
                                {product.variants.map((variant, idx) => {
                                  const variantLabel = variant.attributes && variant.attributes.length > 0
                                    ? variant.attributes.map(a => {
                                        const attr = product.customAttributes?.find(ca => ca.key === a.key);
                                        const option = attr?.options?.find(o => o.value === a.value);
                                        return option?.label || a.value;
                                      }).join(' • ')
                                    : `Variante ${idx + 1}`;
                                  const stockColor = variant.stock > 10 ? 'success' : variant.stock > 0 ? 'warning' : 'danger';
                                  return (
                                    <div key={idx} className="mb-1">
                                      <Badge bg={stockColor} className="me-1">
                                        {variant.stock || 0}
                                      </Badge>
                                      <small className="text-muted">{variantLabel}</small>
                                    </div>
                                  );
                                })}
                                <hr className="my-1" />
                                <Badge bg="secondary">
                                  Tot: {product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)}
                                </Badge>
                              </div>
                            ) : (
                              <Badge bg={product.stock > 10 ? 'success' : product.stock > 0 ? 'warning' : 'danger'}>
                                {product.stock || 0}
                              </Badge>
                            )}
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

      {/* Alert Modal per tutti i messaggi */}
      <AlertModal
        show={alertModal.show}
        onHide={() => setAlertModal({ show: false, message: '', type: 'info' })}
        message={alertModal.message}
        type={alertModal.type}
      />
    </Container>
  );
};

export default VendorDashboard;
