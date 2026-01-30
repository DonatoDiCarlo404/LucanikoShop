import { Card, Badge, Carousel } from 'react-bootstrap';
import './ProductCard.css';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../context/authContext';
import { wishlistAPI } from '../services/api';
import { useState, useEffect } from 'react';

const ProductCard = ({ product }) => {
    // Calcola prezzo minimo e stock totale se ci sono varianti
    let minVariantPrice = null;
    let totalVariantStock = 0;
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      minVariantPrice = product.variants
        .filter(v => typeof v.price === 'number')
        .reduce((min, v) => v.price < min ? v.price : min, Infinity);
      if (!isFinite(minVariantPrice)) minVariantPrice = null;
      totalVariantStock = product.variants
        .filter(v => typeof v.stock === 'number')
        .reduce((sum, v) => sum + v.stock, 0);
    }
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);

  // Verifica se il prodotto è nella wishlist
  useEffect(() => {
    const checkWishlist = async () => {
      if (user?.token) {
        try {
          const wishlistData = await wishlistAPI.getWishlist(user.token);
          const inWishlist = wishlistData.some(item => item.product?._id === product._id);
          setIsInWishlist(inWishlist);
        } catch (error) {
          console.error('Errore nel controllo wishlist:', error);
        }
      }
    };
    checkWishlist();
  }, [user, product._id]);

  const handleWishlistToggle = async (e) => {
    e.stopPropagation();
    if (!user?.token) return;

    setLoading(true);
    try {
      if (isInWishlist) {
        await wishlistAPI.removeFromWishlist(product._id, user.token);
        setIsInWishlist(false);
      } else {
        await wishlistAPI.addToWishlist(product._id, user.token);
        setIsInWishlist(true);
      }
    } catch (error) {
      console.error('Errore gestione wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      style={{
        cursor: 'pointer',
        height: '100%',
        position: 'relative',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18), 0 1.5px 6px rgba(0,0,0,0.12)',
        border: '2px solid transparent',
        transition: 'all 0.3s ease'
      }}
      onClick={e => {
        // Se il click è su una freccia del carosello, non aprire dettaglio
        if (
          e.target.closest('.carousel-control-prev') ||
          e.target.closest('.carousel-control-next')
        ) {
          e.stopPropagation();
          return;
        }
        navigate(`/products/${product._id}`);
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.16)';
        e.currentTarget.style.borderColor = '#004b75';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18), 0 1.5px 6px rgba(0,0,0,0.12)';
        e.currentTarget.style.borderColor = 'transparent';
      }}
      className="h-100"
    >
      {/* Cuore wishlist in alto a sinistra, solo per buyer loggato */}
      {user && user.role === 'buyer' && (
        <span
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 11,
            fontSize: 24,
            color: isInWishlist ? '#e74c3c' : '#ccc',
            background: 'rgba(255,255,255,0.85)',
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            cursor: loading ? 'wait' : 'pointer'
          }}
          title={isInWishlist ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
          onClick={handleWishlistToggle}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleWishlistToggle(e);
            }
          }}
        >
          <i className={`bi bi-heart${isInWishlist ? '-fill' : ''}`}></i>
        </span>
      )}

      {/* Badge sconto in alto a destra */}
      {product.hasActiveDiscount && product.discountPercentage && (
        <Badge className="badge-discount">
          -{product.discountPercentage}%
        </Badge>
      )}
      
      {product.images && product.images.length > 0 ? (
        <Carousel
          interval={2500}
          indicators={product.images.length > 1}
          controls={product.images.length > 1}
          className="product-card-carousel"
        >
          {product.images.map((img, idx) => (
            <Carousel.Item key={idx}>
              <img
                src={img.url}
                alt={product.name}
                className="product-card-img"
              />
            </Carousel.Item>
          ))}
        </Carousel>
      ) : (
        <div
          style={{
            height: '280px',
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span className="text-muted">Nessuna immagine</span>
        </div>
      )}

      <Card.Body className="d-flex flex-column">
        <Card.Title
          className="product-card-title"
          style={{
            fontSize: '1rem',
            height: '20px',
            overflow: 'hidden',
            marginBottom: 4,
            fontWeight: 700,
            color: '#004b75'
          }}
        >
          {product.name}
        </Card.Title>
        {/* Nome azienda creatrice */}
        {product.seller && (
          <div className="text-muted small mb-2" style={{ minHeight: 18 }}>
            {product.seller.businessName || product.seller.name}
          </div>
        )}

        {/* Mostra rating e numero recensioni solo se ci sono recensioni */}
        {product.numReviews > 0 && (
          <div className="d-flex align-items-center mb-2 justify-content-between">
            <span style={{ color: '#FFD700', fontSize: '1.1em', marginRight: 4 }}>
              {'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}
            </span>
            <span className="text-muted small" style={{ marginLeft: 4 }}>
              {product.rating ? product.rating.toFixed(1) : '0.0'} ({product.numReviews})
            </span>
          </div>
        )}

        <div className="d-flex flex-row flex-nowrap gap-2 mb-2 badge-category-row">
          <Badge className="badge-category-product">
            {typeof product.category === 'string' ? product.category : product.category?.name || 'N/A'}
          </Badge>
          {/* Se ci sono altre categorie, aggiungile qui come altri Badge */}
        </div>

        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              {product.hasActiveDiscount && product.originalPrice ? (
                <>
                  <h5 className="mb-0" style={{ fontSize: '1rem', color: '#004b75', fontWeight: 700 }}>
                    €{product.discountedPrice?.toFixed(2) || '0.00'}
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                      /{product.unit}
                    </small>
                  </h5>
                  <small className="text-muted" style={{ textDecoration: 'line-through' }}>
                    €{product.originalPrice?.toFixed(2) || '0.00'}
                  </small>
                </>
              ) : typeof product.price === 'number' ? (
                <h5 className="mb-0" style={{ fontSize: '1rem', color: '#004b75', fontWeight: 700 }}>
                  €{product.price.toFixed(2)}
                  <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                    /{product.unit}
                  </small>
                </h5>
              ) : minVariantPrice !== null ? (
                <h5 className="mb-0" style={{ fontSize: '1rem', color: '#004b75', fontWeight: 700 }}>
                  da €{minVariantPrice.toFixed(2)}
                  <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                    /{product.unit}
                  </small>
                </h5>
              ) : (
                <h5 className="text-muted mb-0">
                  <small>Prezzo su varianti</small>
                </h5>
              )}
            </div>

            {(() => {
              const hasStock = (typeof product.stock === 'number' && product.stock > 0) || totalVariantStock > 0;
              const isAvailable = hasStock && product.isActive;
              if (!hasStock) {
                return <Badge className="badge-esaurito">Esaurito</Badge>;
              }
              return isAvailable ? (
                <>
                  <Badge className="badge-availability d-none d-sm-inline">Disponibile</Badge>
                  <Badge className="badge-availability d-inline d-sm-none">Disp.</Badge>
                </>
              ) : (
                <>
                  <Badge className="badge-not-available d-none d-sm-inline">Non disponibile</Badge>
                  <Badge className="badge-not-available d-inline d-sm-none">Non Disp.</Badge>
                </>
              );
            })()}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    price: PropTypes.number.isRequired,
    category: PropTypes.string.isRequired,
    stock: PropTypes.number.isRequired,
    unit: PropTypes.string.isRequired,
    images: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string.isRequired,
        public_id: PropTypes.string.isRequired,
      })
    ),
  }).isRequired,
};

export default ProductCard;
