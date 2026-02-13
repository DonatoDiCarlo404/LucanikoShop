# Roadmap Implementazione Pagamenti Live - Abbonamento Registrazione

## Fase 1: Preparazione e Test in Locale (TEST MODE)

### 1.1 Verifica configurazione chiavi TEST in locale
**Backend (.env):**
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

**Frontend (.env):**
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 1.2 Test completo flusso registrazione locale
- [ ] Avvia backend: `cd backend && npm start`
- [ ] Avvia frontend: `cd frontend && npm run dev`
- [ ] Registra un nuovo utente venditore
- [ ] Completa pagamento con carta test: `4242 4242 4242 4242`
- [ ] Verifica che l'utente venga creato con `isSubscribed: true`
- [ ] Verifica ricezione email di conferma
- [ ] Verifica webhook ricevuti nel terminale backend

### 1.3 Test carte Stripe di test
- **Successo:** `4242 4242 4242 4242`
- **Rifiutata:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0027 6000 3184`
- **Insufficienza fondi:** `4000 0000 0000 9995`

---

## Fase 2: Deploy Produzione con TEST MODE

### 2.1 Configura chiavi TEST in produzione
**Railway (Backend):**
- Vai su Railway Dashboard → Progetto backend → Variables
- Aggiungi/Verifica:
  ```
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_... (da configurare dopo webhook)
  ```

**Vercel (Frontend):**
- Vai su Vercel Dashboard → Progetto frontend → Settings → Environment Variables
- Aggiungi/Verifica:
  ```
  VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
  ```

### 2.2 Configura Webhook TEST in Stripe
1. Vai su Stripe Dashboard → Developers → Webhooks
2. Assicurati di essere in **modalità TEST** (toggle in alto a destra)
3. Clicca su **"Add endpoint"**
4. Inserisci URL: `https://api.lucanikoshop.it/api/webhook/stripe`
5. Seleziona eventi:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. Clicca su **"Add endpoint"**
7. Copia il **Signing secret** (inizia con `whsec_`)
8. Vai su Railway → Variables → Aggiorna `STRIPE_WEBHOOK_SECRET`

### 2.3 Test in produzione con carte TEST
- [ ] Vai su https://www.lucanikoshop.it
- [ ] Registra un nuovo utente
- [ ] Completa pagamento con carta test `4242 4242 4242 4242`
- [ ] Verifica utente creato correttamente
- [ ] Controlla Railway logs per webhook ricevuti
- [ ] Verifica email di conferma ricevuta

---

## Fase 3: Completamento Verifica Stripe per LIVE MODE

### 3.1 Attiva account Stripe Live
1. Vai su Stripe Dashboard → **Modalità LIVE** (toggle in alto a destra)
2. Vai su **Settings** → **Business settings**
3. Completa tutte le sezioni richieste:
   - **Business details:** Nome azienda, indirizzo, tipo attività
   - **Representative:** Dati del rappresentante legale
   - **Banking:** IBAN per ricevere pagamenti
   - **Identity verification:** Carica documenti (ID, prova indirizzo)

### 3.2 Attendi approvazione Stripe
- Stripe revisiona i documenti (può richiedere 1-7 giorni)
- Riceverai email di conferma quando l'account è approvato

---

## Fase 4: Configurazione Chiavi LIVE

### 4.1 Recupera chiavi LIVE da Stripe
1. Vai su Stripe Dashboard → **Modalità LIVE** (toggle in alto)
2. Vai su **Developers** → **API keys**
3. Copia:
   - **Publishable key** (inizia con `pk_live_...`)
   - **Secret key** (inizia con `sk_live_...`) - clicca su "Reveal test key token"

### 4.2 Configura Webhook LIVE
1. Stripe Dashboard → **Modalità LIVE** → **Developers** → **Webhooks**
2. Clicca su **"Add endpoint"**
3. Inserisci URL: `https://api.lucanikoshop.it/api/webhook/stripe`
4. Seleziona gli stessi eventi del punto 2.2
5. Copia il **Signing secret LIVE** (inizia con `whsec_`)

