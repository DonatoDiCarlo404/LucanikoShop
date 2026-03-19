# 🔄 Sistema Automatico di Retry per Transfer Falliti

## ⚠️ Problema Risolto

**Problema:** L'ordine del 18 marzo (ID: 69babec16b1c88550245402a) ha ricevuto il pagamento (€38) ma il transfer automatico al venditore non è partito. I soldi sono rimasti sull'account principale invece di andare a "Spezialità Lucane".

**Causa:** Il webhook `checkout.session.completed` ha creato il VendorPayout ma non ha eseguito il transfer automatico (probabilmente per un crash silenzioso o errore non loggato).

**Soluzione Implementata:** 
1. ✅ Transfer manuale eseguito (€30.82 → Spezialità Lucane)
2. ✅ Webhook migliorato con logging robusto
3. ✅ Script di retry automatico per payout pending

---

## 📁 File Modificati/Creati

### 1. `executeManualTransfer.js` ✨ NUOVO
Script per eseguire transfer manuali quando il webhook fallisce.

**Uso:**
```bash
# Dry-run (solo validazione)
node executeManualTransfer.js <payoutId> --prod

# Esecuzione reale
node executeManualTransfer.js <payoutId> --prod --confirm
```

**Caratteristiche:**
- ✅ Validazioni di sicurezza multiple
- ✅ Verifica che il payout non sia già stato processato
- ✅ Recupera charge ID per source_transaction
- ✅ Aggiorna database automaticamente

### 2. `retryPendingPayouts.js` ✨ NUOVO
Script cronjob per eseguire retry automatici di payout pending.

**Uso:**
```bash
# Dry-run (solo controllo)
node retryPendingPayouts.js --prod --dry-run

# Esecuzione reale
node retryPendingPayouts.js --prod
```

**Configurazione:**
- Riprova payout pending più vecchi di **1 ora**
- Skippa payout senza Stripe Connect attivo
- Logga tutti gli errori nel database (status='failed')

### 3. `checkOrderPayouts.js` ✨ NUOVO
Script diagnostico per verificare stato payout di un ordine.

**Uso:**
```bash
node checkOrderPayouts.js <orderId> --prod
```

### 4. `checkRecentOrders.js` ✨ NUOVO
Script per verificare ordini degli ultimi 2 giorni.

**Uso:**
```bash
node checkRecentOrders.js
```

### 5. `webhookController.js` ✅ MIGLIORATO
Webhook con logging robusto per debugging.

**Miglioramenti:**
- ✅ Logging dettagliato per ogni fase del transfer
- ✅ Errori visibili con separatori `==========`
- ✅ Informazioni complete: Order ID, VendorPayout ID, Venditore
- ✅ Log separati per transfer skipped (Stripe Connect non attivo)

---

## 🔧 Configurazione Cronjob (Railway)

### Opzione 1: Railway Cron Job (Consigliato)

1. **Aggiungi al `railway.json`:**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "cron": [{
      "command": "node retryPendingPayouts.js --prod",
      "schedule": "0 * * * *",
      "description": "Retry pending vendor payouts every hour"
    }]
  }
}
```

2. **Deploy:** Il cronjob verrà eseguito automaticamente ogni ora.

### Opzione 2: Node-Cron (In-app)

1. **Installa node-cron:**
```bash
npm install node-cron
```

2. **Crea `jobs/retryPayoutsJob.js`:**
```javascript
import cron from 'node-cron';
import { exec } from 'child_process';

// Esegui ogni ora
cron.schedule('0 * * * *', () => {
  console.log('🔄 [CRON] Esecuzione retry payout pending...');
  exec('node retryPendingPayouts.js --prod', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ [CRON] Errore:', error);
      return;
    }
    console.log(stdout);
  });
});

console.log('✅ [CRON] Job configurato: retry payout ogni ora');
```

3. **Importa in `server.js`:**
```javascript
import './jobs/retryPayoutsJob.js';
```

### Opzione 3: Servizio Esterno (Cron-job.org)

1. Vai su https://cron-job.org/
2. Crea un job che chiama un endpoint API ogni ora:
   ```
   GET https://tuodominio.com/api/admin/retry-payouts
   ```
3. Crea l'endpoint nel backend che esegue lo script

---

## 🚀 Flusso Corretto Implementato

### 1. Cliente Paga (Checkout)
```
Cliente → Stripe Checkout → €38.00 → Account Principale
```

### 2. Webhook Riceve Notifica
```
Stripe → webhook → checkout.session.completed
```

### 3. Sistema Crea Ordine e Calcola Earnings
```
✅ Crea Order nel DB
✅ Calcola VendorEarnings
✅ Crea VendorPayout (status: 'pending')
```

### 4. Transfer Automatico
```
IF venditore ha Stripe Connect attivo:
  ✅ Esegue transfer automatico
  ✅ VendorPayout → status: 'processing'
  ✅ Log: "Transfer completato: tr_xxx"
