import 'dotenv/config';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import VendorPayout from './models/VendorPayout.js';
import User from './models/User.js';
import Order from './models/Order.js';

// Script per eseguire transfer manuale quando il webhook ha fallito
const args = process.argv.slice(2);
const payoutId = args[0];
const useProduction = args.includes('--prod');

if (!payoutId) {
  console.error('❌ Uso: node executeManualTransfer.js <payoutId> [--prod]');
  console.error('   Esempio: node executeManualTransfer.js 69bacc18ee79a3cda8ed4840 --prod');
  process.exit(1);
}

const MONGODB_URI = useProduction 
  ? (process.env.MONGODB_URI_PROD || process.env.MONGODB_URI)
  : (process.env.MONGODB_URI || process.env.MONGODB_URI_PROD);

const STRIPE_KEY = useProduction
  ? (process.env.STRIPE_SECRET_KEY_PROD || process.env.STRIPE_SECRET_KEY)
  : process.env.STRIPE_SECRET_KEY;

const stripe = new Stripe(STRIPE_KEY);

async function executeManualTransfer() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║         💸 TRANSFER MANUALE STRIPE CONNECT           ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log(`📦 Database: ${useProduction ? 'PRODUZIONE' : 'SVILUPPO'}`);
    console.log(`🔑 Stripe: ${useProduction ? 'LIVE MODE' : 'TEST MODE'}\n`);

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connesso al database\n');

    // 1. Recupera il VendorPayout con tutti i dati necessari
    console.log(`🔍 Recupero VendorPayout: ${payoutId}...`);
    const payout = await VendorPayout.findById(payoutId)
      .populate('vendorId', 'name businessName companyName email stripeConnectAccountId stripeChargesEnabled stripePayoutsEnabled')
      .populate('orderId');

    if (!payout) {
      throw new Error(`❌ VendorPayout ${payoutId} non trovato`);
    }

    console.log('✅ Payout trovato\n');
    console.log('═══════════════════════════════════════');
    console.log('📊 DETTAGLI PAYOUT:');
    console.log('═══════════════════════════════════════');
    console.log(`ID: ${payout._id}`);
    console.log(`Venditore: ${payout.vendorId?.businessName || payout.vendorId?.name || 'N/A'}`);
    console.log(`Email: ${payout.vendorId?.email || 'N/A'}`);
    console.log(`Amount: €${payout.amount}`);
    console.log(`Status: ${payout.status}`);
    console.log(`Order ID: ${payout.orderId?._id || 'N/A'}`);
    console.log(`Order Total: €${payout.orderId?.totalPrice || 'N/A'}`);
    console.log(`Stripe Transfer ID: ${payout.stripeTransferId || 'N/A'}`);
    console.log(`Failure Reason: ${payout.failureReason || 'N/A'}`);
    console.log('═══════════════════════════════════════\n');

    // 2. VALIDAZIONI DI SICUREZZA
    console.log('🔒 VALIDAZIONI DI SICUREZZA:\n');

    // Verifica che il payout non sia già stato processato
    if (payout.status === 'paid' || payout.status === 'processing') {
      throw new Error(`❌ BLOCCO SICUREZZA: Il payout è già stato processato (status: ${payout.status})`);
    }

    // Verifica che non ci sia già un transfer ID
    if (payout.stripeTransferId) {
      console.log('⚠️  WARNING: Esiste già uno stripeTransferId:', payout.stripeTransferId);
      console.log('   Verifico su Stripe se il transfer è reale...\n');
      
      try {
        const existingTransfer = await stripe.transfers.retrieve(payout.stripeTransferId);
        if (existingTransfer && existingTransfer.amount === Math.round(payout.amount * 100)) {
          throw new Error(`❌ BLOCCO SICUREZZA: Transfer già eseguito su Stripe! ID: ${existingTransfer.id}`);
        }
      } catch (stripeError) {
        if (stripeError.code === 'resource_missing') {
          console.log('✅ Transfer ID nel DB ma non esiste su Stripe - procedo\n');
        } else {
          throw stripeError;
        }
      }
    }

    // Verifica che il venditore esista
    if (!payout.vendorId) {
      throw new Error('❌ BLOCCO SICUREZZA: Venditore non trovato nel database');
    }

    // Verifica Stripe Connect
    if (!payout.vendorId.stripeConnectAccountId) {
      throw new Error('❌ BLOCCO SICUREZZA: Venditore non ha configurato Stripe Connect');
    }

    if (!payout.vendorId.stripeChargesEnabled || !payout.vendorId.stripePayoutsEnabled) {
      throw new Error(`❌ BLOCCO SICUREZZA: Account Stripe Connect non attivo
         - Charges Enabled: ${payout.vendorId.stripeChargesEnabled}
         - Payouts Enabled: ${payout.vendorId.stripePayoutsEnabled}`);
    }

    console.log('✅ Tutte le validazioni PASSED\n');

    // 3. RICHIEDI CONFERMA
    console.log('═══════════════════════════════════════');
    console.log('⚠️  CONFERMA TRANSFER:');
    console.log('═══════════════════════════════════════');
    console.log(`Importo: €${payout.amount} (${Math.round(payout.amount * 100)} centesimi)`);
    console.log(`Da: Account Principale Lucaniko Shop`);
    console.log(`A: ${payout.vendorId.businessName || payout.vendorId.name}`);
    console.log(`Account: ${payout.vendorId.stripeConnectAccountId}`);
    console.log(`Email: ${payout.vendorId.email}`);
    console.log(`Ordine: ${payout.orderId?._id || 'N/A'}`);
    console.log('═══════════════════════════════════════\n');

    // Conferma automatica se --confirm è passato, altrimenti richiede conferma
    if (!args.includes('--confirm')) {
      console.log('❌ Transfer NON eseguito - aggiungi --confirm per eseguire');
      console.log('   Comando: node executeManualTransfer.js', payoutId, useProduction ? '--prod' : '', '--confirm');
      process.exit(0);
    }

    // 4. ESEGUI IL TRANSFER
    console.log('💸 ESECUZIONE TRANSFER...\n');

    const amountInCents = Math.round(payout.amount * 100);
    
    const transferParams = {
      amount: amountInCents,
      currency: 'eur',
      destination: payout.vendorId.stripeConnectAccountId,
      description: `Transfer manuale - Ordine #${payout.orderId?._id || 'N/A'}`,
      metadata: {
        payoutId: payout._id.toString(),
        orderId: payout.orderId?._id?.toString() || 'N/A',
        vendorId: payout.vendorId._id.toString(),
        manual_transfer: 'true',
        reason: 'webhook_failed'
      }
    };

    // Recupera charge ID dall'ordine se disponibile
    if (payout.orderId?.stripeSessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(payout.orderId.stripeSessionId);
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
    console.log(`Created: ${new Date(transfer.created * 1000).toISOString()}`);
    console.log('═══════════════════════════════════════\n');

    // 5. AGGIORNA IL DATABASE
    console.log('💾 Aggiornamento database...');
    
    payout.status = 'processing';
    payout.stripeTransferId = transfer.id;
    payout.paymentDate = new Date();
    await payout.save();

    console.log('✅ VendorPayout aggiornato a "processing"');
    console.log(`   - Stripe Transfer ID: ${transfer.id}`);
    console.log(`   - Payment Date: ${payout.paymentDate}\n`);

    console.log('═══════════════════════════════════════');
    console.log('✅ OPERAZIONE COMPLETATA CON SUCCESSO!');
    console.log('═══════════════════════════════════════\n');
    console.log('📝 Prossimi passi:');
    console.log('   1. Verifica il transfer nel Dashboard Stripe');
    console.log('   2. Il venditore riceverà i soldi nel suo account');
    console.log('   3. Monitora che il webhook funzioni per i prossimi ordini\n');

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

executeManualTransfer();
