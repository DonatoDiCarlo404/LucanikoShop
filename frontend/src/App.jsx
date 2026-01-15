import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/authContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
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
import OrderTracking from './pages/OrderTracking';
import VendorDashboard from './pages/VendorDashboard';
import VendorProfile from './pages/VendorProfile';
import ShopPage from './pages/ShopPage';
import Footer from './components/Footer';
import Error from './pages/Error';
import SplashScreen from './components/SplashScreen';
import { useState, useEffect } from 'react';
import BuyerProfile from './pages/BuyerProfile';
import OffersAndDiscounts from './pages/OffersAndDiscounts';
import Categories from './pages/Categories';
import CategoriesCarouselArrows from './components/CategoriesCarouselArrows';
import TermsVendors from './pages/TermsVendors';
import TermsBuyers from './pages/TermsBuyers';
import CookiePolicy from './pages/CookiePolicy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookieBanner from './components/CookieBanner';
import HelpCenterBuyer from './pages/HelpCenterBuyer';
import ShippingAndPayments from './pages/ShippingAndPayments';
import SpazioVenditoriLucani from './pages/SpazioVenditoriLucani';
import HelpCenterVendor from './pages/HelpCenterVendor';

function AppContent() {
  const location = useLocation();
  
  // Pagine dove NON mostrare il carosello
  const hideCarouselPaths = ['/login', '/register', '/cart', '/categories', '/products/new'];
  const shouldShowCarousel = !hideCarouselPaths.includes(location.pathname) && !location.pathname.startsWith('/products/edit/');

  return (
    <>
      <Navbar />
      <CookieBanner />
      <Routes>
        <Route path="/" element={<Products />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/success" element={<AuthSuccess />} />
        <Route path="/pending-approval" element={<PendingApproval />} />

        {/* Prodotti pubblici */}
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/shop/:sellerId" element={<ShopPage />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/checkout/cancel" element={<CheckoutCancel />} />
        <Route path="/offers" element={<OffersAndDiscounts />} />
        <Route path="/categories" element={<Categories />} />

        {/* Prodotti protetti (solo seller/admin) */}
        <Route path="/my-products" element={<ProtectedRoute allowedRoles={['seller', 'admin']}> <MyProducts /> </ProtectedRoute>} />
        <Route path="/products/new" element={<ProtectedRoute allowedRoles={['seller', 'admin']}> <ProductForm /> </ProtectedRoute>} />
        <Route path="/products/edit/:id" element={<ProtectedRoute allowedRoles={['seller', 'admin']}> <ProductForm /> </ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute> <OrderHistory /> </ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute> <OrderDetail /> </ProtectedRoute>} />
        <Route path="/orders/:id/tracking" element={<ProtectedRoute> <OrderTracking /> </ProtectedRoute>} />

        {/* Vendor Dashboard */}
        <Route path="/vendor/dashboard" element={<ProtectedRoute allowedRoles={['seller', 'admin']}> <VendorDashboard /> </ProtectedRoute>} />
        <Route path="/vendor/profile" element={<ProtectedRoute allowedRoles={['seller', 'admin']}> <VendorProfile /> </ProtectedRoute>} />

        {/* Buyer Profile */}
        <Route path="/profile" element={<ProtectedRoute allowedRoles={['buyer','user','acquirente']}> <BuyerProfile /> </ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}> <AdminDashboard /> </ProtectedRoute>} />
        <Route path="/terms-vendors" element={<TermsVendors />} />
        <Route path="/terms-buyers" element={<TermsBuyers />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />


        {/* Centro Assistenza Acquirenti */}
        <Route path="/help-center-buyers" element={<HelpCenterBuyer />} />
        <Route path="/help-center-vendors" element={<HelpCenterVendor />} />
        <Route path="/spazio-venditori-lucani" element={<SpazioVenditoriLucani />} />

        {/* Spedizioni e Metodi di Pagamento */}
        <Route path="/cancellation-policy" element={<ShippingAndPayments />} />

        <Route path="*" element={<Error />} />
      </Routes>
      {shouldShowCarousel && <CategoriesCarouselArrows />}
      <Footer />
    </>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000); 
    return () => clearTimeout(timer);
  }, []);

  return showSplash ? <SplashScreen /> : (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;