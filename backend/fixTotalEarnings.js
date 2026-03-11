import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import VendorPayout from './models/VendorPayout.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URI_PRODUCTION;

async function fixTotalEarnings() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connesso al database\n');

    // Trova i due venditori
    const vendors = await User.find({
      $or: [
        { businessName: 'Sangel Shop' },
        { businessName: 'La Bontà delle Carni' }
      ]
    });

    console.log(`📊 Trovati ${vendors.length} venditori\n`);

    for (const vendor of vendors) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`👤 Venditore: ${vendor.businessName || vendor.name}`);
      console.log(`   ID: ${vendor._id}`);
      console.log(`\n   📊 DATI ATTUALI:`);
      console.log(`   - Pending Earnings: €${(vendor.pendingEarnings || 0).toFixed(2)}`);
      console.log(`   - Paid Earnings: €${(vendor.paidEarnings || 0).toFixed(2)}`);
      console.log(`   - Total Earnings: €${(vendor.totalEarnings || 0).toFixed(2)}`);

      // Calcola il totale reale dai VendorPayouts
      const payouts = await VendorPayout.find({ vendorId: vendor._id });
      
      let totalPending = 0;
      let totalPaid = 0;

      payouts.forEach(payout => {
        if (payout.status === 'pending' || payout.status === 'processing') {
          totalPending += payout.amount;
        } else if (payout.status === 'paid') {
          totalPaid += payout.amount;
        }
      });

      const correctTotal = totalPending + totalPaid;

      console.log(`\n   📊 DATI CORRETTI (da VendorPayouts):`);
      console.log(`   - Pending Earnings: €${totalPending.toFixed(2)}`);
      console.log(`   - Paid Earnings: €${totalPaid.toFixed(2)}`);
      console.log(`   - Total Earnings: €${correctTotal.toFixed(2)}`);
      console.log(`\n   📋 Dettaglio payouts: ${payouts.length}`);
      payouts.forEach(p => {
        console.log(`      - ${p.status.padEnd(12)}: €${p.amount.toFixed(2)}`);
      });

      // Aggiorna se diversi
      if (vendor.pendingEarnings !== totalPending || 
          vendor.paidEarnings !== totalPaid || 
          vendor.totalEarnings !== correctTotal) {
        
        console.log(`\n   🔧 Correggo i valori...`);
        vendor.pendingEarnings = totalPending;
        vendor.paidEarnings = totalPaid;
        vendor.totalEarnings = correctTotal;
        await vendor.save();
        console.log(`   ✅ Valori corretti!`);
      } else {
        console.log(`\n   ✅ Valori già corretti, nessun update necessario`);
      }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    await mongoose.connection.close();
    console.log('✅ Operazione completata\n');
    
  } catch (error) {
    console.error('❌ Errore:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

fixTotalEarnings();
