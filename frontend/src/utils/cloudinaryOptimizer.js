/**
 * Utility per ottimizzare automaticamente le immagini Cloudinary
 * 
 * Funzionalità:
 * - Formato automatico (WebP quando supportato)
 * - Qualità automatica (riduce dimensione file senza perdita percettibile)
 * - Responsive sizing
 * - Lazy loading friendly
 */

/**
 * Ottimizza URL Cloudinary con trasformazioni automatiche
 * 
 * @param {string} url - URL originale Cloudinary
 * @param {object} options - Opzioni di ottimizzazione
 * @param {number} options.width - Larghezza desiderata (opzionale)
 * @param {number} options.height - Altezza desiderata (opzionale)
 * @param {string} options.quality - Qualità: 'auto', 'auto:low', 'auto:good', 'auto:best' (default: 'auto')
 * @param {string} options.format - Formato: 'auto', 'webp', 'jpg', 'png' (default: 'auto')
 * @param {string} options.crop - Tipo di crop: 'fill', 'fit', 'limit', 'scale' (default: 'limit')
 * @returns {string} URL ottimizzata
 */
export const optimizeCloudinaryUrl = (url, options = {}) => {
  if (!url || typeof url !== 'string') return url;
  
  // Verifica se è un URL Cloudinary
  if (!url.includes('cloudinary.com') && !url.includes('res.cloudinary')) {
    return url;
  }

  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'limit',
    dpr = 'auto' // Device Pixel Ratio
  } = options;

  // Costruisci le trasformazioni
  const transformations = [];

  // Qualità e formato automatici (WebP quando supportato)
  transformations.push(`f_${format}`);
  transformations.push(`q_${quality}`);

  // Device Pixel Ratio per display retina
  transformations.push(`dpr_${dpr}`);

  // Dimensioni responsive
  if (width || height) {
    const sizeParams = [];
    if (width) sizeParams.push(`w_${width}`);
    if (height) sizeParams.push(`h_${height}`);
    sizeParams.push(`c_${crop}`);
    transformations.push(sizeParams.join(','));
  }

  // Stringa trasformazione completa
  const transformString = transformations.join(',');

  // Inserisci le trasformazioni nell'URL
  // Pattern: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{path}
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;

  // Controlla se ci sono già trasformazioni
  const afterUpload = url.substring(uploadIndex + 8);
  const versionMatch = afterUpload.match(/^v\d+\//);
  
  if (versionMatch) {
    // Ha già versione, inserisci trasformazioni prima
    return url.replace('/upload/', `/upload/${transformString}/`);
  } else {
    // Potrebbe avere già trasformazioni, sostituiscile
    const parts = afterUpload.split('/');
    if (parts[0].includes('_')) {
      // Ha trasformazioni esistenti, sostituiscile
      parts[0] = transformString;
      return url.substring(0, uploadIndex + 8) + parts.join('/');
    } else {
      // Nessuna trasformazione, aggiungile
      return url.replace('/upload/', `/upload/${transformString}/`);
    }
  }
};

/**
 * Preset di ottimizzazione per casi d'uso comuni
 */
export const CloudinaryPresets = {
  // Thumbnail prodotti (200x200)
  thumbnail: (url) => optimizeCloudinaryUrl(url, {
    width: 200,
    height: 200,
    crop: 'fill',
    quality: 'auto:good'
  }),

  // Card prodotto (400x400)
  productCard: (url) => optimizeCloudinaryUrl(url, {
    width: 400,
    height: 400,
    crop: 'limit',
    quality: 'auto'
  }),

  // Dettaglio prodotto (800x800)
  productDetail: (url) => optimizeCloudinaryUrl(url, {
    width: 800,
    height: 800,
    crop: 'limit',
    quality: 'auto:best'
  }),

  // Galleria prodotto full (1200x1200)
  productGallery: (url) => optimizeCloudinaryUrl(url, {
    width: 1200,
    height: 1200,
    crop: 'limit',
    quality: 'auto:best'
  }),

  // Logo vendor (300x300)
  vendorLogo: (url) => optimizeCloudinaryUrl(url, {
    width: 300,
    height: 300,
    crop: 'fit',
    quality: 'auto:good'
  }),

  // Avatar utente (150x150)
  avatar: (url) => optimizeCloudinaryUrl(url, {
    width: 150,
    height: 150,
    crop: 'fill',
    quality: 'auto:good'
  }),

  // Responsive - genera URL per diversi breakpoint
  responsive: (url) => ({
    mobile: optimizeCloudinaryUrl(url, { width: 400, quality: 'auto' }),
    tablet: optimizeCloudinaryUrl(url, { width: 768, quality: 'auto' }),
    desktop: optimizeCloudinaryUrl(url, { width: 1200, quality: 'auto:best' })
  })
};

/**
 * Hook React per URL ottimizzate con srcset responsive
 * 
 * @param {string} url - URL originale
 * @param {string} preset - Nome preset da CloudinaryPresets
 * @returns {object} { src, srcSet }
 */
export const useOptimizedImage = (url, preset = 'productCard') => {
  if (!url) return { src: '', srcSet: '' };

  // Usa preset se esiste
  if (CloudinaryPresets[preset] && typeof CloudinaryPresets[preset] === 'function') {
    const optimizedUrl = CloudinaryPresets[preset](url);
    
    // Genera srcSet per responsive
    const srcSet = [
      `${optimizeCloudinaryUrl(url, { width: 400 })} 400w`,
      `${optimizeCloudinaryUrl(url, { width: 800 })} 800w`,
      `${optimizeCloudinaryUrl(url, { width: 1200 })} 1200w`
    ].join(', ');

    return {
      src: optimizedUrl,
      srcSet
    };
  }

  // Default: ottimizzazione base
  return {
    src: optimizeCloudinaryUrl(url),
    srcSet: ''
  };
};

export default optimizeCloudinaryUrl;
