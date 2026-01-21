import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Card, Container, Carousel } from 'react-bootstrap';
import './CategoriesCarousel.css';

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

const CategoriesCarouselArrows = () => {
  const navigate = useNavigate();
  const [imageErrors, setImageErrors] = useState({});

  const handleCategoryClick = (categoryName) => {
    navigate(`/products?category=${encodeURIComponent(categoryName)}`);
  };

  const handleImageError = (categoryId) => {
    setImageErrors(prev => ({ ...prev, [categoryId]: true }));
  };

  // Suddividi le card in gruppi da 4
  const chunkedCards = [];
  for (let i = 0; i < categoryCards.length; i += 4) {
    chunkedCards.push(categoryCards.slice(i, i + 4));
  }

  return (
    <div className="categories-carousel-container">
      <Container>
        <h3 className="text-center mb-4" style={{ fontWeight: 600, color: '#004b75' }}>Esplora le Categorie</h3>
      </Container>
      <Carousel interval={5000} indicators={true} controls={true} pause="hover">
        {chunkedCards.map((group, idx) => (
          <Carousel.Item key={idx}>
            <div className="d-flex justify-content-center align-items-stretch w-100">
              {group.map(cat => (
                <div key={cat.id} className="carousel-card-wrapper">
                  <Card
                    className="h-100 shadow-sm category-card"
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    onClick={() => handleCategoryClick(cat.name)}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {!imageErrors[cat.id] ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        style={{ height: 200, width: '100%', objectFit: 'cover', background: '#f8f9fa' }}
                        onError={() => handleImageError(cat.id)}
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
                    <Card.Body className="text-center p-3">
                      <Card.Title style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#861515' }}>
                        {cat.name}
                      </Card.Title>
                    </Card.Body>
                  </Card>
                </div>
              ))}
            </div>
          </Carousel.Item>
        ))}
      </Carousel>
    </div>
  );
};

export default CategoriesCarouselArrows;
