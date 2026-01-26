# 🗺️ ROADMAP GUIDATA - Deploy LucanikoShop

## 📋 COME FUNZIONA QUESTA ROADMAP

**Io ti guiderò passo-passo attraverso ogni fase.**

Ad ogni checkpoint:
1. ✅ Completi il task descritto
2. 📸 (Opzionale) Mi invii screenshot/conferma
3. 🚀 Mi dici "FATTO" o "Procedi"
4. ➡️ Ti guido al prossimo step

**Non saltare step. Procediamo in ordine.**

---

## ⏱️ TIMELINE TOTALE: 3-4 ORE

```
FASE 1: Setup Account      → 45 minuti
FASE 2: GitHub Setup        → 15 minuti
FASE 3: Deploy Backend      → 45 minuti
FASE 4: Deploy Frontend     → 30 minuti
FASE 5: Domini Custom       → 45 minuti
FASE 6: Test Completo       → 30 minuti
```

---

# 🎯 FASE 1: SETUP ACCOUNT E SERVIZI (45 min)

## ✅ CHECKPOINT 1.1 - Dominio (10 min)

### Task:
1. Vai su https://www.cloudflare.com/products/registrar/
2. Cerca disponibilità dominio: `lucanikoshop.com` (o altro nome)
3. Acquista dominio (€15/anno circa)
4. Completa pagamento

### Output atteso:
- [ok] Dominio acquistato
- [ok] Email conferma ricevuta

**📝 Scrivi qui il dominio scelto:** ____lucanikoshop.it_______________________

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 1.1 COMPLETATO" quando hai finito**

--- fatto!

## ✅ CHECKPOINT 1.2 - MongoDB Atlas (15 min)

### Task:
1. Vai su https://cloud.mongodb.com
2. Registrati/Login
3. Create New Cluster:
   - Deployment Type: **Dedicated**
   - Tier: **M10** (€57/mese)
   - Cloud Provider: **AWS**
   - Region: **Frankfurt (eu-central-1)**
4. Cluster Name: `lucanikoshop-production`
5. Create Cluster (attendi 5-7 minuti)

### Dopo che il cluster è pronto:
6. Security → Database Access → Add Database User
   - Username: `lucaniko_admin`
   - Password: [Genera password sicura]
   - Role: **Atlas admin**
7. Security → Network Access → Add IP Address
   - **0.0.0.0/0** (Allow access from anywhere)
   - Temporary comment: "Railway backend"
8. Databases → Connect → Drivers
   - Copia connection string: `mongodb+srv://lucaniko_admin:PASSWORD@...`

### Output atteso:
- [ ] Cluster M10 attivo
- [ ] Database user creato
- [ ] IP whitelist configurato
- [ ] Connection string copiato

**📝 Incolla connection string in CREDENTIALS_TEMPLATE.md**

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 1.2 COMPLETATO" quando hai finito**

---

## ✅ CHECKPOINT 1.3 - Railway (5 min)

### Task:
1. Vai su https://railway.app
2. Sign up con GitHub account
3. Verify email
4. Settings → Upgrade to Pro (€30/mese)
5. Aggiungi carta di credito

### Output atteso:
- [ ] Account Railway Pro attivo
- [ ] Billing configurato

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 1.3 COMPLETATO" quando hai finito**

---

## ✅ CHECKPOINT 1.4 - Vercel (5 min)

### Task:
1. Vai su https://vercel.com
2. Sign up con GitHub account
3. Verify email
4. (NON upgrade ancora - lo faremo dopo deploy)

### Output atteso:
- [ ] Account Vercel FREE attivo
- [ ] GitHub collegato

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 1.4 COMPLETATO" quando hai finito**

---

## ✅ CHECKPOINT 1.5 - Cloudinary (5 min)

### Task:
1. Vai su https://cloudinary.com
2. Sign up
3. Dashboard → Upgrade to Plus (€90/mese)
4. Completa pagamento
5. Settings → Access Keys
   - Copia: **Cloud Name**
   - Copia: **API Key**
   - Copia: **API Secret**

### Output atteso:
- [ ] Account Cloudinary Plus attivo
- [ ] Credenziali copiate

**📝 Incolla credenziali in CREDENTIALS_TEMPLATE.md**

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 1.5 COMPLETATO" quando hai finito**

---

## ✅ CHECKPOINT 1.6 - SendGrid (5 min)

