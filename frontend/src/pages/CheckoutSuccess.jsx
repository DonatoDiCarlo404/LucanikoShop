import { Container, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart, removeCoupon } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderCreated, setOrderCreated] = useState(false);

  useEffect(() => {
    const processOrder = async () => {
      if (!sessionId) {
        setError('Session ID mancante');
        setLoading(false);
        return;
      }

      console.log('🔄 [CHECKOUT SUCCESS] Verifica e creazione ordine...');
      console.log('🔄 [CHECKOUT SUCCESS] Session ID:', sessionId);

      try {
        // Chiama l'endpoint di success per creare l'ordine
        const response = await fetch(`${API_URL}/checkout/success?session_id=${sessionId}`);
        const data = await response.json();

        console.log('🔄 [CHECKOUT SUCCESS] Risposta:', data);

        if (data.success) {
          setOrderCreated(true);
          // Pulisci carrello solo se l'ordine è stato creato
          clearCart();
          removeCoupon();
          localStorage.removeItem('cart_guest');
          console.log('✅ [CHECKOUT SUCCESS] Ordine creato:', data.order._id);
        } else {
          setError(data.message || 'Errore nella creazione dell\'ordine');
        }
      } catch (err) {
        console.error('❌ [CHECKOUT SUCCESS] Errore:', err);
        setError('Errore nella verifica del pagamento');
      } finally {
        setLoading(false);
      }
    };

    processOrder();
  }, [sessionId]);

  if (loading) {
    return (
      <Container className="py-5">
        <Card className="text-center p-5">
          <Card.Body>
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Sto processando il tuo ordine...</p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Card className="text-center p-5">
          <Card.Body>
            <Alert variant="warning">
              <Alert.Heading>⚠️ Attenzione</Alert.Heading>
              <p>{error}</p>
              <p className="small">Il pagamento è stato completato ma c'è stato un problema nella creazione dell'ordine. Contatta il supporto.</p>
            </Alert>
            <Button variant="primary" onClick={() => navigate('/')}>
              Torna alla Home
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Card className="text-center p-5">
        <Card.Body>
          <div style={{ fontSize: '5rem', color: '#28a745' }}>✓</div>
          <h2 className="mt-3 text-success">Pagamento Completato!</h2>
          <p className="text-muted mt-3">
            Il tuo ordine è stato confermato con successo.
          </p>
          {sessionId && (
            <p className="small text-muted">
              ID Sessione: <code>{sessionId}</code>
            </p>
          )}
          <div className="d-grid gap-2 mt-4" style={{ maxWidth: '300px', margin: '0 auto' }}>
            <Button variant="primary" onClick={() => navigate('/products')}>
              Torna al Catalogo
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate('/')}>
              Vai alla Home
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CheckoutSuccess;
