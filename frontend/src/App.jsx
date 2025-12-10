import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/authContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import AuthSuccess from './pages/AuthSuccess';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import ProductForm from './pages/ProductForm';
import MyProducts from './pages/MyProducts';
import AdminDashboard from './pages/AdminDashboard';
import PendingApproval from './pages/PendingApproval';
import { CartProvider } from './context/CartContext';
import Cart from './pages/Cart';
import CheckoutSuccess from './pages/CheckoutSuccess';
import CheckoutCancel from './pages/CheckoutCancel';
import OrderHistory from './pages/OrderHistory';
import OrderDetail from './pages/OrderDetail';
import VendorDashboard from './pages/VendorDashboard';
import Footer from './components/Footer';
import Error from './pages/Error';
import SplashScreen from './components/SplashScreen';
import { useState, useEffect } from 'react';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000); 
    return () => clearTimeout(timer);
  }, []);

  return showSplash ? <SplashScreen /> : (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Products />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/success" element={<AuthSuccess />} />
            <Route path="/pending-approval" element={<PendingApproval />} />

            {/* Prodotti pubblici */}
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            <Route path="/checkout/cancel" element={<CheckoutCancel />} />

            {/* Prodotti protetti (solo seller/admin) */}
            <Route path="/my-products" element={<ProtectedRoute allowedRoles={['seller', 'admin']}> <MyProducts /> </ProtectedRoute>} />
            <Route path="/products/new" element={<ProtectedRoute allowedRoles={['seller', 'admin']}> <ProductForm /> </ProtectedRoute>} />
            <Route path="/products/edit/:id" element={<ProtectedRoute allowedRoles={['seller', 'admin']}> <ProductForm /> </ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute> <OrderHistory /> </ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute> <OrderDetail /> </ProtectedRoute>} />

            {/* Vendor Dashboard */}
            <Route path="/vendor/dashboard" element={<ProtectedRoute allowedRoles={['seller', 'admin']}> <VendorDashboard /> </ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}> <AdminDashboard /> </ProtectedRoute>} />

            <Route path="*" element={<Error />} />
          </Routes>
          <Footer />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;