### Task:
1. Vai su https://sendgrid.com
2. Sign up
3. Upgrade to Essentials (€15/mese)
4. Settings → API Keys → Create API Key
   - Name: `lucanikoshop-production`
   - Permissions: **Full Access**
5. Copia API Key (SOLO UNA VOLTA visibile!)

### Output atteso:
- [ ] Account SendGrid Essentials attivo
- [ ] API Key copiato (inizia con `SG.`)

**📝 Incolla API Key in CREDENTIALS_TEMPLATE.md**

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 1.6 COMPLETATO" quando hai finito**

---

# 🎯 FASE 2: PREPARAZIONE CODICE (15 min)

## ✅ CHECKPOINT 2.1 - GitHub Repository (10 min)

### Task:
1. Apri terminale
2. Esegui comandi:

```bash
cd "C:\Users\donat\OneDrive\Desktop\Personal Work\LucanikoShop"

# Verifica git status
git status

# Se ci sono file non committati
git add .
git commit -m "Preparazione deploy produzione"

# Se non hai ancora remote GitHub
# Vai su github.com → New Repository → Nome: "LucanikoShop"
# Poi:
git remote add origin https://github.com/TUO_USERNAME/LucanikoShop.git
git branch -M main
git push -u origin main
```

### Output atteso:
- [ ] Repository GitHub creato
- [ ] Codice pushato su main branch
- [ ] Visibile su GitHub

**📝 Scrivi URL repository:** https://github.com/___/___

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 2.1 COMPLETATO" quando hai finito**

---

## ✅ CHECKPOINT 2.2 - Verifica .env files (5 min)

### Task:
1. Verifica che `.env` files NON siano committati:
   ```bash
   git status
   # .env NON deve apparire
   ```

2. Se appare, aggiungi a `.gitignore` e rimuovi:
   ```bash
   # In backend/.gitignore e frontend/.gitignore verifica ci sia:
   .env
   .env.local
   .env.production
   
   # Se hai committato .env per errore:
   git rm --cached backend/.env
   git rm --cached frontend/.env
   git commit -m "Remove .env files"
   git push
   ```

### Output atteso:
- [ ] .env files non su GitHub
- [ ] .gitignore corretto

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 2.2 COMPLETATO" quando hai finito**

---

# 🎯 FASE 3: DEPLOY BACKEND SU RAILWAY (45 min)

## ✅ CHECKPOINT 3.1 - Crea Progetto Railway (5 min)

### Task:
1. Railway → New Project
2. Deploy from GitHub repo
3. Seleziona repository: `LucanikoShop`
4. Service Name: `backend`
5. Root Directory: `/backend`
6. **NON cliccare Deploy ancora!**

### Output atteso:
- [ ] Progetto Railway creato
- [ ] Backend service configurato

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 3.1 COMPLETATO" quando hai finito**

---

## ✅ CHECKPOINT 3.2 - Configura Environment Variables (15 min)

### Task:
1. Railway → backend service → Variables

2. Genera JWT_SECRET:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   # Copia output
   ```

3. Click "Raw Editor" e incolla (sostituisci con i tuoi valori):

```
JWT_SECRET=IL_JWT_GENERATO_SOPRA
CLOUDINARY_CLOUD_NAME=tuo_cloud_name
CLOUDINARY_API_KEY=tua_api_key
CLOUDINARY_API_SECRET=tuo_api_secret
SENDGRID_API_KEY=SG.xxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_CALLBACK_URL=https://lucanikoshop-backend-production.up.railway.app/api/auth/google/callback
FRONTEND_URL=https://lucanikoshop.vercel.app
PORT=5000
NODE_ENV=production
```

4. Salva variables

### Output atteso:
- [ ] Tutte le 13 variabili configurate
- [ ] JWT_SECRET generato e salvato

**📝 Salva JWT_SECRET anche in CREDENTIALS_TEMPLATE.md**

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 3.2 COMPLETATO" quando hai finito**

---

## ✅ CHECKPOINT 3.3 - Deploy Backend (10 min)

### Task:
1. Railway → Settings → Deploy
2. Attendi build (5-7 minuti)
3. Monitorare logs per errori

### Output atteso:
- [ ] Build SUCCESS
- [ ] Deployment attivo
- [ ] Logs mostrano: "✅ Connesso a MongoDB"
- [ ] Logs mostrano: "🚀 Server in esecuzione sulla porta 5000"

**📝 Copia URL deployment:** https://_____________________.up.railway.app

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 3.3 COMPLETATO" quando hai finito**

---

## ✅ CHECKPOINT 3.4 - Test Backend (5 min)

### Task:
1. Apri browser
2. Vai a: `https://TUO-PROGETTO.up.railway.app/api/health`
3. Dovresti vedere: `{"status":"ok","message":"Server is running"}`