ELSE:
  ⚠️  VendorPayout rimane 'pending'
  ⚠️  Log: "Transfer skipped - Stripe Connect non attivo"
```

### 5. Retry Automatico (Cronjob ogni ora)
```
IF payout 'pending' > 1 ora:
  IF venditore ha Stripe Connect:
    ✅ Riprova transfer
    ✅ VendorPayout → status: 'processing'
  ELSE:
    ⚠️  Skip (transfer manuale richiesto)
```

### 6. Soldi Arrivano al Venditore
```
Account Principale → Stripe Transfer → Account Venditore
(automatico entro 7 giorni da Stripe)
```

---

## 📊 Monitoraggio e Debugging

### Controllare Ordini Recenti
```bash
node checkRecentOrders.js
```

### Controllare Stato Specifico Ordine
```bash
node checkOrderPayouts.js <orderId> --prod
```

### Controllare Log Webhook
```bash
# Railway
railway logs

# Locale
tail -f logs/combined.log | grep "WEBHOOK"
```

### Dashboard Admin
Vai su: `https://tuodominio.com/admin/payment-control`

- ✅ Visualizza tutti i payout pending
- ✅ Esegui transfer manuali con un click
- ✅ Monitora transfer falliti

---

## ⚠️ Quando Eseguire Transfer Manuale

Il transfer manuale è necessario solo se:

1. **Venditore NON ha Stripe Connect attivo**
   - Payout rimane 'pending' indefinitamente
   - Cronjob non può processarlo
   - Soluzione: Admin esegue transfer manuale dalla dashboard

2. **Transfer fallisce ripetutamente**
   - Payout → status: 'failed'
   - Motivo visibile in `failureReason`
   - Soluzione: Verifica errore e riprova manualmente

3. **Emergenza: Cliente lamenta mancato pagamento**
   - Verifica ordine con `checkOrderPayouts.js`
   - Se payout presente ma pending → esegui transfer manuale
   - Se payout assente → usa `recalculatePayouts.js` per crearlo

---

## 🎯 Riepilogo

| Scenario | Cosa Succede | Azione Richiesta |
|----------|--------------|------------------|
| ✅ Webhook OK + Stripe Connect attivo | Transfer automatico → 'processing' | Nessuna |
| ⚠️ Webhook fallisce | Payout → 'pending' | Cronjob risolve in 1h |
| ⚠️ Stripe Connect non attivo | Payout → 'pending' | Transfer manuale da admin |
| ❌ Transfer fallisce | Payout → 'failed' | Verifica errore + retry manuale |

---

## 📝 Modifiche da Deploy

### File da Deployare
1. ✅ `backend/controllers/webhookController.js` (logging migliorato)
2. ✅ `backend/retryPendingPayouts.js` (nuovo)
3. ✅ `backend/executeManualTransfer.js` (nuovo)
4. ✅ `backend/checkOrderPayouts.js` (nuovo)
5. ✅ `backend/checkRecentOrders.js` (nuovo)

### File Opzionali (già in repo)
- `backend/inspectOrder.js`
- `backend/recalculatePayouts.js`
- `backend/analyzeStripeSession.js`

### Configurazione Railway
1. ✅ Aggiungi cronjob al `railway.json` (vedi sopra)
2. ✅ Deploy modifiche
3. ✅ Verifica logs: `railway logs --tail 100`

---

## ✅ Verifica Finale

Dopo il deploy, esegui questi test:

1. **Test Cronjob:**
```bash
# Locale
node retryPendingPayouts.js --prod --dry-run
```

2. **Test Ordine:**
   - Fai un ordine di test
   - Verifica che il transfer parta automaticamente
   - Controlla i log: `railway logs | grep "STRIPE TRANSFER"`

3. **Monitoraggio Dashboard:**
   - Vai su Admin Payment Control
   - Verifica che non ci siano payout pending vecchi

---

## 📞 Supporto

Se il problema si ripete:
1. Controlla i log: cerca `ERRORE TRANSFER CRITICO`
2. Verifica che il cronjob sia attivo
3. Esegui manualmente: `node retryPendingPayouts.js --prod`
4. Se necessario, esegui transfer singolo: `node executeManualTransfer.js <payoutId> --prod --confirm`
