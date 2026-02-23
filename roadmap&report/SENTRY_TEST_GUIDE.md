# Test Sentry Integration

## Test rapidi da console browser

Dopo aver configurato Sentry, puoi testare che funzioni correttamente.

### 1. Verifica inizializzazione

Apri DevTools → Console e cerca:
```
✅ [Sentry] Inizializzato in ambiente: development
```

Se vedi:
```
ℹ️ [Sentry] DSN non configurato - Sentry disabilitato
```
→ Devi aggiungere `VITE_SENTRY_DSN` al file `.env`

### 2. Test errore semplice

Nella console browser:
```javascript
throw new Error("Test Sentry - errore base");
```

Vai su https://sentry.io → Issues → Dovresti vedere l'errore!

### 3. Test errore con contesto

```javascript
const testError = new Error("Test con contesto utente");
testError.userId = "test-123";
throw testError;
```

In Sentry dovresti vedere anche il contesto.

### 4. Test cattura manuale

```javascript
// Importa Sentry nel componente che vuoi testare
import { captureMessage, captureException } from '../config/sentry';

// Test messaggio
captureMessage("Questo è un test di Sentry", "info");

// Test eccezione
try {
  // Simula errore
  JSON.parse("{invalid json");
} catch (error) {
  captureException(error, { note: "Test parsing JSON" });
}
```

### 5. Test QuotaExceededError

Simula l'errore del tuo vice admin:

```javascript
// Riempi localStorage fino a superare quota
try {
  const bigData = 'x'.repeat(10000000);
  localStorage.setItem('test_overflow', bigData);
} catch (error) {
  console.log("✅ Errore catturato:", error.name);
  // Sentry dovrebbe ricevere questo errore
}
```

Il nostro nuovo codice lo gestirà senza crashare!

### 6. Test ErrorBoundary

Crea un componente di test che lancia un errore:

```jsx
// TestError.jsx
export default function TestError() {
  const handleClick = () => {
    throw new Error("Test ErrorBoundary");
  };

  return <button onClick={handleClick}>Lancia Errore</button>;
}
```

Aggiungi al routing e clicca il bottone → Dovresti vedere l'ErrorBoundary + errore in Sentry.

---

## Checklist verifica

- [ ] Messaggio "✅ [Sentry] Inizializzato" in console
- [ ] Errore di test appare in Sentry dashboard
- [ ] Info utente visibile in Sentry (dopo login)
- [ ] Environment corretto (development/production)
- [ ] Stack trace completo visibile
- [ ] Session replay disponibile (quando errore)

---

## Se qualcosa non funziona

1. **Nessun errore in Sentry**
   - Verifica DSN corretto in `.env`
   - Controlla console per errori init Sentry
   - Prova in modalità incognito (evita estensioni)

2. **Errori duplicati**
   - Normale in dev mode (hot reload)
   - In produzione non dovrebbe succedere

3. **Troppi errori**
   - Riduci `tracesSampleRate` in `sentry.js`
   - Aggiungi filtri in `beforeSend`

4. **Source maps non funzionano**
   - Vercel carica automaticamente source maps
   - Controlla che `vite.config.js` abbia `sourcemap: true` in build

---

## Comandi utili

```bash
# Build con source maps
npm run build

# Testa build locale
npm run preview

# Check dimensione bundle (con Sentry)
npm run build && du -sh dist/assets/*
```

Sentry aggiunge circa 50-60KB al bundle totale.
