import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import readline from 'readline';

// Import models
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import Review from './models/Review.js';
import Notification from './models/Notification.js';
import Wishlist from './models/Wishlist.js';
import AdminNews from './models/AdminNews.js';
import Discount from './models/Discount.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function cleanDatabase() {
  try {
    console.log('🔌 Connessione a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connesso\n');

    console.log('⚠️  ATTENZIONE: Questo script eliminerà TUTTI i dati dal database!\n');
    console.log('📋 Verranno eliminati:');
    console.log('   - ❌ TUTTI gli utenti (admin inclusi)');
    console.log('   - ❌ TUTTI i prodotti');
    console.log('   - ❌ TUTTI gli ordini');
    console.log('   - ❌ TUTTE le recensioni');
    console.log('   - ❌ TUTTE le wishlist');
    console.log('   - ❌ TUTTE le notifiche');
    console.log('   - ❌ TUTTE le news');
    console.log('   - ❌ TUTTI i discount');
    console.log('\n📂 Verranno mantenuti:');
    console.log('   - ✅ Le categorie (struttura base)\n');

    // Controlla se è stato passato il flag --confirm
    const hasConfirmFlag = process.argv.includes('--confirm');

    if (!hasConfirmFlag) {
      const answer = await askQuestion('Sei sicuro di voler continuare? Scrivi "ELIMINA TUTTO" per confermare: ');

      if (answer.trim() !== 'ELIMINA TUTTO') {
        console.log('\n❌ Operazione annullata.');
        rl.close();
        process.exit(0);
      }
    } else {
      console.log('✅ Flag --confirm rilevato, procedo con la pulizia...\n');
    }

    console.log('\n🧹 Inizio pulizia database...\n');

    // Conta documenti prima della pulizia
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    const reviewCount = await Review.countDocuments();
    const wishlistCount = await Wishlist.countDocuments();
    const notificationCount = await Notification.countDocuments();
    const newsCount = await AdminNews.countDocuments();
    const discountCount = await Discount.countDocuments();

    console.log('📊 Documenti attuali:');
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Products: ${productCount}`);
    console.log(`   - Orders: ${orderCount}`);
    console.log(`   - Reviews: ${reviewCount}`);
    console.log(`   - Wishlist: ${wishlistCount}`);
    console.log(`   - Notifications: ${notificationCount}`);
    console.log(`   - News: ${newsCount}`);
    console.log(`   - Discounts: ${discountCount}\n`);

    // Elimina tutti gli utenti
    console.log('🗑️  Eliminazione utenti...');
    const deletedUsers = await User.deleteMany({});
    console.log(`✅ Eliminati ${deletedUsers.deletedCount} utenti`);

    // Elimina tutti i prodotti
    console.log('🗑️  Eliminazione prodotti...');
    const deletedProducts = await Product.deleteMany({});
    console.log(`✅ Eliminati ${deletedProducts.deletedCount} prodotti`);

    // Elimina tutti gli ordini
    console.log('🗑️  Eliminazione ordini...');
    const deletedOrders = await Order.deleteMany({});
    console.log(`✅ Eliminati ${deletedOrders.deletedCount} ordini`);

    // Elimina tutte le recensioni
    console.log('🗑️  Eliminazione recensioni...');
    const deletedReviews = await Review.deleteMany({});
    console.log(`✅ Eliminate ${deletedReviews.deletedCount} recensioni`);

    // Elimina tutte le wishlist
    console.log('🗑️  Eliminazione wishlist...');
    const deletedWishlist = await Wishlist.deleteMany({});
    console.log(`✅ Eliminate ${deletedWishlist.deletedCount} wishlist`);

    // Elimina tutte le notifiche
    console.log('🗑️  Eliminazione notifiche...');
    const deletedNotifications = await Notification.deleteMany({});
    console.log(`✅ Eliminate ${deletedNotifications.deletedCount} notifiche`);

    // Elimina tutte le news
    console.log('🗑️  Eliminazione news...');
    const deletedNews = await AdminNews.deleteMany({});
    console.log(`✅ Eliminate ${deletedNews.deletedCount} news`);

    // Elimina tutti i discount
    console.log('🗑️  Eliminazione discount...');
    const deletedDiscounts = await Discount.deleteMany({});
    console.log(`✅ Eliminati ${deletedDiscounts.deletedCount} discount`);

    console.log('\n✨ Pulizia completata con successo!\n');
    console.log('📝 Prossimi passi:');
    console.log('   1. Registrati normalmente come buyer (con email/password)');
    console.log('   2. Vai in Mongo Compass → Collection "users"');
    console.log('   3. Trova il tuo account e cambia role: "buyer" → "admin"');
    console.log('   4. Ripeti per altri account admin se necessario');
    console.log('   5. Ora potrai accedere sia con email/password che con Google OAuth\n');

    if (!process.argv.includes('--confirm')) {
      rl.close();
    }
    process.exit(0);

  } catch (error) {
    console.error('❌ Errore durante la pulizia:', error);
    if (!process.argv.includes('--confirm')) {
      rl.close();
    }
    process.exit(1);
  }
}

cleanDatabase();
