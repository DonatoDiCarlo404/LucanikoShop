import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes.js';
import passport from './config/passport.js';
import uploadRoutes from './routes/uploadRoutes.js';
import productRoutes from './routes/productRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';
import categoryRoutes from './routes/categoryRoutes.js';
import categoryAttributeRoutes from './routes/categoryAttributeRoutes.js';
import discountRoutes from './routes/discountRoutes.js';
import shopSettingsRoutes from './routes/shopSettingsRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminNewsRoutes from './routes/adminNewsRoutes.js';
import { updateExpiredDiscounts } from './utils/discountUtils.js';

const app = express();

// Serve i PDF vendor caricati
app.use('/uploads/vendor_docs', express.static(path.join(process.cwd(), 'uploads', 'vendor_docs')));
const PORT = process.env.PORT || 5000;

// IMPORTANTE: Webhook route PRIMA di express.json()
// Stripe ha bisogno del raw body per verificare la firma
app.use('/api/webhook', webhookRoutes);

// Middleware
app.use(cors());
import { renewExpiredSubscriptions } from './utils/subscriptionUtils.js';
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(helmet());
app.use(passport.initialize());

// Routes

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin/news', adminNewsRoutes); // DEVE essere PRIMA di /api/admin per evitare conflitti
app.use('/api/admin', adminRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/category-attributes', categoryAttributeRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/shop-settings', shopSettingsRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/payment', paymentRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connesso a MongoDB');
    
    // Esegui il controllo degli sconti all'avvio
    updateExpiredDiscounts()
      .then(result => {
        console.log(`✅ Controllo sconti completato: ${result.expired} scaduti, ${result.activated} attivati`);
      })
      .catch(error => {
        console.error('❌ Errore nel controllo sconti:', error);
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
  })
  .catch((error) => console.error('❌ Errore connessione MongoDB:', error));
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

app.get('/', (req, res) => {
  res.json({ message: 'Benvenuto in LucanikoShop API' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Rotta NOT FOUND
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
app.use(notFound);

// Middleware gestione errori
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server in esecuzione sulla porta ${PORT}`);
});