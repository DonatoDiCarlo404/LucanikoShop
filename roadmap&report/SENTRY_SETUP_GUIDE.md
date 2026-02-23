# 🔔 Guida Setup Sentry - LucanikoShop

## ✅ Cosa abbiamo implementato

Sentry è ora integrato nel frontend per tracciare automaticamente:
- ❌ Errori JavaScript non gestiti
- 🔴 Crash dell'app (pagina bianca)
- 🐛 Eccezioni in React components
- 👤 Quale utente ha avuto l'errore
- 📱 Browser, OS, device dell'utente
- 🎬 Replay della sessione quando c'è un errore

**Zero impatto se non configurato** - Se non aggiungi il DSN, Sentry non si attiva.

---

## 🚀 Setup Rapido (5 minuti)

### 1. Crea account Sentry (GRATIS)

Vai su [https://sentry.io](https://sentry.io) e:
- Clicca "Get Started" 
- Registrati con Google/GitHub o email
- Piano FREE: 5,000 errori/mese - più che sufficiente!

### 2. Crea nuovo progetto

1. Clicca "Create Project"
2. Seleziona piattaforma: **React**
3. Nome progetto: `lucanikoshop-frontend`
4. Clicca "Create Project"

### 3. Copia il DSN

Dopo aver creato il progetto, Sentry ti mostra il **DSN**:

```
https://xxxxxxxxxxxxxxxxxxx@xxxxxxx.ingest.sentry.io/xxxxxxx
```

**Questo è il tuo codice univoco** - copialo!

### 4. Configura variabili ambiente

**SVILUPPO (locale):**
Crea file `.env` nella cartella `frontend/`:

```bash
# Frontend .env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=your_stripe_test_key
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# 🔔 SENTRY - Aggiungi queste righe
VITE_SENTRY_DSN=https://xxxxxxxxxxx@xxxxxxx.ingest.sentry.io/xxxxxxx
VITE_SENTRY_ENVIRONMENT=development
VITE_APP_VERSION=1.0.0

VITE_MAINTENANCE_MODE=false
```

**PRODUZIONE (Vercel):**

1. Vai su [Vercel Dashboard](https://vercel.com)
2. Seleziona il progetto `lucanikoshop-frontend`
3. Settings → Environment Variables
4. Aggiungi:

| Nome | Valore | Environment |
|------|--------|-------------|
| `VITE_SENTRY_DSN` | `https://xxx@xxx.ingest.sentry.io/xxx` | Production |
| `VITE_SENTRY_ENVIRONMENT` | `production` | Production |
| `VITE_APP_VERSION` | `1.0.0` | Production |

5. Clicca "Save"
6. **Redeploy** il progetto per applicare le variabili

---

## 🧪 Testa che funzioni

### Test locale:

1. Avvia il frontend in dev:
```bash
cd frontend
npm run dev
```

2. Guarda la console browser - dovresti vedere:
```
✅ [Sentry] Inizializzato in ambiente: development
```

3. **Genera un errore di test**: apri console e scrivi:
```javascript
throw new Error("Test Sentry - tutto ok!");
```

4. Vai su [https://sentry.io](https://sentry.io) → Issues
5. Dovresti vedere l'errore "Test Sentry - tutto ok!"

### Test produzione:

Dopo il deploy su Vercel:
1. Apri il sito in produzione
2. Apri DevTools → Console
3. Lancia errore di test (come sopra)
4. Controlla Sentry - dovresti vedere:
   - Errore
   - Environment: **production**
   - URL del sito
   - Browser dell'utente

---

## 📊 Cosa vedrai in Sentry

Quando un utente ha un errore, Sentry ti mostra:

```
🔴 QuotaExceededError
📂 File: CartContext.jsx
📍 Linea: 89
👤 Utente: email@example.com (role: buyer)
🌐 Browser: Chrome 121 / Windows 11
📱 Device: Desktop
🕐 Data/Ora: 23 Feb 2026, 14:35
🎬 Session Replay: [▶️ Guarda cosa ha fatto]
📋 Stack trace completo
```

### Dashboard Sentry:

- **Issues**: Lista di tutti gli errori raggruppati
- **Releases**: Errori per versione app
- **Performance**: Metriche performance (opzionale)
- **Replays**: Video delle sessioni con errori

---

## ⚙️ Configurazione avanzata

### Aggiorna versione app

Quando rilasci un aggiornamento, cambia la versione in `.env`:

```bash
VITE_APP_VERSION=1.1.0
```

Così saprai quale versione ha generato l'errore.

### Filtra errori non importanti

Il file `frontend/src/config/sentry.js` già filtra:
- ✅ Errori da estensioni browser
- ✅ Errori di rete temporanei
- ✅ Console logs in produzione (privacy)

Puoi aggiungere altri filtri modificando la funzione `beforeSend`.

### Disabilita in sviluppo locale

Se non vuoi Sentry in localhost, rimuovi/commenta `VITE_SENTRY_DSN` dal `.env` locale.

---

## 🚨 Risoluzione problemi

### "Sentry disabilitato in sviluppo locale"

**Normale!** Per default Sentry non si attiva su localhost per non riempire la quota.

Se vuoi attivarlo anche in localhost, cambia in `frontend/src/config/sentry.js`:

```javascript
// Commenta questa parte
// if (environment === 'development' && window.location.hostname === 'localhost') {
//   console.log('ℹ️ [Sentry] Disabilitato in sviluppo locale');
//   return;
// }
```

### "DSN non configurato"

Hai dimenticato di aggiungere `VITE_SENTRY_DSN` al `.env` o a Vercel.

### Errori non appaiono in Sentry

1. Verifica che il DSN sia corretto
2. Controlla la console - vedi "✅ [Sentry] Inizializzato"?
3. Controlla quota Sentry (potrebbero essere finite le 5K/mese)
4. Verifica che l'errore non sia filtrato da `beforeSend`

---

## 💰 Piani e Costi

### FREE (attuale)
- ✅ 5,000 errori/mese
- ✅ 1 progetto
- ✅ 30 giorni di storia
- ✅ Illimitati membri team
- ✅ Source maps
- ✅ Session replay su errori

**Sufficiente per migliaia di utenti!**

### Se superi 5K errori/mese:
- Team Plan: $26/mese (50K errori)
- Oppure: riduci sample rate in `sentry.js`

---

## 📝 Note importanti

1. **Privacy**: Sentry maschera automaticamente:
   - Password
   - Dati carte di credito  
   - Token
   - Cookie sensibili

2. **Performance**: Impatto minimo:
   - ~50KB aggiuntivi al bundle
   - Errori inviati in background (non blocca UI)

3. **GDPR compliant**: Puoi configurare data residency EU

4. **Non serve nel backend**: Abbiamo implementato solo frontend
   - Backend ha già logging su Railway/file
   - Evita problemi precedenti con Railway

---

## 🎯 Prossimi passi

1. ✅ **Setup ora**: Crea account e aggiungi DSN
2. ⏰ **Monitoraggio**: Controlla Sentry 1 volta/settimana
3. 🔔 **Notifiche**: Configura alert email per errori critici
4. 📈 **Analisi**: Dopo 1 mese, analizza pattern errori più comuni

---

## 📞 Supporto

- **Sentry Docs**: https://docs.sentry.io/platforms/javascript/guides/react/
- **Dashboard**: https://sentry.io
- **Community**: https://discord.gg/sentry

---

**Congratulazioni! 🎉**  
Ora hai un sistema di error tracking professionale che ti avvisa automaticamente quando qualcosa va storto!
