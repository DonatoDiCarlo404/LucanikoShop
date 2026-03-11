# 🚀 PIANO OTTIMIZZAZIONE PERFORMANCE - LUCANIKOSHOP

**Data analisi:** 11 Marzo 2026  
**Obiettivo:** Ridurre tempi di caricamento del 50-70%

---

## 📊 ANALISI ATTUALE

### ✅ **Già Ottimizzato** (Buone pratiche già implementate)

1. **Frontend (React + Vite)**
   - ✅ Lazy loading di tutte le route (React.lazy + Suspense)
   - ✅ Code splitting con manualChunks (react, bootstrap, stripe separati)
   - ✅ Drop console.log in produzione
   - ✅ Terser minification
   - ✅ No sourcemaps in produzione

2. **Backend (Node.js + Express)**
   - ✅ Compression gzip/deflate (riduzione 70% payload)
   - ✅ Helmet per security headers
   - ✅ CORS configurato correttamente
   - ✅ MongoDB indici ben configurati (categoria, città, seller, status)

3. **Database**
   - ✅ Indici su tutti i campi frequentemente query-ati
   - ✅ Text indexes per ricerca full-text

---

## ⚠️ **PROBLEMI CRITICI** (Da risolvere SUBITO)

### 🔴 1. Redis Cache NON ATTIVA ⚡ **MASSIMA PRIORITÀ**
**Impatto:** Ogni richiesta colpisce MongoDB anche per dati statici  
**Perdita:** ~200-500ms per ogni API call ripetitiva

#### **Soluzione: Attivare Upstash Redis (GRATUITO)**

1. Vai su https://upstash.com/ → Sign up (gratis)
2. Crea database Redis → Copia `REDIS_URL`
3. Aggiungi a Railway:
   ```bash
   REDIS_URL=rediss://default:***@your-region.upstash.io:6379
   ```

4. Riavvia il server → Redis si connetterà automaticamente

**Beneficio atteso:** -300ms medio su API frequenti

---

### 🟡 2. Mancanza di Middleware Cache per API

Attualmente Redis è configurato ma **non viene usato** nelle route.

#### **Soluzione: Aggiungere cache middleware**

**File da creare:** `backend/middlewares/cache.js`

