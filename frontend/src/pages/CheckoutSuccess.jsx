import { Container, Card, Button } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useCart } from '../context/CartContext';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart, removeCoupon } = useCart();

  useEffect(() => {
    clearCart();
    removeCoupon();
    // Svuota anche il localStorage guest (fallback)
    localStorage.removeItem('cart_guest');
  }, []);

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