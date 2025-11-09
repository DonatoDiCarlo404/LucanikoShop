import { Card, Badge } from 'react-bootstrap';
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
      {product.images && product.images.length > 0 ? (
        <Card.Img
          variant="top"
          src={product.images[product.images.length - 1].url}
          alt={product.name}
          style={{ height: '200px', objectFit: 'cover' }}
        />
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
            height: '48px', 
            overflow: 'hidden',
            marginBottom: '12px'
          }}
        >
          {product.name}
        </Card.Title>
        
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
            <h5 className="text-primary mb-0">
              €{product.price.toFixed(2)}
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                /{product.unit}
              </small>
            </h5>
            
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
