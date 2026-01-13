# 🎯 Sistema Attributi Dinamici - Implementazione Completata

## 📋 Panoramica

Sistema completo di attributi dinamici per categorie che permette di:
- ✅ Definire attributi specifici per ogni categoria (taglia, colore, materiale, ecc.)
- ✅ Generare automaticamente varianti prodotto (es. t-shirt rossa M, t-shirt blu L)
- ✅ Rendering dinamico del form basato sulla categoria selezionata
- ✅ Validazione attributi obbligatori lato backend
- ✅ Zero hardcoding - tutto configurabile da database

---

## 🏗️ Architettura Implementata

### Backend

#### 1. **Nuovo Model: CategoryAttribute**
📁 `backend/models/CategoryAttribute.js`

Definisce gli attributi disponibili per ogni categoria:
- `category`: riferimento alla categoria
- `name`: nome visualizzato (es. "Taglia")
- `key`: chiave programmatica (es. "size")
- `type`: tipo campo (select, multiselect, text, number, color)
- `required`: se obbligatorio
- `allowVariants`: se genera varianti
- `options`: valori disponibili per select/color
- `order`: ordine visualizzazione

#### 2. **Model Product Esteso**
📁 `backend/models/Product.js`

Aggiunti campi:
```javascript
attributes: [{
  key: String,    // es. "color"
  value: String   // es. "red"
}]
hasVariants: Boolean
variants: [{
  sku: String,
  attributes: [{ key, value }],
  price: Number,  // opzionale, null = usa prezzo base
  stock: Number,
  images: [String],
  active: Boolean
}]
```

#### 3. **Controller CategoryAttribute**
📁 `backend/controllers/categoryAttributeController.js`

Funzioni:
- `getCategoryAttributes()` - GET /api/categories/:id/attributes (PUBLIC)
- `createCategoryAttribute()` - POST /api/category-attributes (ADMIN)
- `updateCategoryAttribute()` - PUT /api/category-attributes/:id (ADMIN)
- `deleteCategoryAttribute()` - DELETE /api/category-attributes/:id (ADMIN)
- `getAllCategoryAttributes()` - GET /api/category-attributes (ADMIN)

#### 4. **Product Controller Esteso**
📁 `backend/controllers/productController.js`

`createProduct()` e `updateProduct()` ora:
- Validano attributi obbligatori per categoria
- Verificano completezza varianti
- Auto-generano SKU per varianti
- Gestiscono stock separato per variante

#### 5. **Routes**
- 📁 `backend/routes/categoryRoutes.js` - aggiunto GET /:id/attributes
- 📁 `backend/routes/categoryAttributeRoutes.js` - CRUD attributi (admin)
- 📁 `backend/server.js` - registrata route /api/category-attributes

### Frontend

#### 1. **ProductForm.jsx Refactored**
📁 `frontend/src/pages/ProductForm.jsx`

Modifiche:
- Stato esteso con `attributes`, `hasVariants`, `variants`
- Caricamento attributi dinamici quando cambia categoria
- Funzione `renderAttributeField()` per rendering campi dinamici
- Sezione "Attributi Specifici Categoria" (solo attributi non-varianti)
- Integrazione componente VariantManager

#### 2. **Nuovo Componente: VariantManager**
📁 `frontend/src/components/VariantManager.jsx`

Funzionalità:
- Generazione automatica tutte le combinazioni (prodotto cartesiano)
- Tabella interattiva per gestire stock/prezzo per variante
- Attiva/disattiva varianti singolarmente
- Badge contatore varianti attive
- Validazione form integrata

---

## 🚀 Come Utilizzare il Sistema

### 1. **Setup Iniziale - Popola Attributi**

Esegui lo script seed per creare attributi di esempio:

```bash
cd backend
node seedCategoryAttributes.js
```

Questo creerà attributi per:
- **Abbigliamento**: Taglia (XS-XXL), Colore, Materiale, Genere
- **Scarpe**: Numero (35-54), Colore, Tipo, Genere
- **Elettronica**: Marca, Modello, Garanzia, Condizione
- **Casa e Giardino**: Materiale, Colore
- **Gioielli**: Materiale, Taglia

**Output atteso:**
```
📦 Connessione al database riuscita
✅ Trovate 8 categorie
🗑️  Attributi precedenti eliminati
✨ Creati 23 attributi per 5 categorie
🎉 Seed completato con successo!
```

### 2. **Creare Prodotto con Varianti (Esempio: T-Shirt)**

1. Vai su "Nuovo Prodotto"
2. Compila campi base (nome, descrizione, prezzo BASE, stock BASE)
3. **Seleziona categoria "Abbigliamento"**
4. 🎉 **Magia!** Il form mostra automaticamente:
   - Campo "Materiale" (attributo semplice)
   - Campo "Genere" (attributo semplice)
