# Fix Rate Limiter - Errore 429 in Produzione

## Problema Risolto

### Cause dell'errore 429 "Too Many Requests":

1. **Rate limiter troppo restrittivo**: 
   - Limite precedente: 5 tentativi/15 minuti
   - Contava anche i login **riusciti** come tentativi
   
2. **Mancanza di trust proxy**:
   - Senza `app.set('trust proxy', 1)`, tutti i client dietro un proxy (Railway) condividevano lo stesso IP
   - Questo causava il raggiungimento veloce del limite globale

### Fix Applicati:

#### 1. rateLimiter.js
```javascript
// Prima (❌):
max: 5,
skipSuccessfulRequests: false

// Dopo (✅):
max: 20,
skipSuccessfulRequests: true  // Non conta i login riusciti
```

#### 2. server.js
```javascript
// Aggiunto:
app.set('trust proxy', 1);
```

## ⚠️ AZIONE RICHIESTA

### Per applicare il fix in produzione:

1. **Commit e push delle modifiche:**
   ```bash
   git add .
   git commit -m "Fix: Aumenta rate limit login e abilita trust proxy"
   git push origin main
   ```

2. **Riavvia il backend su Railway:**
   - Il deploy automatico partirà al push
   - Oppure vai su Railway Dashboard → Redeploy

3. **Verifica:**
   - Attendi 1-2 minuti per il deploy
   - Prova a fare login in produzione
   - Dovrebbe funzionare!

## Nuovi Limiti:

- **Login/Registrazione**: 20 tentativi falliti / 15 minuti
- Login riusciti: **illimitati** (non contano nel limite)
- Admin operations: 50 richieste / 15 minuti
- API pubbliche: 100 richieste / 15 minuti

## Note:

Il rate limiter usa memoria in-process, quindi si resetta automaticamente al riavvio del server.
Se sei ancora bloccato dopo il deploy, aspetta 15 minuti oppure riavvia manualmente il backend.
