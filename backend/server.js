import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import helmet from 'helmet';
import { connectRedis } from './config/redis.js';
import authRoutes from './routes/authRoutes.js';
import passport from './config/passport.js';
import uploadRoutes from './routes/uploadRoutes.js';
import productRoutes from './routes/productRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';

console.log('📦 Importazione webhookRoutes...');
import webhookRoutes from './routes/webhookRoutes.js';
console.log('✅ webhookRoutes importato con successo');

import orderRoutes from './routes/orderRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';
import categoryRoutes from './routes/categoryRoutes.js';
import categoryAttributeRoutes from './routes/categoryAttributeRoutes.js';
import discountRoutes from './routes/discountRoutes.js';
import shopSettingsRoutes from './routes/shopSettingsRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';

console.log('📦 Importazione paymentRoutes...');
import paymentRoutes from './routes/paymentRoutes.js';
console.log('✅ paymentRoutes importato con successo');

import stripeConnectRoutes from './routes/stripeConnectRoutes.js';
import { handleConnectWebhook } from './controllers/stripeConnectController.js';
import adminNewsRoutes from './routes/adminNewsRoutes.js';
import sponsorRoutes from './routes/sponsorRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import sitemapRoutes from './routes/sitemapRoutes.js';
import vendorEarningsRoutes from './routes/vendorEarningsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminPaymentRoutes from './routes/adminPaymentRoutes.js';
import stripeMonitoringRoutes from './routes/stripeMonitoringRoutes.js';
import cookieConsentRoutes from './routes/cookieConsentRoutes.js';
import { updateExpiredDiscounts } from './utils/discountUtils.js';
import cron from 'node-cron';
import { processVendorPayouts } from './jobs/processVendorPayouts.js';
import logger from './config/logger.js';
import { sendCronFailureAlert } from './utils/alertService.js';
import { httpLogger } from './middlewares/logger.js';

const app = express();

// Trust proxy per ottenere IP reali in produzione (Railway, Vercel, etc.)
app.set('trust proxy', 1);

// Serve i PDF vendor caricati
app.use('/uploads/vendor_docs', express.static(path.join(process.cwd(), 'uploads', 'vendor_docs')));

// Serve robots.txt per bloccare l'indicizzazione dell'API
app.use(express.static(path.join(process.cwd(), 'public')));

const PORT = process.env.PORT || 5000;

// IMPORTANTE: Webhook routes PRIMA di express.json()
// Stripe ha bisogno del raw body per verificare la firma
console.log('🔌 Montaggio route /api/webhook...');
app.use('/api/webhook', webhookRoutes);
console.log('✅ Route /api/webhook montata con successo');

// Webhook Stripe Connect (anche questo raw body)
console.log('🔌 Montaggio route /api/stripe-connect/webhook...');
app.post('/api/stripe-connect/webhook', express.raw({ type: 'application/json' }), handleConnectWebhook);
console.log('✅ Route /api/stripe-connect/webhook montata con successo');

// Middleware CORS configurato per produzione
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://www.lucanikoshop.it', // Dominio principale con www
  'https://lucanikoshop.it',     // Dominio senza www (redirect)
  'http://localhost:5173', // Dev locale
  'http://localhost:5174', // Dev locale (porta alternativa)
  'http://localhost:3000'  // Dev locale alternativo
].filter(Boolean);

// Domini Vercel specifici autorizzati (NON usare wildcard per sicurezza)
const allowedVercelDomains = [
  'lucanikoshop.vercel.app',
  'lucanikoshop-frontend.vercel.app',
  // Aggiungi qui altri domini Vercel specifici del tuo progetto
];

