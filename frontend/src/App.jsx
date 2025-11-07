import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/authContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import AuthSuccess from './pages/AuthSuccess';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import MyProducts from './pages/MyProducts';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/success" element={<AuthSuccess />} />
          
          {/* Prodotti pubblici */}
          <Route path="/products" element={<Products />} />
          
          {/* Prodotti protetti (solo seller/admin) */}
          <Route
            path="/my-products"
            element={
              <ProtectedRoute allowedRoles={['seller', 'admin']}>
                <MyProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/new"
            element={
              <ProtectedRoute allowedRoles={['seller', 'admin']}>
                <ProductForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['seller', 'admin']}>
                <ProductForm />
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;