5. Scorri in basso, vedi sezione **"Varianti Prodotto"**
6. Click su "🚀 Genera Tutte le Varianti Automaticamente"
7. Appare tabella con **48 varianti** (6 taglie × 8 colori)
8. Per ogni variante imposta:
   - **Stock**: quantità disponibile (es. 10)
   - **Prezzo**: lascia vuoto per usare prezzo base, o specifica (es. XL costa +2€)
   - **Attiva**: switch on/off
9. Carica immagini (stella per principale)
10. Submit!

**Risultato backend:**
```javascript
{
  name: "T-Shirt Cotone Bio",
  price: 19.99,  // prezzo base
  category: "...",
  attributes: [
    { key: "material", value: "cotton" },
    { key: "gender", value: "unisex" }
  ],
  hasVariants: true,
  variants: [
    {
      sku: "TSH-BL-XS-A3F2",
      attributes: [
        { key: "size", value: "xs" },
        { key: "color", value: "black" }
      ],
      stock: 10,
      price: null,  // usa 19.99
      active: true
    },
    {
      sku: "TSH-RE-XL-B8D1",
      attributes: [
        { key: "size", value: "xl" },
        { key: "color", value: "red" }
      ],
      stock: 5,
      price: 21.99,  // prezzo custom per XL
      active: true
    },
    // ... altre 46 varianti
  ]
}
```

### 3. **Aggiungere Nuova Categoria con Attributi (Admin)**

#### Via API (Postman/curl):

```bash
# 1. Crea categoria
POST http://localhost:5000/api/categories
Authorization: Bearer ADMIN_TOKEN
{
  "name": "Accessori",
  "slug": "accessori"
}

# 2. Aggiungi attributo "Materiale"
POST http://localhost:5000/api/category-attributes
Authorization: Bearer ADMIN_TOKEN
{
  "category": "CATEGORY_ID_QUI",
  "name": "Materiale",
  "key": "material",
  "type": "select",
  "required": true,
  "allowVariants": false,
  "options": [
    { "label": "Pelle", "value": "leather" },
    { "label": "Tessuto", "value": "fabric" },
    { "label": "Metallo", "value": "metal" }
  ],
  "order": 1
}

# 3. Aggiungi attributo "Colore" (con varianti!)
POST http://localhost:5000/api/category-attributes
{
  "category": "CATEGORY_ID_QUI",
  "name": "Colore",
  "key": "color",
  "type": "color",
  "required": true,
  "allowVariants": true,  // ← genera varianti!
  "options": [
    { "label": "Nero", "value": "black", "color": "#000000" },
    { "label": "Marrone", "value": "brown", "color": "#8B4513" }
  ],
  "order": 2
}
```

**Risultato:** 
- Frontend NON richiede modifiche
- Quando seller seleziona "Accessori", form mostra automaticamente Materiale + Colore
- Se il prodotto ha solo Colore (con allowVariants=true), mostra sezione varianti

---

## 🎨 Tipi di Campo Supportati

### 1. **select** (Dropdown singola scelta)
```javascript
{
  type: "select",
  options: [
    { label: "Piccolo", value: "small" },
    { label: "Grande", value: "large" }
  ]
}
```

### 2. **multiselect** (Checkbox multiple)
```javascript
{
  type: "multiselect",
  options: [
    { label: "Wifi", value: "wifi" },
    { label: "Bluetooth", value: "bluetooth" }
  ]
}
// Salva come: "wifi,bluetooth"
```

### 3. **color** (Palette colori)
```javascript
{
  type: "color",
  options: [
    { label: "Rosso", value: "red", color: "#FF0000" },
    { label: "Blu", value: "blue", color: "#0000FF" }
  ]
}
```
Mostra quadrati colorati cliccabili con checkmark quando selezionati.

### 4. **number** (Input numerico con validazione)
```javascript
{
  type: "number",
  validation: { min: 0, max: 100 },
  placeholder: "Inserisci valore"
}
```

### 5. **text** (Input testo libero)
```javascript
{
  type: "text",
  placeholder: "Inserisci descrizione"
}
```

---

## 🔧 Configurazione Avanzata

### Attributi Semplici vs Varianti

**Attributo Semplice** (`allowVariants: false`):
- Valore unico per tutto il prodotto
- Esempio: Materiale, Marca, Garanzia
- Mostrato in sezione "Attributi Specifici"

**Attributo Variante** (`allowVariants: true`):
- Genera combinazioni multiple
- Esempio: Taglia, Colore, Numero
- Mostrato in sezione "Varianti"

**Combinazioni automatiche:**
- 1 attributo variante (6 opzioni) = 6 varianti
- 2 attributi varianti (6 × 8) = 48 varianti
- 3 attributi varianti (6 × 8 × 3) = 144 varianti

### Validazioni Backend

**Attributi obbligatori:**
```javascript
// Se "Taglia" è required=true per Abbigliamento
// Il backend rifiuta prodotti senza taglia:
{
  "message": "Attributo obbligatorio mancante: Taglia"
}
```

