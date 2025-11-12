import { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { orderAPI } from '../services/api';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await orderAPI.getMyOrders(user.token);
        setOrders(data);
      } catch (err) {
        setError(err.message || 'Errore nel caricamento degli ordini');
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchOrders();
    }
  }, [user]);

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
        <p className="mt-3">Caricamento ordini...</p>
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

  if (orders.length === 0) {
    return (
      <Container className="py-5">
        <Card className="text-center p-5">
          <Card.Body>
            <div style={{ fontSize: '5rem' }}>📦</div>
            <h3 className="mt-3">Nessun ordine trovato</h3>
            <p className="text-muted">Non hai ancora effettuato ordini.</p>
            <Button variant="primary" onClick={() => navigate('/products')}>
              Vai al Catalogo
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="mb-4">I Miei Ordini</h2>
      
      <Card>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>ID Ordine</th>
                <th>Data</th>
                <th>Prodotti</th>
                <th>Totale</th>
                <th>Stato</th>
                <th>Pagamento</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <code>#{order._id.slice(-8)}</code>
                  </td>
                  <td>
                    {new Date(order.createdAt).toLocaleDateString('it-IT')}
                  </td>
                  <td>{order.items.length} prodotto/i</td>
                  <td>
                    <strong>€{order.totalPrice.toFixed(2)}</strong>
                  </td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td>
                    {order.isPaid ? (
                      <Badge bg="success">Pagato</Badge>
                    ) : (
                      <Badge bg="warning">Non Pagato</Badge>
                    )}
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => navigate(`/orders/${order._id}`)}
                    >
                      Dettagli
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default OrderHistory;