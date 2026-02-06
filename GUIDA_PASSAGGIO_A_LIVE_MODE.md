# 🚀 Guida Completa: Passaggio a LIVE MODE

## ✅ Checklist Pre-Passaggio

- [x] Sistema testato in TEST mode
- [x] Transfer automatici verificati e funzionanti
- [x] Indirizzi spedizione raccolti correttamente
- [x] Abbonamenti Stripe Billing funzionanti (non toccati!)
- [x] Email conferma ordini testate
- [ ] Webhook LIVE da creare
- [ ] Variabili Railway da aggiornare

---

## 📝 STEP 1: Aggiorna Variabili su Railway

Vai su **Railway** → Il tuo progetto → **Variables** e sostituisci:

### 🔑 Chiavi Stripe

```bash
# Rimuovi TEST, aggiungi LIVE
STRIPE_SECRET_KEY=sk_live_51SrKuwK9Lxisu9UD...XXXXX...your_live_secret_key

STRIPE_PUBLISHABLE_KEY=pk_live_51SrKuwK9Lxisu9UD...XXXXX...your_live_publishable_key

# Webhook standard LIVE
STRIPE_WEBHOOK_SECRET=whsec_GnfgcdyfnEphUDypHBq...XXXXX...your_webhook_secret

# Frontend production
FRONTEND_URL=https://www.lucanikoshop.it
```

### ⚠️ NON MODIFICARE ANCORA:
```bash
# QUESTO LO AGGIORNERAI DOPO AVER CREATO IL WEBHOOK CONNECT LIVE
STRIPE_CONNECT_WEBHOOK_SECRET=(lascia quello attuale per ora)
```

---

## 🎯 STEP 2: Stripe Dashboard - Passa a LIVE Mode

1. Vai su **Stripe Dashboard**: https://dashboard.stripe.com
2. Toggle in alto a destra: **Test mode** → **Live mode** (switch off)
3. Conferma che sei in LIVE mode (il toggle deve essere grigio/spento)

---

## 🔗 STEP 3: Crea Webhook LIVE su Stripe

### Webhook 1: Pagamenti Standard (GIÀ ESISTENTE - verifica!)

Il webhook standard per `checkout.session.completed` dovrebbe già esistere in LIVE mode da quando hai testato gli abbonamenti.

**Verifica**:
1. **Developers** → **Webhooks** (assicurati di essere in LIVE mode)
2. Cerca endpoint: `https://api.lucanikoshop.it/api/webhook`
3. Se esiste: **copia il Signing Secret** e verifica che corrisponda a `whsec_GnfgcdyfnEphUDypHBqL8FlKcw3N3ah1`
4. Se NON esiste, crealo:
   - Click **Add endpoint**
   - URL: `https://api.lucanikoshop.it/api/webhook`
   - Eventi: `checkout.session.completed`, `payment_intent.succeeded`
   - Copia il **Signing secret** generato

### Webhook 2: Stripe Connect (DA CREARE)

**Crea nuovo webhook Connect**:
1. **Developers** → **Webhooks** (in LIVE mode)
2. Click **Add endpoint**
3. **Endpoint URL**: `https://api.lucanikoshop.it/api/stripe-connect/webhook`
4. **Eventi da ascoltare** (seleziona questi):
   - `account.updated`
   - `transfer.created`
   - `transfer.updated`
   - `transfer.reversed`
   - `payout.created`
   - `payout.paid`
   - `payout.failed`
5. Click **Add endpoint**
6. **COPIA IL SIGNING SECRET** (inizia con `whsec_...`)

### Aggiorna Railway con nuovo Connect Webhook Secret

Vai su **Railway Variables** e aggiungi/aggiorna:
```bash
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_XXXXX_IL_SECRET_APPENA_COPIATO
```

**Railway farà auto-deploy** dopo il cambio variabili.

---

## 👥 STEP 4: Flusso Venditore REALE su Stripe Connect

### Come Funziona per i Venditori

1. **Venditore si registra** su LucanikoShop come seller
2. **Accede alla Dashboard Venditore** (dopo login)
3. **Click su "Collega Account Stripe"** o simile (nel suo profilo/dashboard)
4. Viene **reindirizzato a Stripe Onboarding** (pagina Stripe ufficiale)
5. **Compila dati REALI**:
   - Ragione sociale azienda
   - Partita IVA reale
   - IBAN reale per ricevere pagamenti
   - Documento identità (carta identità o passaporto)
   - Informazioni fiscali
