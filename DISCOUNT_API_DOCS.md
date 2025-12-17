# 🎯 API Sconti e Configurazioni Negozio - Documentazione

## 📋 Indice
- [API Sconti](#api-sconti)
- [API Configurazioni Negozio](#api-configurazioni-negozio)
- [Esempi di Utilizzo](#esempi-di-utilizzo)

---

## 🎁 API Sconti

### 1. Creare uno Sconto
**POST** `/api/discounts`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Body:**
```json
{
  "name": "Black Friday 2025",
  "description": "Sconto speciale Black Friday",
  "discountType": "percentage",
  "discountValue": 20,
  "applicationType": "category",
  "categories": ["Frutta e Verdura", "Latticini"],
  "startDate": "2025-11-29T00:00:00Z",
  "endDate": "2025-11-30T23:59:59Z",
  "minPurchaseAmount": 50,
  "maxDiscountAmount": 30
}
```

**Tipi di sconto:**
- `discountType`: `"percentage"` (%) o `"fixed"` (valore fisso in €)
- `applicationType`: 
  - `"product"` - sconto su prodotti specifici
  - `"category"` - sconto su categorie
  - `"coupon"` - sconto tramite codice coupon

**Esempio coupon:**
```json
{
  "name": "Codice Benvenuto",
  "discountType": "fixed",
  "discountValue": 10,
  "applicationType": "coupon",
  "couponCode": "WELCOME10",
  "startDate": "2025-12-01T00:00:00Z",
  "endDate": "2025-12-31T23:59:59Z",
  "usageLimit": 100,
  "minPurchaseAmount": 30
}
```

---

### 2. Ottenere i Propri Sconti
**GET** `/api/discounts`

**Response:**
```json
{
  "success": true,
  "count": 5,
  "discounts": [
    {
      "_id": "...",
      "name": "Black Friday 2025",
      "discountType": "percentage",
      "discountValue": 20,
      "applicationType": "category",
      "categories": ["Frutta e Verdura"],
      "startDate": "2025-11-29T00:00:00Z",
      "endDate": "2025-11-30T23:59:59Z",
      "isActive": true,
      "usageCount": 45
    }
  ]
}
```

---

### 3. Ottenere un Singolo Sconto
**GET** `/api/discounts/:id`

---

### 4. Aggiornare uno Sconto
**PUT** `/api/discounts/:id`

**Body:** (stesso formato della creazione)

---

### 5. Eliminare uno Sconto
**DELETE** `/api/discounts/:id`

---

### 6. Attivare/Disattivare uno Sconto
**PATCH** `/api/discounts/:id/toggle`

---

### 7. Validare un Coupon (Pubblico)
**POST** `/api/discounts/validate-coupon`

**Body:**
```json
{
  "couponCode": "WELCOME10",
  "cartTotal": 50
}
```

**Response:**
```json
{
  "success": true,
  "discount": {
    "id": "...",
    "code": "WELCOME10",
    "name": "Codice Benvenuto",
    "discountType": "fixed",
    "discountValue": 10,
    "savedAmount": 10,
    "newTotal": 40
  }
}
```

---

### 8. Ottenere Prodotti in Sconto (Pubblico)
**GET** `/api/discounts/active-products`

**Response:**
```json
{
  "success": true,
  "count": 15,
  "products": [
    {
      "_id": "...",
      "name": "Mele Golden",
      "price": 10,
      "originalPrice": 10,
      "discountedPrice": 8,
      "discountPercentage": 20,
      "hasActiveDiscount": true,
      "activeDiscount": {
        "name": "Black Friday 2025",
        "discountType": "percentage",
        "discountValue": 20
      }
    }
  ]
}
```

---

## ⚙️ API Configurazioni Negozio

### 1. Ottenere le Proprie Configurazioni
**GET** `/api/shop-settings`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Response:**
```json
{
  "success": true,
  "shopSettings": {
    "shipping": {
      "freeShipping": false,
      "freeShippingThreshold": 50,
      "shippingRates": [
        {
          "name": "Standard",
          "description": "Consegna in 3-5 giorni",
          "calculationType": "fixed",
          "baseRate": 5.99,
          "estimatedDays": "3-5 giorni"
        }
      ]
    },
    "productSettings": {
      "enableColors": true,
      "availableColors": ["Rosso", "Blu", "Nero"],
      "enableSizes": true,
      "availableSizes": ["S", "M", "L", "XL"]
    },
    "returnPolicy": {
      "enabled": true,
      "days": 14,
      "description": "Reso gratuito entro 14 giorni"
    }
  }
}
```

---

### 2. Aggiornare Tutte le Configurazioni
**PUT** `/api/shop-settings`

**Body:**
```json
{
  "shipping": {
    "freeShipping": false,
    "freeShippingThreshold": 50,
    "defaultShippingRate": 5.99,
    "shippingRates": [
      {
        "name": "Standard",
        "description": "Consegna in 3-5 giorni",
        "calculationType": "fixed",
        "baseRate": 5.99,
        "estimatedDays": "3-5 giorni"
      },
      {
        "name": "Express",
        "description": "Consegna in 1-2 giorni",
        "calculationType": "fixed",
        "baseRate": 12.99,
        "estimatedDays": "1-2 giorni"
      }
    ]
  },
  "productSettings": {
    "enableColors": true,
    "availableColors": ["Rosso", "Blu", "Verde", "Nero", "Bianco"],
    "enableSizes": true,
    "availableSizes": ["XS", "S", "M", "L", "XL", "XXL"]
  },
  "returnPolicy": {
    "enabled": true,
    "days": 14,
    "description": "Reso gratuito entro 14 giorni dall'acquisto"
  },
  "minOrderAmount": 20,
  "currency": "EUR",
  "taxRate": 22
}
```

---

### 3. Aggiornare Solo le Spedizioni
**PUT** `/api/shop-settings/shipping`

**Body:**
```json
{
  "freeShipping": false,
  "freeShippingThreshold": 50,
  "shippingRates": [
    {
      "name": "Standard",
      "calculationType": "weight",
      "baseRate": 3.99,
      "ratePerUnit": 1.5,
      "estimatedDays": "3-5 giorni"
    }
  ]
}
```

**Tipi di calcolo spedizione:**
- `fixed`: Tariffa fissa
- `weight`: Basato sul peso (baseRate + ratePerUnit * kg)
- `price`: Basato sul prezzo (baseRate + ratePerUnit * importo/100)

---

### 4. Aggiornare Solo le Configurazioni Prodotto
**PUT** `/api/shop-settings/products`

**Body:**
```json
{
  "enableColors": true,
  "availableColors": ["Rosso", "Blu", "Verde"],
  "enableSizes": true,
  "availableSizes": ["S", "M", "L"],
  "enableShoeNumbers": true,
  "availableShoeNumbers": ["38", "39", "40", "41", "42"],
  "customVariants": [
    {
      "name": "Materiale",
      "values": ["Cotone", "Lino", "Seta"]
    }
  ]
}
```

---

### 5. Ottenere Configurazioni Pubbliche di un Negozio (Pubblico)
**GET** `/api/shop-settings/public/:sellerId`

---

### 6. Calcolare il Costo di Spedizione (Pubblico)
**POST** `/api/shop-settings/calculate-shipping`

**Body:**
```json
{
  "sellerId": "...",
  "cartTotal": 75.50,
  "totalWeight": 2.5
}
```

**Response:**
```json
{
  "success": true,
  "shippingCost": 0,
  "isFree": true,
  "message": "Spedizione gratuita per ordini superiori a €50"
}
```

---

## 📚 Esempi di Utilizzo

### Scenario 1: Creare uno sconto del 20% per Black Friday

```javascript
const createBlackFridayDiscount = async () => {
  const response = await fetch('http://localhost:5000/api/discounts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Black Friday 2025',
      description: 'Sconto speciale per il Black Friday',
      discountType: 'percentage',
      discountValue: 20,
      applicationType: 'category',
      categories: ['Frutta e Verdura', 'Latticini'],
      startDate: '2025-11-29T00:00:00Z',
      endDate: '2025-11-30T23:59:59Z'
    })
  });
  
  const data = await response.json();
  console.log('Sconto creato:', data);
};
```

### Scenario 2: Creare un coupon di benvenuto

```javascript
const createWelcomeCoupon = async () => {
  const response = await fetch('http://localhost:5000/api/discounts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Benvenuto nel nostro negozio',
      discountType: 'fixed',
      discountValue: 10,
      applicationType: 'coupon',
      couponCode: 'WELCOME10',
      startDate: '2025-12-01T00:00:00Z',
      endDate: '2025-12-31T23:59:59Z',
      usageLimit: 100,
      minPurchaseAmount: 30
    })
  });
  
  const data = await response.json();
  console.log('Coupon creato:', data);
};
```

### Scenario 3: Configurare la spedizione gratuita sopra €50

```javascript
const setupFreeShipping = async () => {
  const response = await fetch('http://localhost:5000/api/shop-settings/shipping', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      freeShipping: false,
      freeShippingThreshold: 50,
      defaultShippingRate: 5.99,
      shippingRates: [
        {
          name: 'Standard',
          description: 'Consegna in 3-5 giorni lavorativi',
          calculationType: 'fixed',
          baseRate: 5.99,
          estimatedDays: '3-5 giorni'
        },
        {
          name: 'Express',
          description: 'Consegna in 1-2 giorni lavorativi',
          calculationType: 'fixed',
          baseRate: 12.99,
          estimatedDays: '1-2 giorni'
        }
      ]
    })
  });
  
  const data = await response.json();
  console.log('Spedizioni configurate:', data);
};
```

### Scenario 4: Validare un coupon nel carrello

```javascript
const validateCouponCode = async (code, cartTotal) => {
  const response = await fetch('http://localhost:5000/api/discounts/validate-coupon', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      couponCode: code,
      cartTotal: cartTotal
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log(`Coupon valido! Risparmi €${data.discount.savedAmount}`);
    console.log(`Nuovo totale: €${data.discount.newTotal}`);
  } else {
    console.log('Coupon non valido:', data.message);
  }
};
```

---

## 🔄 Sistema Automatico di Gestione Sconti

Il backend include un sistema automatico che:

1. **All'avvio del server**: Controlla tutti gli sconti e li attiva/disattiva in base alle date
2. **Ogni ora**: Esegue un controllo automatico per:
   - Disattivare gli sconti scaduti
   - Attivare gli sconti programmati
   - Rimuovere gli sconti dai prodotti se necessario

### Log di esempio:
```
✅ Connesso a MongoDB
✅ Controllo sconti completato: 2 scaduti, 3 attivati
🔄 Controllo sconti orario: 0 scaduti, 1 attivati
```

---

## ⚖️ Conformità Legale sui Prezzi

Il sistema garantisce la **trasparenza sui prezzi** come richiesto dalla legge:

- ✅ Prezzo originale sempre salvato (`originalPrice`)
- ✅ Prezzo scontato calcolato automaticamente (`discountedPrice`)
- ✅ Percentuale di sconto visualizzata (`discountPercentage`)
- ✅ Informazioni sullo sconto attivo (`activeDiscount`)

**Esempio di visualizzazione conforme:**
```
Prezzo originale: €10,00
Sconto: -20%
Prezzo attuale: €8,00
```

---

## 🎯 Best Practices

1. **Sconti multipli**: Se un prodotto appartiene a più sconti (es: categoria + prodotto specifico), viene applicato automaticamente il miglior sconto disponibile

2. **Coupon**: I codici coupon sono sempre in maiuscolo e unici

3. **Validità temporale**: Gli sconti vengono automaticamente attivati/disattivati in base alle date

4. **Limiti di utilizzo**: I coupon possono avere un limite di utilizzi

5. **Importi minimi**: Si può richiedere un importo minimo per applicare uno sconto

6. **Sconto massimo**: Per gli sconti percentuali, si può impostare un importo massimo di sconto

---

## 🛠️ Troubleshooting

**Problema**: Lo sconto non viene applicato ai prodotti
- Verifica che `isActive` sia `true`
- Verifica che le date siano corrette
- Verifica che i prodotti/categorie siano specificati correttamente

**Problema**: Il coupon non è valido
- Verifica che il codice sia corretto (case-insensitive)
- Verifica che l'importo minimo sia raggiunto
- Verifica che il limite di utilizzi non sia stato superato
- Verifica che lo sconto non sia scaduto

---

Implementato il: 15 Dicembre 2025
