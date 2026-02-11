import { useEffect } from 'react';
import { Container, Card, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

/**
 * Pagina di errore per Google OAuth
 * Mostrata quando l'autenticazione Google fallisce
 */
const AuthError = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.error('❌ [AUTH ERROR] Autenticazione Google fallita');
  }, []);

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ maxWidth: '500px', width: '100%' }}>
        <Card.Body className="text-center p-5">
          <div style={{ fontSize: '5rem' }}>⚠️</div>
          <h2 className="mt-3 mb-4" style={{ color: '#dc3545' }}>
            Errore di Autenticazione
          </h2>
          
          <Alert variant="danger">
            <Alert.Heading>Accesso con Google non riuscito</Alert.Heading>
            <p className="mb-0">
              Si è verificato un errore durante l'autenticazione con Google.
              Per favore riprova o contatta l'assistenza se il problema persiste.
            </p>
          </Alert>

          <div className="d-grid gap-2 mt-4">
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => navigate('/login')}
            >
              Torna al Login
            </Button>
            <Button 
              variant="outline-secondary"
              onClick={() => navigate('/')}
            >
              Torna alla Home
            </Button>
          </div>

          <div className="mt-4">
            <p className="text-muted small mb-0">
              <strong>Possibili cause:</strong>
            </p>
            <ul className="text-muted small text-start mt-2">
              <li>Hai annullato l'autorizzazione Google</li>
              <li>Problema di connessione temporaneo</li>
              <li>Account Google non accessibile</li>
            </ul>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AuthError;
