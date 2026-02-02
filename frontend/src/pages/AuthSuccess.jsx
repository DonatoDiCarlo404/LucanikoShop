import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';
import { authAPI } from '../services/api';

const AuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleGoogleAuth = async () => {
      const token = searchParams.get('token');

      if (token) {
        try {
          // Salva il token
          localStorage.setItem('token', token);
          
          // Ottieni i dati dell'utente
          const userData = await authAPI.getProfile(token);
          
          // Se l'utente è admin, imposta il bypass per la manutenzione
          if (userData.role === 'admin') {
            sessionStorage.setItem('maintenance_bypass', 'true');
          }
          
          // Aspetta un momento per assicurarsi che sessionStorage sia sincronizzato
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Ricarica la pagina per aggiornare l'AuthContext
          window.location.href = '/';
        } catch (error) {
          console.error('Errore durante l\'autenticazione:', error);
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
    };

    handleGoogleAuth();
  }, [searchParams, navigate]);

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="text-center">
        <Spinner animation="border" role="status" className="mb-3" />
        <p>Autenticazione in corso...</p>
      </div>
    </Container>
  );
};

export default AuthSuccess;
