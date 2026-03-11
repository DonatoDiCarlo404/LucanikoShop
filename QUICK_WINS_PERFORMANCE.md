// 🚀 QUICK WINS - Ottimizzazioni implementabili in 30 minuti
// Applicare in questo ordine per massimo impatto

// ============================================
// 1. HELPER OTTIMIZZAZIONE IMMAGINI CLOUDINARY
// ============================================
// File: frontend/src/utils/imageOptimizer.js

export const getOptimizedImageUrl = (url, options = {}) => {
  const {
    width = 400,
    height = null,
    quality = 'auto',
    format = 'auto',
    crop = 'fill'
  } = options;

  // Se non è Cloudinary, ritorna l'URL originale
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  // Costruisci trasformazioni
  const transformations = [
    `w_${width}`,
    height ? `h_${height}` : null,
    `q_${quality}`,
    `f_${format}`,
    `c_${crop}`
  ].filter(Boolean).join(',');

  // Inserisci trasformazioni nell'URL
  return url.replace('/upload/', `/upload/${transformations}/`);
};

// Preset per diversi contesti
export const IMAGE_PRESETS = {
  thumbnail: { width: 150, height: 150, crop: 'thumb', quality: 'auto:low' },
  card: { width: 400, height: 300, crop: 'fill' },
  detail: { width: 800, quality: 'auto:good' },
  hero: { width: 1200, height: 600, quality: 'auto:best' },
  avatar: { width: 100, height: 100, crop: 'thumb', quality: 'auto:low' }
};

// ============================================
// 2. COMPONENTE IMMAGINE OTTIMIZZATA
// ============================================
// File: frontend/src/components/OptimizedImage.jsx

import React from 'react';
import { getOptimizedImageUrl, IMAGE_PRESETS } from '../utils/imageOptimizer';

const OptimizedImage = ({ 
  src, 
  alt, 
  preset = 'card',
  className = '',
  style = {},
  ...props 
}) => {
  // Usa preset o opzioni custom
  const options = typeof preset === 'string' 
    ? IMAGE_PRESETS[preset] 
    : preset;
  
  const optimizedSrc = getOptimizedImageUrl(src, options);

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      loading="lazy" // ⚡ Lazy loading nativo
      decoding="async" // ⚡ Decoding asincrono
      className={className}
      style={style}
      {...props}
    />
  );
};

export default OptimizedImage;

// ============================================
// 3. MIDDLEWARE CACHE REDIS
// ============================================
// File: backend/middlewares/cache.js

import { getRedisClient, isRedisAvailable } from '../config/redis.js';

// Cache middleware generico
export const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    // Solo per GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Se Redis non disponibile, passa oltre
    if (!isRedisAvailable()) {
      return next();
    }

    try {
      const redisClient = getRedisClient();
      
      // Chiave cache basata su URL + query params + user role
      const userRole = req.user?.role || 'guest';
      const cacheKey = `cache:${userRole}:${req.originalUrl}`;

      // Prova a recuperare dalla cache
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return res.json(JSON.parse(cachedData));
      }

      console.log(`❌ Cache MISS: ${cacheKey}`);

      // Override res.json per salvare in cache
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        // Salva in cache con TTL
        redisClient.setEx(cacheKey, duration, JSON.stringify(data))
          .catch(err => console.error('Cache save error:', err));
        
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Helper per invalidare cache
export const invalidateCache = async (pattern) => {
  if (!isRedisAvailable()) return;
  
  try {
    const redisClient = getRedisClient();
    const keys = await redisClient.keys(pattern);
    
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`🗑️  Invalidate cache: ${keys.length} keys (${pattern})`);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};

// Preset cache per diversi tipi di dati
export const cacheShort = cacheMiddleware(60);      // 1 minuto
export const cacheMedium = cacheMiddleware(300);    // 5 minuti
export const cacheLong = cacheMiddleware(1800);     // 30 minuti
export const cacheVeryLong = cacheMiddleware(3600); // 1 ora

// ============================================
// 4. APPLICARE CACHE ALLE ROUTE PRINCIPALI
// ============================================
// File: backend/routes/productRoutes.js

import { cacheMedium, cacheLong, invalidateCache } from '../middlewares/cache.js';

// Route pubbliche con cache
router.get('/', cacheMedium, getProducts); // 5 minuti
router.get('/:id', cacheMedium, getProductById); // 5 minuti
router.get('/category/:category', cacheMedium, getProductsByCategory);

// Route che modificano dati -> invalidano cache
router.post('/', authenticateToken, authorizeVendor, async (req, res) => {
  await createProduct(req, res);
  await invalidateCache('cache:*:/api/products*'); // Invalida cache prodotti
});

