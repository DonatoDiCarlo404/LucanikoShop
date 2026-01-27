import { useState } from 'react';
import { Container, Form, Button, Card, Alert, InputGroup, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

const Login = () => {
  const [email, setEmail] = useState(() => localStorage.getItem('rememberedEmail') || '');
  const [password, setPassword] = useState(() => localStorage.getItem('rememberedPassword') || '');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    const saved = localStorage.getItem('rememberMe');
    return saved === 'true';
  });
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSent(false);
    try {
      // Chiamata API per invio email recupero password
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      if (res.ok) {
        setResetSent(true);
      } else {
        const data = await res.json();
        setResetError(data.message || 'Errore invio email');
      }
    } catch (err) {
      setResetError('Errore di rete');
    }
  };

  const handleSubmit = async (e) => {
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('rememberedEmail', email);
      localStorage.setItem('rememberedPassword', password);
    } else {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberedPassword');
    }
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '400px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">Accedi</h2>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Inserisci email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>
          {/* Modale recupero password */}
          <Modal show={showResetModal} onHide={() => setShowResetModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Recupera password</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {resetSent ? (
                <Alert variant="success">Se l'email è registrata, riceverai un link per reimpostare la password.</Alert>
              ) : (
                <Form onSubmit={handlePasswordReset}>
                  <Form.Group className="mb-3" controlId="resetEmail">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Inserisci la tua email"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      required
                    />
                  </Form.Group>
                  {resetError && <Alert variant="danger">{resetError}</Alert>}
                  <Button type="submit" variant="primary" className="w-100">Invia link</Button>
                </Form>
              )}
            </Modal.Body>
          </Modal>

            <Form.Group className="mb-3" controlId="password">
              <Form.Label>Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  placeholder="Inserisci password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button 
                  variant="outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <i className="bi bi-eye-slash-fill"></i> : <i className="bi bi-eye-fill"></i>}
                </Button>
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3" controlId="rememberMe">
              <Form.Check
                type="checkbox"
                label="Ricorda credenziali"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
              />
              <div className="text-end mt-1">
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 btn-forgot-border" 
                  onClick={() => setShowResetModal(true)}
                >
                  Password dimenticata?
                </Button>
              </div>
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100 mb-3" disabled={loading}>
              {loading ? 'Caricamento...' : 'Accedi'}
            </Button>
          </Form>

          <hr />

          <Button variant="outline-danger" className="w-100 mb-3" onClick={handleGoogleLogin}>
            <i className="bi bi-google me-2"></i> Accedi con Google
          </Button>

          <div className="text-center">
            Non hai un account? <Link to="/register">Registrati</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;