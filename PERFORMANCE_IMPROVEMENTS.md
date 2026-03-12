# 🚀 Miglioramenti Performance Proposti per LucanikoShop

## ⚠️ Problemi identificati e soluzioni

### 1. **Troppe richieste HTTP separate** (Priorità: ALTA)

#### Problema
Molti componenti fanno 3-8 chiamate API separate in parallelo:
```javascript
// AdminDashboard.jsx - 3+ chiamate
adminAPI.getStats(), adminAPI.getPendingSellers(), adminAPI.getAllSellers()

// ShopPage.jsx - 2-3 chiamate  
fetch vendors, fetch products, fetch reviews

// ProductDetail.jsx - 2-3 chiamate
fetch product, fetch reviews, fetch vendor
```

**Impatto:** Su connessioni lente (3G/4G) ogni chiamata aggiunge latenza (300-800ms ciascuna).

#### Soluzione: Endpoint aggregati

**Backend:**
```javascript
// NEW: /api/admin/dashboard - Unica chiamata per tutto
router.get('/dashboard', protect, admin, async (req, res) => {
  const [stats, pendingSellers, allSellers] = await Promise.all([
    getStatsLogic(),
    getPendingSellersLogic(),
    getAllSellersLogic()
  ]);
  
  res.json({ stats, pendingSellers, allSellers });
});

// NEW: /api/vendors/:id/full - Vendor + prodotti + reviews
router.get('/:id/full', async (req, res) => {
  const [vendor, products, reviews] = await Promise.all([
    getVendorLogic(),
    getProductsLogic(),
    getReviewsLogic()
  ]);
  
  res.json({ vendor, products, reviews });
});
```

**Frontend:**
```javascript
// Invece di 3 chiamate separate
const response = await fetch('/api/admin/dashboard');
const { stats, pendingSellers, allSellers } = response.json();
```

**Beneficio:** Riduzione 60-70% delle richieste HTTP = caricamento 2-3x più veloce

---

### 2. **Indici database mancanti** (Priorità: MEDIA)

#### Problema
Query MongoDB senza indici espliciti possono essere lente con molti prodotti.

#### Soluzione
Esegui lo script creato:
```bash
cd backend
node scripts/addDatabaseIndexes.js
```

Questo creerà indici ottimizzati per:
- `Product` (category, seller, isActive, rating)
- `Order` (buyer, vendor, status)
- `User` (email, role)
- `Review` (product, user)

**Beneficio:** Query 5-10x più veloci su grandi dataset

---

### 3. **Estendere cache Redis** (Priorità: BASSA)

#### Problema
Alcune route non hanno cache ma potrebbero averla.

#### Soluzione
Aggiungi cache su route statiche:

```javascript
// routes/categoryRoutes.js
router.get('/', cache(3600), getCategories);  // 1 ora
router.get('/main', cache(3600), getMainCategories);

// routes/vendorRoutes.js  
router.get('/', cache(600), getAllVendors);  // 10 min
```

**Beneficio:** Meno carico sul database MongoDB

---

### 4. **Preload font critici** (Priorità: MOLTO BASSA)

#### Problema
Font Google Fonts caricati in modo asincrono causano FOUT (Flash of Unstyled Text).

#### Soluzione
Se usi font custom, aggiungi in `index.html`:
```html
<link rel="preload" href="/fonts/your-font.woff2" as="font" type="font/woff2" crossorigin>
```

**Beneficio:** Riduce leggermente il CLS (Cumulative Layout Shift)

---

## 📊 Impatto previsto

| Miglioramento | Priorità | Impatto Velocità | Difficoltà | Tempo |
|---------------|----------|------------------|------------|-------|
| Endpoint aggregati | ALTA | **+60-70%** | Media | 3-4 ore |
| Indici database | MEDIA | **+30-50%** | Bassa | 10 min |
| Estendere cache | BASSA | **+10-15%** | Bassa | 30 min |
| Preload font | MOLTO BASSA | **+2-5%** | Bassa | 5 min |

---

## ✅ Cosa è GIÀ ottimizzato

1. **Hosting:** Railway con gzip compression ✅
2. **Immagini:** Cloudinary CDN + WebP + lazy loading ✅
3. **Code splitting:** Vite con chunk ottimizzati ✅
4. **Cache Redis:** Su endpoint prodotti principali ✅
5. **Database:** `.lean()` e populate selettivi ✅
6. **CDN:** Cloudinary globale ✅
7. **Minificazione:** Terser + rimozione console.log ✅

---

## 🎯 Raccomandazione finale

**Implementa SOLO il punto 1 (endpoint aggregati)** → Questo darà il **massimo beneficio** con sforzo ragionevole.

Gli altri punti sono opzionali e danno ritorni decrescenti.
