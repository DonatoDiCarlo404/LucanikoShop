# 🔐 Google OAuth - Configurazione Dual Environment (Locale + Produzione)

## ✅ Problema Risolto
Il sistema ora rileva **automaticamente** l'ambiente e usa il callback URL corretto:
- **Sviluppo locale**: `http://localhost:5000/api/auth/google/callback`
- **Produzione**: `https://api.lucanikoshop.it/api/auth/google/callback`

**NON serve più cambiare le variabili d'ambiente** quando switchi tra locale e produzione!

---

## 📋 Step 1: Configurazione Google Cloud Console

### 1.1 Crea/Accedi al Progetto Google Cloud
1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Seleziona il progetto "LucanikoShop" (o creane uno nuovo)

### 1.2 Abilita Google+ API
1. Vai su **API e Servizi** > **Libreria**
2. Cerca "Google+ API"
3. Clicca **Abilita**

### 1.3 Configura Schermata Consenso OAuth
1. Vai su **API e Servizi** > **Schermata consenso OAuth**
2. Seleziona **Esterno** (per permettere a tutti di accedere)
3. Compila i campi:
   - **Nome app**: LucanikoShop
   - **Email assistenza utente**: donato.dicarlo404@gmail.com
   - **Domini autorizzati**: 
     - `lucanikoshop.it`
     - `localhost` (per sviluppo)
   - **Email sviluppatore**: donato.dicarlo404@gmail.com
4. **Ambiti**: Aggiungi `email`, `profile`, `openid`
5. Salva

### 1.4 Crea Credenziali OAuth 2.0
1. Vai su **API e Servizi** > **Credenziali**
2. Clicca **+ CREA CREDENZIALI** > **ID client OAuth**
3. Tipo applicazione: **Applicazione web**
4. Nome: `LucanikoShop - Dual Environment`

### 1.5 ⚠️ **IMPORTANTE**: Aggiungi ENTRAMBI i Redirect URI

**Origini JavaScript autorizzate:**
```
http://localhost:3000
http://localhost:5173
https://lucanikoshop.it
https://www.lucanikoshop.it
```

**URI di reindirizzamento autorizzati:**
```
http://localhost:5000/api/auth/google/callback
https://api.lucanikoshop.it/api/auth/google/callback
```

5. Clicca **CREA**
6. **Copia** il `Client ID` e il `Client Secret`

---

## 🔧 Step 2: Configurazione Backend (.env)

### Locale (development)
```env
NODE_ENV=development

# Google OAuth (le STESSE credenziali per locale e produzione)
GOOGLE_CLIENT_ID=123456789-abcdefghijk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
# GOOGLE_CALLBACK_URL è opzionale (costruito auto come localhost:5000)

# Frontend URL per redirect dopo login
FRONTEND_URL=http://localhost:5173
```

### Produzione (Railway/Vercel)
```env
NODE_ENV=production

# Google OAuth (le STESSE credenziali)
GOOGLE_CLIENT_ID=123456789-abcdefghijk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
GOOGLE_CALLBACK_URL=https://api.lucanikoshop.it/api/auth/google/callback

# Frontend URL per redirect dopo login
FRONTEND_URL=https://lucanikoshop.it
```

---

## 🎯 Step 3: Come Funziona

### Backend (passport.js)
```javascript
const getGoogleCallbackURL = () => {
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  
  if (isDevelopment) {
    return 'http://localhost:5000/api/auth/google/callback';
  } else {
    return process.env.GOOGLE_CALLBACK_URL || 'https://api.lucanikoshop.it/api/auth/google/callback';
  }
};
```

**Comportamento:**
- ✅ Se `NODE_ENV=development` → usa `localhost:5000`
- ✅ Se `NODE_ENV=production` → usa `api.lucanikoshop.it`
- ✅ Se `NODE_ENV` non definito → usa `localhost:5000` (default dev)

### Flusso Completo

#### 1️⃣ **Utente clicca "Accedi con Google"**
```
Frontend (lucanikoshop.it) 
  ↓
GET http://localhost:5000/api/auth/google  (o https://api.lucanikoshop.it/api/auth/google)
```

#### 2️⃣ **Backend reindirizza a Google**
```
Passport Strategy costruisce URL:
  ↓
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=123456789...
  &redirect_uri=http://localhost:5000/api/auth/google/callback  (o produzione)
  &scope=profile+email
```

