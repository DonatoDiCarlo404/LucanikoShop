import { Container, Button } from 'react-bootstrap';
import { useAuth } from '../context/authContext';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Container className="mt-5">
      <h1>Benvenuto su LucanikoShop! 🛍️</h1>
      
      {isAuthenticated ? (
        <div className="mt-4">
          <h3>Ciao, {user.name}! 👋</h3>
          <p>Email: {user.email}</p>
          <p>Ruolo: <strong>{user.role}</strong></p>
          
          <Button variant="danger" onClick={handleLogout} className="mt-3">
            Logout
          </Button>
        </div>
      ) : (
        <div className="mt-4">
          <p>Non sei autenticato.</p>
          <Button variant="primary" onClick={() => navigate('/login')} className="me-2">
            Login
          </Button>
          <Button variant="success" onClick={() => navigate('/register')}>
            Registrati
          </Button>
        </div>
      )}
    </Container>
  );
};

export default Home;