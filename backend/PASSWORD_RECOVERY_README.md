# Script di Recovery Password

## Problema Identificato

Il bug nel pre-save hook di User.js (mancava `return` prima di `next()`) causava il doppio hashing delle password quando un utente aggiornava il proprio profilo.

**Bug:**
```javascript
if (!this.isModified('password')) {
    next();  // ❌ Senza return, continuava l'esecuzione
}
// Continuava e hashava di nuovo la password già hashata
```

**Fix:**
```javascript
if (!this.isModified('password')) {
    return next();  // ✅ Ora esce correttamente
}
```

## Utenti Affetti

Tutti gli utenti che hanno fatto un save/update del profilo dopo l'introduzione del bug hanno la password corrotta.

## Script Disponibili

### 1. resetAdmin.js
Resetta solo l'account admin test.

```bash
node resetAdmin.js
```

### 2. checkPasswordIssues.js
Verifica se ci sono problemi di password (rileva pattern anomali).

```bash
node checkPasswordIssues.js
```

### 3. resetUserPassword.js **(CONSIGLIATO)**
Reset interattivo per un utente specifico.

```bash
node resetUserPassword.js
```

Segui le istruzioni:
1. Inserisci email utente
2. Inserisci nuova password (min 8 char, 1 maiuscola, 1 minuscola, 1 numero, 1 simbolo)
3. Conferma

### 4. resetVendorPasswords.js
Reset batch per più venditori.

1. Modifica il file e aggiungi le email:
```javascript
const vendorsToReset = [
  { email: 'venditore1@esempio.com', newPassword: 'NuovaPass123!' },
  { email: 'venditore2@esempio.com', newPassword: 'AltroPass456!' },
];
```

2. Esegui:
```bash
node resetVendorPasswords.js
```

## Istruzioni per l'Utente

Se un utente non riesce a fare login:

1. Usa `resetUserPassword.js` per resettare la sua password
2. Comunica all'utente la nuova password temporanea
3. Chiedi all'utente di cambiarla dopo il primo login

## Prevenzione Futura

Il fix è già applicato in User.js. Tutti i nuovi utenti e tutti gli aggiornamenti futuri funzioneranno correttamente.
