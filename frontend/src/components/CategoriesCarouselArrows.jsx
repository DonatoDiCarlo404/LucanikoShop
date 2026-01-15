import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Card, Container, Button } from 'react-bootstrap';
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
  const carouselRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  // Scorrimento automatico più veloce
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || isPaused) return;

    let lastScrollLeft = carousel.scrollLeft;
    let stableCount = 0;

    const scroll = () => {
      if (carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth) {
        carousel.scrollLeft = 0;
      } else {
        carousel.scrollLeft += 4;
      }
      // Stabilizzazione: se il carosello non si muove per 3 cicli, ferma lo scroll
      if (carousel.scrollLeft === lastScrollLeft) {
        stableCount++;
        if (stableCount > 3) {
          setIsPaused(true);
        }
      } else {
        stableCount = 0;
        lastScrollLeft = carousel.scrollLeft;
      }
    };

    const interval = setInterval(scroll, 10);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleCategoryClick = (categoryName) => {
    navigate(`/products?category=${encodeURIComponent(categoryName)}`);
  };

  const handleImageError = (categoryId) => {
    setImageErrors(prev => ({ ...prev, [categoryId]: true }));
  };

  const handleScrollLeft = () => {
    setIsPaused(true);
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.scrollLeft -= 300;
    }
    setTimeout(() => setIsPaused(false), 600); // Pausa lo scorrimento automatico per 600ms
  };

  const handleScrollRight = () => {
    setIsPaused(true);
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.scrollLeft += 300;
    }
    setTimeout(() => setIsPaused(false), 600); // Pausa lo scorrimento automatico per 600ms
  };

  return (
    <div className="categories-carousel-container" style={{ position: 'relative' }}>
      <Container>
        <h3 className="text-center mb-4" style={{ fontWeight: 600, color: '#7c4d1e' }}>Esplora le Categorie</h3>
      </Container>
      <Button 
        variant="light" 
        className="carousel-arrow left" 
        style={{ position: 'absolute', left: 0, top: '50%', zIndex: 2, transform: 'translateY(-50%)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        onClick={handleScrollLeft}
      >
        <span style={{ fontSize: '2rem', color: '#764ba2' }}>&#8592;</span>
      </Button>
      <div 
        className="categories-carousel" 
        ref={carouselRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{ scrollbarWidth: 'none' }}
      >
        {[...categoryCards, ...categoryCards].map((cat, index) => (
          <div key={`${cat.id}-${index}`} className="carousel-card-wrapper">
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
                <Card.Title style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                  {cat.name}
                </Card.Title>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>
      <Button 
        variant="light" 
        className="carousel-arrow right" 
        style={{ position: 'absolute', right: 0, top: '50%', zIndex: 2, transform: 'translateY(-50%)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        onClick={handleScrollRight}
      >
        <span style={{ fontSize: '2rem', color: '#764ba2' }}>&#8594;</span>
      </Button>
    </div>
  );
};

export default CategoriesCarouselArrows;
