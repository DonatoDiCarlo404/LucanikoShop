# Guida Configurazione Stripe per Lucaniko Shop

## 1. Creare Account Stripe

1. Vai su [https://stripe.com](https://stripe.com)
2. Clicca su "Start now" o "Registrati"
3. Compila i dati richiesti:
   - Email
   - Nome completo
   - Paese (Italia)
   - Password

## 2. Completare la Verifica Account

Dopo la registrazione, Stripe richiederà:
- **Dati aziendali**: Nome azienda, indirizzo, P.IVA
- **Dati bancari**: IBAN del conto dove ricevere i pagamenti
- **Documenti**: Documento d'identità del titolare
- **Verifica**: Potrebbero fare piccoli depositi di verifica sul tuo conto

## 3. Ottenere le Chiavi API

1. Nel Dashboard Stripe, vai su **Developers** → **API keys**
2. Troverai due tipi di chiavi:
   - **Publishable key** (pk_test_... per test, pk_live_... per produzione)
   - **Secret key** (sk_test_... per test, sk_live_... per produzione)

### Modalità Test (per sviluppo)
- Usa le chiavi `pk_test_` e `sk_test_`
- Puoi testare con carte di prova (es: 4242 4242 4242 4242)

### Modalità Live (per produzione)
- Attiva il tuo account completando tutti i requisiti
- Usa le chiavi `pk_live_` e `sk_live_`
- I pagamenti saranno reali

## 4. Configurare le Chiavi nel Progetto

### Frontend (Register.jsx)
Sostituisci la chiave pubblica placeholder:
```javascript
const stripePromise = loadStripe('pk_test_TUA_CHIAVE_PUBBLICA');
// In produzione usa: pk_live_...
```

### Backend
Crea/modifica il file `backend/.env`:
```env
STRIPE_SECRET_KEY=sk_test_TUA_CHIAVE_SEGRETA
# In produzione usa: sk_live_...
```

## 5. Implementare Endpoint Backend

Nel backend dovrai creare un endpoint per processare i pagamenti:

### File: `backend/routes/paymentRoutes.js`
```javascript
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Crea PaymentIntent per abbonamento venditore
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, email, subscriptionType } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe usa centesimi
      currency: 'eur',
      description: `Abbonamento ${subscriptionType} - Lucaniko Shop`,
      receipt_email: email,
      metadata: {
        subscriptionType,
        userId: req.user?._id || 'pending'
      }
    });
    
    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verifica stato pagamento
router.post('/verify-payment', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    res.json({ 
      status: paymentIntent.status,
      paid: paymentIntent.status === 'succeeded'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Aggiungi al server.js:
```javascript
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payment', paymentRoutes);
```

### Installa Stripe nel backend:
```bash
cd backend
npm install stripe
```

## 6. Commissioni e Costi Stripe

Stripe addebita:
- **1,4% + €0,25** per carte europee
- **2,9% + €0,25** per carte non europee
- Nessun costo fisso mensile
- Accrediti sul conto in **2-7 giorni lavorativi**

### Esempio calcolo:
- Abbonamento: €183,00
- Commissione Stripe: ~€2,81
- Ricevi: ~€180,19

## 7. Webhook (Opzionale ma Consigliato)

Per gestire eventi come pagamenti confermati o falliti:

1. Nel Dashboard Stripe: **Developers** → **Webhooks**
2. Aggiungi endpoint: `https://tuodominio.com/api/webhooks/stripe`
3. Seleziona eventi:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

### Backend webhook handler:
```javascript
router.post('/webhooks/stripe', 
  express.raw({type: 'application/json'}), 
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    try {
      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      
      if (event.type === 'payment_intent.succeeded') {
        // Attiva account venditore
        const paymentIntent = event.data.object;
        // TODO: aggiorna database utente
      }
      
      res.json({received: true});
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
});
```

## 8. Testare il Sistema

### Carte di Test Stripe:
- **Successo**: 4242 4242 4242 4242
- **Rifiutata**: 4000 0000 0000 0002
- **Richiede autenticazione**: 4000 0027 6000 3184
- Data scadenza: qualsiasi data futura
- CVC: qualsiasi 3 cifre
- CAP: qualsiasi

## 9. Andare in Produzione

Prima di usare le chiavi live:
1. ✅ Completa verifica account Stripe
2. ✅ Fornisci tutti i documenti richiesti
3. ✅ Collega conto bancario
4. ✅ Testa accuratamente in modalità test
5. ✅ Sostituisci chiavi test con chiavi live
6. ✅ Configura webhook in produzione

## 10. Sicurezza

⚠️ **IMPORTANTE**:
- ❌ **MAI** committare chiavi segrete su Git
- ✅ Usa variabili d'ambiente (`.env`)
- ✅ Aggiungi `.env` al `.gitignore`
- ✅ Usa HTTPS in produzione
- ✅ Valida sempre pagamenti lato server

## 11. Dashboard Stripe

Nel dashboard potrai:
- 📊 Vedere tutte le transazioni
- 💳 Gestire rimborsi
- 📈 Analizzare statistiche
- 👥 Gestire clienti
- 🔔 Configurare notifiche email

## 12. Alternative o Integrazioni Aggiuntive

Se preferisci, puoi aggiungere anche:
- **PayPal** (commissioni simili)
- **Satispay** (per il mercato italiano)
- **Bonifico bancario** (manuale, senza commissioni)

---

## Link Utili

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Documentazione Stripe](https://stripe.com/docs)
- [Test Card Numbers](https://stripe.com/docs/testing)
- [Pricing Stripe Italia](https://stripe.com/it/pricing)
