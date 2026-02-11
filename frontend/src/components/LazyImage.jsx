import React, { useState, useEffect, useRef } from 'react';
import optimizeCloudinaryUrl from '../utils/cloudinaryOptimizer';

/**
 * Componente per lazy loading delle immagini con ottimizzazione Cloudinary automatica
 * Carica l'immagine solo quando entra nel viewport
 */
const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  style = {}, 
  placeholder = '/placeholder.png',
  onLoad,
  onError,
  cloudinaryOptions = {},
  ...props 
}) => {
  // Ottimizza URL Cloudinary automaticamente
  const optimizedSrc = src ? optimizeCloudinaryUrl(src, cloudinaryOptions) : src;
  
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    let observer;
    let didCancel = false;

    if (imgRef.current && optimizedSrc) {
      // Intersection Observer per lazy loading
      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              // Quando l'immagine entra nel viewport (o è vicina)
              if (!didCancel && (entry.intersectionRatio > 0 || entry.isIntersecting)) {
                const img = new Image();
                img.src = optimizedSrc;
                
                img.onload = () => {
                  if (!didCancel) {
                    setImageSrc(optimizedSrc);
                    setIsLoading(false);
                    onLoad && onLoad();
                  }
                };
                
                img.onerror = () => {
                  if (!didCancel) {
                    setHasError(true);
                    setIsLoading(false);
                    onError && onError();
                  }
                };
                
                // Stop observing dopo il caricamento
                if (observer && imgRef.current) {
                  observer.unobserve(imgRef.current);
                }
              }
            });
          },
          {
            threshold: 0.01,
            rootMargin: '75px' // Carica 75px prima che l'immagine entri nel viewport
          }
        );

        observer.observe(imgRef.current);
      } else {
        // Fallback per browser che non supportano IntersectionObserver
        setImageSrc(optimizedSrc);
        setIsLoading(false);
      }
    }

    return () => {
      didCancel = true;
      if (observer && observer.disconnect) {
        observer.disconnect();
      }
    };
  }, [optimizedSrc, onLoad, onError]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoading ? 'lazy-loading' : 'lazy-loaded'}`}
      style={{
        ...style,
        transition: 'opacity 0.3s ease-in-out',
        opacity: isLoading ? 0.6 : 1
      }}
      loading="lazy" // Native lazy loading come fallback
      {...props}
    />
  );
};

export default LazyImage;
