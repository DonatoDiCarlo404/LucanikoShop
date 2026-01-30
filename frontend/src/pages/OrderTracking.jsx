import { useState, useEffect } from 'react';
import { API_URL } from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Row, Col, Badge, Button, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { useAuth } from '../context/authContext';

const OrderTracking = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Errore nel recupero dell\'ordine');
      }

      const data = await response.json();
      setOrder(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { variant: 'secondary', text: 'In Attesa' },
      processing: { variant: 'info', text: 'In Preparazione' },
      shipped: { variant: 'custom-shipped', text: 'Spedito' },
      delivered: { variant: 'success', text: 'Consegnato' },
      cancelled: { variant: 'danger', text: 'Cancellato' }
    };
    return badges[status] || badges.pending;
  };

  const getStatusProgress = (status) => {
    const progress = {
      pending: 25,
      processing: 50,
      shipped: 75,
      delivered: 100,
      cancelled: 0
    };
    return progress[status] || 0;
  };

  const getTrackingUrl = (carrier, trackingNumber) => {
    const carriers = {
      'DHL': `https://www.dhl.com/it-it/home/tracking.html?tracking-id=${trackingNumber}`,
      'FedEx': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
      'Poste Italiane': `https://www.poste.it/cerca/index.html#/risultati-spedizioni/${trackingNumber}`,
      'BRT': `https://vas.brt.it/vas/sped_det_show.hsm?referer=sped_numspe_par.htm&Nspediz=${trackingNumber}`,
      'GLS': `https://gls-group.eu/IT/it/ricerca-pacchi?match=${trackingNumber}`
    };
    return carriers[carrier] || null;
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Caricamento tracking...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Button onClick={() => navigate('/orders')}>Torna agli ordini</Button>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-5">
        <Alert variant="warning">Ordine non trovato</Alert>
        <Button onClick={() => navigate('/orders')}>Torna agli ordini</Button>
      </Container>
    );
  }

  const statusBadge = getStatusBadge(order.status);
  const progress = getStatusProgress(order.status);
  const trackingUrl = order.trackingInfo?.carrier && order.trackingInfo?.trackingNumber
    ? getTrackingUrl(order.trackingInfo.carrier, order.trackingInfo.trackingNumber)
    : null;

  return (
    <Container className="py-5">
      <Button variant="outline-secondary" className="mb-4" onClick={() => navigate('/orders')}>
        <i className="bi bi-arrow-left"></i> Torna agli ordini
      </Button>

      <h2 className="mb-4" style={{ color: '#004b75', fontWeight: 700 }}>
        <i className="bi bi-truck"></i> Tracking Ordine #{order._id.slice(-6).toUpperCase()}
      </h2>

      {/* Stato ordine */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={8}>
              <h5 style={{ color: '#004b75', fontWeight: 700 }}>Stato Spedizione</h5>
              {statusBadge.text === 'Spedito' ? (
                <Badge style={{ backgroundColor: '#004b75', color: '#fff' }} className="fs-6 mb-3">
                  {statusBadge.text}
                </Badge>
              ) : (
                <Badge bg={statusBadge.variant} className="fs-6 mb-3">
                  {statusBadge.text}
                </Badge>
              )}
              <ProgressBar
                now={progress}
                variant={statusBadge.text === 'Spedito' ? undefined : statusBadge.variant}
                label={`${progress}%`}
                style={statusBadge.text === 'Spedito' ? { height: '25px', backgroundColor: '#cce0ef' } : { height: '25px' }}
                animated={statusBadge.text === 'Spedito'}
                striped={statusBadge.text === 'Spedito'}
                className={statusBadge.text === 'Spedito' ? 'custom-shipped-bar' : ''}
                // Per "Spedito" la barra sarà blu matrice
                // Per altri status, colore di default
              />
            </Col>
            <Col md={4} className="text-center">
              <i className={`bi bi-box-seam display-3 text-${statusBadge.variant}`}></i>
            </Col>
          </Row>

          {/* Timeline stati */}
          <div className="mt-4">
            <h6 className="text-muted">Fasi della spedizione:</h6>
            <div className="d-flex justify-content-between text-center mt-3">
              <div className={order.status !== 'cancelled' ? 'text-success' : 'text-muted'}>
                <i className={`bi bi-check-circle${order.status !== 'cancelled' ? '-fill' : ''} fs-4`}></i>
                <p className="small mb-0">Ordine ricevuto</p>
              </div>
              <div className={['processing', 'shipped', 'delivered'].includes(order.status) ? 'text-success' : 'text-muted'}>
                <i className={`bi bi-check-circle${['processing', 'shipped', 'delivered'].includes(order.status) ? '-fill' : ''} fs-4`}></i>
                <p className="small mb-0">In preparazione</p>
              </div>
              <div className={['shipped', 'delivered'].includes(order.status) ? 'text-success' : 'text-muted'}>
                <i className={`bi bi-check-circle${['shipped', 'delivered'].includes(order.status) ? '-fill' : ''} fs-4`}></i>
                <p className="small mb-0">Spedito</p>
              </div>
              <div className={order.status === 'delivered' ? 'text-success' : 'text-muted'}>
                <i className={`bi bi-check-circle${order.status === 'delivered' ? '-fill' : ''} fs-4`}></i>
                <p className="small mb-0">Consegnato</p>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Info tracking */}
      {order.trackingInfo && (order.trackingInfo.trackingNumber || order.trackingInfo.carrier) && (
        <Card className="mb-4">
          <Card.Body>
            <h5 style={{ color: '#004b75', fontWeight: 700 }}><i className="bi bi-info-circle"></i> Informazioni Spedizione</h5>
            <Row className="mt-3">
              {order.trackingInfo.carrier && (
                <Col md={6}>
                  <p className="mb-2"><strong>Corriere:</strong></p>
                  <p className="text-muted">{order.trackingInfo.carrier}</p>
                </Col>
              )}
              {order.trackingInfo.trackingNumber && (
                <Col md={6}>
                  <p className="mb-2"><strong>Numero di Tracking:</strong></p>
                  <p className="text-muted font-monospace">{order.trackingInfo.trackingNumber}</p>
                </Col>
              )}
            </Row>
            {order.trackingInfo.updatedAt && (
              <p className="text-muted small mt-3 mb-0">
                <i className="bi bi-clock"></i> Ultimo aggiornamento: {new Date(order.trackingInfo.updatedAt).toLocaleString('it-IT')}
              </p>
            )}

            {trackingUrl && (
              <div className="mt-3">
                <Button 
                  variant="primary" 
                  href={trackingUrl} 
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-box-arrow-up-right"></i> Traccia su {order.trackingInfo.carrier}
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Indirizzo di spedizione */}
      <Card className="mb-4">
        <Card.Body>
          <h5 style={{ color: '#004b75', fontWeight: 700 }}><i className="bi bi-geo-alt"></i> Indirizzo di Spedizione</h5>
          <address className="mt-3">
            {order.shippingAddress.street}<br />
            {order.shippingAddress.zipCode} {order.shippingAddress.city}, {order.shippingAddress.state}<br />
            {order.shippingAddress.country}<br />
            <strong>Tel:</strong> {order.shippingAddress.phone}
          </address>
        </Card.Body>
      </Card>

      {/* Prodotti nell'ordine */}
      <Card>
        <Card.Body>
          <h5 style={{ color: '#004b75', fontWeight: 700 }}><i className="bi bi-cart"></i> Prodotti Ordinati</h5>
          {order.items.map((item, index) => (
            <div key={index} className="d-flex align-items-center border-bottom py-3">
              {item.product?.images?.[0]?.url && (
                <img
                  src={item.product.images[0].url}
                  alt={item.name}
                  style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                  className="me-3 rounded"
                />
              )}
              <div className="flex-grow-1">
                <h6 className="mb-1">{item.name}</h6>
                <p className="text-muted small mb-0">Quantità: {item.quantity}</p>
              </div>
              <div className="text-end">
                <strong>€{(item.price * item.quantity).toFixed(2)}</strong>
              </div>
            </div>
          ))}
          <div className="text-end mt-3">
            <h5>Totale: €{order.totalPrice.toFixed(2)}</h5>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default OrderTracking;
