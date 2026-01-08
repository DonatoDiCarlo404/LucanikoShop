import { Card, Badge, Carousel } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  return (
    <Card
      style={{ cursor: 'pointer', height: '100%' }}
      onClick={() => navigate(`/products/${product._id}`)}
      className="h-100 shadow-sm hover-shadow"
    >
      {/* Badge sconto in alto a destra */}
      {product.hasActiveDiscount && product.discountPercentage && (
        <Badge 
          bg="danger" 
          style={{ 
            position: 'absolute', 
            top: '10px', 
            right: '10px', 
            zIndex: 10,
            fontSize: '1rem',
            padding: '8px 12px'
          }}
        >
          -{product.discountPercentage}%
        </Badge>
      )}
      
      {product.images && product.images.length > 0 ? (
        <Carousel interval={2500}
          indicators={product.images.length > 1}
          controls={product.images.length > 1}
          onClick={e => e.stopPropagation()}
        >
          {product.images.map((img, idx) => (
            <Carousel.Item key={idx}>
              <img
                src={img.url}
                alt={product.name}
                style={{ height: '200px', width: '100%', objectFit: 'cover' }}
              />
            </Carousel.Item>
          ))}
        </Carousel>
      ) : (
        <div
          style={{
            height: '200px',
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
          style={{
            fontSize: '1rem',
            height: '20px',
            overflow: 'hidden',
            marginBottom: '12px'
          }}
        >
          {product.name}
        </Card.Title>

        <div className="d-flex align-items-center mb-2 justify-content-between">
          <span style={{ color: '#FFD700', fontSize: '1.1em', marginRight: 4 }}>
            {'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}
          </span>
          <span className="text-muted small" style={{ marginLeft: 4 }}>
            {product.rating ? product.rating.toFixed(1) : '0.0'} ({product.numReviews || 0})
          </span>
        </div>

        <Badge bg="secondary" className="mb-2 align-self-start">
          {product.category}
        </Badge>

        {product.description && (
          <Card.Text
            className="text-muted small"
            style={{
              height: '40px',
              overflow: 'hidden',
              marginBottom: '12px'
            }}
          >
            {product.description}
          </Card.Text>
        )}

        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              {product.hasActiveDiscount && product.originalPrice ? (
                <>
                  <h5 className="text-primary mb-0">
                    €{product.discountedPrice.toFixed(2)}
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                      /{product.unit}
                    </small>
                  </h5>
                  <small className="text-muted" style={{ textDecoration: 'line-through' }}>
                    €{product.originalPrice.toFixed(2)}
                  </small>
                </>
              ) : (
                <h5 className="text-primary mb-0">
                  €{product.price.toFixed(2)}
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                    /{product.unit}
                  </small>
                </h5>
              )}
            </div>

            {product.stock > 0 ? (
              <Badge bg="success">
                Disponibile
              </Badge>
            ) : (
              <Badge bg="danger">
                Esaurito
              </Badge>
            )}
          </div>

          {product.stock > 0 && (
            <small className="text-muted d-block mt-1">
              {product.stock} {product.unit} disponibili
            </small>
          )}
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
