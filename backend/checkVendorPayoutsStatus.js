import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import VendorPayout from './models/VendorPayout.js';
import Order from './models/Order.js'; // Importa Order per populate

dotenv.config();

const checkVendorPayoutsStatus = async () => {
  try {
    console.log('🔍 Connessione al database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database\n');

    // Trova il venditore "La Bontà delle Carni"
    const vendor = await User.findOne({ 
      businessName: /La Bontà delle Carni/i,
      role: 'seller'
    });

    if (!vendor) {
      console.log('❌ Venditore "La Bontà delle Carni" non trovato');
      process.exit(0);
    }

    console.log('✅ Venditore trovato:');
    console.log('   Nome:', vendor.businessName || vendor.name);
    console.log('   Email:', vendor.email);
    console.log('   ID:', vendor._id);
    console.log('\n📊 STATISTICHE VENDITORE (da User.js):');
    console.log('   Total Earnings: €' + (vendor.totalEarnings || 0).toFixed(2));
    console.log('   Pending Earnings: €' + (vendor.pendingEarnings || 0).toFixed(2));
    console.log('   Paid Earnings: €' + (vendor.paidEarnings || 0).toFixed(2));
    console.log('   Debt Balance: €' + (vendor.debtBalance || 0).toFixed(2));
    
    // Trova tutti i VendorPayouts per questo venditore
    const payouts = await VendorPayout.find({ vendorId: vendor._id })
      .populate('orderId', 'orderNumber totalAmount')
      .sort({ saleDate: -1 });

    console.log('\n📦 VENDOR PAYOUTS (' + payouts.length + ' totali):');
    console.log('─'.repeat(80));

    const now = new Date();
    payouts.forEach((payout, index) => {
      const daysSinceSale = Math.floor((now - payout.saleDate) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, 14 - daysSinceSale);
      
      console.log(`\n${index + 1}. PAYOUT ID: ${payout._id}`);
      console.log(`   Ordine: ${payout.orderId?.orderNumber || 'N/A'}`);
      console.log(`   Status: ${payout.status.toUpperCase()}`);
      console.log(`   Importo: €${payout.amount.toFixed(2)}`);
      console.log(`   Data vendita: ${payout.saleDate.toLocaleDateString('it-IT')}`);
      console.log(`   Giorni dalla vendita: ${daysSinceSale}`);
      console.log(`   Giorni rimanenti: ${daysRemaining}`);
      console.log(`   Transfer ID: ${payout.stripeTransferId || 'N/A'}`);
      console.log(`   Payment Date: ${payout.paymentDate ? payout.paymentDate.toLocaleDateString('it-IT') : 'N/A'}`);
      
      if (payout.status === 'pending' && daysSinceSale >= 14) {
        console.log(`   ⚠️  PROBLEMA: Status è 'pending' ma sono passati ${daysSinceSale} giorni (dovrebbe essere processato!)`);
      }
    });

    // Riepilogo per status
    console.log('\n\n📊 RIEPILOGO PER STATUS:');
    console.log('─'.repeat(80));
    const statusGroups = payouts.reduce((acc, p) => {
      acc[p.status] = acc[p.status] || { count: 0, total: 0 };
      acc[p.status].count++;
      acc[p.status].total += p.amount;
      return acc;
    }, {});

    Object.entries(statusGroups).forEach(([status, data]) => {
      console.log(`   ${status.toUpperCase()}: ${data.count} payout(s) - Totale: €${data.total.toFixed(2)}`);
    });

    // Verifica coerenza dati
    console.log('\n\n🔍 VERIFICA COERENZA DATI:');
    console.log('─'.repeat(80));
    
    const calcTotalEarnings = payouts.reduce((sum, p) => sum + p.amount, 0);
    const calcPendingEarnings = payouts
      .filter(p => ['pending', 'processing'].includes(p.status))
      .reduce((sum, p) => sum + p.amount, 0);
    const calcPaidEarnings = payouts
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    console.log('VALORI NEL DATABASE (User):');
    console.log(`   Total Earnings: €${(vendor.totalEarnings || 0).toFixed(2)}`);
    console.log(`   Pending Earnings: €${(vendor.pendingEarnings || 0).toFixed(2)}`);
    console.log(`   Paid Earnings: €${(vendor.paidEarnings || 0).toFixed(2)}`);
    
    console.log('\nVALORI CALCOLATI (da VendorPayouts):');
    console.log(`   Total Earnings: €${calcTotalEarnings.toFixed(2)}`);
    console.log(`   Pending Earnings: €${calcPendingEarnings.toFixed(2)}`);
    console.log(`   Paid Earnings: €${calcPaidEarnings.toFixed(2)}`);

    console.log('\nDIFFERENZE:');
    const diffTotal = Math.abs((vendor.totalEarnings || 0) - calcTotalEarnings);
    const diffPending = Math.abs((vendor.pendingEarnings || 0) - calcPendingEarnings);
    const diffPaid = Math.abs((vendor.paidEarnings || 0) - calcPaidEarnings);
    
    console.log(`   Total: ${diffTotal > 0.01 ? '❌' : '✅'} €${diffTotal.toFixed(2)}`);
    console.log(`   Pending: ${diffPending > 0.01 ? '❌' : '✅'} €${diffPending.toFixed(2)}`);
    console.log(`   Paid: ${diffPaid > 0.01 ? '❌' : '✅'} €${diffPaid.toFixed(2)}`);

    // Raccomandazioni
    console.log('\n\n💡 RACCOMANDAZIONI:');
    console.log('─'.repeat(80));
    
    const pendingOld = payouts.filter(p => {
      const daysSinceSale = Math.floor((now - p.saleDate) / (1000 * 60 * 60 * 24));
      return p.status === 'pending' && daysSinceSale >= 14;
    });
    
    if (pendingOld.length > 0) {
      console.log(`⚠️  Ci sono ${pendingOld.length} payout in 'pending' da più di 14 giorni!`);
      console.log('   Il job automatico dovrebbe averli già processati.');
      console.log('   Possibili cause:');
      console.log('   1. Il job non è in esecuzione');
      console.log('   2. Il job ha fallito (controlla i log)');
      console.log('   3. Il venditore non ha completato Stripe Connect onboarding');
    }
    
    if (diffPaid > 0.01 || diffPending > 0.01) {
      console.log('⚠️  I dati nel modello User non sono sincronizzati con VendorPayouts!');
      console.log('   Soluzione: Eseguire uno script per ricalcolare e sincronizzare i valori.');
    }

    if (statusGroups.paid && statusGroups.paid.count > 0 && (vendor.paidEarnings || 0) === 0) {
      console.log('❌ PROBLEMA CRITICO: Ci sono payouts marcati come "paid" ma paidEarnings è 0!');
      console.log('   Questo è esattamente il problema che sta vedendo il venditore.');
      console.log('   Soluzione: Ricalcolare paidEarnings sommando tutti i payouts con status "paid".');
    }

  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Connessione chiusa');
  }
};

checkVendorPayoutsStatus();
