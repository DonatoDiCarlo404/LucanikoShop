# ⚡ Quick Start: Google OAuth Locale + Produzione

## 🎯 TL;DR - Setup Veloce

### 1️⃣ Google Cloud Console (5 min)
```
1. Vai su https://console.cloud.google.com/
2. Crea progetto "LucanikoShop" (se non esiste)
3. Abilita "Google+ API"
4. Crea OAuth 2.0 Client ID
5. Aggiungi ENTRAMBI i redirect URI:
   ✅ http://localhost:5000/api/auth/google/callback
   ✅ https://api.lucanikoshop.it/api/auth/google/callback
6. Copia Client ID e Client Secret
```

### 2️⃣ Backend .env (2 min)
```env
# Locale
NODE_ENV=development
GOOGLE_CLIENT_ID=123456789-xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
FRONTEND_URL=http://localhost:5173
```

### 3️⃣ Frontend .env (1 min)
```env
# Locale
VITE_API_URL=http://localhost:5000/api
```

### 4️⃣ Testa (1 min)
```bash
# Backend
cd backend
npm run dev

# Frontend (altro terminale)
cd frontend
npm run dev

# Browser: http://localhost:5173/login
# Click "Accedi con Google"
```

---

## ✅ Come Funziona (Automatico)

### Backend rileva automaticamente l'ambiente:

```javascript
// passport.js
const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment) {
  callbackURL = 'http://localhost:5000/api/auth/google/callback';
} else {
  callbackURL = 'https://api.lucanikoshop.it/api/auth/google/callback';
}
```

### Zero modifiche quando switchi:
- ✅ Sviluppo locale → usa `localhost:5000`
- ✅ Deploy produzione → usa `api.lucanikoshop.it`
- ✅ Nessuna variabile da cambiare!

---

## 🔄 Flusso Completo

```
Utente clicca "Accedi con Google"
  ↓
Frontend → GET http://localhost:5000/api/auth/google
  ↓
Backend → Redirect Google con callback=localhost:5000
  ↓
Utente approva su Google
  ↓
Google → Redirect http://localhost:5000/api/auth/google/callback?code=xxx
  ↓
Backend → Verifica code, crea/trova User, genera JWT
  ↓
Backend → Redirect http://localhost:5173/auth/success?token=xxx
  ↓
Frontend → Salva token, fetch profilo, redirect /dashboard
```

---

## 📋 Checklist Test Locale

- [ ] Google Cloud: Redirect URI `localhost:5000` aggiunto
- [ ] Backend: `NODE_ENV=development` nelle variabili
- [ ] Backend: `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` configurati
- [ ] Backend: `FRONTEND_URL=http://localhost:5173`
- [ ] Frontend: `VITE_API_URL=http://localhost:5000/api`
- [ ] Backend avviato su porta 5000
- [ ] Frontend avviato su porta 5173
- [ ] Click "Accedi con Google" su `/login`
- [ ] Redirect a Google funziona
- [ ] Redirect da Google torna a localhost:5173
- [ ] Token salvato in localStorage
- [ ] Utente reindirizzato a /dashboard

---

## 🚀 Deploy Produzione

### Backend (Railway)
```env
NODE_ENV=production
GOOGLE_CLIENT_ID=123456789-xxx.apps.googleusercontent.com  # STESSE credenziali
GOOGLE_CLIENT_SECRET=GOCSPX-xxx  # STESSE credenziali
GOOGLE_CALLBACK_URL=https://api.lucanikoshop.it/api/auth/google/callback
FRONTEND_URL=https://lucanikoshop.it
```

### Frontend (Vercel)
```env
VITE_API_URL=https://api.lucanikoshop.it/api
```

**NON servono altre modifiche!** Il sistema rileva automaticamente `NODE_ENV=production` e usa il callback corretto.

---

## 🐛 Debug Veloce

### Errore: `redirect_uri_mismatch`
**Fix**: Vai su Google Console → Credentials → Verifica che il redirect URI sia ESATTAMENTE:
- `http://localhost:5000/api/auth/google/callback` (locale)
- NO trailing slash!
- NO www!

### Console backend mostra callback sbagliato
**Fix**: Controlla `NODE_ENV`:
```bash
# Deve stampare
🔐 [PASSPORT] Google OAuth Callback URL: http://localhost:5000/api/auth/google/callback
```

Se sbagliato:
```bash
export NODE_ENV=development  # Linux/Mac
set NODE_ENV=development     # Windows CMD
$env:NODE_ENV="development"  # Windows PowerShell
```

### Token non arriva al frontend
**Fix**: Controlla console browser → Network → Redirect finale deve essere:
```
http://localhost:5173/auth/success?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Se manca, controlla `FRONTEND_URL` nel backend .env.

---

## 📚 File Modificati

### Backend
- ✅ `config/passport.js` - Auto-detect ambiente
- ✅ `.env.example` - Documentazione

### Frontend  
- ✅ `App.jsx` - Route `/auth/error` aggiunta
- ✅ `pages/AuthError.jsx` - Pagina errore creata
- ✅ `.env.example` - Documentazione

### Documentazione
- ✅ `GOOGLE_OAUTH_DUAL_ENVIRONMENT_SETUP.md` - Guida completa
- ✅ `GOOGLE_OAUTH_QUICKSTART.md` - Questa guida veloce

---

## ⏱️ Tempo Stimato

- **Setup iniziale**: ~10 minuti
- **Test locale**: ~2 minuti  
- **Deploy produzione**: ~0 minuti (automatico!)

**Mai più cambiare variabili d'ambiente!** 🎉
