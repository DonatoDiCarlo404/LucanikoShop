# 🚀 ROADMAP AGGIORNATA - Deploy LucanikoShop (2026)

## 1. Collegamento Dominio Custom
- [ok ] Accedi a Cloudflare e seleziona il dominio acquistato (es. lucanikoshop.it)
- [ok ] Vai su "DNS" e aggiungi questi record:
  - **A**: @ → 76.76.21.21 (frontend Vercel)
  - **CNAME**: www → cname.vercel-dns.com (frontend www)
  - **CNAME**: api → TUO-PROGETTO.up.railway.app (backend API, cloud grigia)
- [ok ] Salva e attendi propagazione (fino a 30 min)

## 2. Collegamento Dominio su Vercel e Railway
- [ok ] Vercel → Project Settings → Domains → Aggiungi: lucanikoshop.it e www.lucanikoshop.it
- [ok ] Railway → Settings → Domains → Aggiungi: api.lucanikoshop.it
- [ok ] Attendi verifica e attivazione SSL (🔒)
- [ok ] Testa:
  - https://lucanikoshop.it (sito)
  - https://api.lucanikoshop.it/api/health (API)

## 3. Cloudinary Plus (Gestione Immagini)
- [ok ] Attiva piano Plus su Cloudinary
- [ok ] Copia Cloud Name, API Key, API Secret
- [ok ] Inserisci le credenziali nelle variabili ambiente backend su Railway:
  - CLOUDINARY_CLOUD_NAME
  - CLOUDINARY_API_KEY
  - CLOUDINARY_API_SECRET
- [ok ] Testa upload immagini da dashboard venditore

## 4. SendGrid Essentials (Invio Email)
- [ ] Attiva piano Essentials su SendGrid
- [ ] Crea API Key (Full Access)
- [ ] Inserisci la chiave nelle variabili ambiente backend su Railway:
  - SENDGRID_API_KEY
- [ ] Configura sender authentication (verifica dominio email su Cloudflare se richiesto)
- [ ] Testa invio email (registrazione, ordine)

## 5. Stripe Live (Pagamenti)
- [ ] Copia chiave live Stripe (backend: STRIPE_SECRET_KEY, frontend: VITE_STRIPE_PUBLIC_KEY)
- [ ] Inserisci nelle rispettive variabili ambiente (Railway e Vercel)
- [ ] Testa pagamento reale o con carta test

## 6. Health Check Backend
- [ ] Vai su https://api.lucanikoshop.it/api/health
- [ ] Dovresti vedere: { "status": "ok", ... }
- [ ] Se non risponde, controlla variabili ambiente e log Railway

## 7. Test Funzionali Finali
- [ ] Registrazione buyer e seller
- [ ] Login/logout
- [ ] Caricamento prodotto e immagini
- [ ] Ordine e pagamento
- [ ] Ricezione email
- [ ] Navigazione mobile (responsive)

## 8. Sicurezza e Backup Credenziali
- [ ] Salva tutte le credenziali/API keys in un password manager (es. 1Password, Bitwarden)
- [ ] Fai un backup locale criptato (opzionale)

## 9. Monitoring (Opzionale ma consigliato)
- [ ] Attiva Better Uptime (monitoraggio uptime API e sito)
- [ ] Attiva Sentry (monitoraggio errori frontend/backend)

---

**Procedi in ordine. Se hai dubbi su un punto, chiedi!**

**Quando completi un passaggio, spunta la casella e testa sempre il risultato.**
