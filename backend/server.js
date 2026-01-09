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
import discountRoutes from './routes/discountRoutes.js';
import shopSettingsRoutes from './routes/shopSettingsRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import { updateExpiredDiscounts } from './utils/discountUtils.js';

const app = express();
const PORT = process.env.PORT || 5000;

// IMPORTANTE: Webhook route PRIMA di express.json()
// Stripe ha bisogno del raw body per verificare la firma
app.use('/api/webhook', webhookRoutes);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(passport.initialize());

// Routes

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/shop-settings', shopSettingsRoutes);
app.use('/api/vendors', vendorRoutes);

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

app.get('/', (req, res) => {
  res.json({ message: 'Benvenuto in LucanikoShop API' });
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
});