\`\`\`javascript
import { getRedisClient, isRedisAvailable } from '../config/redis.js';

// Cache middleware generico
export const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    // Solo per GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Verifica se Redis è disponibile
    if (!isRedisAvailable()) {
      return next();
    }

    try {
      const redisClient = getRedisClient();
      const key = \`cache:\${req.originalUrl}\`;

      // Prova a recuperare dalla cache
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        console.log(\`✅ Cache HIT: \${key}\`);
        return res.json(JSON.parse(cachedData));
      }

      // Cache MISS: continua e salva risposta
      console.log(\`❌ Cache MISS: \${key}\`);
      
      // Override res.json per cachare la risposta
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        // Salva in cache con TTL
        redisClient.setEx(key, duration, JSON.stringify(data))
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

// Cache per liste (prodotti, esperienze, etc)
export const cacheList = cacheMiddleware(300); // 5 minuti

// Cache per dettagli (singolo prodotto, esperienza)
export const cacheDetail = cacheMiddleware(600); // 10 minuti

// Cache per statistiche pubbliche
export const cacheStats = cacheMiddleware(1800); // 30 minuti
\`\`\`

**Applicare alle route principali:**

\`\`\`javascript
// backend/routes/productRoutes.js
import { cacheList, cacheDetail } from '../middlewares/cache.js';

router.get('/', cacheList, getProducts); // Cache 5min
router.get('/:id', cacheDetail, getProductById); // Cache 10min

// backend/routes/experienceRoutes.js  
router.get('/', cacheList, getExperiences);
router.get('/:id', cacheDetail, getExperienceById);

// backend/routes/eventRoutes.js
router.get('/', cacheList, getEvents);
\`\`\`

**Beneficio atteso:** -400ms su liste prodotti/esperienze

---

### 🟡 3. Immagini Cloudinary Non Ottimizzate

Attualmente le immagini vengono servite a risoluzione piena.

#### **Soluzione: Trasformazioni Cloudinary automatiche**

**File da modificare:** `frontend/src/components/ProductCard.jsx`, `ProductDetail.jsx`, etc.

\`\`\`javascript
// ❌ PRIMA (immagine non ottimizzata)
<img src={product.images[0].url} alt={product.title} />

// ✅ DOPO (immagine ottimizzata)
const optimizeCloudinaryUrl = (url, width = 400, quality = 'auto') => {
  if (!url || !url.includes('cloudinary')) return url;
  
  // Inserisce trasformazioni nell'URL Cloudinary
  return url.replace(
    '/upload/',
    \`/upload/w_\${width},q_\${quality},f_auto/\`
  );
};

<img 
  src={optimizeCloudinaryUrl(product.images[0].url, 400)} 
  alt={product.title}
  loading="lazy" // ⚠️ IMPORTANTE!
/>
\`\`\`

**Helper da creare:** `frontend/src/utils/imageOptimizer.js`

\`\`\`javascript
export const getOptimizedImageUrl = (url, options = {}) => {
  const {
    width = 400,
    height = 'auto',
    quality = 'auto',
    format = 'auto',
    crop = 'fill'
  } = options;

  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  const transformations = [
    \`w_\${width}\`,
    height !== 'auto' ? \`h_\${height}\` : null,
    \`q_\${quality}\`,
    \`f_\${format}\`,
    crop ? \`c_\${crop}\` : null
  ].filter(Boolean).join(',');

  return url.replace('/upload/', \`/upload/\${transformations}/\`);
};

// Preset per diversi usi
export const IMAGE_PRESETS = {
  thumbnail: { width: 150, height: 150, crop: 'thumb' },
  card: { width: 400, height: 300, crop: 'fill' },
  detail: { width: 800, quality: 'auto:good' },
  hero: { width: 1200, quality: 'auto:best' }
};
\`\`\`

**Beneficio atteso:** -60% dimensione immagini = -1-2s caricamento pagine

---

### 🟡 4. Query N+1 nei Populate MongoDB

Alcune route fanno populate multipli inefficienti.

#### **Soluzione: Usa \`.select()\` per limitare campi**

\`\`\`javascript
// ❌ PRIMA (carica TUTTI i campi del seller)
const products = await Product.find()
  .populate('seller');

// ✅ DOPO (carica solo i campi necessari)
const products = await Product.find()
  .populate('seller', 'name businessName email city');
  
// ✅ ANCORA MEGLIO (usa lean() se non serve Mongoose doc)
const products = await Product.find()
  .populate('seller', 'name businessName city')
  .lean(); // +30% velocità, ma niente metodi Mongoose
\`\`\`

**Controllare in:**
- `productController.js`
- `orderController.js`  
- `experienceController.js`

**Beneficio atteso:** -100ms su liste complesse

---

## 🔧 **OTTIMIZZAZIONI MEDIE** (Implementare dopo le critiche)

### 5. Preload Route Critiche

Aggiungi prefetch per le route più usate:

\`\`\`javascript
// frontend/src/App.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Prefetch route quando si hovera sui link
const prefetchRoutes = () => {
  useEffect(() => {
    const links = document.querySelectorAll('a[href^="/"]');
    links.forEach(link => {
      link.addEventListener('mouseenter', () => {
        const href = link.getAttribute('href');
        if (href === '/products') {
          import('./pages/Products'); // Prefetch
        }
      });
    });
  }, []);
};
\`\`\`

**Beneficio:** Pagine istantanee al click

---

### 6. Service Worker per PWA

\`\`\`javascript
// frontend/public/sw.js
const CACHE_NAME = 'lucanikoshop-v1';
const urlsToCache = [
  '/',
  '/products',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
\`\`\`

**Beneficio:** Funziona offline, -50% chiamate ripetute

---

### 7. Lazy Load Immagini Intelligente

\`\`\`bash
npm install react-lazy-load-image-component
\`\`\`

\`\`\`javascript
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

<LazyLoadImage
  src={optimizedUrl}
  effect="blur"
  placeholderSrc="/placeholder.jpg"
/>
\`\`\`

---

## 📈 **RISULTATI ATTESI**

| Ottimizzazione | Tempo Risparmiato | Priorità |
|---|---|---|
| Redis Cache | -300ms | 🔴 CRITICA |
| Middleware Cache API | -400ms | 🔴 CRITICA |
| Immagini Ottimizzate | -1500ms | 🟡 ALTA |
| Query Optimize (.lean) | -100ms | 🟡 ALTA |
| Preload Routes | -200ms | 🟢 MEDIA |
| Service Worker | -50% repeat | 🟢 MEDIA |

**TOTALE ATTESO: -2.5s sul caricamento iniziale**

---

## ✅ **PIANO DI IMPLEMENTAZIONE (Ordine consigliato)**

### Settimana 1: Critiche
1. ✅ **GIORNO 1:** Attiva Upstash Redis (15 minuti)
2. ✅ **GIORNO 2:** Implementa cache middleware (2 ore)
3. ✅ **GIORNO 3:** Applica cache alle route principali (1 ora)
4. ✅ **GIORNO 4:** Test e monitoring (30 min)

### Settimana 2: Alte priorità  
5. ✅ **GIORNO 5-6:** Ottimizza immagini Cloudinary (4 ore)
6. ✅ **GIORNO 7-8:** Ottimizza query con .lean() e .select() (3 ore)

### Settimana 3: Medie priorità
7. ✅ **GIORNO 9-10:** Implementa prefetch routes (2 ore)
8. ✅ **GIORNO 11-12:** Service Worker PWA (4 ore)

---

## 🎯 **QUICK WINS** (Implementabili in 1 ora!)

1. **Aggiungi \`loading="lazy"\` a TUTTE le immagini**
   \`\`\`javascript
   <img src={url} loading="lazy" alt={alt} />
   \`\`\`

2. **Abilita HTTP/2 su Railway** (già attivo probabilmente)

3. **Aggiungi \`rel="preconnect"\` in index.html**
   \`\`\`html
   <link rel="preconnect" href="https://api.lucanikoshop.it">
   <link rel="preconnect" href="https://res.cloudinary.com">
   \`\`\`

4. **Riduci bundle rimuovendo librerie inutilizzate**
   \`\`\`bash
   npx depcheck # Trova dipendenze non usate
   \`\`\`

---

## 📊 MONITORING

Dopo le ottimizzazioni, monitora con:

1. **Lighthouse (Chrome DevTools)**
   - Target: >90 Performance Score

2. **GTmetrix** (https://gtmetrix.com)
   - Target: Fully Loaded < 3s

3. **WebPageTest** (https://www.webpagetest.org)
   - Target: First Contentful Paint < 1.5s

---

## 💡 NOTE FINALI

- **Redis è GRATUITO** con Upstash (fino a 10,000 comandi/giorno)
- **Cloudinary** trasformazioni sono incluse nel piano gratuito
- Tutte le ottimizzazioni sono **retrocompatibili**
- **Nessun breaking change** per gli utenti

**STIMA COSTO TEMPORALE TOTALE:** 20 ore sviluppo  
**BENEFICIO:** -60% tempo caricamento medio
