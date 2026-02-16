# ⚙️ Setup Variabile MONGODB_URI_PROD

## 📝 Cosa fare DOPO il pull

Gli script di sync database ora usano variabili d'ambiente invece di credenziali hardcoded (più sicuro!).

### 1. Apri il tuo file `.env` locale

```bash
# Nel backend
nano .env
# oppure
code .env
```

### 2. Aggiungi questa riga

```env
# Stringa di connessione produzione (per script sync/backup)
MONGODB_URI_PROD=mongodb+srv://lucanikofood_db_user:m5Qvi9N2DsTHCgF3GZoY6zMuyr0SVEP4@lucanikoshop-production.vocyyy.mongodb.net/lucanikoshop?retryWrites=true&w=majority
```

### 3. Verifica che funzioni

```bash
npm run db:copy:prod-to-dev
```

Dovrebbe funzionare senza errori!

---

## ✅ Cosa è stato fatto

- ✅ Rimosso credenziali hardcoded da 4 file
- ✅ Ora tutti gli script usano `process.env.MONGODB_URI_PROD`
- ✅ File `.env` già ignorato da Git (sicuro!)
- ✅ Aggiunto `.env.example` con documentazione

---

## 🔒 Sicurezza

**IMPORTANTE:** 
- Il file `.env` NON viene committato (è nel `.gitignore`)
- Le credenziali restano solo sul tuo computer
- Gli script controllano che la variabile esista prima di eseguire

---

## 🗑️ Dopo il setup

Puoi eliminare questo file:
```bash
rm backend/SETUP_ENV_PROD.md
```
