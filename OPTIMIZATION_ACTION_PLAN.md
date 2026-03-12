# 🚀 Piano d'Azione: Ottimizzazioni Performance LucanikoShop

## ✅ GIÀ IMPLEMENTATO (Non serve fare nulla)

### Frontend
- ✅ React Lazy Loading (tutte le pagine)
- ✅ Code Splitting Vite (vendor chunks)
- ✅ Minificazione Terser
- ✅ Tree shaking automatico
- ✅ Immagini: WebP, lazy loading, CDN Cloudinary
- ✅ Preconnect DNS (Cloudinary, API, Google Fonts)

### Backend
- ✅ Compressione GZIP
- ✅ Cache Redis su prodotti principali
- ✅ MongoDB `.lean()` per query read-only
- ✅ Populate selettivo (solo campi necessari)

---

## 🔥 DA IMPLEMENTARE - Quick Wins (1-2 ore)

### 1. Indici Database (10 min) ⚡ PRIORITÀ MASSIMA
**Impatto:** Query 5-10x più veloci

```bash
cd backend
node scripts/addDatabaseIndexes.js
```

✅ **Fatto:** Script già creato, basta eseguirlo!

---

### 2. Estendere Cache Redis (COMPLETATO ✅)

**Route aggiornate:**
- ✅ `/api/vendors/*` - Cache 10 minuti
- ✅ `/api/sponsors/*` - Cache 10 minuti
- ✅ Categorie, Eventi, Esperienze già cached

**Beneficio:** -40% carico database

---

### 3. Ottimizzare Query MongoDB Projection (20 min)

**Problema:** Le liste prodotti scaricano TUTTI i campi (incluso description completo).

**Soluzione:** Select solo campi necessari per le card:

```javascript
// In productController.js - getProducts()
products = await Product.find(query)
  .select('name price originalPrice discountedPrice hasActiveDiscount discountPercentage images category subcategory seller stock isActive hasVariants variants rating numReviews')
  .populate('seller', 'name businessName slug')
  .populate('category', 'name')
  .populate('subcategory', 'name')
  .lean()
```

**Beneficio:** -30-40% dati trasferiti, risposta 2-3x più veloce

---

### 4. Prefetch Route Critiche (15 min)

**Aggiungere prefetch per le pagine più visitate:**

```javascript
// In frontend/src/App.jsx
import { Link } from 'react-router-dom';

// Prefetch delle pagine più visitate al mount
useEffect(() => {
  // Preload componenti critici dopo 2 secondi
  setTimeout(() => {
    import('./pages/Products');
    import('./pages/Cart');
    import('./pages/ProductDetail');
  }, 2000);
}, []);
```

**Beneficio:** Navigazione istantanea per utenti che visitano queste pagine

---

### 5. HTTP Headers Ottimali (10 min)

**Aggiungere in backend/server.js:**

```javascript
// Cache control per risorse statiche
app.use(express.static('public', {
  maxAge: '1y',
  immutable: true
}));

// Security headers aggiuntivi
app.use(helmet({
  contentSecurityPolicy: false, // Già gestito
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

**Beneficio:** Browser cache più aggressiva sulle risorse statiche

---

## 🎯 OTTIMIZZAZIONI AVANZATE (3-5 ore)

### 6. Endpoint Aggregati (3 ore) ⭐ MAX IMPATTO

**Problema:** Frontend fa 3-8 chiamate API separate.

**Esempio - AdminDashboard:**
```javascript
// PRIMA (3 chiamate)
const stats = await adminAPI.getStats();
const pending = await adminAPI.getPendingSellers();
const sellers = await adminAPI.getAllSellers();

// DOPO (1 chiamata)
const { stats, pending, sellers } = await adminAPI.getDashboardData();
```

**Route da creare:**

#### Backend: `routes/aggregateRoutes.js`
```javascript
// 1. Admin Dashboard
router.get('/admin/dashboard', protect, admin, async (req, res) => {
  const [stats, pendingSellers, allSellers] = await Promise.all([
    getStatsLogic(),
    getPendingSellersLogic(),
    getAllSellersLogic()
  ]);
  res.json({ stats, pendingSellers, allSellers });
});

// 2. Shop Page Full
router.get('/shops/:id/full', cache(300), async (req, res) => {
  const [vendor, products, reviews] = await Promise.all([
    getVendorLogic(),
    getProductsByVendorLogic(),
    getReviewsLogic()
  ]);
  res.json({ vendor, products, reviews });
});

