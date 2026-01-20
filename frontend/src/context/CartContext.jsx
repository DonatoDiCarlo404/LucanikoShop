import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from './authContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve essere usato dentro CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Genera la chiave del carrello basata sull'utente
  const getCartKey = () => {
    return user ? `cart_${user._id}` : 'cart_guest';
  };

  // Carica carrello da localStorage all'avvio o quando l'utente cambia
  useEffect(() => {
    const cartKey = getCartKey();
    const savedCart = localStorage.getItem(cartKey);
    const savedCoupon = localStorage.getItem('appliedCoupon');
    const savedDiscount = localStorage.getItem('discountAmount');
    
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    } else {
      setCartItems([]); // Carrello vuoto per nuovo utente
    }
    
    if (savedCoupon) {
      setAppliedCoupon(JSON.parse(savedCoupon));
    }
    
    if (savedDiscount) {
      setDiscountAmount(parseFloat(savedDiscount));
    }
    
    setIsLoaded(true);
  }, [user?._id]); // Ricarica quando cambia utente

  // Salva carrello in localStorage quando cambia (solo dopo il primo caricamento)
  useEffect(() => {
    if (isLoaded) {
      const cartKey = getCartKey();
      localStorage.setItem(cartKey, JSON.stringify(cartItems));
    }
  }, [cartItems, isLoaded, user?._id]);

    // Aggiungi prodotto al carrello
  const addToCart = (product, quantity = 1) => {
    setCartItems((prevItems) => {
      const getKey = (item) => item._id + (item.selectedVariantSku ? `__${item.selectedVariantSku}` : '');
      const newProductKey = getKey(product);
      const existingItem = prevItems.find(item => getKey(item) === newProductKey);

      let newItems;
      if (existingItem) {
        newItems = prevItems.map(item =>
          getKey(item) === newProductKey
            ? { ...product, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newItems = [...prevItems, { ...product, quantity }];
      }

      return newItems;
    });
  };

  // Rimuovi prodotto dal carrello
  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter(item => item._id !== productId));
  };

  // Aggiorna quantità prodotto
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map(item =>
        item._id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Svuota carrello
  const clearCart = () => {
    setCartItems([]);
  };

  // Applica coupon
  const applyCoupon = (coupon, discount) => {
    setAppliedCoupon(coupon);
    setDiscountAmount(discount);
    localStorage.setItem('appliedCoupon', JSON.stringify(coupon));
    localStorage.setItem('discountAmount', discount.toString());
  };

  // Rimuovi coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    localStorage.removeItem('appliedCoupon');
    localStorage.removeItem('discountAmount');
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  const cartTotal = cartItems.reduce((total, item) => {
    const price = item.discountedPrice || item.originalPrice || item.price || 0;
    return total + (price * item.quantity);
  }, 0);

  const value = {
    cartItems,
    cartCount,
    cartTotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    appliedCoupon,
    discountAmount,
    applyCoupon,
    removeCoupon,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

CartProvider.propTypes = {
  children: PropTypes.node.isRequired,
};