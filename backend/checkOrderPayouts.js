import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/Order.js';
import VendorPayout from './models/VendorPayout.js';
import User from './models/User.js';

dotenv.config();

const args = process.argv.slice(2);
const orderId = args[0];
const useProduction = args.includes('--prod');

if (!orderId) {
  console.error('❌ Uso: node checkOrderPayouts.js <orderId> [--prod]');
  process.exit(1);
}

const MONGODB_URI = useProduction 
  ? (process.env.MONGODB_URI_PROD || process.env.MONGODB_URI)
  : (process.env.MONGODB_URI || process.env.MONGODB_URI_PROD);

async function checkOrderPayouts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`✅ Connesso al database ${useProduction ? 'PRODUZIONE' : 'SVILUPPO'}\n`);

    // Trova ordine
    const order = await Order.findById(orderId);
    if (!order) {
      console.log('❌ Ordine non trovato');
      process.exit(1);
    }

    console.log('═══════════════════════════════════════');
    console.log(`📦 Order ID: ${order._id}`);
    console.log(`📅 Data: ${order.createdAt}`);
    console.log(`💰 Totale: €${order.totalPrice}`);
    console.log(`👤 Cliente: ${order.guestName || order.buyer?.name || 'N/A'}`);
    console.log(`📧 Email: ${order.guestEmail || order.buyer?.email || 'N/A'}`);
    console.log(`💳 isPaid: ${order.isPaid}`);
    console.log(`🔵 Stripe Session: ${order.stripeSessionId || 'N/A'}`);
    console.log('═══════════════════════════════════════\n');

    // Controlla vendorEarnings
    console.log('💰 VENDOR EARNINGS:\n');
    if (order.vendorEarnings && order.vendorEarnings.length > 0) {
      console.log(`✅ Trovati ${order.vendorEarnings.length} vendorEarnings:\n`);
      for (const earning of order.vendorEarnings) {
        const vendor = await User.findById(earning.vendorId);
        console.log(`   📊 Venditore: ${vendor?.businessName || vendor?.name || earning.vendorId}`);
        console.log(`      Prodotti: €${earning.productPrice}`);
        console.log(`      Spedizione: €${earning.shippingPrice}`);
        console.log(`      Netto: €${earning.netAmount}`);
        console.log(`      Fee Stripe: €${earning.stripeFee}`);
        console.log(`      Fee Transfer: €${earning.transferFee}`);
        console.log('');
      }
    } else {
      console.log('❌ NESSUN vendorEarnings trovato!');
      console.log('⚠️  Gli earnings non sono stati calcolati!\n');
    }

    // Controlla VendorPayout
    console.log('═══════════════════════════════════════');
    console.log('💸 VENDOR PAYOUTS:\n');
    
    const payouts = await VendorPayout.find({ orderId: order._id })
      .populate('vendorId', 'name businessName companyName email stripeConnectAccountId stripeChargesEnabled stripePayoutsEnabled');
    
    if (payouts.length > 0) {
      console.log(`✅ Trovati ${payouts.length} VendorPayouts:\n`);
      for (const payout of payouts) {
        console.log(`   💰 Payout ID: ${payout._id}`);
        console.log(`      Venditore: ${payout.vendorId?.businessName || payout.vendorId?.name || payout.vendorId}`);
        console.log(`      Email: ${payout.vendorId?.email || 'N/A'}`);
        console.log(`      Status: ${payout.status}`);
        console.log(`      Amount: €${payout.amount}`);
        console.log(`      Stripe Fee: €${payout.stripeFee}`);
        console.log(`      Transfer Fee: €${payout.transferFee}`);
        console.log(`      Sale Date: ${payout.saleDate}`);
        console.log(`      Payment Date: ${payout.paymentDate || 'N/A'}`);
        console.log(`      Stripe Transfer ID: ${payout.stripeTransferId || 'N/A'}`);
        console.log(`      Failure Reason: ${payout.failureReason || 'N/A'}`);
        console.log(`      \n      📊 Stripe Connect Status:`);
        console.log(`         Account ID: ${payout.vendorId?.stripeConnectAccountId || 'N/A'}`);
        console.log(`         Charges Enabled: ${payout.vendorId?.stripeChargesEnabled || false}`);
        console.log(`         Payouts Enabled: ${payout.vendorId?.stripePayoutsEnabled || false}`);
        console.log('');
      }
    } else {
      console.log('❌ NESSUN VendorPayout trovato!');
      console.log('');
      console.log('🚨 PROBLEMA CRITICO:');
      console.log('   I soldi sono rimasti sull\'account principale!');
      console.log('   Il transfer automatico non è stato eseguito!\n');
      
      // Verifica perché non è stato creato
      if (!order.vendorEarnings || order.vendorEarnings.length === 0) {
        console.log('❌ Causa probabile: vendorEarnings non calcolati nel webhook');
        console.log('   Soluzione: Ricalcolare earnings e creare payout manualmente\n');
      }
    }

    console.log('═══════════════════════════════════════');
    console.log('\n✅ Analisi completata');
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

checkOrderPayouts();