router.put('/:id', authenticateToken, authorizeVendor, async (req, res) => {
  await updateProduct(req, res);
  await invalidateCache('cache:*:/api/products*');
});

router.delete('/:id', authenticateToken, authorizeVendor, async (req, res) => {
  await deleteProduct(req, res);
  await invalidateCache('cache:*:/api/products*');
});

// ============================================
// 5. OTTIMIZZARE QUERY MONGODB
// ============================================
// File: backend/controllers/productController.js

// ❌ PRIMA (carica tutto)
const products = await Product.find({ status: 'active' })
  .populate('seller');

// ✅ DOPO (solo campi necessari + lean)
const products = await Product.find({ status: 'active' })
  .populate('seller', 'businessName city rating')
  .select('title price images category city')
  .lean(); // +30% performance, ma senza metodi Mongoose

// Per liste: sempre .lean()
// Per singoli documenti con logica: NO .lean()

// ============================================
// 6. PRECONNECT NEL HTML
// ============================================
// File: frontend/index.html

<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- ⚡ PRECONNECT per domini esterni -->
  <link rel="preconnect" href="https://lucanikoshop-production.up.railway.app" crossorigin />
  <link rel="preconnect" href="https://res.cloudinary.com" />
  <link rel="dns-prefetch" href="https://js.stripe.com" />
  
  <title>LucanikoShop</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>

// ============================================
// 7. SETUP REDIS SU UPSTASH (GRATIS)
// ============================================

/*
PASSAGGI:

1. Vai su https://upstash.com/
2. Sign up (gratis, nessuna carta richiesta)
3. Create Database → Seleziona regione EU
4. Copia l'URL Redis (formato: rediss://default:***@eu1-example.upstash.io:6379)
5. Aggiungi su Railway:
   - Vai su railway.app → progetto backend
   - Variables → New Variable
   - Nome: REDIS_URL
   - Valore: rediss://default:***@eu1-example.upstash.io:6379
6. Riavvia deployment

✅ Redis si connetterà automaticamente (già configurato in config/redis.js)
*/

// ============================================
// 8. COMPONENTE LAZY LOAD INTELLIGENTE
// ============================================
// File: frontend/src/components/LazySection.jsx

import React, { Suspense } from 'react';
import { Spinner } from 'react-bootstrap';

const LazySection = ({ 
  children, 
  fallback = <Spinner animation="border" />,
  minHeight = '200px'
}) => {
  return (
    <Suspense fallback={
      <div style={{ minHeight, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {fallback}
      </div>
    }>
      {children}
    </Suspense>
  );
};

export default LazySection;

// Uso:
// const Reviews = lazy(() => import('./Reviews'));
// <LazySection minHeight="400px">
//   <Reviews productId={id} />
// </LazySection>

// ============================================
// 9. CHECKLIST APPLICAZIONE
// ============================================

/*
✅ IMMEDIATE (15 minuti):
1. Aggiungi preconnect in index.html
2. Setup Redis su Upstash
3. Crea imageOptimizer.js helper

✅ VELOCI (1-2 ore):
4. Crea OptimizedImage component
5. Sostituisci <img> con <OptimizedImage> nei componenti principali:
   - ProductCard.jsx
   - ProductDetail.jsx
   - ExperienceCard.jsx
   - EventCard.jsx

✅ IMPORTANTI (2-3 ore):
6. Crea cache.js middleware
7. Applica cache a productRoutes.js
8. Applica cache a experienceRoutes.js
9. Applica cache a eventRoutes.js

✅ OPZIONALI (1 ora):
10. Aggiungi .lean() nelle query di lista
11. Usa .select() per limitare campi popolati
12. Crea LazySection per sezioni pesanti

BENEFICIO TOTALE ATTESO:
- Redis cache: -300ms medio
- Immagini ottimizzate: -60% dimensione
- Query ottimizzate: -100ms liste
- Preconnect: -50ms connessione
= TOTALE: -2s caricamento iniziale
*/

// ============================================
// 10. TESTING
// ============================================

/*
Dopo ogni ottimizzazione, testa con:

1. Chrome DevTools → Network
   - Verifica dimensioni immagini ridotte
   - Controlla cache headers
   - Verifica timing API

2. Lighthouse (Chrome DevTools)
   - Target: Performance >90

3. Backend logs
   - Cerca "Cache HIT" nei log
   - Verifica "Cache disabilitata" NON appare più

4. Redis CLI (opzionale)
   npm install -g upstash-cli
   upstash redis connect YOUR_URL
   KEYS cache:*
   GET cache:guest:/api/products
*/
