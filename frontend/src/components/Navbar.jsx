import { useState, useEffect } from 'react';
import { Navbar as BSNavbar, Nav, Container, Badge, Button, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { adminAPI } from '../services/api';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingProductsCount, setPendingProductsCount] = useState(0);

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadPendingCount();
      loadPendingProductsCount();

      // Refresh ogni 30 secondi
      const interval = setInterval(() => {
        loadPendingCount();
        loadPendingProductsCount();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadPendingCount = async () => {
    try {
      const data = await adminAPI.getPendingSellers(user.token);
      setPendingCount(data.count);
    } catch (err) {
      console.error('Errore caricamento venditori pendenti:', err);
    }
  };

  const loadPendingProductsCount = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/products/pending/count', {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingProductsCount(data.count);
      }
    } catch (err) {
      console.error('Errore caricamento prodotti pendenti:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <BSNavbar bg="light" variant="light" expand="lg" sticky="top">
      <Container>
        <BSNavbar.Brand as={Link} to="/">
          <img src="/lucaniko shop 2-01.png" alt="lucaniko shop" className='logonavbar' />
        </BSNavbar.Brand>
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/products">
              <span><i className="bi bi-journal-arrow-up">  Catalogo</i></span>
            </Nav.Link>
            <Nav.Link as={Link} to="/cart">
              <span><i className="bi bi-cart"> Carrello</i></span>
              {cartCount > 0 && (
                <Badge bg="danger" className="ms-2">
                  {cartCount}
                </Badge>
              )}
            </Nav.Link>
            {isAuthenticated && user.role === 'seller' && user.isApproved && (
              <>
                <Nav.Link as={Link} to="/vendor/dashboard">
                  <span><i className="bi bi-graph-up"></i> Dashboard Venditore</span>
                </Nav.Link>
                <Nav.Link as={Link} to="/my-products">
                  I miei prodotti
                </Nav.Link>
                <Nav.Link as={Link} to="/products/new">
                  Nuovo prodotto
                </Nav.Link>
              </>
            )}

            {isAuthenticated && user.role === 'admin' && (
              <>
                <Nav.Link as={Link} to="/vendor/dashboard">
                  <span><i className="bi bi-graph-up"></i> Dashboard Venditore</span>
                </Nav.Link>
                <Nav.Link as={Link} to="/my-products">
                  <span><i className="bi bi-kanban"></i> Gestione prodotti</span>
                  {pendingProductsCount > 0 && (
                    <Badge bg="info" className="ms-2">
                      {pendingProductsCount}
                    </Badge>
                  )}
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/dashboard">
                  <span><i className="bi bi-shield-lock"></i> Dashboard Admin</span>
                  {pendingCount > 0 && (
                    <Badge bg="warning" className="ms-2">
                      {pendingCount}
                    </Badge>
                  )}
                </Nav.Link>
              </>
            )}
          </Nav>

          <Nav>
            {isAuthenticated ? (
              <NavDropdown
                title={
                  <>
                    Ciao, {user.name} <Badge bg="secondary">{user.role}</Badge>
                  </>
                }
                id="user-dropdown"
                align="end"
              >
                {(user.role === 'seller' || user.role === 'admin') && (
                  <>
                    <NavDropdown.Item onClick={() => navigate('/vendor/profile')}>
                      <span><i className="bi bi-person-badge me-2"></i> Profilo Aziendale</span>
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                  </>
                )}
                <NavDropdown.Item onClick={() => navigate('/orders')}>
                  <span><i className="bi bi-list-ul me-2"></i> I Miei Ordini</span>
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  <span><i className="bi bi-power me-2"></i> Logout</span>
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">
                  Login
                </Nav.Link>
                <Nav.Link as={Link} to="/register">
                  Registrati
                </Nav.Link>
              </>
            )}
        </Nav>
      </BSNavbar.Collapse>
    </Container>
    </BSNavbar >
  );
};

export default Navbar;
