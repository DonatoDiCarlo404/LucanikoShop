import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/Order.js';
import VendorPayout from './models/VendorPayout.js';
import User from './models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URI_PRODUCTION;

async function fixMissingVendorPayouts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connesso al database\n');

    // Trova tutti gli ordini pagati con vendorEarnings popolato
    console.log('🔍 Cerco ordini pagati con vendorEarnings ma senza VendorPayout...\n');

    const ordersWithEarnings = await Order.find({
      isPaid: true,
      'vendorEarnings.0': { $exists: true } // Ha almeno un elemento in vendorEarnings
    });

    console.log(`📊 Trovati ${ordersWithEarnings.length} ordini con vendorEarnings\n`);

    let fixed = 0;
    let skipped = 0;
    const errors = [];

    for (const order of ordersWithEarnings) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📦 Order: ${order._id}`);
      console.log(`   Date: ${order.createdAt.toISOString()}`);
      console.log(`   Paid At: ${order.paidAt ? order.paidAt.toISOString() : 'N/A'}`);
      console.log(`   Vendor Earnings: ${order.vendorEarnings.length}`);

      for (const earning of order.vendorEarnings) {
        // Verifica se esiste già un VendorPayout per questo order + vendor
        const existingPayout = await VendorPayout.findOne({
          orderId: order._id,
          vendorId: earning.vendorId
        });

        if (existingPayout) {
          console.log(`   ⏭️  VendorPayout già esiste per venditore ${earning.vendorId} - skip`);
          skipped++;
          continue;
        }

        // Crea il VendorPayout mancante
        console.log(`   🔧 Creo VendorPayout per venditore ${earning.vendorId}...`);

        try {
          const vendorPayout = await VendorPayout.create({
            vendorId: earning.vendorId,
            orderId: order._id,
            amount: earning.netAmount,
            stripeFee: earning.stripeFee,
            transferFee: earning.transferFee,
            status: 'pending',
            saleDate: order.paidAt || order.createdAt
          });

          console.log(`   ✅ VendorPayout creato: ${vendorPayout._id}`);
          console.log(`      - Amount: €${earning.netAmount.toFixed(2)}`);
          console.log(`      - Stripe Fee: €${earning.stripeFee.toFixed(2)}`);
          console.log(`      - Transfer Fee: €${earning.transferFee.toFixed(2)}`);
          console.log(`      - Status: pending`);
          console.log(`      - Sale Date: ${vendorPayout.saleDate.toISOString()}`);

          // Aggiorna statistiche del venditore
          try {
            const vendor = await User.findById(earning.vendorId);
            if (vendor) {
              // Verifica se questi earnings sono già stati aggiunti a pendingEarnings
              // (potrebbero essere già stati aggiunti quando l'ordine è stato creato)
              // Per sicurezza, verifichiamo se il pending è coerente
              
              console.log(`   📊 Venditore: ${vendor.businessName || vendor.name}`);
              console.log(`      - Pending Earnings PRIMA: €${(vendor.pendingEarnings || 0).toFixed(2)}`);
              console.log(`      - Total Earnings PRIMA: €${(vendor.totalEarnings || 0).toFixed(2)}`);

              // Se pendingEarnings è 0 o non esiste, aggiungiamo
              if (!vendor.pendingEarnings || vendor.pendingEarnings === 0) {
                vendor.pendingEarnings = earning.netAmount;
                vendor.totalEarnings = (vendor.totalEarnings || 0) + earning.netAmount;
                await vendor.save();
                
                console.log(`      - Pending Earnings DOPO: €${vendor.pendingEarnings.toFixed(2)}`);
                console.log(`      - Total Earnings DOPO: €${vendor.totalEarnings.toFixed(2)}`);
              } else {
                console.log(`      - ⚠️  PendingEarnings già presente, non aggiungo per evitare duplicati`);
              }
            }
          } catch (vendorError) {
            console.error(`   ❌ Errore aggiornamento venditore:`, vendorError.message);
            errors.push({
              orderId: order._id,
              vendorId: earning.vendorId,
              error: vendorError.message
            });
          }

          fixed++;
        } catch (payoutError) {
          console.error(`   ❌ Errore creazione VendorPayout:`, payoutError.message);
          errors.push({
            orderId: order._id,
            vendorId: earning.vendorId,
            error: payoutError.message
          });
        }
      }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`\n📊 RIEPILOGO:`);
    console.log(`   ✅ VendorPayout creati: ${fixed}`);
    console.log(`   ⏭️  Già esistenti (skip): ${skipped}`);
    console.log(`   ❌ Errori: ${errors.length}`);

    if (errors.length > 0) {
      console.log(`\n❌ ERRORI:`);
      errors.forEach(err => {
        console.log(`   - Order ${err.orderId}, Vendor ${err.vendorId}: ${err.error}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Operazione completata');
    
  } catch (error) {
    console.error('❌ Errore:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

fixMissingVendorPayouts();