#### 3️⃣ **Utente approva su Google**
```
Google reindirizza a:
  ↓
http://localhost:5000/api/auth/google/callback?code=xyz...  (o produzione)
```

#### 4️⃣ **Backend gestisce callback**
```
passport.authenticate('google') verifica code
  ↓
Crea/trova User nel DB
  ↓
Genera JWT token
  ↓
Redirect a: http://localhost:5173/auth/success?token=...  (o produzione)
```

#### 5️⃣ **Frontend salva token**
```
AuthCallback.jsx estrae token da URL
  ↓
Salva in localStorage
  ↓
Redirect a /dashboard
```

---

## 🧪 Testing

### Test Locale
```bash
# 1. Backend in sviluppo
cd backend
NODE_ENV=development npm run dev

# 2. Frontend in sviluppo
cd frontend
npm run dev

# 3. Apri browser
http://localhost:5173/login
  ↓ Clicca "Accedi con Google"
  ↓ Verifica che reindirizza a localhost:5000
  ↓ Dopo login Google, torna a localhost:5173
```

### Test Produzione
```bash
# 1. Deploy backend su Railway con NODE_ENV=production

# 2. Deploy frontend su Vercel

# 3. Apri browser
https://lucanikoshop.it/login
  ↓ Clicca "Accedi con Google"
  ↓ Verifica che reindirizza a api.lucanikoshop.it
  ↓ Dopo login Google, torna a lucanikoshop.it
```

---

## ✅ Checklist Verifica

### Google Cloud Console
- [ ] Progetto creato
- [ ] Google+ API abilitata
- [ ] Schermata consenso configurata (Esterno)
- [ ] Credenziali OAuth 2.0 create
- [ ] **ENTRAMBI** i redirect URI aggiunti:
  - [ ] `http://localhost:5000/api/auth/google/callback`
  - [ ] `https://api.lucanikoshop.it/api/auth/google/callback`
- [ ] Origini JavaScript autorizzate aggiunte (localhost + produzione)

### Backend .env
- [ ] `GOOGLE_CLIENT_ID` configurato
- [ ] `GOOGLE_CLIENT_SECRET` configurato
- [ ] `NODE_ENV=development` in locale
- [ ] `NODE_ENV=production` su Railway
- [ ] `FRONTEND_URL` corretto per l'ambiente

### Test Funzionamento
- [ ] Login Google funziona in locale
- [ ] Login Google funziona in produzione
- [ ] Utente registrato correttamente nel DB
- [ ] JWT token generato e salvato
- [ ] Redirect a dashboard funziona

---

## 🐛 Troubleshooting

### Errore: "redirect_uri_mismatch"
**Causa**: Il redirect URI non è autorizzato in Google Cloud Console

**Soluzione**:
1. Vai su Google Cloud Console > Credenziali
2. Modifica l'OAuth 2.0 Client ID
3. Assicurati che il redirect URI sia ESATTAMENTE:
   - Locale: `http://localhost:5000/api/auth/google/callback`
   - Produzione: `https://api.lucanikoshop.it/api/auth/google/callback`
4. Controlla che non ci siano spazi o trailing slashes

### Backend usa callback URL sbagliato
**Causa**: `NODE_ENV` non configurato correttamente

**Soluzione**:
```bash
# Verifica NODE_ENV
echo $NODE_ENV  # Linux/Mac
echo %NODE_ENV%  # Windows

# Se vuoto, impostalo
export NODE_ENV=development  # Linux/Mac
set NODE_ENV=development  # Windows
```

### Utente non viene reindirizzato dopo login
**Causa**: `FRONTEND_URL` non configurato nel backend

**Soluzione**:
```env
# backend/.env
FRONTEND_URL=http://localhost:5173  # locale
FRONTEND_URL=https://lucanikoshop.it  # produzione
```

---

## 📚 Risorse Utili
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js Google Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)
- [Google Cloud Console](https://console.cloud.google.com/)

---

## 🎉 Vantaggi di Questa Configurazione
✅ **Un solo set di credenziali** Google  
✅ **Zero modifiche manuali** alle variabili d'ambiente  
✅ **Funziona automaticamente** in locale e produzione  
✅ **Testing semplificato** per sviluppatori  
✅ **Deploy sicuro** senza rischi di credenziali sbagliate  
