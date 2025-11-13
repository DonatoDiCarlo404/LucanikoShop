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

  // Genera la chiave del carrello basata sull'utente
  const getCartKey = () => {
    return user ? `cart_${user._id}` : 'cart_guest';
  };

  // Carica carrello da localStorage all'avvio o quando l'utente cambia
  useEffect(() => {
    const cartKey = getCartKey();
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    } else {
      setCartItems([]); // Carrello vuoto per nuovo utente
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
      const existingItem = prevItems.find(item => item._id === product._id);
      
      if (existingItem) {
        // Se il prodotto esiste già, aumenta la quantità
        return prevItems.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Altrimenti aggiungi nuovo prodotto
        return [...prevItems, { ...product, quantity }];
      }
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

  const value = {
    cartItems,
    cartCount: cartItems.reduce((total, item) => total + item.quantity, 0),
    cartTotal: cartItems.reduce((total, item) => total + (item.price * item.quantity), 0),
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
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