### Se NON funziona:
- Railway → Logs → Cerca errori
- Verifica MONGODB_URI corretto
- Verifica tutte le variabili

### Output atteso:
- [ ] Health check risponde OK
- [ ] Nessun errore nei logs

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 3.4 COMPLETATO" quando hai finito**

---

## ✅ CHECKPOINT 3.5 - Aggiorna GOOGLE_CALLBACK_URL (5 min)

### Task:
1. Ora che hai URL Railway reale, aggiorna:
2. Railway → Variables → Modifica:
   ```
   GOOGLE_CALLBACK_URL=https://IL_TUO_URL_RAILWAY.up.railway.app/api/auth/google/callback
   ```
3. Redeploy (automatico dopo modifica)

### Output atteso:
- [ ] Callback URL aggiornato
- [ ] Redeploy completato

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 3.5 COMPLETATO" quando hai finito**

---

# 🎯 FASE 4: DEPLOY FRONTEND SU VERCEL (30 min)

## ✅ CHECKPOINT 4.1 - Crea Progetto Vercel (5 min)

### Task:
1. Vercel → Add New Project
2. Import Git Repository
3. Seleziona: `LucanikoShop`
4. Configure Project:
   - Framework Preset: **Vite**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **NON cliccare Deploy ancora!**

### Output atteso:
- [ ] Progetto Vercel configurato
- [ ] Frontend settings corretti

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 4.1 COMPLETATO" quando hai finito**

---

## ✅ CHECKPOINT 4.2 - Configura Environment Variables (5 min)

### Task:
1. Vercel → Environment Variables
2. Aggiungi:

```
Name: VITE_API_URL
Value: https://TUO_RAILWAY_URL.up.railway.app/api
Environments: Production, Preview, Development

Name: VITE_STRIPE_PUBLIC_KEY
Value: pk_live_xxxxx
Environments: Production, Preview, Development
```

3. Salva

### Output atteso:
- [ ] 2 variabili configurate
- [ ] URL Railway backend corretto

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 4.2 COMPLETATO" quando hai finito**

---

## ✅ CHECKPOINT 4.3 - Deploy Frontend (10 min)

### Task:
1. Vercel → Deploy
2. Attendi build (3-5 minuti)
3. Monitora logs

### Output atteso:
- [ ] Build SUCCESS
- [ ] Deployment attivo
- [ ] Nessun errore build

**📝 Copia URL:** https://lucanikoshop.vercel.app

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 4.3 COMPLETATO" quando hai finito**

---

## ✅ CHECKPOINT 4.4 - Test Frontend (5 min)

### Task:
1. Apri: `https://lucanikoshop.vercel.app`
2. Naviga nel sito
3. Verifica:
   - [ ] Homepage carica
   - [ ] Categorie visibili
   - [ ] Prodotti caricano (se presenti)
   - [ ] Nessun errore console browser (F12)

### Se CORS error:
- Torna a Railway → Variables
- Verifica: `FRONTEND_URL=https://lucanikoshop.vercel.app`
- Redeploy backend

### Output atteso:
- [ ] Sito accessibile
- [ ] API connessa al backend
- [ ] Nessun errore

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 4.4 COMPLETATO" quando hai finito**

---

## ✅ CHECKPOINT 4.5 - Aggiorna Backend FRONTEND_URL (5 min)

### Task:
1. Railway → Variables → Modifica:
   ```
   FRONTEND_URL=https://lucanikoshop.vercel.app
   ```
2. Redeploy automatico
3. Test cross-origin requests

### Output atteso:
- [ ] CORS configurato correttamente
- [ ] Frontend comunica con backend

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 4.5 COMPLETATO" quando hai finito**

---

# 🎯 FASE 5: DOMINI CUSTOM (45 min)

## ✅ CHECKPOINT 5.1 - DNS Cloudflare Setup (10 min)

### Task:
1. Cloudflare → Seleziona dominio
2. DNS → Manage DNS
3. Aggiungi records:

**Record 1 - Frontend:**
```
Type: A
Name: @
IPv4: 76.76.21.21
Proxy: ON (cloud arancione)
```

