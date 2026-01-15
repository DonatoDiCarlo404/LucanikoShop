import { Container, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import SplashScreen from '../components/SplashScreen';

const Categories = () => {
  const navigate = useNavigate();
  const [imageErrors, setImageErrors] = useState({});
  const [showSplash, setShowSplash] = useState(false);

  // Card separate per ogni macrocategoria con immagini dirette
  const categoryCards = [
    {
      id: 'cibi-e-bevande',
      name: 'Cibi e Bevande',
      image: '/immagini-categorie-lucaniko-shop/6.png'
    },
    {
      id: 'abbigliamento-e-accessori',
      name: 'Abbigliamento e Accessori',
      image: '/immagini-categorie-lucaniko-shop/1.png'
    },
    {
      id: 'benessere-e-salute',
      name: 'Benessere e Salute',
      image: '/immagini-categorie-lucaniko-shop/3.png'
    },
    {
      id: 'calzature',
      name: 'Calzature',
      image: '/immagini-categorie-lucaniko-shop/4.png'
    },
    {
      id: 'casa-arredi-ufficio',
      name: 'Casa, Arredi e Ufficio',
      image: '/immagini-categorie-lucaniko-shop/5.png'
    },
    {
      id: 'elettronica-informatica',
      name: 'Elettronica e Informatica',
      image: '/immagini-categorie-lucaniko-shop/7.png'
    },
    {
      id: 'industria-ferramenta-artigianato',
      name: 'Industria, Ferramenta e Artigianato',
      image: '/immagini-categorie-lucaniko-shop/2.png'
    },
    {
      id: 'libri-media-giocattoli',
      name: 'Libri, Media e Giocattoli',
      image: '/immagini-categorie-lucaniko-shop/8.png'
    },
    {
      id: 'orologi-e-gioielli',
      name: 'Orologi e Gioielli',
      image: '/immagini-categorie-lucaniko-shop/9.png'
    },
    {
      id: 'ricambi-auto-moto',
      name: 'Ricambi e accessori per auto e moto',
      image: '/immagini-categorie-lucaniko-shop/10.png'
    },
    {
      id: 'sport-hobby-viaggi',
      name: 'Sport, Hobby e Viaggi',
      image: '/immagini-categorie-lucaniko-shop/11.png'
    }
  ];

  const handleCategoryClick = (categoryName) => {
    if (categoryName === 'Cibi e Bevande') {
      setShowSplash(true);
      setTimeout(() => {
        setShowSplash(false);
        navigate(`/products?category=${encodeURIComponent(categoryName)}`);
      }, 2000);
    } else {
      navigate(`/products?category=${encodeURIComponent(categoryName)}`);
    }
  };

  const handleImageError = (categoryId, categoryName) => {
    setImageErrors(prev => ({ ...prev, [categoryId]: true }));
  };

  if (showSplash) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <SplashScreen phrase="Non avevi fame? E mò la tin!" />
      </div>
    );
  }

  return (
    <Container className="mt-4 mb-5">
      <h2 className="mb-4">Categorie</h2>
      <Row className="g-4">
        {categoryCards.map(cat => (
          <Col key={cat.id} xs={6} sm={4} md={3}>
            <Card 
              className="h-100 shadow-sm category-card"
              style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
              onClick={() => handleCategoryClick(cat.name)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {!imageErrors[cat.id] ? (
                <img
                  src={cat.image}
                  alt={cat.name}
                  style={{ 
                    height: 200, 
                    width: '100%',
                    objectFit: 'cover', 
                    background: '#f8f9fa' 
                  }}
                  onError={() => handleImageError(cat.id, cat.name)}
                />
              ) : (
                <div
                  style={{
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontSize: '3rem',
                    fontWeight: 'bold'
                  }}
                >
                  {cat.name.charAt(0).toUpperCase()}
                </div>
              )}
              <Card.Body className="text-center">
                <Card.Title style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                  {cat.name}
                </Card.Title>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Categories;
