import mongoose from 'mongoose';
import dotenv from 'dotenv';
import VendorPayout from './models/VendorPayout.js';
import Order from './models/Order.js';

dotenv.config();

const debugVendorPayouts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB\n');

    const vendorId = '6994ab54b1aaa303f9ff641c'; // Daniele Gargano

    console.log('🔍 TUTTI i VendorPayouts per vendorId:', vendorId);
    const allPayouts = await VendorPayout.find({ vendorId }).sort('-saleDate');

    console.log('\n📊 Trovati', allPayouts.length, 'payouts totali:\n');

    allPayouts.forEach((payout, idx) => {
      console.log(`${idx + 1}. Amount: €${payout.amount}`);
      console.log(`   Status: ${payout.status}`);
      console.log(`   Sale Date: ${payout.saleDate.toLocaleDateString()}`);
      console.log(`   Stripe Transfer ID: ${payout.stripeTransferId || 'NESSUNO'}`);
      console.log(`   Payment Date: ${payout.paymentDate?.toLocaleDateString() || 'N/A'}`);
      console.log('');
    });

    // Calcola per status
    const byStatus = {};
    allPayouts.forEach(p => {
      if (!byStatus[p.status]) byStatus[p.status] = { count: 0, total: 0 };
      byStatus[p.status].count++;
      byStatus[p.status].total += p.amount;
    });

    console.log('\n💰 Riepilogo per STATUS:');
    Object.keys(byStatus).forEach(status => {
      console.log(`   ${status}: ${byStatus[status].count} payouts, €${byStatus[status].total.toFixed(2)}`);
    });

    // Payouts con transfer
    const withTransfer = allPayouts.filter(p => p.stripeTransferId);
    console.log(`\n🔗 Payouts CON stripeTransferId: ${withTransfer.length}`);
    withTransfer.forEach(p => {
      console.log(`   - €${p.amount} (${p.status}) - ${p.stripeTransferId}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnesso da MongoDB');
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
};

debugVendorPayouts();
