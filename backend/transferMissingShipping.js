import 'dotenv/config';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import VendorPayout from './models/VendorPayout.js';
import User from './models/User.js';
import Order from './models/Order.js';

// Script per transfer integrativo della spedizione mancante
// Ordine: 69babec16b1c88550245402a
// Venditore: Spezialità Lucane
// Importo mancante: €6.50 (spedizione)

const args = process.argv.slice(2);
const useProduction = args.includes('--prod');
const confirm = args.includes('--confirm');

const MONGODB_URI = useProduction 
  ? (process.env.MONGODB_URI_PROD || process.env.MONGODB_URI)
  : (process.env.MONGODB_URI || process.env.MONGODB_URI_PROD);

const STRIPE_KEY = useProduction
  ? (process.env.STRIPE_SECRET_KEY_PROD || process.env.STRIPE_SECRET_KEY)
  : process.env.STRIPE_SECRET_KEY;

const stripe = new Stripe(STRIPE_KEY);

const ORDER_ID = '69babec16b1c88550245402a';
const VENDOR_NAME = 'Spezialità Lucane';
const SHIPPING_AMOUNT = 6.50; // €6.50 spedizione mancante

async function transferMissingShipping() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║     💸 TRANSFER INTEGRATIVO SPEDIZIONE MANCANTE      ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log(`📦 Database: ${useProduction ? 'PRODUZIONE' : 'SVILUPPO'}`);
    console.log(`🔑 Stripe: ${useProduction ? 'LIVE MODE' : 'TEST MODE'}\n`);

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connesso al database\n');

    // 1. Recupera l'ordine
    const order = await Order.findById(ORDER_ID);
    if (!order) {
      throw new Error('Ordine non trovato');
    }

    console.log('═══════════════════════════════════════');
    console.log('📊 DETTAGLI ORDINE:');
    console.log('═══════════════════════════════════════');
    console.log(`Order ID: ${order._id}`);
    console.log(`Items Price: €${order.itemsPrice}`);
    console.log(`Shipping Price: €${order.shippingPrice}`);
    console.log(`Total Price: €${order.totalPrice}`);
    console.log('═══════════════════════════════════════\n');

    // 2. Recupera il VendorPayout esistente
    const existingPayout = await VendorPayout.findOne({ orderId: ORDER_ID })
      .populate('vendorId', 'name businessName email stripeConnectAccountId');

    if (!existingPayout) {
      throw new Error('VendorPayout esistente non trovato');
    }

    console.log('📊 PAYOUT ESISTENTE:');
    console.log(`   Amount: €${existingPayout.amount}`);
    console.log(`   Transfer ID: ${existingPayout.stripeTransferId}`);
    console.log(`   Status: ${existingPayout.status}`);
    console.log('');

    // 3. Verifica che la spedizione sia davvero mancante
    if (order.shippingPrice !== SHIPPING_AMOUNT) {
      console.log(`⚠️  WARNING: Shipping price nell'ordine è €${order.shippingPrice}, non €${SHIPPING_AMOUNT}`);
      console.log('   Verifica manualmente l\'importo corretto!');
      if (!confirm) {
        process.exit(1);
      }
    }

    const vendor = existingPayout.vendorId;

    console.log('═══════════════════════════════════════');
    console.log('⚠️  TRANSFER INTEGRATIVO:');
    console.log('═══════════════════════════════════════');
    console.log(`Venditore: ${vendor.businessName || vendor.name}`);
    console.log(`Email: ${vendor.email}`);
    console.log(`Account Stripe: ${vendor.stripeConnectAccountId}`);
    console.log(`Importo: €${SHIPPING_AMOUNT} (spedizione mancante)`);
    console.log(`Ordine: ${ORDER_ID}`);
    console.log('═══════════════════════════════════════\n');

    console.log('📋 RIEPILOGO:');
    console.log(`   Transfer precedente: €${existingPayout.amount} (solo prodotti)`);
    console.log(`   Transfer integrativo: €${SHIPPING_AMOUNT} (spedizione)`);
    console.log(`   Totale al venditore: €${(existingPayout.amount + SHIPPING_AMOUNT).toFixed(2)}`);
    console.log('');

    if (!confirm) {
      console.log('❌ Transfer NON eseguito - aggiungi --confirm per eseguire');
      console.log('   Comando: node transferMissingShipping.js --prod --confirm');
      await mongoose.disconnect();
      process.exit(0);
    }

    // 4. ESEGUI IL TRANSFER INTEGRATIVO
    console.log('💸 ESECUZIONE TRANSFER INTEGRATIVO...\n');

    const amountInCents = Math.round(SHIPPING_AMOUNT * 100);
    
    const transferParams = {
      amount: amountInCents,
      currency: 'eur',
      destination: vendor.stripeConnectAccountId,
      description: `Spedizione mancante - Ordine #${ORDER_ID}`,
      metadata: {
        orderId: ORDER_ID,
        vendorId: vendor._id.toString(),
        originalPayoutId: existingPayout._id.toString(),
        type: 'missing_shipping',
        reason: 'webhook_calculated_products_only'
      }
    };

    // Recupera charge ID se disponibile
    if (order.stripeSessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
        if (session.payment_intent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
          if (paymentIntent.latest_charge) {
            transferParams.source_transaction = paymentIntent.latest_charge;
            console.log(`💳 Usando source_transaction: ${paymentIntent.latest_charge}`);
          }
        }
      } catch (chargeError) {
        console.log('⚠️  Impossibile recuperare charge ID, procedo senza source_transaction');
      }
    }

    console.log('📤 Creazione transfer su Stripe...');
    const transfer = await stripe.transfers.create(transferParams);

    console.log('\n✅ TRANSFER COMPLETATO CON SUCCESSO!\n');
    console.log('═══════════════════════════════════════');
    console.log('📊 RISULTATO TRANSFER:');
    console.log('═══════════════════════════════════════');
    console.log(`Transfer ID: ${transfer.id}`);
    console.log(`Amount: €${(transfer.amount / 100).toFixed(2)}`);
    console.log(`Destination: ${transfer.destination}`);
    console.log(`Status: ${transfer.status || 'pending'}`);
    console.log('═══════════════════════════════════════\n');

    // 5. Crea un nuovo VendorPayout per tracciare questo transfer
    console.log('💾 Creazione record VendorPayout per il transfer integrativo...');
    
    const shippingPayout = await VendorPayout.create({
      vendorId: vendor._id,
      orderId: order._id,
      amount: SHIPPING_AMOUNT,
      stripeFee: 0, // Commissioni già pagate nel primo transfer
      transferFee: 0,
      status: 'processing',
      saleDate: order.createdAt,
      paymentDate: new Date(),
      stripeTransferId: transfer.id,
      failureReason: null
    });

    console.log(`✅ VendorPayout integrativo creato: ${shippingPayout._id}\n`);

    console.log('═══════════════════════════════════════');
    console.log('✅ OPERAZIONE COMPLETATA CON SUCCESSO!');
    console.log('═══════════════════════════════════════\n');
    console.log('📝 Riepilogo finale:');
    console.log(`   Transfer prodotti: €${existingPayout.amount} (${existingPayout.stripeTransferId})`);
    console.log(`   Transfer spedizione: €${SHIPPING_AMOUNT} (${transfer.id})`);
    console.log(`   Totale trasferito: €${(existingPayout.amount + SHIPPING_AMOUNT).toFixed(2)}`);
    console.log('');
    console.log('📊 Il venditore riceverà entrambi i transfer nel suo account Stripe.');
    console.log('');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERRORE DURANTE IL TRANSFER:\n');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    
    try {
      await mongoose.disconnect();
    } catch (e) {
      // Ignora errori di disconnessione
    }
    
    process.exit(1);
  }
}

transferMissingShipping();
