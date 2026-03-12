import { useState, useEffect } from 'react';
import { Card, Spinner, Button, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { API_URL, wishlistAPI } from '../services/api';
import { CloudinaryPresets } from '../utils/cloudinaryOptimizer';
import { useAuth } from '../context/authContext';

const OtherCategoriesCarousel = ({ excludeCategory, title = '🌟 Scopri anche altre categorie', titleColor = '#004b75' }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState({});
  const [wishlistLoading, setWishlistLoading] = useState({});
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchOtherCategoriesProducts();
  }, [excludeCategory]);

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

  const fetchOtherCategoriesProducts = async () => {
    try {
      const params = new URLSearchParams({
        limit: '12'
      });
      
      if (excludeCategory) {
        params.append('excludeCategory', excludeCategory);
      }

      const response = await fetch(`${API_URL}/products/other-categories?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Errore nel recupero prodotti altre categorie:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (productId) => {
    navigate(`/products/${productId}`);
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
    <div className="other-categories-section mb-5 mt-5">
      <h4 className="mb-4 text-center" style={{ color: titleColor, fontWeight: 700 }}>{title}</h4>
      
      <Row>
        {products.map((product) => {
          // Calcola il prezzo da mostrare con controlli robusti
          let displayPrice = product.price || 0;
          let displayDiscountedPrice = product.discountedPrice || displayPrice;
          
          // Se il prodotto ha varianti, prendi il prezzo minimo
          if (product.hasVariants && product.variants && product.variants.length > 0) {
            const prices = product.variants.map(v => v.price).filter(p => p != null && p > 0);
            if (prices.length > 0) {
              displayPrice = Math.min(...prices);
            }
            
            if (product.hasActiveDiscount) {
              const discountedPrices = product.variants.map(v => v.discountedPrice).filter(p => p != null && p > 0);
              if (discountedPrices.length > 0) {
                displayDiscountedPrice = Math.min(...discountedPrices);
              } else {
                displayDiscountedPrice = displayPrice;
              }
            }
          }

          // Se il prezzo è ancora 0 o null, salta questo prodotto
          if (!displayPrice || displayPrice <= 0) {
            return null;
          }
          
          return (
          <Col key={product._id} md={2} sm={4} xs={6} className="mb-4">
            <Card 
              className="h-100 shadow-sm"
              style={{ 
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                border: '1px solid #e0e0e0'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
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
                className="position-relative"
                onClick={() => navigate(`/products/${product._id}`)}
                style={{ overflow: 'hidden' }}
              >
                {product.images && product.images.length > 0 ? (
                  <Card.Img 
                    variant="top" 
                    src={CloudinaryPresets.productCard(product.images[0].url)}
                    srcSet={`
                      ${CloudinaryPresets.thumbnail(product.images[0].url)} 200w,
                      ${CloudinaryPresets.productCard(product.images[0].url)} 400w
                    `}
                    sizes="(max-width: 576px) 150px, 200px"
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    style={{ height: '180px', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="d-flex align-items-center justify-content-center bg-light" style={{ height: '180px' }}>
                    <i className="bi bi-image" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                  </div>
                )}
                
                {product.hasActiveDiscount && product.discountPercentage > 0 && (
                  <div 
                    className="position-absolute top-0 end-0 m-2 px-2 py-1 rounded"
                    style={{ 
                      backgroundColor: '#861515', 
                      color: 'white', 
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}
                  >
                    -{product.discountPercentage}%
                  </div>
                )}
                
                {/* Badge categoria */}
                {product.category?.name && (
                  <div 
                    className="position-absolute bottom-0 start-0 m-2 px-2 py-1 rounded"
                    style={{ 
                      backgroundColor: 'rgba(0, 75, 117, 0.9)', 
                      color: 'white', 
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}
                  >
                    {product.category.name}
                  </div>
                )}
              </div>
              
              <Card.Body className="d-flex flex-column p-3">
                <Card.Title 
                  className="mb-2"
                  onClick={() => navigate(`/products/${product._id}`)}
                  style={{ 
                    cursor: 'pointer', 
                    color: '#004b75',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    lineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {product.name}
                </Card.Title>
                
                {product.seller?.businessName && (
                  <Card.Text className="text-muted small mb-2" style={{ fontSize: '0.8rem' }}>
                    {product.seller.businessName}
                  </Card.Text>
                )}
                
                <div className="mb-2">
                  {product.hasActiveDiscount ? (
                    <>
                      <div className="fw-bold" style={{ color: '#004b75', fontSize: '1.1rem' }}>
                        {product.hasVariants && 'da '}€{displayDiscountedPrice?.toFixed(2)}
                      </div>
                      <div className="text-muted text-decoration-line-through" style={{ fontSize: '0.85rem' }}>
                        €{displayPrice?.toFixed(2)}
                      </div>
                    </>
                  ) : (
                    <div className="fw-bold" style={{ color: '#004b75', fontSize: '1.1rem' }}>
                      {product.hasVariants && 'da '}€{displayPrice?.toFixed(2)}
                    </div>
                  )}
                </div>
                
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(product._id);
                  }}
                  className="mt-auto w-100"
                  style={{ fontSize: '0.85rem' }}
                >
                  Vedi dettagli
                </Button>
              </Card.Body>
            </Card>
          </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default OtherCategoriesCarousel;
