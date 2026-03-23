import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/Order.js';
import VendorPayout from './models/VendorPayout.js';

dotenv.config();

const checkVendorOrders = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB\n');

    const vendorId = '6994ab54b1aaa303f9ff641c'; // Daniele Gargano

    console.log('🔍 Ordini pagati con prodotti del venditore (ultimi 30 giorni):\n');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders = await Order.find({
      'items.seller': vendorId,
      isPaid: true,
      createdAt: { $gte: thirtyDaysAgo }
    }).sort('-createdAt').select('_id orderNumber totalAmount createdAt items');

    console.log(`Trovati ${orders.length} ordini pagati\n`);

    for (const order of orders) {
      const vendorItems = order.items.filter(item => 
        item.seller && item.seller.toString() === vendorId
      );
      
      const vendorTotal = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Verifica se esiste VendorPayout per questo ordine
      const payout = await VendorPayout.findOne({ orderId: order._id, vendorId });

      console.log(`Order: ${order.orderNumber || order._id.toString().substring(0, 8)}`);
      console.log(`  Data: ${order.createdAt.toLocaleDateString()}`);
      console.log(`  Totale venditore: €${vendorTotal.toFixed(2)}`);
      console.log(`  VendorPayout: ${payout ? `SÌ (€${payout.amount}, status: ${payout.status})` : '❌ MANCANTE'}`);
      console.log('');
    }

    await mongoose.disconnect();
    console.log('✅ Disconnesso da MongoDB');
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

checkVendorOrders();
