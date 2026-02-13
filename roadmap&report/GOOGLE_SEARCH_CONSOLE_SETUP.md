# Configurazione Google Search Console - Dominio Preferito

## ✅ Modifiche Implementate

### 1. Dominio Principale: `lucanikoshop.it`

Tutti i canonical URL sono stati aggiornati per usare **https://lucanikoshop.it**

### 2. Redirect Automatici Configurati

Nel file `vercel.json` sono stati aggiunti redirect permanenti (301):
- `lucaniko.it` → `lucanikoshop.it`
- `www.lucaniko.it` → `lucanikoshop.it`

### 3. API Backend Bloccata

- Creato `robots.txt` per bloccare l'indicizzazione di `api.lucanikoshop.it`
- File servito da `backend/public/robots.txt`

---

## 🔧 Azioni da Fare su Google Search Console

### Passo 1: Impostare il Dominio Preferito

1. Vai su [Google Search Console](https://search.google.com/search-console)
2. Seleziona la proprietà **lucanikoshop.it**
3. Vai su **Impostazioni** (icona ingranaggio)
4. Sotto "Dominio preferito" seleziona: **https://lucanikoshop.it**

### Passo 2: Aggiungere Tutte le Varianti

Assicurati di aver aggiunto TUTTE le varianti del dominio come proprietà:
- ✅ https://lucanikoshop.it
- ✅ http://lucanikoshop.it (redirect)
- ✅ https://www.lucanikoshop.it (se esiste)
- ✅ https://lucaniko.it (redirect)

### Passo 3: Richiedere la Rimozione delle URL Duplicate

Per ogni URL duplicata trovata:

1. Vai su **Rimozioni** nel menu laterale
2. Clicca su **Nuova richiesta**
3. Inserisci l'URL da rimuovere temporaneamente:
   - `https://lucaniko.it/`
   - `http://lucanikoshop.it/`
4. Seleziona **Rimuovi temporaneamente l'URL**

### Passo 4: Inviare Nuovamente la Sitemap

1. Vai su **Sitemap**
2. Verifica che la sitemap sia:
   ```
   https://lucanikoshop.it/sitemap.xml
   ```
3. Se non è presente, aggiungila
4. Clicca **Invia**

### Passo 5: Richiedere Nuova Indicizzazione

Per le pagine importanti:
1. Vai su **Controllo URL**
2. Inserisci l'URL completo (es: `https://lucanikoshop.it/products`)
3. Clicca **Richiedi indicizzazione**

---

## 📊 Verifiche da Fare

### Test Redirect
Apri il browser e verifica che questi URL reindirizzino correttamente:

```bash
http://lucanikoshop.it/         → https://lucanikoshop.it/
https://lucaniko.it/            → https://lucanikoshop.it/
https://lucaniko.it/products    → https://lucanikoshop.it/products
```

### Test Canonical Tag
Apri il sorgente di qualsiasi pagina e verifica il tag canonical:

```html
<link rel="canonical" href="https://lucanikoshop.it/..." />
```

### Test robots.txt API
Visita: https://api.lucanikoshop.it/robots.txt

Dovrebbe mostrare:
```
User-agent: *
Disallow: /
```

---

## ⏱️ Tempi di Elaborazione

- **Redirect**: Immediato (dopo deploy)
- **Rimozione URL duplicati**: 1-2 giorni
- **Nuova indicizzazione**: 3-7 giorni
- **Canonical riconosciuti**: 1-2 settimane

---

## 🎯 Risultato Finale Atteso

Dopo queste modifiche, Google Search Console dovrebbe mostrare:

✅ **Pagine indicizzate**: Tutte su `lucanikoshop.it`
✅ **Redirect**: 0 errori (tutti intenzionali)
✅ **Duplicati**: 0 (canonical corretti)
✅ **API**: Non indicizzata (bloccata da robots.txt)

---

## 📞 Supporto

Per qualsiasi domanda o problema, contatta il team tecnico.

**Ultimo aggiornamento**: 5 febbraio 2026