### 4.3 Aggiorna variabili ambiente in produzione
**Railway (Backend):**
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (LIVE)
```

**Vercel (Frontend):**
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 4.4 Redeploy applicazioni
- **Railway:** Redeploy automatico dopo modifica variabili
- **Vercel:** Redeploy manuale o tramite nuovo commit

---

## Fase 5: Test Transazione Reale

### 5.1 Crea prodotto/abbonamento test economico (opzionale)
Per testare senza spendere molto:
1. Backend: crea temporaneamente un abbonamento a 1€
2. O usa l'abbonamento reale se hai budget

### 5.2 Test transazione reale
- [ ] Vai su https://www.lucanikoshop.it
- [ ] Registra nuovo utente con email reale
- [ ] Usa carta di credito/debito reale
- [ ] Completa il pagamento
- [ ] Verifica che:
  - Utente creato con `isSubscribed: true`
  - Email di conferma ricevuta
  - Pagamento visibile su Stripe Dashboard (modalità LIVE)
  - Webhook ricevuti (controlla Railway logs)
  - Denaro accreditato su Stripe (disponibile dopo 7 giorni)

### 5.3 Monitora transazione
- Stripe Dashboard → Payments → Trova la transazione
- Verifica stato: **Succeeded**
- Controlla eventuali dispute o chargeback

---

## Fase 6: Monitoraggio e Sicurezza

### 6.1 Configura notifiche Stripe
- Stripe Dashboard → Settings → Notifications
- Attiva notifiche per:
  - Pagamenti riusciti
  - Pagamenti falliti
  - Dispute
  - Chargeback

### 6.2 Monitoraggio continuo
- [ ] Controlla Railway logs giornalmente per errori webhook
- [ ] Verifica Stripe Dashboard per transazioni anomale
- [ ] Monitora email di utenti per problemi pagamento

### 6.3 Backup chiavi
- Salva le chiavi Stripe in un password manager sicuro
- Non condividere mai le chiavi segrete
- Ruota le chiavi periodicamente (ogni 6-12 mesi)

---

## Fase 7: Rollback in caso di problemi

Se qualcosa va storto in produzione:

### 7.1 Rollback immediato
1. Railway → Variables → Ripristina chiavi TEST
2. Vercel → Environment Variables → Ripristina chiavi TEST
3. Redeploy entrambe le applicazioni

### 7.2 Debug
- Controlla Railway logs per errori
- Controlla Stripe Dashboard → Logs per webhook falliti
- Verifica che le chiavi siano corrette e corrispondano

### 7.3 Supporto Stripe
Se hai problemi con l'account o pagamenti:
- Stripe Dashboard → Support → Contatta supporto
- Fornisci payment intent ID o transaction ID

---

## Checklist Finale Prima di Go-Live

- [ ] Tutti i test in locale completati con successo
- [ ] Tutti i test in produzione (TEST mode) completati
- [ ] Account Stripe verificato e approvato
- [ ] IBAN configurato per ricevere pagamenti
- [ ] Webhook LIVE configurati e funzionanti
- [ ] Chiavi LIVE configurate in produzione
- [ ] Transazione reale test completata con successo
- [ ] Email di conferma funzionanti
- [ ] Monitoraggio attivo
- [ ] Piano di rollback pronto

---

## Note Importanti

⚠️ **Non testare mai pagamenti live in locale** - usa sempre TEST mode in sviluppo

⚠️ **Backup delle chiavi** - salva tutte le chiavi in modo sicuro

⚠️ **Monitoraggio continuo** - controlla logs e Stripe Dashboard regolarmente

⚠️ **Privacy e GDPR** - assicurati di salvare i dati di pagamento solo come necessario

⚠️ **PCI Compliance** - Stripe gestisce la compliance, ma non salvare mai dati carta nel tuo DB

---

## Contatti Utili

- **Stripe Support:** https://support.stripe.com
- **Stripe Documentation:** https://stripe.com/docs
- **Stripe API Reference:** https://stripe.com/docs/api
- **Railway Support:** https://railway.app/help
- **Vercel Support:** https://vercel.com/support

---

**Data creazione:** 5 Febbraio 2026
**Ultima modifica:** 5 Febbraio 2026
**Status:** In attesa di implementazione
