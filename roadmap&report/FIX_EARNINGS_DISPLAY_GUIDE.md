# 🔧 Correzione Earnings Display - Guida Esecuzione

## Problema Identificato

Gli earnings dei venditori venivano spostati da `pendingEarnings` a `paidEarnings` immediatamente dopo la creazione del transfer Stripe Connect, anche se:
- Il VendorPayout status era solo `'processing'` (non `'paid'`)
- Il venditore NON aveva ancora ricevuto i soldi nel conto bancario
- Il transfer Stripe impiega 1-7 giorni per completarsi

## Correzioni Applicate

### 1. Correzione Logica Webhook (✅ Completata)
**File:** `backend/controllers/webhookController.js`

**Prima:**
```javascript
// Dopo il transfer Stripe Connect
vendor.pendingEarnings = Math.max(0, (vendor.pendingEarnings || 0) - earning.netAmount);
vendor.paidEarnings = (vendor.paidEarnings || 0) + earning.netAmount;
await vendor.save();
```

**Dopo:**
```javascript
// NOTA: Gli earnings rimangono in pendingEarnings finché il payout non è completato
// Lo spostamento da pendingEarnings a paidEarnings avviene solo quando
// il payout viene segnato come 'paid' (manualmente dall'admin o via webhook)
```

### 2. Script di Correzione Dati (✅ Creato)
**File:** `backend/fixEarningsData.js`

Lo script:
- Trova tutti i VendorPayout con status `'pending'` o `'processing'` (non ancora pagati)
- Per ogni venditore, calcola quanto dovrebbe essere in `pendingEarnings` invece che in `paidEarnings`
- Sposta l'importo erroneamente classificato da `paidEarnings` a `pendingEarnings`
- Mostra un report dettagliato delle correzioni

## Come Eseguire la Correzione

### Opzione 1: Esecuzione su Railway (CONSIGLIATA per Produzione)

