# 🗄️ Gestione Database Dev/Prod - Guida Completa

## 📋 Script Disponibili

### 1. **Backup Database**
Crea un backup JSON di tutte le collezioni in `mongodb_backup/`

```bash
# Backup DEV
npm run db:backup:dev

# Backup PROD
npm run db:backup:prod
```

**Quando usarlo:**
- Prima di fare modifiche importanti
- Prima di copiare dati tra database
- Backup programmati (settimanali/mensili)

---

### 2. **Copia PROD → DEV**
Copia tutti i dati da produzione a sviluppo (per testare con dati reali)

```bash
npm run db:copy:prod-to-dev (questo va nel terminale backend per avere tutti i dati anche in locale)
```

**Quando usarlo:**
- Vuoi testare con dati reali
- Debugging di problemi in produzione
- Test di performance con dati reali

**⚠️ ATTENZIONE:** Sovrascrive tutto il DB di sviluppo!

---

### 3. **Copia DEV → PROD**
Copia tutti i dati da sviluppo a produzione (deployment modifiche)

```bash
npm run db:copy:dev-to-prod
```

**Quando usarlo:**
- Deployment di nuove funzionalità testate
- Migrazione dati preparati in dev

**🚨 SUPER ATTENZIONE:** 
- Sovrascrive tutto il DB di produzione!
- SEMPRE fare backup prima!
- Richiede conferma manuale

---

### 4. **Sync Solo Schema**
Sincronizza SOLO categorie e attributi (NON utenti/prodotti/ordini)

```bash
# PROD → DEV (per avere categorie aggiornate in dev)
npm run db:sync:schema-to-dev

# DEV → PROD (dopo aver creato nuove categorie in dev)
npm run db:sync:schema-to-prod
```

**Quando usarlo:**
- Hai aggiunto nuove categorie in dev e vuoi applicarle a prod
- Vuoi le categorie di prod in dev senza copiare tutto

---

## 🔄 Workflow Consigliati

### Scenario 1: Sviluppo Nuova Funzionalità
```bash
# 1. Copia dati reali per testare
npm run db:copy:prod-to-dev

# 2. Sviluppi e testi in locale

# 3. Quando tutto funziona, backup prod
npm run db:backup:prod

# 4. (Opzionale) Copia da dev a prod
npm run db:copy:dev-to-prod
```

---

### Scenario 2: Nuove Categorie/Attributi
```bash
# 1. Crei le categorie in dev (MongoDB Compass o script)

# 2. Testi che funzioni tutto

# 3. Backup prod (per sicurezza)
npm run db:backup:prod

# 4. Sincronizzi SOLO lo schema
npm run db:sync:schema-to-prod
```

---

### Scenario 3: Debugging Problema in Produzione
```bash
# 1. Backup prod (per sicurezza)
npm run db:backup:prod

# 2. Copia prod → dev per replicare il problema
npm run db:copy:prod-to-dev

# 3. Debuggi in locale con dati identici a prod

# 4. Risolvi e testi

# 5. Applichi la fix in prod (via deploy codice, NON dati)
```

---

### Scenario 4: Solo Modifiche allo Schema
**Quando modifichi solo categorie/attributi:**

```bash
# Opzione A: Modifica direttamente in prod via MongoDB Compass
# Poi sincronizza in dev
npm run db:sync:schema-to-dev

# Opzione B: Modifica in dev, testa, poi applica
npm run db:sync:schema-to-prod
```

---

## 🎯 Best Practices

### ✅ DO
- **Backup sempre** prima di operazioni pericolose
- Usa `sync-schema-only` per modifiche a categorie/attributi
- Testa sempre in dev prima di applicare a prod
- Verifica i backup periodicamente

### ❌ DON'T
- **NON** copiare dev→prod senza backup
- **NON** modificare prod manualmente se non necessario
- **NON** ignorare i warning degli script
- **NON** copiare prod→dev se hai modifiche non salvate in dev

---

## 📊 Collezioni Gestite

### Dati Completi (copy scripts)
- `users` - Utenti
- `products` - Prodotti
- `categories` - Categorie
- `categoryattributes` - Attributi categorie
- `orders` - Ordini
- `reviews` - Recensioni
- `discounts` - Sconti
- `sponsors` - Sponsor
- `adminnews` - News admin
- `notifications` - Notifiche
- `cookieconsents` - Consensi cookie
- `wishlists` - Wishlist

### Schema Only (sync-schema scripts)
- `categories` - Categorie
- `categoryattributes` - Attributi categorie

---

## 🔧 Tips & Tricks

### Modifiche Frequenti allo Schema
Se modifichi spesso categorie/attributi:

1. **Lavora in dev** (MongoDB Compass)
2. **Testa** in locale
3. **Sincronizza** solo lo schema:
   ```bash
   npm run db:sync:schema-to-prod
   ```

### Mantenere Dev Aggiornato
Ogni tanto (es. settimanale):
```bash
npm run db:copy:prod-to-dev
```
Per avere dati reali freschi in dev.

### Backup Automatici
Puoi aggiungere nel cron job o script di deploy:
```bash
npm run db:backup:prod
```

---

## 🆘 Troubleshooting

### Errore di connessione
- Verifica che `.env` abbia `MONGODB_URI` corretto
- Controlla la connessione internet
- Verifica IP whitelist su MongoDB Atlas

### Script si blocca
- Controlla la dimensione del database (potrebbe richiedere tempo)
- Verifica che non ci siano processi node attivi

### Backup non si crea
- Verifica permessi cartella `mongodb_backup/`
- Controlla spazio disco disponibile

---

## 📝 Note Importanti

1. **I backup sono in formato JSON** - leggibili e modificabili
2. **Gli script usano transazioni sicure** - o tutto o niente
3. **Conferme richieste** per operazioni pericolose (dev→prod)
4. **Log dettagliati** per monitorare il progresso

---

## 🚀 Quick Reference

```bash
# Backup rapido prima di modifiche
npm run db:backup:prod

# Aggiorna dev con dati prod
npm run db:copy:prod-to-dev

# Applica solo nuove categorie
npm run db:sync:schema-to-prod

# Deploy completo (con backup)
npm run db:backup:prod && npm run db:copy:dev-to-prod
```

---

**Ricorda:** In caso di dubbi, fai un backup! È sempre meglio essere prudenti. 🛡️
