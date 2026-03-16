import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

dotenv.config();

const checkAllPurchasedProducts = async () => {
  try {
    console.log('🔄 Connessione al database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database MongoDB\n');

    // Trova TUTTI gli ordini (guest e non)
    const allOrders = await Order.find({
      isPaid: true
    }).sort({ createdAt: -1 });

    console.log(`📦 TOTALE ORDINI PAGATI: ${allOrders.length}\n`);

    const productStats = new Map();

    for (const order of allOrders) {
      console.log(`--- Ordine ${order._id} ---`);
      console.log(`Tipo: ${order.isGuestOrder ? 'GUEST' : 'REGISTRATO'}`);
      console.log(`Email: ${order.isGuestOrder ? order.guestEmail : 'Utente registrato'}`);
      console.log(`Data: ${order.createdAt.toLocaleDateString()}`);
      console.log(`Prodotti: ${order.items.length}`);
      
      for (const item of order.items) {
        console.log(`\n  📦 ${item.name}`);
        console.log(`     - Product ID: ${item.product}`);
        console.log(`     - Quantità: ${item.quantity}`);
        console.log(`     - Prezzo: €${item.price}`);
        
        // Verifica se il prodotto esiste ancora
        const product = await Product.findById(item.product);
        if (product) {
          console.log(`     - ✅ Prodotto trovato nel DB`);
          console.log(`     - Rating attuale: ${product.rating?.toFixed(1) || '0.0'}`);
          console.log(`     - Recensioni: ${product.numReviews || 0}`);
          
          // Raccoglie statistiche
          if (!productStats.has(item.product.toString())) {
            productStats.set(item.product.toString(), {
              name: product.name,
              timesOrdered: 0,
              totalQuantity: 0,
              rating: product.rating,
              numReviews: product.numReviews
            });
          }
          const stats = productStats.get(item.product.toString());
          stats.timesOrdered++;
          stats.totalQuantity += item.quantity;
        } else {
          console.log(`     - ❌ PRODOTTO NON TROVATO NEL DB (probabilmente eliminato)`);
        }
      }
      
      console.log('');
    }

    console.log('\n\n📊 RIEPILOGO PRODOTTI ACQUISTATI:\n');
    console.log('='.repeat(80));
    
    for (const [productId, stats] of productStats.entries()) {
      console.log(`\n${stats.name}`);
      console.log(`  ID: ${productId}`);
      console.log(`  Ordinato: ${stats.timesOrdered} volte`);
      console.log(`  Quantità totale: ${stats.totalQuantity}`);
      console.log(`  Rating: ${stats.rating?.toFixed(1) || '0.0'}`);
      console.log(`  Recensioni: ${stats.numReviews || 0}`);
    }

    console.log('\n\n📈 TOTALI:');
    console.log(`  - Ordini pagati: ${allOrders.length}`);
    console.log(`  - Ordini guest: ${allOrders.filter(o => o.isGuestOrder).length}`);
    console.log(`  - Ordini registrati: ${allOrders.filter(o => !o.isGuestOrder).length}`);
    console.log(`  - Prodotti unici acquistati (esistenti): ${productStats.size}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

checkAllPurchasedProducts();
