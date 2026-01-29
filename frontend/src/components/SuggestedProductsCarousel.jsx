import { useState, useEffect } from 'react';
import { Card, Spinner, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../services/api';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import './SuggestedProductsCarousel.css';

const SuggestedProductsCarousel = ({ cartItems, sameVendor = true, title, titleColor = '#333' }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  useEffect(() => {
    fetchSuggestedProducts();
  }, [cartItems]);

  const fetchSuggestedProducts = async () => {
    if (!cartItems || cartItems.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/products/suggested`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems: cartItems.map(item => ({
            _id: item._id,
            category: item.category?._id || item.category,
            seller: item.seller?._id || item.seller
          })),
          sameVendor,
          limit: 8
        }),
      });

      const data = await response.json();
      
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
          {products.map((product) => (
            <Card 
              key={product._id} 
              className="suggested-product-card"
            >
              <div 
                className="suggested-product-image"
                onClick={() => navigate(`/products/${product._id}`)}
                style={{ cursor: 'pointer' }}
              >
                {product.images && product.images.length > 0 ? (
                  <Card.Img 
                    variant="top" 
                    src={product.images[0].url} 
                    alt={product.name}
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
                        €{product.discountedPrice?.toFixed(2)}
                      </span>
                      <span className="original-price text-muted text-decoration-line-through ms-2">
                        €{product.price?.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="current-price fw-bold" style={{ color: '#004b75' }}>
                      €{product.price?.toFixed(2)}
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
          ))}
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
