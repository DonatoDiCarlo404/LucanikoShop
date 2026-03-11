import mongoose from 'mongoose';
import dotenv from 'dotenv';
import VendorPayout from './models/VendorPayout.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URI_PRODUCTION;

async function getAllPayouts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connesso al database\n');

    // Query diretta per contare tutti i VendorPayouts
    const totalCount = await VendorPayout.countDocuments({});
    console.log(`📊 TOTALE DOCUMENTI VendorPayout: ${totalCount}\n`);

    // Conta per ogni status
    const statuses = ['pending', 'processing', 'paid', 'failed'];
    
    for (const status of statuses) {
      const count = await VendorPayout.countDocuments({ status });
      const result = await VendorPayout.aggregate([
        { $match: { status } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const total = result[0]?.total || 0;
      console.log(`${status.padEnd(12)}: ${count} documenti, €${total.toFixed(2)}`);
    }

    // Mostra tutti i documenti
    console.log('\n═══════════════════════════════════════');
    console.log('📋 TUTTI I VENDORPAYOUTS:');
    console.log('═══════════════════════════════════════\n');

    const allPayouts = await VendorPayout.find({}).sort('-createdAt');
    allPayouts.forEach((p, i) => {
      console.log(`${i+1}. ID: ${p._id}`);
      console.log(`   Status: ${p.status}`);
      console.log(`   Amount: €${p.amount.toFixed(2)}`);
      console.log(`   Created: ${p.createdAt ? p.createdAt.toISOString().split('T')[0] : 'N/A'}`);
      console.log(`   VendorId: ${p.vendorId || 'N/A'}`);
      console.log(`   OrderId: ${p.orderId || 'N/A'}`);
      console.log('');
    });

    // Test la query esatta che usa getPaymentStatistics
    console.log('═══════════════════════════════════════');
    console.log('🔍 TEST QUERY STATISTICS (failed):');
    console.log('═══════════════════════════════════════\n');

    const failedTransfers = await VendorPayout.aggregate([
      {
        $match: {
          status: 'failed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('Risultato query aggregation:');
    console.log(JSON.stringify(failedTransfers, null, 2));

    await mongoose.connection.close();
    console.log('\n✅ Verifica completata');
    
  } catch (error) {
    console.error('❌ Errore:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

getAllPayouts();