**Record 2 - Frontend WWW:**
```
Type: CNAME
Name: www
Target: cname.vercel-dns.com
Proxy: ON (cloud arancione)
```

**Record 3 - Backend API:**
```
Type: CNAME
Name: api
Target: TUO-PROGETTO.up.railway.app
Proxy: OFF (cloud grigia) ⚠️ IMPORTANTE!
```

### Output atteso:
- [ ] 3 DNS records configurati
- [ ] Proxy settings corretti

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 5.1 COMPLETATO" quando hai finito**

---

## ✅ CHECKPOINT 5.2 - Vercel Custom Domain (10 min)

### Task:
1. Vercel → Project Settings → Domains
2. Add Domain: `tuodominio.com`
3. Add Domain: `www.tuodominio.com`
4. Attendi verifica DNS (2-5 minuti)
5. Verifica SSL Certificate attivo

### Output atteso:
- [ ] Domini aggiunti
- [ ] SSL attivo (🔒)
- [ ] Redirect www → dominio principale

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 5.2 COMPLETATO" quando hai finito**

---

## ✅ CHECKPOINT 5.3 - Railway Custom Domain (10 min)

### Task:
1. Railway → Settings → Domains
2. Custom Domain → Add: `api.tuodominio.com`
3. Attendi verifica DNS (2-5 minuti)
4. Verifica SSL Certificate attivo

### Output atteso:
- [ ] Dominio API configurato
- [ ] SSL attivo
- [ ] Backend raggiungibile

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 5.3 COMPLETATO" quando hai finito**

---

## ✅ CHECKPOINT 5.4 - Aggiorna Environment Variables con Domini (10 min)

### Task:
1. **Railway Variables:**
   ```
   FRONTEND_URL=https://tuodominio.com
   GOOGLE_CALLBACK_URL=https://api.tuodominio.com/api/auth/google/callback
   ```

2. **Vercel Environment Variables:**
   ```
   VITE_API_URL=https://api.tuodominio.com/api
   ```

3. Redeploy entrambi (automatico)
4. Attendi deploy (5 minuti)

### Output atteso:
- [ ] Backend usa domini custom
- [ ] Frontend usa domini custom
- [ ] Redeploy completati

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 5.4 COMPLETATO" quando hai finito**

---

## ✅ CHECKPOINT 5.5 - Test Domini Custom (5 min)

### Task:
1. Apri browser INCOGNITO
2. Vai a: `https://tuodominio.com`
3. Verifica:
   - [ ] HTTPS attivo (🔒)
   - [ ] Sito carica
   - [ ] API calls funzionano
4. Test API: `https://api.tuodominio.com/api/health`
   - [ ] Risponde OK

### Output atteso:
- [ ] Domini custom funzionanti
- [ ] SSL attivo ovunque
- [ ] Nessun errore

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 5.5 COMPLETATO" quando hai finito**

---

# 🎯 FASE 6: TEST COMPLETO E GO LIVE (30 min)

## ✅ CHECKPOINT 6.1 - Test Registrazione Buyer (5 min)

### Task:
1. `https://tuodominio.com/register`
2. Registrati come buyer
3. Verifica email conferma (se attiva)
4. Login
5. Logout

### Output atteso:
- [ ] Registrazione OK
- [ ] Login OK
- [ ] JWT funziona

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 6.1 COMPLETATO" quando hai finito**

---

## ✅ CHECKPOINT 6.2 - Test Registrazione Venditore (10 min)

### Task:
1. `https://tuodominio.com/register`
2. Registrati come seller
3. Compila tutti i dati
4. Procedi al pagamento Stripe
5. **USA CARTA TEST:**
   ```
   Numero: 4242 4242 4242 4242
   Scadenza: 12/34
   CVV: 123
   ```
6. Completa registrazione
7. Login come venditore

### Output atteso:
- [ ] Registrazione seller OK
- [ ] Pagamento Stripe OK
- [ ] Accesso dashboard venditore

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 6.2 COMPLETATO" quando hai finito**

---

## ✅ CHECKPOINT 6.3 - Test Caricamento Prodotto (5 min)

### Task:
1. Dashboard Venditore → Aggiungi Prodotto
2. Compila form completo
3. Carica 2-3 immagini
4. Salva prodotto
5. Verifica prodotto visibile nel catalogo

### Output atteso:
- [ ] Upload immagini Cloudinary OK
- [ ] Prodotto salvato
- [ ] Visibile sul sito

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 6.3 COMPLETATO" quando hai finito**