#### Step 1: Accedi alla Dashboard Railway
1. Vai su [railway.app](https://railway.app)
2. Seleziona il progetto LucanikoShop
3. Clicca sul servizio backend

#### Step 2: Apri la Shell
1. Clicca sulla tab **"Settings"** nel menu laterale
2. Scorri fino alla sezione **"Environment Variables"**
3. Verifica che `MONGODB_URI` punti al database di produzione
4. Torna alla tab **"Deployments"**
5. Clicca sul deployment attivo
6. Clicca su **"View Logs"** o **"Shell"**

#### Step 3: Esegui lo Script
Nella shell Railway, esegui:
```bash
node fixEarningsData.js
```

Oppure, se hai configurato npm script (vedi sotto):
```bash
npm run fix:earnings
```

#### Step 4: Verifica il Report
Lo script mostrerà:
- Numero di payout non pagati trovati (pending + processing)
- Per ogni venditore:
  - Email e business name
  - Quanti payout non pagati ha
  - Importo totale da spostare
  - Valori prima e dopo la correzione
- Report finale con totali

### Opzione 2: Esecuzione Locale con Connessione Produzione

⚠️ **ATTENZIONE**: Questa opzione richiede accesso diretto al database di produzione.

#### Step 1: Ottieni MONGODB_URI di Produzione
1. Da Railway Dashboard → Backend Service → Variables
2. Copia il valore di `MONGODB_URI` (quello di produzione)

#### Step 2: Esegui con MONGODB_URI Custom
```bash
cd backend
MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/production-db" node fixEarningsData.js
```

Su Windows PowerShell:
```powershell
cd backend
$env:MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/production-db"
node fixEarningsData.js
```

### Opzione 3: Test su Database di Sviluppo

Per testare lo script senza toccare la produzione:
```bash
cd backend
node fixEarningsData.js
```

Questo userà il MONGODB_URI dal file `.env` locale (database di sviluppo).

## Output Atteso

### Se ci sono earnings da correggere:
```
🔧 [FIX EARNINGS] ========== INIZIO CORREZIONE EARNINGS ==========

✅ [DB] Connesso al database

📊 [ANALISI] Trovati 1 payout in stato 'processing'
📊 [ANALISI] Trovati 0 payout in stato 'pending'
📊 [ANALISI] Totale payout non pagati: 1

📊 [ANALISI] Venditori coinvolti: 1

👤 [VENDITORE] Lucaniko Food (vendor@example.com)
   ID: 507f1f77bcf86cd799439011
   Payout non pagati: 1
     - Pending: 0
     - Processing: 1
   Importo totale da spostare: €12.46
   Prima della correzione:
     - Pending Earnings: €0.00
     - Paid Earnings: €12.46
     - Total Earnings: €12.46
   Dopo la correzione:
     - Pending Earnings: €12.46 ✅
     - Paid Earnings: €0.00 ✅
     - Total Earnings: €12.46

======================================================================
📊 [REPORT FINALE]
======================================================================
✅ Venditori corretti: 1/1
💰 Importo totale spostato da paid a pending: €12.46
📦 Payout in processing: 1
📦 Payout in pending: 0
📦 Totale payout non pagati: 1

✅ Correzione completata con successo!

ℹ️  NOTA: Gli earnings ora sono in "In Attesa di Pagamento" finché
   l'admin non segna i payout come "paid" dal pannello admin.
```

### Se NON ci sono earnings da correggere:
```
🔧 [FIX EARNINGS] ========== INIZIO CORREZIONE EARNINGS ==========

✅ [DB] Connesso al database

📊 [ANALISI] Trovati 0 payout in stato 'processing'
📊 [ANALISI] Trovati 0 payout in stato 'pending'
📊 [ANALISI] Totale payout non pagati: 0

✅ Nessun payout da correggere. Tutti i dati sono corretti.
```

## Verifica Post-Correzione

### 1. Verifica VendorDashboard
1. Accedi come venditore su [lucaniko.shop](https://lucaniko.shop)
2. Vai alla dashboard venditori
3. Controlla le sezioni:
   - **In Attesa di Pagamento**: Dovrebbe mostrare €12.46 (o l'importo corretto)
   - **Pagamenti Ricevuti**: Dovrebbe essere €0.00
   - **Prossimo Pagamento**: Dovrebbe mostrare i payout programmati

### 2. Verifica Database (Opzionale)
Puoi verificare i dati direttamente nel database:
```javascript
// Connetti a MongoDB
// Trova il venditore
db.users.findOne({ email: "vendor@example.com" }, { pendingEarnings: 1, paidEarnings: 1, totalEarnings: 1 })

// Trova i payout
db.vendorpayouts.find({ vendorId: ObjectId("...") }, { amount: 1, status: 1, saleDate: 1 })
```

## Aggiungere Script NPM (Opzionale)

Per semplificare l'esecuzione, aggiungi questo script al `package.json`:

```json
{
  "scripts": {
    "fix:earnings": "node fixEarningsData.js"
  }
}
```

Poi puoi eseguire semplicemente:
```bash
npm run fix:earnings
```

## Prossimi Passi

### Come Segnare i Payout Come Pagati

Quando un venditore riceve effettivamente i soldi nel conto bancario, l'admin deve:

1. Accedere al pannello admin
2. Andare alla sezione **"Gestione Pagamenti"** o **"Vendor Payouts"**
3. Trovare il payout da segnare come pagato
4. Cliccare su **"Segna Come Pagato"** o **"Esegui Pagamento"**

Questo:
- Imposta `payout.status = 'paid'`
- Sposta l'importo da `pendingEarnings` a `paidEarnings`
- Registra la data di pagamento

### Implementare Webhook Automatici (Futuro)

Per automatizzare completamente il processo, implementare webhook listener per:
- `transfer.paid`: Quando un transfer Stripe Connect è completato
- `payout.paid`: Quando un payout Stripe Connect arriva nel conto del venditore

Questi webhook dovrebbero:
1. Trovare il VendorPayout corrispondente
2. Aggiornare status a `'paid'`
3. Spostare l'importo da `pendingEarnings` a `paidEarnings`

## Domande Frequenti

### Q: Posso eseguire lo script più volte?
**A:** Sì, lo script è idempotente. Se non ci sono payout da correggere, mostrerà semplicemente "Nessun payout da correggere".

### Q: Lo script modifica i totalEarnings?
**A:** No, lo script sposta solo da `paidEarnings` a `pendingEarnings`. Il `totalEarnings` rimane invariato perché è la somma corretta di tutti gli earnings.

### Q: Cosa succede ai payout con status='failed'?
**A:** Lo script non tocca i payout con status `'failed'`. Questi devono essere gestiti manualmente.

### Q: Come posso verificare che lo script ha funzionato?
**A:** Controlla il VendorDashboard. Gli importi in "In Attesa di Pagamento" dovrebbero ora essere corretti e riflettere i payout effettivamente non pagati.

## Supporto

Per problemi o domande:
1. Controlla i log dello script per errori specifici
2. Verifica che MONGODB_URI sia corretto
3. Usa Railway Shell per esecuzione in produzione
4. Contatta il supporto tecnico se persistono problemi

---

**Data Creazione:** 2025-01-XX  
**Versione:** 1.0  
**Autore:** GitHub Copilot
