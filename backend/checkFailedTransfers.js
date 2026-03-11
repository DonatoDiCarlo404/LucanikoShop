import mongoose from 'mongoose';
import dotenv from 'dotenv';
import VendorPayout from './models/VendorPayout.js';
import User from './models/User.js';
import Order from './models/Order.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URI_PRODUCTION;

async function checkFailedTransfers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connesso al database\n');

    console.log('═══════════════════════════════════════');
    console.log('📊 TRANSFER FALLITI');
    console.log('═══════════════════════════════════════\n');

    const failedPayouts = await VendorPayout.find({ status: 'failed' })
      .populate('vendorId', 'businessName companyName name email stripeConnectAccountId stripeOnboardingCompleted')
      .populate('orderId', 'orderNumber status isPaid createdAt')
      .sort('-createdAt');

    console.log(`Totale transfer falliti: ${failedPayouts.length}\n`);

    let totalAmount = 0;

    for (const payout of failedPayouts) {
      totalAmount += payout.amount;
      
      console.log('───────────────────────────────────────');
      console.log(`ID Payout: ${payout._id}`);
      console.log(`Importo: €${payout.amount.toFixed(2)}`);
      console.log(`Data Creazione: ${payout.createdAt ? payout.createdAt.toISOString().split('T')[0] : 'N/A'}`);
      console.log(`Sale Date: ${payout.saleDate ? payout.saleDate.toISOString().split('T')[0] : 'N/A'}`);
      console.log(`\n📦 Ordine:`);
      console.log(`   ID: ${payout.orderId?._id || 'N/A'}`);
      console.log(`   Number: ${payout.orderId?.orderNumber || 'N/A'}`);
      console.log(`   Status: ${payout.orderId?.status || 'N/A'}`);
      console.log(`   Paid: ${payout.orderId?.isPaid || false}`);
      console.log(`   Date: ${payout.orderId?.createdAt ? payout.orderId.createdAt.toISOString().split('T')[0] : 'N/A'}`);
      
      console.log(`\n👤 Venditore:`);
      if (payout.vendorId) {
        console.log(`   ID: ${payout.vendorId._id}`);
        console.log(`   Nome: ${payout.vendorId.businessName || payout.vendorId.companyName || payout.vendorId.name || 'N/A'}`);
        console.log(`   Email: ${payout.vendorId.email || 'N/A'}`);
        console.log(`   Stripe Account: ${payout.vendorId.stripeConnectAccountId || 'NESSUNO'}`);
        console.log(`   Onboarding Completo: ${payout.vendorId.stripeOnboardingCompleted || false}`);
      } else {
        console.log(`   ❌ Venditore NON trovato`);
      }
      
      console.log(`\n🔴 Errore:`);
      console.log(`   Motivo: ${payout.failureReason || 'N/A'}`);
      console.log(`   Stripe Transfer ID: ${payout.stripeTransferId || 'N/A'}`);
      
      // Verifica se l'ordine esiste ancora
      if (payout.orderId) {
        const orderExists = await Order.findById(payout.orderId._id);
        if (!orderExists) {
          console.log(`\n   ⚠️  L'ordine associato NON ESISTE PIÙ nel database`);
        } else if (orderExists.status === 'cancelled') {
          console.log(`\n   ⚠️  L'ordine è CANCELLATO`);
        }
      }
      
      console.log('');
    }

    console.log('═══════════════════════════════════════');
    console.log(`\n💰 TOTALE IMPORTO FALLITO: €${totalAmount.toFixed(2)}`);
    console.log(`📊 NUMERO TRANSFER FALLITI: ${failedPayouts.length}`);

    // Suggerimenti
    console.log('\n📝 SUGGERIMENTI:');
    console.log('');
    
    const cancelledOrderPayouts = failedPayouts.filter(p => 
      p.orderId && p.orderId.status === 'cancelled'
    );
    
    const missingVendorPayouts = failedPayouts.filter(p => !p.vendorId);
    
    const noStripeAccountPayouts = failedPayouts.filter(p => 
      p.vendorId && !p.vendorId.stripeConnectAccountId
    );

    if (cancelledOrderPayouts.length > 0) {
      console.log(`✅ ${cancelledOrderPayouts.length} payouts sono di ordini cancellati - CORRETTI (non vanno pagati)`);
    }
    
    if (missingVendorPayouts.length > 0) {
      console.log(`❌ ${missingVendorPayouts.length} payouts NON hanno venditore - DATI ORFANI (da eliminare)`);
    }
    
    if (noStripeAccountPayouts.length > 0) {
      console.log(`⚠️  ${noStripeAccountPayouts.length} payouts: venditore senza Stripe Connect - FALLITI LEGITTIMI`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Analisi completata');
    
  } catch (error) {
    console.error('❌ Errore:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

checkFailedTransfers();