app.use(cors({
  origin: function(origin, callback) {
    // 🔒 SECURITY: Blocca richieste senza origin in produzione
    if (!origin) {
      // Permetti solo in sviluppo (Postman, test locali)
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      logger.warn('⚠️ Request without origin blocked in production');
      return callback(new Error('Origin header required'));
    }
    
    // Verifica domini Vercel specifici (NON wildcard)
    const isVercelAllowed = allowedVercelDomains.some(domain => 
      origin === `https://${domain}` || origin === `http://${domain}`
    );
    
    if (isVercelAllowed || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`⚠️ CORS blocked request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

import { renewExpiredSubscriptions } from './utils/subscriptionUtils.js';
// 🔒 SECURITY: Ridotto payload limit da 50MB a 10MB per prevenire attacchi DoS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(helmet());
app.use(passport.initialize());

// 📊 Logging HTTP requests
app.use(httpLogger);

// Routes

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin/news', adminNewsRoutes); // DEVE essere PRIMA di /api/admin per evitare conflitti
app.use('/api/admin/payments', adminPaymentRoutes); // Admin payment control panel
app.use('/api/admin/stripe', stripeMonitoringRoutes); // Admin Stripe monitoring
app.use('/api/admin', adminRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/category-attributes', categoryAttributeRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/shop-settings', shopSettingsRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/vendor/earnings', vendorEarningsRoutes);
app.use('/api/wishlist', wishlistRoutes);
console.log('🔌 Montaggio route /api/payment...');
app.use('/api/payment', paymentRoutes);
console.log('✅ Route /api/payment montata con successo');
app.use('/api/stripe-connect', stripeConnectRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/sitemap', sitemapRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/cookie-consent', cookieConsentRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connesso a MongoDB');
    
    // Connetti Redis per il caching (opzionale)
    await connectRedis();
    
    // Esegui il controllo degli sconti all'avvio
    updateExpiredDiscounts()
      .then(result => {
        console.log(`✅ Controllo sconti completato: ${result.expired} scaduti, ${result.activated} attivati`);
      })
      .catch(error => {
        console.error('❌ Errore nel controllo sconti:', error);
      });
    
    // Esegui il controllo degli abbonamenti all'avvio
    renewExpiredSubscriptions()
      .then(result => {
        console.log(`✅ Rinnovo abbonamenti: ${result.renewed} rinnovati`);
        if (result.renewedList && result.renewedList.length > 0) {
          console.log('📧 Venditori rinnovati:', result.renewedList.map(r => `${r.businessName || r.name} (${r.email})`).join(', '));
        }
      })
      .catch(error => {
        console.error('❌ Errore rinnovo abbonamenti:', error);
      });
    
    // Programma il controllo degli sconti ogni ora
    setInterval(() => {
      updateExpiredDiscounts()
        .then(result => {
          console.log(`🔄 Controllo sconti orario: ${result.expired} scaduti, ${result.activated} attivati`);
        })
        .catch(error => {
          console.error('❌ Errore nel controllo sconti orario:', error);
        });
    }, 60 * 60 * 1000); // Ogni ora
    
    // Programma il controllo degli abbonamenti ogni ora
    setInterval(() => {
      renewExpiredSubscriptions()
        .then(result => {
          console.log(`🔄 Rinnovo abbonamenti orario: ${result.renewed} rinnovati`);
          if (result.renewedList && result.renewedList.length > 0) {
            console.log('📧 Venditori rinnovati:', result.renewedList.map(r => `${r.businessName || r.name} (${r.email})`).join(', '));
          }
        })
        .catch(error => {
          console.error('❌ Errore rinnovo abbonamenti orario:', error);
        });
    }, 60 * 60 * 1000); // Ogni ora
    
    // Programma il processamento pagamenti venditori ogni giorno alle 3:00 AM
    cron.schedule('0 3 * * *', async () => {
      logger.logCron('Job pagamenti venditori avviato', { scheduledTime: '03:00 AM' });
      try {
        const result = await processVendorPayouts();
        logger.logCron('Job completato con successo', result);
      } catch (error) {
        logger.critical('Job pagamenti venditori fallito', error);
        
        // Invia alert email ad admin
        try {
          await sendCronFailureAlert(error, 'Automatic Vendor Payouts');
        } catch (alertError) {
          logger.error('Errore invio alert cron', { error: alertError.message });
        }
      }
    });
    
    logger.info('⏰ Cron job pagamenti venditori schedulato: ogni giorno alle 3:00 AM');
  })
  .catch((error) => console.error('❌ Errore connessione MongoDB:', error));

app.get('/', (req, res) => {
  res.json({ message: 'Benvenuto in LucanikoShop API' });
});

// Health check endpoint (per monitoring Better Stack, Railway, etc.)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Rotta NOT FOUND
app.use(notFound);

// Middleware gestione errori
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server in esecuzione sulla porta ${PORT}`);
  
  // Verifica configurazione SendGrid
  if (process.env.SENDGRID_API_KEY) {
    console.log('✅ SendGrid API Key configurata');
    console.log('📧 SendGrid Key inizia con:', process.env.SENDGRID_API_KEY.substring(0, 10) + '...');
  } else {
    console.error('❌ ATTENZIONE: SendGrid API Key NON configurata!');
    console.error('   Le email non verranno inviate.');
    console.error('   Verifica che la variabile SENDGRID_API_KEY sia presente nel file .env');
  }
});