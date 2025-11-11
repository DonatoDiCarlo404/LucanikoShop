import { Container, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const CheckoutCancel = () => {
  const navigate = useNavigate();

  return (
    <Container className="py-5">
      <Card className="text-center p-5">
        <Card.Body>
          <div style={{ fontSize: '5rem', color: '#ffc107' }}>⚠️</div>
          <h2 className="mt-3 text-warning">Pagamento Annullato</h2>
          <p className="text-muted mt-3">
            Il pagamento è stato annullato. Il tuo carrello è ancora disponibile.
          </p>
          <div className="d-grid gap-2 mt-4" style={{ maxWidth: '300px', margin: '0 auto' }}>
            <Button variant="primary" onClick={() => navigate('/cart')}>
              Torna al Carrello
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate('/products')}>
              Continua lo Shopping
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CheckoutCancel;