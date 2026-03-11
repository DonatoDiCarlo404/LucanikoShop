import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/Order.js';
import VendorPayout from './models/VendorPayout.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URI_PRODUCTION;

async function fixCancelledOrderPayout() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connesso al database\n');

    // Trova l'ordine cancelled
    const cancelledOrder = await Order.findOne({
      status: 'cancelled',
      isPaid: true
    });

    if (!cancelledOrder) {
      console.log('❌ Nessun ordine cancelled trovato');
      await mongoose.connection.close();
      return;
    }

    console.log(`📦 Ordine cancelled trovato:`);
    console.log(`   ID: ${cancelledOrder._id}`);
    console.log(`   Order Number: ${cancelledOrder.orderNumber || 'N/A'}`);
    console.log(`   Date: ${cancelledOrder.createdAt.toISOString()}`);
    console.log(`   Status: ${cancelledOrder.status}`);
    console.log(`   Paid: ${cancelledOrder.isPaid}\n`);

    // Trova il VendorPayout associato
    const payout = await VendorPayout.findOne({
      orderId: cancelledOrder._id
    });

    if (!payout) {
      console.log('❌ Nessun VendorPayout trovato per questo ordine');
      await mongoose.connection.close();
      return;
    }

    console.log(`💰 VendorPayout trovato:`);
    console.log(`   ID: ${payout._id}`);
    console.log(`   Amount: €${payout.amount.toFixed(2)}`);
    console.log(`   Status PRIMA: ${payout.status}\n`);

    // Aggiorna il payout a 'failed' (cancelled non è uno status valido)
    payout.status = 'failed';
    payout.failureReason = 'Ordine cancellato - pagamento non dovuto';
    await payout.save();

    console.log(`✅ VendorPayout aggiornato a 'failed' (ordine cancellato)\n`);

    // Aggiorna anche le statistiche del venditore
    const vendorId = payout.vendorId;
    if (vendorId) {
      const User = (await import('./models/User.js')).default;
      const vendor = await User.findById(vendorId);
      
      if (vendor) {
        console.log(`👤 Venditore: ${vendor.businessName || vendor.name}`);
        console.log(`   Pending Earnings PRIMA: €${(vendor.pendingEarnings || 0).toFixed(2)}`);
        
        // Rimuovi l'importo da pendingEarnings
        vendor.pendingEarnings = Math.max(0, (vendor.pendingEarnings || 0) - payout.amount);
        vendor.totalEarnings = Math.max(0, (vendor.totalEarnings || 0) - payout.amount);
        await vendor.save();
        
        console.log(`   Pending Earnings DOPO: €${vendor.pendingEarnings.toFixed(2)}`);
        console.log(`   Total Earnings DOPO: €${vendor.totalEarnings.toFixed(2)}`);
      }
    }

    await mongoose.connection.close();
    console.log('\n✅ Operazione completata');
    
  } catch (error) {
    console.error('❌ Errore:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

fixCancelledOrderPayout();