---

## ✅ CHECKPOINT 6.4 - Test Ordine Completo (5 min)

### Task:
1. Logout
2. Login come buyer
3. Cerca prodotto caricato
4. Aggiungi al carrello
5. Checkout
6. Pagamento con carta test Stripe
7. Verifica ordine completato

### Output atteso:
- [ ] Carrello funziona
- [ ] Checkout OK
- [ ] Pagamento processato
- [ ] Ordine creato

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 6.4 COMPLETATO" quando hai finito**

---

## ✅ CHECKPOINT 6.5 - Test Email (se SendGrid configurato) (5 min)

### Task:
1. Verifica inbox per email conferma ordine
2. Se NON arrivano email:
   - SendGrid → Settings → Sender Authentication
   - Authenticate Domain
   - Configura DNS records su Cloudflare

### Output atteso:
- [ ] Email arrivano
- [ ] O domenica autenticata per dopo

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 6.5 COMPLETATO" quando hai finito**

---

## ✅ CHECKPOINT 6.6 - Test Mobile Responsive (5 min)

### Task:
1. Apri sito da smartphone
   O
2. Browser → F12 → Toggle device toolbar
3. Test su iPhone e Android
4. Verifica:
   - [ ] Layout responsive
   - [ ] Navigazione mobile
   - [ ] Checkout mobile
   - [ ] Immagini caricano

### Output atteso:
- [ ] Mobile friendly
- [ ] Tutto funziona

**🛑 FERMATI QUI - Dimmi "CHECKPOINT 6.6 COMPLETATO" quando hai finito**

---

# 🎉 CHECKPOINT FINALE - GO LIVE!

## ✅ CHECKPOINT FINALE - Verifica Completa

### Checklist Finale:
```
☐ Domini custom attivi e SSL funziona
☐ Backend Railway risponde correttamente
☐ Frontend Vercel carica velocemente
☐ MongoDB connesso e funzionante
☐ Cloudinary upload immagini OK
☐ Stripe pagamenti processano
☐ SendGrid email configurate (o da fare)
☐ Registrazione buyer funziona
☐ Registrazione seller + pagamento funziona
☐ Caricamento prodotti OK
☐ Ordine completo processato
☐ Mobile responsive verificato
☐ Nessun errore in console browser
☐ Railway logs puliti
☐ Vercel deployment stabile
```

### Task Finali:
1. Compila `CREDENTIALS_TEMPLATE.md` completo
2. Salva in password manager (1Password/Bitwarden)
3. Backup locale criptato
4. Aggiungi monitoring (opzionale):
   - Better Uptime: https://betteruptime.com
   - Sentry: https://sentry.io

### Output atteso:
- [ ] Sistema 100% operativo
- [ ] Credenziali salvate sicure
- [ ] Monitoring attivo

---

## 🎊 COMPLIMENTI!

**SEI ONLINE! 🚀**

### URL Finali:
- **Sito:** https://tuodominio.com
- **API:** https://api.tuodominio.com
- **Admin:** https://tuodominio.com/admin

### Dashboard:
- Railway: https://railway.app/dashboard
- Vercel: https://vercel.com/dashboard
- MongoDB: https://cloud.mongodb.com
- Cloudinary: https://cloudinary.com/console
- SendGrid: https://app.sendgrid.com

### Prossimi 7 Giorni:
- [ ] Monitora logs Railway daily
- [ ] Check MongoDB usage
- [ ] Verifica Cloudinary bandwidth
- [ ] Test con utenti reali
- [ ] Raccogli feedback
- [ ] Fix bug immediati

---

## 📊 COSTI ATTIVI:

**Mensili: €212**
- Railway Pro: €30
- MongoDB M10: €57
- Vercel Pro: €20 (dopo upgrade)
- Cloudinary Plus: €90
- SendGrid: €15

**Annuali: €87**
- Dominio: €15
- Google Workspace: €72 (da fare)

---

## 🆘 PROBLEMI DURANTE LA ROADMAP?

**Ad ogni checkpoint, se qualcosa non funziona:**
1. Leggi TROUBLESHOOTING.md
2. Check logs (Railway/Vercel)
3. Dimmi esattamente l'errore
4. Ti guido alla soluzione

---

**PRONTO A INIZIARE?**

**Scrivi: "START - Procediamo con CHECKPOINT 1.1"** e iniziamo! 🚀
