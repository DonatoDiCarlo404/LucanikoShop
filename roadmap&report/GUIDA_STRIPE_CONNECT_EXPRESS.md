# 🚀 Guida Configurazione Stripe Connect Express

**Data implementazione**: Febbraio 2026  
**Sistema**: Lucaniko Shop Marketplace Multivendor  
**Modalità pagamenti**: Solo aziende (business_type: company)

---

## 📋 Prerequisiti

- ✅ Account Stripe attivo (https://stripe.com)
- ✅ Business verificato
- ✅ API Keys (Secret Key e Publishable Key)
- ✅ Webhook già configurato per pagamenti standard

---

## ⚙️ STEP 1: Attiva Stripe Connect

### 1.1 Accedi a Stripe Dashboard

1. Vai su https://dashboard.stripe.com
2. Assicurati di essere in **modalità Test** per testare prima di andare in produzione
3. Nel menu laterale, clicca su **Connect** (icona ⚡)

### 1.2 Attiva Stripe Connect

1. Clicca su **"Get started"** o **"Enable Connect"**
2. Stripe ti chiederà alcune informazioni sul tuo marketplace:
   - **Platform name**: `Lucaniko Shop`
   - **Website**: `https://www.lucanikoshop.it`
   - **Type of business**: `Marketplace` or `Platform`
   - **Industry**: Seleziona la categoria appropriata (es. "Retail")
   
3. Accetta i termini di servizio Connect

✅ Stripe Connect è ora attivato sul tuo account!

---

## 🔧 STEP 2: Configura Impostazioni Connect

### 2.1 Impostazioni Base

1. Nel dashboard Connect, vai su **Settings** (⚙️)
2. Configura le seguenti opzioni:

#### **Branding**:
- **Brand name**: `Lucaniko Shop`
- **Brand color**: Il tuo colore brand
- **Brand logo**: Logo Lucaniko Shop (formato PNG o SVG, max 1MB)
- **Icon**: Favicon (128x128px)

#### **Business Information**:
- **Support URL**: `https://www.lucanikoshop.it/support`
- **Privacy policy URL**: `https://www.lucanikoshop.it/privacy`
- **Terms of service URL**: `https://www.lucanikoshop.it/terms`

### 2.2 Impostazioni Payout

1. Vai su **Connect → Settings → Payouts**
2. Configura:
   - **Default payout schedule**: `Daily` (payout automatici giornalieri)
   - **Delay days**: `0` (nessun ritardo, solo quello standard Stripe di 2-3 giorni)
   - **Currency**: `EUR`

### 2.3 Impostazioni Onboarding

1. Vai su **Connect → Settings → Onboarding**
2. Configura gli URL:
   - **Return URL**: `https://www.lucanikoshop.it/dashboard/venditor/stripe-connect/complete`
   - **Refresh URL**: `https://www.lucanikoshop.it/dashboard/venditor/stripe-connect/refresh`

---

## 🔔 STEP 3: Configura Webhook Connect (Nuovo!)

**IMPORTANTE**: Questo webhook è DIVERSO da quello per i pagamenti standard!

### 3.1 Crea Webhook Connect

1. Vai su **Developers → Webhooks**
2. Clicca **"Add endpoint"**
3. Compila:
   - **Endpoint URL**: `https://your-backend-url.com/api/stripe-connect/webhook`
   - **Description**: `Lucaniko Shop - Stripe Connect Events`
   - **Version**: Ultima versione API disponibile

### 3.2 Seleziona Eventi

Seleziona i seguenti eventi:

```
✅ account.updated
✅ account.external_account.created
✅ account.external_account.updated
✅ account.external_account.deleted
✅ transfer.created
✅ transfer.updated
✅ transfer.failed
✅ transfer.reversed
✅ payout.created
✅ payout.updated
✅ payout.paid
✅ payout.failed
```

### 3.3 Salva Webhook Secret

1. Dopo aver creato il webhook, clicca su di esso
2. Rivela il **Signing secret** (inizia con `whsec_...`)
3. **COPIA** questo secret

### 3.4 Aggiungi al .env

Nel file `.env` del backend, aggiungi:

```env
# Stripe Connect Webhook (NUOVO - diverso dal webhook pagamenti)
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

---

## 🔑 STEP 4: Verifica API Keys

Nel tuo `.env` dovresti avere:

```env
# Stripe Standard
STRIPE_SECRET_KEY=sk_test_...  # o sk_live_... in produzione
STRIPE_PUBLISHABLE_KEY=pk_test_...  # o pk_live_... in produzione

# Stripe Webhooks
STRIPE_WEBHOOK_SECRET=whsec_...  # Webhook pagamenti standard
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...  # Webhook Connect (NUOVO!)

# Frontend URL
FRONTEND_URL=https://www.lucanikoshop.it  # In produzione
# FRONTEND_URL=http://localhost:5173  # In sviluppo
```

---

## ✅ STEP 5: Test in Modalità Test

### 5.1 Testa Creazione Account Connect

1. Avvia il backend: `npm run dev`
2. Accedi come venditore su Lucaniko Shop
3. Vai nel dashboard venditore
4. Clicca su **"Attiva pagamenti Stripe"** o simile
5. Dovresti essere reindirizzato a Stripe Connect Onboarding

### 5.2 Completa Onboarding Test

In modalità test, puoi usare dati fittizi:

**Dati azienda test**:
- **Business name**: Test Company SRL
- **P.IVA**: 12345678901
- **Email**: test@example.com
- **Phone**: +39 123 456 7890
- **Address**: Via Test 123, Milano, 20100, IT

**Dati rappresentante legale**:
- **Nome**: Mario
- **Cognome**: Rossi
- **Data nascita**: 01/01/1980
- **Documento**: Puoi caricare un'immagine qualsiasi in test mode

**IBAN test** (fornito da Stripe):
```
IT60X0542811101000000123456
```

### 5.3 Verifica Account Attivo

Dopo l'onboarding:
1. Torna su Lucaniko Shop
2. Dovresti vedere **Account Connect attivo** ✅
3. Nel Stripe Dashboard → Connect → Accounts
4. Dovresti vedere il nuovo account Express creato

### 5.4 Testa Transfer Automatico

1. Crea un ordine test su Lucaniko Shop
2. Completa il pagamento con carta test Stripe:
   - **Numero**: `4242 4242 4242 4242`
   - **Data**: Qualsiasi data futura
   - **CVC**: Qualsiasi 3 cifre
   - **ZIP**: Qualsiasi codice
3. Vai su Stripe Dashboard → Connect → Transfers
4. Dovresti vedere il transfer automatico verso l'account del venditore!

---

## 🚀 STEP 6: Vai in Produzione

### 6.1 Attiva Stripe Connect in Live Mode

1. Nel Stripe Dashboard, **passa a Live mode** (toggle in alto a destra)
2. Vai su **Connect → Settings**
3. Verifica che tutte le impostazioni siano corrette
4. Stripe potrebbe richiedere verifiche aggiuntive per il live mode

### 6.2 Crea Webhook Connect LIVE

**IMPORTANTE**: I webhook in test mode e live mode sono SEPARATI!

1. Assicurati di essere in **Live mode**
2. Ripeti lo STEP 3 per creare il webhook in modalità live
3. Usa lo stesso endpoint: `https://your-backend-url.com/api/stripe-connect/webhook`
4. **Copia il nuovo webhook secret LIVE** (sarà diverso da quello test!)

### 6.3 Aggiorna .env Produzione

```env
# Stripe LIVE
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx_LIVE
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_xxxxxxxx_LIVE_CONNECT
```

### 6.4 Deploy Backend

1. Aggiorna le variabili d'ambiente su Railway/Vercel/hosting
2. Riavvia il backend
3. Testa con un account venditore reale

---

## 📊 Monitoraggio e Gestione

### Dashboard Stripe - Sezioni Utili

1. **Connect → Accounts**: Elenco venditori collegati
2. **Connect → Transfers**: Trasferimenti ai venditori
3. **Connect → Payouts**: Payout dai venditori alle loro banche
4. **Developers → Logs**: Log chiamate API
5. **Developers → Events**: Eventi webhook

### Log Backend da Monitorare

Cerca nei log questi messaggi:

```bash
# Successo creazione account
✅ [STRIPE CONNECT] Account creato: acct_xxxxx

# Successo transfer
✅ [STRIPE TRANSFER] Transfer completato: tr_xxxxx

# Errori transfer
❌ [STRIPE TRANSFER] Errore transfer: ...
```

---

## 🔍 Troubleshooting

### Problema: "Account Connect non si crea"

✅ **Verifica**:
- Chiavi API corrette in `.env`
- Venditore ha role = 'seller'
- Connessione internet stabile

### Problema: "Transfer fallisce"

✅ **Verifica**:
- Account venditore ha `stripeChargesEnabled: true`
- Account venditore ha `stripePayoutsEnabled: true`
- Importo transfer > 0
- Importo in centesimi è intero (no decimali)

### Problema: "Webhook non riceve eventi"

✅ **Verifica**:
- Endpoint pubblicamente accessibile (no localhost)
- HTTPS obbligatorio in produzione
- Webhook secret corretto in `.env`
- Firewall/load balancer non blocca richieste Stripe

### Problema: "Venditore non completa onboarding"

✅ **Verifica**:
- Link onboarding non scaduto (valido 60 minuti)
- Genera nuovo link con `/refresh-onboarding`
- Dati richiesti completi (P.IVA, IBAN, documenti)

---

## 📞 Supporto

### Documentazione Stripe Official
- Connect Overview: https://stripe.com/docs/connect
- Express Accounts: https://stripe.com/docs/connect/express-accounts
- Transfers: https://stripe.com/docs/connect/transfers

### Test Cards Stripe
- https://stripe.com/docs/testing

### Stripe Support
- Dashboard → Help (icona ❓)
- https://support.stripe.com

---

## ✅ Checklist Finale

Prima di andare in produzione, verifica:

- [ ] Stripe Connect attivato
- [ ] Webhook Connect configurato (test + live)
- [ ] `.env` aggiornato con tutti i secret
- [ ] Branding personalizzato (logo, colori)
- [ ] URL return/refresh configurati correttamente
- [ ] Testato onboarding venditore completo
- [ ] Testato transfer automatico
- [ ] Testato payout verso banca venditore
- [ ] Monitoraggio log attivo
- [ ] Business verificato in live mode

---

## 🎉 Sistema Completo!

Dopo aver completato questi step, il tuo sistema Stripe Connect Express sarà **completamente funzionante**:

✅ Venditori creano account Connect in autonomia  
✅ Transfer automatici dopo ogni vendita (GRATIS!)  
✅ Payout automatici verso banche venditori (GRATIS!)  
✅ Zero gestione manuale bonifici  
✅ Tracking completo tutti i pagamenti  

**Costi totali**: Solo 1.5% + €0.25 per transazione cliente - nessun altro costo!

---

**Implementato da**: GitHub Copilot  
**Data**: Febbraio 2026