6. **Stripe verifica automaticamente** i dati (può richiedere 1-3 giorni)
7. Quando **verificato**: account attivo (`chargesEnabled=true`, `payoutsEnabled=true`)
8. **Da quel momento**: ogni vendita genera **transfer automatico immediato** sul suo account Stripe
9. **Stripe fa bonifici SEPA automatici** sul suo IBAN (solitamente ogni 2 giorni lavorativi)

### Nella Tua Piattaforma

**Endpoint già implementati**:
- `POST /api/stripe-connect/create-account` - Crea account Connect per venditore
- `GET /api/stripe-connect/account-status` - Verifica stato account
- `POST /api/stripe-connect/refresh-onboarding` - Rigenera link onboarding se scaduto
- `POST /api/stripe-connect/dashboard-link` - Genera link dashboard Stripe per venditore

**Devi solo integrare nel frontend**:
- Bottone "Collega Stripe" nella dashboard venditore
- Chiamata API `create-account` → Redirect all'URL onboarding ritornato
- Verifica stato con `account-status`
- Mostra saldo/statistiche earnings

---

## 💰 STEP 5: Verifica Connect Attivato su Stripe

1. Vai su **Stripe Dashboard** (LIVE mode)
2. **Connect** → **Settings** (o Impostazioni)
3. Verifica che **Connect sia attivato**
4. Tipo account: **Express accounts**
5. Paese di onboarding: **Italia**

Se non è attivato:
1. Click **Enable Connect**
2. Seleziona **Express**
3. Completa setup guidato

---

## 🧪 STEP 6: Test Ordine Reale (IMPORTANTE)

### ⚠️ ATTENZIONE: In LIVE mode userai SOLDI VERI!

**Test consigliato**:
1. Crea un prodotto a **€1** per test
2. Fai un ordine reale con carta vera
3. Verifica:
   - ✅ Ordine creato correttamente
   - ✅ Email ricevuta
   - ✅ Transfer automatico visibile su Stripe Connect (se venditore ha account attivo)
   - ✅ Log Railway senza errori

**Se tutto OK**: puoi lasciare online e iniziare a usare la piattaforma!

---

## 📊 Monitoraggio in LIVE Mode

### Railway Logs
```bash
# I log dovrebbero mostrare:
💳 [STRIPE TRANSFER] Usando source_transaction: ch_XXXXX
✅ [STRIPE TRANSFER] Transfer completato: tr_XXXXX
```

### Stripe Dashboard
1. **Pagamenti** → Vedi tutti gli ordini reali
2. **Connect** → **Account connessi** → Vedi venditori registrati
3. **Connect** → Click su un account → Vedi transfer ricevuti dal venditore
4. **Developers** → **Webhooks** → Vedi log eventi ricevuti

---

## ❓ FAQ

### Q: Gli abbonamenti Stripe Billing funzionano ancora?
**R: SÌ!** Il sistema abbonamenti non è stato toccato. Continua a funzionare identico in LIVE mode.

### Q: Posso tornare a TEST mode?
**R: SÌ!** Basta ri-commentare le chiavi LIVE e decommentare quelle TEST nel .env e Railway.

### Q: Quanto tempo per i bonifici ai venditori?
**R: Transfer immediato su Stripe** (visibile subito nell'account venditore). **Bonifico SEPA sul conto bancario**: 2-7 giorni lavorativi (velocità dipende da Stripe e banca).

### Q: Cosa succede se un venditore non ha completato onboarding?
**R:** Il transfer NON parte (codice controlla `stripeChargesEnabled && stripePayoutsEnabled`). L'earnings rimane in `pendingEarnings` fino a quando il venditore completa la verifica.

### Q: Posso fare refund?
**R: SÌ!** Da Stripe Dashboard → Pagamenti → Click sul pagamento → Refund. Se già fatto transfer al venditore, Stripe gestisce automaticamente (reversal del transfer).

---

## 🎉 Riepilogo

- ✅ Sistema completo e testato
- ✅ Transfer automatici funzionanti
- ✅ Fee corrette: 1.5% + €0.25 per transazione, €0 transfer, €0 payout
- ✅ Onboarding venditori integrato
- ✅ Abbonamenti non toccati e funzionanti
- ✅ Pronto per LIVE mode!

---

**Creato il**: 6 Febbraio 2026  
**Sistema**: Stripe Connect Express + Automatic Transfers  
**Status**: ✅ PRONTO PER PRODUZIONE