**Varianti incomplete:**
```javascript
// Se generi varianti ma dimentichi un attributo
{
  "message": "Variante incompleta: manca Colore"
}
```

### Auto-generazione SKU

Backend genera automaticamente SKU univoci:
```
Formato: [PROD_PREFIX]-[ATTR_CODES]-[RANDOM]
Esempio: TSH-BL-M-A3F2
         │   │  │  │
         │   │  │  └─ Codice random
         │   │  └─── Taglia (M)
         │   └────── Colore (BLack)
         └────────── Prodotto (T-SHirt)
```

---

## 📊 Gestione Stock e Prezzi

### Scenario 1: Prodotto Semplice (no varianti)
```javascript
{
  price: 29.99,
  stock: 100,
  hasVariants: false
}
```
Stock e prezzo unici.

### Scenario 2: Prodotto con Varianti
```javascript
{
  price: 29.99,        // prezzo BASE
  stock: 0,            // ignorato se hasVariants=true
  hasVariants: true,
  variants: [
    {
      sku: "...",
      stock: 10,        // stock SPECIFICO variante
      price: null       // null = usa 29.99 (base)
    },
    {
      sku: "...",
      stock: 5,
      price: 34.99      // OVERRIDE prezzo per questa variante
    }
  ]
}
```

**Logica:**
- Ogni variante ha **stock indipendente**
- Se `variant.price` è `null` → usa `product.price`
- Se `variant.price` è valorizzato → usa quello specifico

---

## 🎯 Filtri e Ricerca (Future)

Gli attributi sono salvati in formato strutturato, pronti per:

```javascript
// Ricerca prodotti rossi taglia M
GET /api/products?attributes=color:red,size:m

// Aggregazione per filtri
{
  "filters": {
    "color": ["red", "blue", "green"],
    "size": ["xs", "s", "m", "l", "xl"]
  }
}
```

*(Da implementare nel productController per ricerca avanzata)*

---

## ✅ Checklist Testing

### Backend
- [ ] Esegui seed: `node seedCategoryAttributes.js`
- [ ] Verifica DB: collection `categoryattributes` popolata
- [ ] Test API: GET /api/categories/:id/attributes (senza auth)
- [ ] Test creazione prodotto con attributi obbligatori mancanti (deve fallire)
- [ ] Test creazione prodotto con varianti

### Frontend
- [ ] Crea prodotto categoria "Abbigliamento" → vedi campi Taglia, Colore, etc.
- [ ] Genera varianti automaticamente
- [ ] Imposta stock/prezzo per alcune varianti
- [ ] Disattiva varianti non disponibili
- [ ] Submit e verifica prodotto creato
- [ ] Modifica prodotto esistente → vedi attributi pre-compilati
- [ ] Cambia categoria → vedi attributi aggiornarsi dinamicamente

---

## 🐛 Troubleshooting

### "Attributo obbligatorio mancante"
- Controlla che categoryAttributes siano stati caricati (`console.log`)
- Verifica che `formData.attributes` contenga tutti i `required: true`

### "Varianti non si generano"
- Controlla che almeno un attributo abbia `allowVariants: true`
- Verifica che gli attributi abbiano `options` popolato

### "Form non mostra attributi"
- Apri DevTools Network → cerca chiamata GET /categories/:id/attributes
- Verifica risposta non sia vuota
- Controlla che `categoryAttributes` state sia popolato

### "SKU duplicati"
- Il backend genera SKU random, ma se ne crei migliaia potrebbero collidere
- Soluzione: modifica `generateSKU()` per usare timestamp o counter

---

## 🚀 Prossimi Step (Opzionali)

1. **Admin Panel per Attributi**
   - UI per creare/modificare attributi senza API calls
   - Drag&drop per riordinare attributi

2. **Filtri Ricerca Avanzata**
   - Sidebar con attributi disponibili
   - Checkbox per filtrare per colore, taglia, etc.

3. **Immagini per Variante**
   - Upload immagini specifiche (es. t-shirt rossa ha foto diversa da blu)
   - Gallery che cambia al click variante

4. **Import/Export Varianti**
   - CSV per caricare 1000+ varianti velocemente
   - Template Excel per seller

5. **Analytics Varianti**
   - Dashboard: quali colori/taglie vendono di più
   - Alert quando stock variante basso

---

## 📝 Note Finali

**✅ Cosa è stato implementato:**
- Sistema completo backend + frontend
- Validazioni robuste
- UI intuitiva con generazione automatica
- Seed con esempi reali

**✅ Compatibilità:**
- Prodotti esistenti (senza attributi) continuano a funzionare
- Sistema retrocompatibile al 100%
- Zero breaking changes

**✅ Estendibilità:**
- Aggiungere nuovi tipi campo (es. "date", "range")
- Personalizzare rendering per categoria
- Integrare con sistemi esterni (ERP, WMS)

---

🎉 **Sistema pronto all'uso!** Ora puoi creare un marketplace ricco come eBay/Amazon con attributi dinamici per qualsiasi categoria.
