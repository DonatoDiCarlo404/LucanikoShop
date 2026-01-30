import { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Table, Badge, Button, Alert, Spinner, ListGroup } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { orderAPI } from '../services/api';

const OrderDetail = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await orderAPI.getOrderById(id, user.token);
        setOrder(data);
      } catch (err) {
        setError(err.message || 'Errore nel caricamento dell\'ordine');
      } finally {
        setLoading(false);
      }
    };

    if (user?.token && id) {
      fetchOrder();
    }
  }, [id, user]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'warning', text: 'In Attesa' },
      processing: { bg: 'info', text: 'In Elaborazione' },
      shipped: { bg: 'primary', text: 'Spedito' },
      delivered: { bg: 'success', text: 'Consegnato' },
      cancelled: { bg: 'danger', text: 'Annullato' },
    };
    const config = statusConfig[status] || { bg: 'secondary', text: status };
    return <Badge bg={config.bg}>{config.text}</Badge>;
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-3">Caricamento dettagli ordine...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={() => navigate('/orders')}>
          Torna agli ordini
        </Button>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-5">
        <Alert variant="warning">Ordine non trovato</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <Button variant="outline-secondary" onClick={() => navigate('/orders')}>
          ← Torna agli ordini
        </Button>
        <div className="d-flex gap-2">
          <Button variant="primary" onClick={() => navigate(`/orders/${id}/tracking`)}>
            <i className="bi bi-truck"></i> Traccia Spedizione
          </Button>
          <Button variant="outline-primary" onClick={() => navigate('/profile')}>
            <i className="bi bi-person"></i> Torna al Profilo
          </Button>
        </div>
      </div>

      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0" style={{ color: '#004b75', fontWeight: 700 }}>Ordine #{order._id.slice(-8)}</h5>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Data ordine:</strong>
                  <p>{new Date(order.createdAt).toLocaleString('it-IT')}</p>
                </Col>
                <Col md={6}>
                  <strong>Stato:</strong>
                  <p>{getStatusBadge(order.status)}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0" style={{ color: '#004b75', fontWeight: 700 }}>Prodotti</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Prodotto</th>
                    <th>Quantità</th>
                    <th>Prezzo</th>
                    <th>Totale</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div className="d-flex align-items-center">
                          {item.product?.images && item.product.images.length > 0 && (
                            <img
                              src={item.product.images[0].url}
                              alt={item.name}
                              style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '10px', borderRadius: '4px' }}
                            />
                          )}
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td>{item.quantity}</td>
                      <td>€{item.price.toFixed(2)}</td>
                      <td><strong>€{(item.price * item.quantity).toFixed(2)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0" style={{ color: '#004b75', fontWeight: 700 }}>Riepilogo</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between">
                  <span>Prodotti:</span>
                  <span>€{order.itemsPrice.toFixed(2)}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <span>Spedizione:</span>
                  <span>€{order.shippingPrice.toFixed(2)}</span>
                </ListGroup.Item>
                {order.discountAmount > 0 && (
                  <ListGroup.Item className="d-flex justify-content-between text-success">
                    <span>Sconto:</span>
                    <span>-€{order.discountAmount.toFixed(2)}</span>
                  </ListGroup.Item>
                )}
                <ListGroup.Item className="d-flex justify-content-between">
                  <span className="text-muted"><small>Tasse (IVA inclusa):</small></span>
                  <span className="text-muted"><small>€{order.taxPrice.toFixed(2)}</small></span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>Totale:</strong>
                  <strong className="text-primary">€{order.totalPrice.toFixed(2)}</strong>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0" style={{ color: '#004b75', fontWeight: 700 }}>Indirizzo di Spedizione</h5>
            </Card.Header>
            <Card.Body>
              <p className="mb-1">{order.shippingAddress.street}</p>
              <p className="mb-1">{order.shippingAddress.city}, {order.shippingAddress.state}</p>
              <p className="mb-1">{order.shippingAddress.zipCode}</p>
              <p className="mb-1">{order.shippingAddress.country}</p>
              <p className="mb-0"><strong>Tel:</strong> {order.shippingAddress.phone}</p>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h5 className="mb-0" style={{ color: '#004b75', fontWeight: 700 }}>Pagamento</h5>
            </Card.Header>
            <Card.Body>
              <p><strong>Metodo:</strong> {order.paymentMethod.toUpperCase()}</p>
              <p>
                <strong>Stato:</strong>{' '}
                {order.isPaid ? (
                  <Badge bg="success">Pagato</Badge>
                ) : (
                  <Badge bg="warning">Non Pagato</Badge>
                )}
              </p>
              {order.isPaid && order.paidAt && (
                <p className="mb-0">
                  <small>Pagato il: {new Date(order.paidAt).toLocaleString('it-IT')}</small>
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderDetail;
