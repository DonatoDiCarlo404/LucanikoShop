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
    <BSNavbar bg="light" variant="light" expand="lg" sticky="top" style={{ zIndex: 1030 }}>
      <Container>
        <BSNavbar.Brand as={Link} to="/">
          <img src="/lucaniko shop 2-01.png" alt="lucaniko shop" className='logonavbar' />
        </BSNavbar.Brand>
        {/* Icona user e carrello sempre visibili, anche su mobile, PRIMA del menu hamburger */}
        <div className="d-lg-none ms-auto d-flex align-items-center">
          {!isAuthenticated && (
            <Nav.Link as={Link} to="/login" className="d-inline-flex align-items-center me-3">
              <span>
                <i className="bi bi-person-circle"></i>
              </span>
            </Nav.Link>
          )}
          <Nav.Link as={Link} to="/cart" className="d-inline-flex align-items-center me-2">
            <span><i className="bi bi-cart"></i></span>
            {cartCount > 0 && (
              <Badge bg="danger" className="ms-2">
                {cartCount}
              </Badge>
            )}
          </Nav.Link>
        </div>
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto w-100 justify-content-lg-start justify-content-end">
            {/* altri link seller/admin qui sotto */}
            {isAuthenticated && user.role === 'seller' && user.isApproved && (
              <>
                <Nav.Link as={Link} to="/vendor/dashboard" className="text-start">
                  <span>
                    <i className="bi bi-graph-up"></i> Dashboard Venditore
                  </span>
                </Nav.Link>
                <Nav.Link as={Link} to="/my-products" className="text-start">
                  <span>
                    <i className="bi bi-bag-check"></i> I miei prodotti
                  </span>
                </Nav.Link>
                <Nav.Link as={Link} to="/products/new" className="text-start">
                  <span>
                    <i className="bi bi-bag-plus"></i> Nuovo prodotto
                  </span>
                </Nav.Link>
                {/* Voci aggiuntive solo mobile hamburger per venditore */}
                <Nav.Link as={Link} to="/vendor/profile" className="d-lg-none text-end w-100">
                  Profilo Aziendale
                </Nav.Link>
                <Nav.Link as={Link} to="/products" className="d-lg-none text-end w-100">
                  Catalogo
                </Nav.Link>
                <Nav.Link as={Link} to="/offers" className="d-lg-none text-end w-100">
                  Offerte e Sconti
                </Nav.Link>
                <Nav.Link as={Link} to="/categories" className="d-lg-none text-end w-100 my-2">
                  Categorie
                </Nav.Link>
                {/* Esci sempre ultimo */}
                <Nav.Link onClick={handleLogout} className="d-lg-none text-end w-100">
                  Esci
                </Nav.Link>
              </>
            )}

            {isAuthenticated && user.role === 'admin' && (
              <>
                <Nav.Link as={Link} to="/vendor/dashboard" className="text-start">
                  <span><i className="bi bi-graph-up"></i> Dashboard Venditore</span>
                </Nav.Link>
                <Nav.Link as={Link} to="/my-products" className="text-start">
                  <span><i className="bi bi-kanban"></i> Gestione prodotti</span>
                  {pendingProductsCount > 0 && (
                    <Badge bg="info" className="ms-2">
                      {pendingProductsCount}
                    </Badge>
                  )}
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/dashboard" className="text-start">
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

          <Nav className="ms-auto align-items-center justify-content-end" style={{ minWidth: 400 }}>
            <Nav.Link as={Link} to="/cart" className="d-none d-lg-inline-flex align-items-center">
              <span><i className="bi bi-cart"></i></span>
              {cartCount > 0 && (
                <Badge bg="danger" className="ms-2">
                  {cartCount}
                </Badge>
              )}
            </Nav.Link>
            <Nav.Link as={Link} to="/products" className="d-none d-lg-inline">
              Catalogo
            </Nav.Link>
            <Nav.Link as={Link} to="/offers" className="d-none d-lg-inline">
              Offerte
            </Nav.Link>
            <Nav.Link as={Link} to="/categories" className="d-none d-lg-inline">
              Categorie
            </Nav.Link>
            {isAuthenticated ? (
              <NavDropdown
                title={
                  <span className="d-none d-lg-inline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
                    Ciao, {user.role === 'buyer' && user.name ? user.name.split(' ')[0] : user.name} <Badge bg="secondary" style={{ marginLeft: '0.15rem' }}>{user.role}</Badge>
                  </span>
                }
                id="user-dropdown"
                align="end"
                className="d-none d-lg-inline"
              >
                {(user.role === 'seller') && (
                  <>
                    <NavDropdown.Item onClick={() => navigate('/vendor/profile')}>
                      <span><i className="bi bi-person-badge me-2"></i> Profilo Aziendale</span>
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                  </>
                )}
                {(user.role === 'buyer' || user.role === 'user' || user.role === 'acquirente') && (
                  <>
                    <NavDropdown.Item onClick={() => navigate('/profile')}>
                      <span><i className="bi bi-person me-2"></i> Profilo</span>
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                  </>
                )}
                <NavDropdown.Item onClick={handleLogout}>
                  <span><i className="bi bi-power me-2"></i> Esci</span>
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <div className="d-none d-lg-block" style={{ padding: 0, margin: 0, minWidth: 0 }}>
                <Link to="/login" style={{ display: 'inline-block', padding: 0, margin: 0, minWidth: 0, lineHeight: 1, color: '#6c757d', marginLeft: '1.2rem' }}>
                  <i className="bi bi-person-circle" style={{ fontSize: '1.7rem', verticalAlign: 'middle', display: 'block', margin: 0, padding: 0, color: '#6c757d' }}></i>
                </Link>
              </div>
            )}
            {/* Mobile hamburger: solo link pubblici per utenti non autenticati */}
            {!isAuthenticated && (
              <Nav className="d-lg-none w-100 text-center">
                <Nav.Link as={Link} to="/products" className="d-lg-none text-end w-100">
                  Catalogo
                </Nav.Link>
                <Nav.Link as={Link} to="/offers" className="d-lg-none text-end w-100">
                  Offerte e Sconti
                </Nav.Link>
                <Nav.Link as={Link} to="/categories" className="d-lg-none text-end w-100">
                  Categorie
                </Nav.Link>
                <Nav.Link as={Link} to="/login" className="d-lg-none text-end w-100">
                  Accedi / Registrati
                </Nav.Link>
              </Nav>
            )}
            {/* Mobile hamburger: link per acquirente loggato */}
            {isAuthenticated && (user.role === 'buyer' || user.role === 'user' || user.role === 'acquirente') && (
              <Nav className="d-lg-none w-100 text-center">
                <Nav.Link as={Link} to="/products" className="d-lg-none text-end w-100">
                  Catalogo
                </Nav.Link>
                <Nav.Link as={Link} to="/offers" className="d-lg-none text-end w-100">
                  Offerte e Sconti
                </Nav.Link>
                <Nav.Link as={Link} to="/categories" className="d-lg-none text-end w-100">
                  Categorie
                </Nav.Link>
                <Nav.Link onClick={handleLogout} className="d-lg-none text-end w-100">
                  Esci
                </Nav.Link>
              </Nav>
            )}
        </Nav>
      </BSNavbar.Collapse>
    </Container>
    </BSNavbar >
  );
};

export default Navbar;