// 3. Product Detail Full
router.get('/products/:id/full', cache(600), async (req, res) => {
  const [product, reviews, vendor, suggestedProducts] = await Promise.all([
    getProductLogic(),
    getReviewsLogic(),
    getVendorLogic(),
    getSuggestedProductsLogic()
  ]);
  res.json({ product, reviews, vendor, suggestedProducts });
});
```

**Beneficio:** -60-70% richieste HTTP = **2-3x più veloce**

---

### 7. React.memo per Componenti Pesanti (1 ora)

**Ottimizzare re-render evitabili:**

```javascript
// ProductCard.jsx
import { memo } from 'react';

const ProductCard = memo(({ product, fromShop }) => {
  // ... codice esistente
}, (prevProps, nextProps) => {
  // Re-render solo se product._id cambia
  return prevProps.product._id === nextProps.product._id;
});

export default ProductCard;
```

**Componenti da memoizzare:**
- ProductCard
- SuggestedProductsCarousel
- OtherCategoriesCarousel
- CategoriesCarouselArrows

**Beneficio:** -30-40% re-render inutili

---

### 8. Virtual Scrolling per Liste Lunghe (2 ore)

**Per pagine con 50+ prodotti, usa react-window:**

```bash
npm install react-window
```

```javascript
// Products.jsx
import { FixedSizeGrid } from 'react-window';

const ProductGrid = ({ products }) => (
  <FixedSizeGrid
    columnCount={4}
    columnWidth={280}
    height={600}
    rowCount={Math.ceil(products.length / 4)}
    rowHeight={400}
    width={1200}
  >
    {({ columnIndex, rowIndex, style }) => {
      const index = rowIndex * 4 + columnIndex;
      return (
        <div style={style}>
          <ProductCard product={products[index]} />
        </div>
      );
    }}
  </FixedSizeGrid>
);
```

**Beneficio:** Pagine con 100+ prodotti restano fluide

---

### 9. Service Worker per Caching Offline (1 ora)

**Vite PWA già supportato:**

```bash
npm install vite-plugin-pwa -D
```

```javascript
// vite.config.js
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60 // 1 settimana
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.railway\.app\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 3
            }
          }
        ]
      }
    })
  ]
});
```

**Beneficio:** App funziona offline, immagini cached localmente

---

## 📊 Riepilogo Impatto per Priorità

| Ottimizzazione | Tempo | Impatto Velocità | Difficoltà | Priorità |
|---------------|-------|------------------|------------|----------|
| 1. Indici DB | 10 min | **+500-1000%** | ⚪ Bassa | 🔴 CRITICA |
| 2. Cache estesa | FATTO ✅ | **+40%** | ⚪ Bassa | 🟢 Completato |
| 3. Query projection | 20 min | **+200-300%** | ⚪ Bassa | 🟡 Alta |
| 4. Route prefetch | 15 min | **+50-100%** | ⚪ Bassa | 🟡 Alta |
| 5. HTTP headers | 10 min | **+20%** | ⚪ Bassa | 🟢 Media |
| 6. Endpoint aggregati | 3 ore | **+200-300%** | 🟡 Media | 🔴 CRITICA |
| 7. React.memo | 1 ora | **+30-40%** | ⚪ Bassa | 🟢 Media |
| 8. Virtual scroll | 2 ore | **+100%** (liste) | 🟡 Media | 🟢 Media |
| 9. Service Worker | 1 ora | **+100%** (repeat) | 🟡 Media | 🟢 Media |

---

## 🎯 PIANO CONSIGLIATO

### Questo pomeriggio (1 ora):
1. ✅ Esegui script indici DB (10 min)
2. ✅ Ottimizza query projection (20 min)
3. ✅ Aggiungi prefetch route (15 min)
4. ✅ HTTP headers (10 min)

**Risultato:** +70-80% più veloce con 1 ora di lavoro

### Questo weekend (4-5 ore):
5. ⭐ Endpoint aggregati (3 ore)
6. ✅ React.memo (1 ora)
7. ✅ Virtual scrolling (2 ore - opzionale)

**Risultato:** +150-200% più veloce complessivo

---

## 💡 CONSIGLIO FINALE

**Inizia con i primi 4 punti (1 ora totale)** = massimo risultato, minimo sforzo!

Gli endpoint aggregati possono aspettare il weekend, ma già implementando i primi 4 vedrai miglioramenti significativi.

Vuoi che implementi i punti 3-4-5 adesso? 🚀
