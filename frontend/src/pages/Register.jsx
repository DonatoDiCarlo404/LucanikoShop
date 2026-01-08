import { useState } from 'react';
import { Container, Form, Button, Card, Alert, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [businessName, setBusinessName] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [uniqueCode, setUniqueCode] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  function isPasswordStrong(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Le password non coincidono');
    }

    if (!isPasswordStrong(password)) {
      return setError('La password deve essere di almeno 8 caratteri e contenere almeno una maiuscola, una minuscola, un numero e un simbolo.');
    }

    setLoading(true);

    const result = await register(name, email, password, role, businessName, vatNumber);

    if (result.success) {
      // Se è un seller, vai alla pagina pending approval
      if (role === 'seller') {
        navigate('/pending-approval');
      } else {
        // Se è un buyer, vai alla home
        navigate('/');
      }
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '400px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">Registrati</h2>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="name">
              <Form.Label>Nome e Cognome</Form.Label>
              <Form.Control
                type="text"
                placeholder="Inserisci nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="businessName">
              <Form.Label>Numero di Telefono</Form.Label>
              <Form.Control
                type="text"
                placeholder="Es: +39 123 456 7890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </Form.Group>

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

            <Form.Group className="mb-3" controlId="password">
              <Form.Label>Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  placeholder="Inserisci password (min 6 caratteri)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Form.Text className="text-muted">
                  La password deve essere di almeno 8 caratteri e contenere almeno una maiuscola, una minuscola, un numero e un simbolo.
                </Form.Text>
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <i className="bi bi-eye-slash-fill"></i> : <i className="bi bi-eye-fill"></i>}
                </Button>
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3" controlId="confirmPassword">
              <Form.Label>Conferma Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Conferma password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <i className="bi bi-eye-slash-fill"></i> : <i className="bi bi-eye-fill"></i>}
                </Button>
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3" controlId="role">
              <Form.Label>Tipo di account</Form.Label>
              <Form.Select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="buyer">Acquirente</option>
                <option value="seller">Venditore</option>
              </Form.Select>
            </Form.Group>

            {/* Campi extra per venditori */}
            {role === 'seller' && (
              <>
                <Alert variant="info" className="small">
                  <strong>ℹ️ Info Venditore:</strong> Questi campi sono obbligatori per l'approvazione come Venditore.
                </Alert>

                <Form.Group className="mb-3" controlId="businessName">
                  <Form.Label>Ragione Sociale</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Es: La Bottega del Gusto"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="vatNumber">
                  <Form.Label>Partita IVA</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Es: 12345678901"
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    maxLength={11}
                  />
                  <Form.Text className="text-muted">
                    11 cifre per P.IVA italiana
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3" controlId="businessName">
                  <Form.Label>Indirizzo</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Es: via Roma 10, Milano"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="businessName">
                  <Form.Label>Codice Univoco</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Es: M5UXCR1"
                    value={uniqueCode}
                    onChange={(e) => setUniqueCode(e.target.value)}
                  />
                </Form.Group>
              </>
            )}

            <Button variant="primary" type="submit" className="w-100 mb-3" disabled={loading}>
              {loading ? 'Caricamento...' : 'Registrati'}
            </Button>
          </Form>

          <div className="text-center">
            Hai già un account? <Link to="/login">Accedi</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Register;