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

// URLs dei database (da variabili d'ambiente)
const DEV_URI = process.env.MONGODB_URI_DEV;
const PROD_URI = process.env.MONGODB_URI_PROD;

// Validazione delle variabili d'ambiente
if (!DEV_URI || !PROD_URI) {
  console.error('❌ Errore: MONGODB_URI_DEV e MONGODB_URI_PROD devono essere definiti nel file .env');
  process.exit(1);
}

async function cleanSingleDatabase(dbUri, dbName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🗄️  Database: ${dbName}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Crea una nuova connessione per questo database
    const connection = await mongoose.createConnection(dbUri).asPromise();
    console.log(`✅ Connesso a ${dbName}`);

    // Usa i modelli con questa connessione
    const UserModel = connection.model('User', User.schema);
    const ProductModel = connection.model('Product', Product.schema);
    const OrderModel = connection.model('Order', Order.schema);
    const ReviewModel = connection.model('Review', Review.schema);
    const NotificationModel = connection.model('Notification', Notification.schema);
    const WishlistModel = connection.model('Wishlist', Wishlist.schema);
    const AdminNewsModel = connection.model('AdminNews', AdminNews.schema);
    const DiscountModel = connection.model('Discount', Discount.schema);

    // Conta documenti prima della pulizia
    const userCount = await UserModel.countDocuments();
    const productCount = await ProductModel.countDocuments();
    const orderCount = await OrderModel.countDocuments();
    const reviewCount = await ReviewModel.countDocuments();
    const wishlistCount = await WishlistModel.countDocuments();
    const notificationCount = await NotificationModel.countDocuments();
    const newsCount = await AdminNewsModel.countDocuments();
    const discountCount = await DiscountModel.countDocuments();

    console.log('📊 Documenti attuali:');
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Products: ${productCount}`);
    console.log(`   - Orders: ${orderCount}`);
    console.log(`   - Reviews: ${reviewCount}`);
    console.log(`   - Wishlist: ${wishlistCount}`);
    console.log(`   - Notifications: ${notificationCount}`);
    console.log(`   - News: ${newsCount}`);
    console.log(`   - Discounts: ${discountCount}\n`);

    console.log(`🧹 Pulizia ${dbName}...\n`);

    // Elimina tutti gli utenti
    console.log('🗑️  Eliminazione utenti...');
    const deletedUsers = await UserModel.deleteMany({});
    console.log(`✅ Eliminati ${deletedUsers.deletedCount} utenti`);

    // Elimina tutti i prodotti
    console.log('🗑️  Eliminazione prodotti...');
    const deletedProducts = await ProductModel.deleteMany({});
    console.log(`✅ Eliminati ${deletedProducts.deletedCount} prodotti`);

    // Elimina tutti gli ordini
    console.log('🗑️  Eliminazione ordini...');
    const deletedOrders = await OrderModel.deleteMany({});
    console.log(`✅ Eliminati ${deletedOrders.deletedCount} ordini`);

    // Elimina tutte le recensioni
    console.log('🗑️  Eliminazione recensioni...');
    const deletedReviews = await ReviewModel.deleteMany({});
    console.log(`✅ Eliminate ${deletedReviews.deletedCount} recensioni`);

    // Elimina tutte le wishlist
    console.log('🗑️  Eliminazione wishlist...');
    const deletedWishlist = await WishlistModel.deleteMany({});
    console.log(`✅ Eliminate ${deletedWishlist.deletedCount} wishlist`);

    // Elimina tutte le notifiche
    console.log('🗑️  Eliminazione notifiche...');
    const deletedNotifications = await NotificationModel.deleteMany({});
    console.log(`✅ Eliminate ${deletedNotifications.deletedCount} notifiche`);

    // Elimina tutte le news
    console.log('🗑️  Eliminazione news...');
    const deletedNews = await AdminNewsModel.deleteMany({});
    console.log(`✅ Eliminate ${deletedNews.deletedCount} news`);

    // Elimina tutti i discount
    console.log('🗑️  Eliminazione discount...');
    const deletedDiscounts = await DiscountModel.deleteMany({});
    console.log(`✅ Eliminati ${deletedDiscounts.deletedCount} discount`);

    console.log(`\n✨ ${dbName} pulito con successo!`);

    // Chiudi la connessione
    await connection.close();

  } catch (error) {
    console.error(`❌ Errore pulizia ${dbName}:`, error.message);
    throw error;
  }
}

async function cleanBothDatabases() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  PULIZIA COMPLETA DATABASE - DEVELOPMENT E PRODUCTION');
    console.log('='.repeat(60));
    console.log('\n📋 Verranno eliminati da ENTRAMBI i database:');
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
      const answer = await askQuestion('⚠️  ATTENZIONE! Stai per pulire ENTRAMBI i database (DEV + PROD).\nScrivi "ELIMINA TUTTO" per confermare: ');

      if (answer.trim() !== 'ELIMINA TUTTO') {
        console.log('\n❌ Operazione annullata.');
        rl.close();
        process.exit(0);
      }
    } else {
      console.log('✅ Flag --confirm rilevato, procedo con la pulizia...\n');
    }

    // Pulisci Development
    await cleanSingleDatabase(DEV_URI, 'DEVELOPMENT');

    // Pulisci Production
    await cleanSingleDatabase(PROD_URI, 'PRODUCTION');

    console.log('\n' + '='.repeat(60));
    console.log('✅ PULIZIA COMPLETATA CON SUCCESSO!');
    console.log('='.repeat(60));
    console.log('\n📝 Prossimi passi:');
    console.log('   1. Registrati normalmente come buyer (con email/password)');
    console.log('   2. Vai in Mongo Compass → Collection "users"');
    console.log('   3. Trova il tuo account e cambia role: "buyer" → "admin"');
    console.log('   4. Ripeti per altri account admin se necessario');
    console.log('   5. Ora potrai accedere sia con email/password che con Google OAuth');
    console.log('\n🚀 Il tuo marketplace è pronto per venditori e acquirenti reali!\n');

    if (!process.argv.includes('--confirm')) {
      rl.close();
    }
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Errore durante la pulizia:', error);
    if (!process.argv.includes('--confirm')) {
      rl.close();
    }
    process.exit(1);
  }
}

cleanBothDatabases();
