import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { Container, Spinner } from 'react-bootstrap';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Caricamento...</p>
      </Container>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Controlla se il seller non è approvato
  if (user.role === 'seller' && !user.isApproved) {
    return <Navigate to="/pending-approval" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <Container className="py-5">
        <div className="alert alert-danger">
          <h4>Accesso Negato</h4>
          <p>Non hai i permessi per accedere a questa pagina.</p>
          <p>Ruolo richiesto: {allowedRoles.join(' o ')}</p>
          <p>Il tuo ruolo: {user.role}</p>
        </div>
      </Container>
    );
  }

  return children;
};

export default ProtectedRoute;
