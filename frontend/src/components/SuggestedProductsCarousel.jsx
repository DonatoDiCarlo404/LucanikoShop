import { useState, useEffect } from 'react';
import { Card, Spinner, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { API_URL, wishlistAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import './SuggestedProductsCarousel.css';
import { CloudinaryPresets } from '../utils/cloudinaryOptimizer';
import { useAuth } from '../context/authContext';

const SuggestedProductsCarousel = ({ cartItems, sameVendor = true, title, titleColor = '#333' }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [wishlistItems, setWishlistItems] = useState({});
  const [wishlistLoading, setWishlistLoading] = useState({});
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    fetchSuggestedProducts();
  }, [cartItems]);

  // Controlla wishlist quando cambiano i prodotti o l'utente
  useEffect(() => {
    const checkWishlist = async () => {
      if (user?.token && products.length > 0) {
        try {
          const wishlistData = await wishlistAPI.getWishlist(user.token);
          const wishlistMap = {};
          products.forEach(product => {
            wishlistMap[product._id] = wishlistData.some(item => item.product?._id === product._id);
          });
          setWishlistItems(wishlistMap);
        } catch (error) {
          console.error('Errore nel controllo wishlist:', error);
        }
      }
    };
    checkWishlist();
  }, [user, products]);

  const fetchSuggestedProducts = async () => {
    if (!cartItems || cartItems.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const requestBody = {
        cartItems: cartItems.map(item => ({
          _id: item._id,
          category: item.category?._id || item.category,
          seller: item.seller?._id || item.seller
        })),
        sameVendor,
        limit: 8
      };

      console.log('🔍 [SUGGESTED CAROUSEL] Richiesta prodotti suggeriti:', {
        sameVendor,
        cartItems: requestBody.cartItems
      });

      const response = await fetch(`${API_URL}/products/suggested`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      console.log('✅ [SUGGESTED CAROUSEL] Prodotti ricevuti:', {
        sameVendor,
        count: data.products?.length || 0,
        products: data.products?.map(p => ({ name: p.name, vendor: p.seller?.businessName }))
      });
      
      if (response.ok) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Errore nel recupero prodotti suggeriti:', error);
    } finally {
      setLoading(false);
    }
  };

  const scroll = (direction) => {
    const container = document.getElementById(`carousel-${sameVendor ? 'same' : 'other'}`);
    if (container) {
      const scrollAmount = 300;
      const newPosition = direction === 'left' 
        ? scrollPosition - scrollAmount 
        : scrollPosition + scrollAmount;
      
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  const handleAddToCart = (product) => {
    if (product.hasVariants && product.variants?.length > 0) {
      navigate(`/products/${product._id}`);
    } else {
      addToCart(product);
      toast.success('Prodotto aggiunto al carrello');
    }
  };

  const handleWishlistToggle = async (e, productId) => {
    e.stopPropagation();
    if (!user?.token) return;

    setWishlistLoading(prev => ({ ...prev, [productId]: true }));
    try {
      if (wishlistItems[productId]) {
        await wishlistAPI.removeFromWishlist(productId, user.token);
        setWishlistItems(prev => ({ ...prev, [productId]: false }));
      } else {
        await wishlistAPI.addToWishlist(productId, user.token);
        setWishlistItems(prev => ({ ...prev, [productId]: true }));
      }
    } catch (error) {
      console.error('Errore gestione wishlist:', error);
    } finally {
      setWishlistLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="suggested-products-section mb-4">
      <h4 className="mb-3" style={{ color: titleColor }}>{title}</h4>
      
      <div className="carousel-wrapper position-relative">
        {scrollPosition > 0 && (
          <button 
            className="carousel-arrow carousel-arrow-left"
            onClick={() => scroll('left')}
            aria-label="Scorri a sinistra"
          >
            ‹
          </button>
        )}
        
        <div 
          id={`carousel-${sameVendor ? 'same' : 'other'}`}
          className="suggested-products-carousel"
        >
          {products.map((product) => {
            // Calcola il prezzo da mostrare
            let displayPrice = product.price;
            let displayDiscountedPrice = product.discountedPrice;
            
            // Se il prodotto ha varianti, prendi il prezzo minimo
            if (product.hasVariants && product.variants && product.variants.length > 0) {
              const prices = product.variants.map(v => v.price).filter(p => p != null);
              displayPrice = prices.length > 0 ? Math.min(...prices) : 0;
              
              if (product.hasActiveDiscount) {
                const discountedPrices = product.variants.map(v => v.discountedPrice).filter(p => p != null);
                displayDiscountedPrice = discountedPrices.length > 0 ? Math.min(...discountedPrices) : displayPrice;
              }
            }
            
            return (
            <Card 
              key={product._id} 
              className="suggested-product-card"
            >
              {/* Cuore wishlist in alto a sinistra, solo per buyer loggato */}
              {user && user.role === 'buyer' && (
                <span
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    zIndex: 11,
                    fontSize: 20,
                    color: wishlistItems[product._id] ? '#e74c3c' : '#ccc',
                    background: 'rgba(255,255,255,0.85)',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                    cursor: wishlistLoading[product._id] ? 'wait' : 'pointer'
                  }}
                  title={wishlistItems[product._id] ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
                  onClick={(e) => handleWishlistToggle(e, product._id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleWishlistToggle(e, product._id);
                    }
                  }}
                >
                  <i className={`bi bi-heart${wishlistItems[product._id] ? '-fill' : ''}`}></i>
                </span>
              )}

              <div 
                className="suggested-product-image"
                onClick={() => navigate(`/products/${product._id}`)}
                style={{ cursor: 'pointer' }}
              >
                {product.images && product.images.length > 0 ? (
                  <Card.Img 
                    variant="top" 
                    src={CloudinaryPresets.productCard(product.images[0].url)}
                    srcSet={`
                      ${CloudinaryPresets.thumbnail(product.images[0].url)} 200w,
                      ${CloudinaryPresets.productCard(product.images[0].url)} 400w
                    `}
                    sizes="(max-width: 576px) 200px, 300px"
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="no-image">
                    <i className="bi bi-image"></i>
                  </div>
                )}
                
                {product.hasActiveDiscount && product.discountPercentage > 0 && (
                  <div className="discount-badge" style={{ backgroundColor: '#861515' }}>
                    -{product.discountPercentage}%
                  </div>
                )}
              </div>
              
              <Card.Body className="d-flex flex-column">
                <Card.Title 
                  className="suggested-product-title"
                  onClick={() => navigate(`/products/${product._id}`)}
                  style={{ cursor: 'pointer', color: '#004b75' }}
                >
                  {product.name}
                </Card.Title>
                
                {product.seller?.businessName && (
                  <Card.Text className="text-muted small mb-2">
                    {product.seller.businessName}
                  </Card.Text>
                )}
                
                <div className="price-section mb-2">
                  {product.hasActiveDiscount ? (
                    <>
                      <span className="discounted-price fw-bold" style={{ color: '#004b75' }}>
                        {product.hasVariants && 'da '}€{displayDiscountedPrice?.toFixed(2)}
                      </span>
                      <span className="original-price text-muted text-decoration-line-through ms-2">
                        €{displayPrice?.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="current-price fw-bold" style={{ color: '#004b75' }}>
                      {product.hasVariants && 'da '}€{displayPrice?.toFixed(2)}
                    </span>
                  )}
                </div>
                
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  onClick={() => handleAddToCart(product)}
                  className="mt-auto"
                >
                  {product.hasVariants ? 'Vedi dettagli' : 'Aggiungi'}
                </Button>
              </Card.Body>
            </Card>
            );
          })}
        </div>
        
        {products.length > 3 && (
          <button 
            className="carousel-arrow carousel-arrow-right"
            onClick={() => scroll('right')}
            aria-label="Scorri a destra"
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
};

export default SuggestedProductsCarousel;
