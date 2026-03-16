# 🚀 Guida Deploy Recensioni Automatiche in Produzione

## ✅ Prerequisiti

Prima di procedere, assicurati che questi file siano aggiornati nel repository:

- ✅ `backend/models/Review.js` (con nuovi indici)
- ✅ `backend/controllers/webhookController.js` (con logica recensioni automatiche)
- ✅ `backend/scripts/setupAutomaticReviews.js` (script unificato)

---

## 📋 Procedura Completa

### STEP 1: Verifica Modifiche Locali

```bash
# Testa lo script in locale per sicurezza
cd backend
node scripts/setupAutomaticReviews.js
```

**Output atteso:**
```
✅ SETUP COMPLETATO!
📊 STATISTICHE FINALI:
  - Recensioni totali: 9
  - Automatiche (guest): 9
  - Manuali (registrati): 0
```

---

### STEP 2: Commit e Push del Codice

```bash
# Dalla root del progetto
git add .
git commit -m "feat: Sistema recensioni automatiche per ordini guest + fix indici MongoDB"
git push origin main
```

**File modificati nel commit:**
- `backend/models/Review.js` - Nuovi indici partial per guest/registrati
- `backend/controllers/webhookController.js` - Creazione automatica recensioni guest
- `backend/scripts/setupAutomaticReviews.js` - Script setup produzione
- Altri script di supporto (fixReviewIndexes.js, testAutomaticReviews.js, etc.)

---

### STEP 3: Deploy su Railway/Vercel/Render

**Se usi Railway:**
```bash
# Railway fa auto-deploy dal push su main
# Verifica il deploy nel dashboard: https://railway.app
```

**Se usi Render:**
```bash
# Render fa auto-deploy dal push
# Controlla i logs in: https://dashboard.render.com
```

**Deploy manuale:**
```bash
# Se necessario, triggera deploy manuale dal dashboard
```

**⏰ Attendi 2-5 minuti** che il deploy completi.

---

### STEP 4: Verifica Deploy Backend

Controlla che il backend sia online:

```bash
# Test endpoint health
curl https://tuobackend.railway.app/api/health

# O apri nel browser:
# https://tuobackend.railway.app
```

**✅ Se vedi risposta 200 OK → backend deployato correttamente**

---

### STEP 5: Esegui lo Script in Produzione

**Opzione A - SSH nel server (se disponibile):**

```bash
# Connettiti al server produzione
railway run bash  # o ssh user@server

# Vai nella cartella backend
cd backend

# Esegui lo script
node scripts/setupAutomaticReviews.js
```

**Opzione B - Railway CLI (consigliato):**

```bash
# Se hai Railway CLI installata
railway run node backend/scripts/setupAutomaticReviews.js

# Output atteso:
# 📡 STEP 1: Connessione al database...
# ✅ Connesso al database MongoDB
# 
# 🔧 STEP 2: Fix indici MongoDB...
# ...
# ✅ SETUP COMPLETATO!
```

**Opzione C - Esegui localmente con DB produzione:**

⚠️ **ATTENZIONE:** Questa opzione richiede accesso diretto al MongoDB produzione

```bash
# BACKUP .env corrente
cp backend/.env backend/.env.local

# Modifica temporaneamente .env per usare DB produzione
# MONGODB_URI=mongodb+srv://...produzione...

cd backend
node scripts/setupAutomaticReviews.js

# RIPRISTINA .env locale
cp backend/.env.local backend/.env
```

---

### STEP 6: Verifica Risultati in Produzione

#### A) Controlla le recensioni nel database:

**Via MongoDB Atlas (consigliato):**
1. Vai su https://cloud.mongodb.com
2. Seleziona cluster produzione
3. Browse Collections → `reviews`
4. Filtra: `{ isAutomatic: true }`

**Dovresti vedere:**
- Recensioni con `isAutomatic: true`
- `guestOrderId` popolato
- `rating: 5`
- `comment: "Recensione automatica da acquisto verificato"`

#### B) Controlla i prodotti:

```
Collections → products
```

**Verifica che i prodotti acquistati abbiano:**
- `rating: 5.0` (o media se ci sono più recensioni)
- `numReviews: > 0`

