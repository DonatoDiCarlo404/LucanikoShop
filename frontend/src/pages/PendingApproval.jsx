import { Container, Card, Alert, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

const PendingApproval = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Container className="py-5">
      <Card className="text-center shadow">
        <Card.Body className="p-5">
          <div style={{ fontSize: '4rem' }}>⏳</div>
          <h2 className="mt-4 mb-3">Account in Attesa di Approvazione</h2>
          
          <Alert variant="warning">
            <Alert.Heading>Il tuo account venditore è in fase di verifica</Alert.Heading>
            <p>
              Ciao <strong>{user?.name}</strong>, grazie per esserti registrato come venditore su LucanikoShop!
            </p>
            <hr />
            <p className="mb-0">
              Il nostro team sta verificando i tuoi dati aziendali. 
              Riceverai una notifica via email non appena il tuo account sarà approvato.
            </p>
          </Alert>

          <Card className="mt-4 bg-light">
            <Card.Body>
              <h5>📋 Dati inviati:</h5>
              <ul className="list-unstyled text-start">
                <li><strong>Nome:</strong> {user?.name}</li>
                <li><strong>Email:</strong> {user?.email}</li>
                {user?.businessName && <li><strong>Azienda:</strong> {user.businessName}</li>}
                {user?.vatNumber && <li><strong>P.IVA:</strong> {user.vatNumber}</li>}
              </ul>
            </Card.Body>
          </Card>

          <div className="mt-4">
            <p className="text-muted">
              Nel frattempo puoi esplorare il catalogo prodotti!
            </p>
            <Button variant="primary" onClick={() => navigate('/products')} className="me-2">
              Vai al Catalogo
            </Button>
            <Button variant="outline-secondary" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PendingApproval;
