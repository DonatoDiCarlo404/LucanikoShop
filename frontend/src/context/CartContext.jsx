import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from './authContext';
import { toast } from 'react-toastify';

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
  const [storageWarningShown, setStorageWarningShown] = useState(false);

  // Genera la chiave del carrello basata sull'utente
  const getCartKey = () => {
    return user ? `cart_${user._id}` : 'cart_guest';
  };

  // Pulizia iniziale dello storage (eseguita una sola volta all'avvio)
  useEffect(() => {
    try {
      // Pulisci vecchi carrelli di altri utenti
      const currentCartKey = getCartKey();
      let removedCount = 0;
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cart_') && key !== currentCartKey) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        removedCount++;
      });
      
      if (removedCount > 0) {
        console.log(`🧹 [CartContext] Pulizia iniziale: rimossi ${removedCount} carrelli vecchi`);
      }
    } catch (error) {
      console.error('🔴 [CartContext] Errore durante pulizia iniziale:', error);
    }
  }, [user?._id]); // Riesegui quando cambia utente

  // Utility: Serializza carrello per salvarlo in modo leggero
  const serializeCartForStorage = (items) => {
    return items.map(item => ({
      _id: item._id,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice,
      discountedPrice: item.discountedPrice,
      hasActiveDiscount: item.hasActiveDiscount,
      discountPercentage: item.discountPercentage,
      discountType: item.discountType,
      discountAmount: item.discountAmount,
      quantity: item.quantity,
      stock: item.stock,
      unit: item.unit,
      // Categoria (può essere stringa o oggetto)
      category: typeof item.category === 'string' 
        ? item.category 
        : (item.category?.name || item.category?._id || null),
      // Salva solo l'ultima immagine (quella principale mostrata)
      images: item.images && item.images.length > 0 
        ? [{
            url: item.images[item.images.length - 1]?.url || item.images[0].url,
            public_id: item.images[item.images.length - 1]?.public_id || item.images[0].public_id
          }]
        : [],
      // Dati seller minimali
      seller: item.seller ? {
        _id: item.seller._id,
        businessName: item.seller.businessName || item.seller.name
      } : null,
      // Variante selezionata (se presente)
      selectedVariantSku: item.selectedVariantSku || null,
      selectedVariantAttributes: item.selectedVariantAttributes || null,
      variantPrice: item.variantPrice || null,
      hasVariants: item.hasVariants || false,
      // Stock (usa quello della variante se presente, altrimenti quello del prodotto)
      stock: item.stock || 0
    }));
  };

  // Utility: Pulisce vecchi carrelli dal localStorage se pieno
  const cleanupOldCarts = () => {
    try {
      const currentCartKey = getCartKey();
      const keysToRemove = [];
      
      // Trova tutti i carrelli di altri utenti
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cart_') && key !== currentCartKey) {
          keysToRemove.push(key);
        }
      }
      
      // Rimuovi vecchi carrelli
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🧹 [CartContext] Rimosso carrello vecchio: ${key}`);
      });
      
      return keysToRemove.length;
    } catch (error) {
      console.error('🔴 [CartContext] Errore durante cleanup:', error);
      return 0;
    }
  };

  // Carica carrello da localStorage all'avvio o quando l'utente cambia
  useEffect(() => {
    try {
      const cartKey = getCartKey();
      const savedCart = localStorage.getItem(cartKey);
      
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        // Validazione base: assicurati che sia un array
        if (Array.isArray(parsedCart)) {
          // Verifica dimensione del carrello salvato
          const sizeKB = (savedCart.length / 1024).toFixed(2);
          console.log(`📦 [CartContext] Caricato carrello: ${parsedCart.length} prodotti, dimensione: ${sizeKB} KB`);
          
          // Se il carrello è troppo grande (>500KB), è probabilmente un vecchio formato
          // Mantieni solo i dati essenziali
          if (savedCart.length > 500 * 1024) {
            console.warn('⚠️ [CartContext] Carrello troppo grande, migrazione in corso...');
            const lightCart = serializeCartForStorage(parsedCart);
            localStorage.setItem(cartKey, JSON.stringify(lightCart));
            setCartItems(lightCart);
          } else {
            setCartItems(parsedCart);
          }
        } else {
          console.warn('⚠️ [CartContext] Dati carrello non validi, reset carrello');
          setCartItems([]);
        }
      } else {
        setCartItems([]); // Carrello vuoto per nuovo utente
      }
    } catch (error) {
      console.error('🔴 [CartContext] Errore caricamento carrello:', error);
      setCartItems([]); // Fallback sicuro
    } finally {
      // Il coupon NON viene salvato - deve essere inserito manualmente ogni volta
      setIsLoaded(true);
    }
  }, [user?._id]); // Ricarica quando cambia utente

  // Salva carrello in localStorage quando cambia (solo dopo il primo caricamento)
  useEffect(() => {
    if (isLoaded) {
      try {
        const cartKey = getCartKey();
        // Serializza il carrello in versione leggera
        const lightCart = serializeCartForStorage(cartItems);
        const cartJSON = JSON.stringify(lightCart);
        
        // Log dimensione per debug
        const sizeKB = (cartJSON.length / 1024).toFixed(2);
        console.log(`💾 [CartContext] Salvando ${cartItems.length} prodotti, dimensione: ${sizeKB} KB`);
        
        localStorage.setItem(cartKey, cartJSON);
      } catch (error) {
        // Se localStorage è pieno, prova a pulire vecchi carrelli
        if (error.name === 'QuotaExceededError') {
          console.warn('⚠️ [CartContext] localStorage pieno, pulizia in corso...');
          const cleaned = cleanupOldCarts();
          
          if (cleaned > 0) {
            // Riprova dopo la pulizia
            try {
              const cartKey = getCartKey();
              const lightCart = serializeCartForStorage(cartItems);
              localStorage.setItem(cartKey, JSON.stringify(lightCart));
              console.log('✅ [CartContext] Carrello salvato dopo pulizia');
              if (!storageWarningShown) {
                toast.info('Pulizia automatica completata. Il carrello è stato salvato.', {
                  autoClose: 5000
                });
                setStorageWarningShown(true);
              }
            } catch (retryError) {
              console.error('🔴 [CartContext] Impossibile salvare carrello anche dopo pulizia:', retryError);
              if (!storageWarningShown) {
                toast.warning('Spazio browser quasi esaurito. Il carrello funziona ma non verrà salvato. Svuota la cache del browser.', {
                  autoClose: 8000
                });
                setStorageWarningShown(true);
              }
            }
          } else {
            console.error('🔴 [CartContext] localStorage pieno, nessun vecchio carrello da rimuovere');
            if (!storageWarningShown) {
              toast.warning('Spazio browser esaurito. Svuota la cache per salvare il carrello.', {
                autoClose: 8000
              });
              setStorageWarningShown(true);
            }
          }
        } else {
          console.error('🔴 [CartContext] Errore salvataggio carrello:', error);
        }
        // Non blocca l'app - il carrello funziona lo stesso in memoria
      }
    }
  }, [cartItems, isLoaded, user?._id, storageWarningShown]);

    // Aggiungi prodotto al carrello
  const addToCart = useCallback((product, quantity = 1) => {
    try {
      // Validazione prodotto
      if (!product || !product._id) {
        console.error('🔴 [CartContext] Prodotto non valido:', product);
        throw new Error('Impossibile aggiungere il prodotto al carrello: dati non validi');
      }

      setCartItems((prevItems) => {
        try {
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
        } catch (innerError) {
          console.error('🔴 [CartContext] Errore durante aggiornamento carrello:', innerError);
          // Ritorna stato precedente senza modifiche
          return prevItems;
        }
      });
    } catch (error) {
      console.error('🔴 [CartContext] Errore addToCart:', error);
      // Mostra errore user-friendly nell'interfaccia (rimuovi l'alert nativo)
      // L'errore viene gestito dai componenti tramite lo stato
    }
  }, []);

  // Rimuovi prodotto dal carrello
  const removeFromCart = useCallback((productId) => {
    setCartItems((prevItems) => prevItems.filter(item => item._id !== productId));
  }, []);

  // Aggiorna quantità prodotto
  const updateQuantity = useCallback((productId, quantity) => {
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
  }, []);

  // Svuota carrello
  const clearCart = useCallback(() => {
    setCartItems([]);
    setAppliedCoupon(null);
    setDiscountAmount(0);
    
    // Pulisci tutto dal localStorage
    const cartKey = getCartKey();
    localStorage.removeItem(cartKey);
    localStorage.removeItem('appliedCoupon');
    localStorage.removeItem('discountAmount');
  }, [user?._id]);

  // Applica coupon
  const applyCoupon = useCallback((coupon, discount) => {
    setAppliedCoupon(coupon);
    setDiscountAmount(discount);
    // Il coupon NON viene salvato nel localStorage - rimane solo per la sessione corrente
  }, []);

  // Rimuovi coupon
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    localStorage.removeItem('appliedCoupon');
    localStorage.removeItem('discountAmount');
  }, []);

  const cartCount = useMemo(() => 
    cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems]
  );
  
  const cartTotal = useMemo(() => 
    cartItems.reduce((total, item) => {
      const price = item.discountedPrice || item.originalPrice || item.price || 0;
      return total + (price * item.quantity);
    }, 0),
    [cartItems]
  );

  const value = useMemo(() => ({
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
  }), [cartItems, cartCount, cartTotal, addToCart, removeFromCart, updateQuantity, clearCart, appliedCoupon, discountAmount, applyCoupon, removeCoupon]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

CartProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