#### C) Controlla il frontend produzione:

Apri la tua app in produzione e verifica:

1. **Homepage/Catalogo:**
   - ⭐⭐⭐⭐⭐ visibili sulle ProductCard
   - Numero recensioni tra parentesi: `5.0 (1)`

2. **Pagina Prodotto:**
   - Sezione recensioni popolata
   - Badge azzurro: **✓ Acquisto Verificato**
   - Commento: "Recensione automatica da acquisto verificato"

---

## 🧪 Test Ordine Guest Futuro

Per verificare che il webhook funzioni per nuovi ordini:

### Test in Stripe Test Mode:

1. **Crea ordine guest** in modalità test
2. **Completa pagamento** con carta test: `4242 4242 4242 4242`
3. **Attendi webhook** (1-2 secondi)
4. **Verifica logs backend:**
   ```
   ⭐ [WEBHOOK] Creazione recensioni automatiche per ordine guest...
   ✅ [WEBHOOK] Create 1 recensioni automatiche
   🔄 [WEBHOOK] Aggiornamento rating prodotti...
   ✅ Prodotto X: rating 5.0, 1 recensioni
   ```

5. **Controlla database:**
   - Nuova recensione con `isAutomatic: true`
   - Prodotto con rating aggiornato

6. **Controlla frontend:**
   - Stelle visibili sulla card
   - Recensione visibile nella pagina prodotto

---

## 📊 Checklist Finale

### Prima del Deploy:
- [ ] Codice testato in locale
- [ ] Tutti i file committati
- [ ] Script eseguito con successo in dev

### Durante il Deploy:
- [ ] Push su repository
- [ ] Deploy completato (Railway/Render/Vercel)
- [ ] Backend online e risponde

### Dopo il Deploy:
- [ ] Script `setupAutomaticReviews.js` eseguito in produzione
- [ ] Indici MongoDB corretti
- [ ] Recensioni create per ordini guest esistenti
- [ ] Rating prodotti aggiornati
- [ ] Frontend mostra stelle e recensioni
- [ ] Test ordine guest futuro funzionante

---

## 🆘 Troubleshooting

### Errore: "E11000 duplicate key error"
```bash
# Riesegui fix indici
node scripts/dropOldIndex.js
node scripts/setupAutomaticReviews.js
```

### Script non trova ordini guest
```javascript
// Verifica che ci siano ordini guest pagati
use lucanikoshop-production
db.orders.find({ isGuestOrder: true, isPaid: true }).count()
```

### Rating non aggiornati
```bash
# Riesegui solo aggiornamento rating
node scripts/updateProductRatings.js
```

### Frontend non mostra stelle
1. **Clear cache browser** (Ctrl+Shift+R)
2. **Verifica API response:**
   ```
   GET /api/products/:id
   ```
   Dovrebbe contenere: `rating: 5.0, numReviews: 1`

3. **Controlla React DevTools** - ProductCard dovrebbe ricevere prop `product.numReviews > 0`

---

## ✅ Tutto Pronto!

Dopo aver completato tutti gli step:

- ✅ **Vecchi ordini guest** → Hanno recensioni automatiche 5⭐
- ✅ **Nuovi ordini guest** → Recensioni create automaticamente via webhook
- ✅ **Utenti registrati** → Possono creare recensioni manuali (modificabili 1 volta entro 30gg)
- ✅ **Frontend** → Mostra stelle, rating e badge distintivi

**Il tuo marketplace è ora completo con il sistema recensioni! 🎉**

---

## 📝 Note Importanti

1. **Backup Database:** Prima di eseguire script in produzione, fai sempre backup:
   ```bash
   mongodump --uri="mongodb+srv://..." --out=backup-$(date +%Y%m%d)
   ```

2. **Monitoraggio:** Controlla i logs del webhook per verificare che funzioni:
   ```bash
   railway logs  # o equivalente per il tuo hosting
   ```

3. **Test Mode Stripe:** Assicurati che il webhook sia configurato sia in test che in live mode

4. **Performance:** Le recensioni automatiche aumentano il carico del webhook. Monitora i tempi di risposta.

---

**Hai domande o problemi durante il deploy? Dimmi dove ti blocchi!** 🚀
