import 'dotenv/config';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import VendorPayout from './models/VendorPayout.js';
import User from './models/User.js';
import Order from './models/Order.js';

// Script cronjob per gestire payout pending vecchi e ritentare transfer automatici
// Eseguire con: node retryPendingPayouts.js [--prod] [--dry-run]

const args = process.argv.slice(2);
const useProduction = args.includes('--prod');
const dryRun = args.includes('--dry-run');

const MONGODB_URI = useProduction 
  ? (process.env.MONGODB_URI_PROD || process.env.MONGODB_URI)
  : (process.env.MONGODB_URI || process.env.MONGODB_URI_PROD);

const STRIPE_KEY = useProduction
  ? (process.env.STRIPE_SECRET_KEY_PROD || process.env.STRIPE_SECRET_KEY)
  : process.env.STRIPE_SECRET_KEY;

const stripe = new Stripe(STRIPE_KEY);

// Configurazione: retry payout pending più vecchi di X ore
const PENDING_THRESHOLD_HOURS = 1; // Riprova dopo 1 ora se ancora pending

async function retryPendingPayouts() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║     🔄 RETRY AUTOMATICO PAYOUT PENDING                ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log(`📦 Database: ${useProduction ? 'PRODUZIONE' : 'SVILUPPO'}`);
    console.log(`🔑 Stripe: ${useProduction ? 'LIVE MODE' : 'TEST MODE'}`);
    console.log(`🧪 Dry Run: ${dryRun ? 'SÌ (nessun transfer reale)' : 'NO (transfer reali)'}\n`);

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connesso al database\n');

    // Trova tutti i payout pending più vecchi di PENDING_THRESHOLD_HOURS
    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - PENDING_THRESHOLD_HOURS);

    console.log(`🔍 Cerco payout pending anteriori a: ${thresholdDate.toISOString()}\n`);

    const pendingPayouts = await VendorPayout.find({
      status: 'pending',
      createdAt: { $lt: thresholdDate }
    })
    .populate('vendorId', 'name businessName companyName email stripeConnectAccountId stripeChargesEnabled stripePayoutsEnabled')
    .populate('orderId')
    .sort('createdAt');

    console.log(`📊 Payout pending trovati: ${pendingPayouts.length}\n`);

    if (pendingPayouts.length === 0) {
      console.log('✅ Nessun payout pending da processare');
      await mongoose.disconnect();
      process.exit(0);
    }

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const payout of pendingPayouts) {
      console.log('═══════════════════════════════════════');
      console.log(`📦 Payout ID: ${payout._id}`);
      console.log(`   Venditore: ${payout.vendorId?.businessName || payout.vendorId?.name || 'N/A'}`);
      console.log(`   Amount: €${payout.amount}`);
      console.log(`   Created: ${payout.createdAt} (${getTimeAgo(payout.createdAt)} fa)`);
      console.log(`   Order: ${payout.orderId?._id || 'N/A'}`);
      
      try {
        // VALIDAZIONI
        if (!payout.vendorId) {
          console.log('   ⚠️  SKIP: Venditore non trovato');
          skipCount++;
          continue;
        }

        if (!payout.vendorId.stripeConnectAccountId) {
          console.log('   ⚠️  SKIP: Venditore senza Stripe Connect');
          skipCount++;
          continue;
        }

        if (!payout.vendorId.stripeChargesEnabled || !payout.vendorId.stripePayoutsEnabled) {
          console.log('   ⚠️  SKIP: Stripe Connect non attivo');
          console.log(`      - Charges: ${payout.vendorId.stripeChargesEnabled || false}`);
          console.log(`      - Payouts: ${payout.vendorId.stripePayoutsEnabled || false}`);
          skipCount++;
          continue;
        }

        // Se c'è già un transfer ID, verifica su Stripe
        if (payout.stripeTransferId) {
          console.log(`   🔍 Transfer ID esistente: ${payout.stripeTransferId}`);
          try {
            const existingTransfer = await stripe.transfers.retrieve(payout.stripeTransferId);
            console.log(`   ✅ Transfer già eseguito su Stripe - aggiorno status a 'processing'`);
            
            if (!dryRun) {
              payout.status = 'processing';
              payout.paymentDate = payout.paymentDate || new Date();
              await payout.save();
            }
            
            successCount++;
            continue;
          } catch (stripeError) {
            if (stripeError.code === 'resource_missing') {
              console.log('   ⚠️  Transfer ID nel DB ma non esiste su Stripe - riprovo');
            } else {
              throw stripeError;
            }
          }
        }

        // ESEGUI TRANSFER
        console.log('   💸 Esecuzione transfer...');

        if (dryRun) {
          console.log('   🧪 DRY RUN: Transfer non eseguito');
          successCount++;
          continue;
        }

        const amountInCents = Math.round(payout.amount * 100);
        
        const transferParams = {
          amount: amountInCents,
          currency: 'eur',
          destination: payout.vendorId.stripeConnectAccountId,
          description: `Retry automatico - Ordine #${payout.orderId?._id || 'N/A'}`,
          metadata: {
            payoutId: payout._id.toString(),
            orderId: payout.orderId?._id?.toString() || 'N/A',
            vendorId: payout.vendorId._id.toString(),
            automated_retry: 'true',
            retry_reason: 'pending_timeout'
          }
        };

        // Recupera charge ID se disponibile
        if (payout.orderId?.stripeSessionId) {
          try {
            const session = await stripe.checkout.sessions.retrieve(payout.orderId.stripeSessionId);
            if (session.payment_intent) {
              const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
              if (paymentIntent.latest_charge) {
                transferParams.source_transaction = paymentIntent.latest_charge;
                console.log(`   💳 Source transaction: ${paymentIntent.latest_charge}`);
              }
            }
          } catch (chargeError) {
            console.log('   ⚠️  Impossibile recuperare charge ID');
          }
        }

        const transfer = await stripe.transfers.create(transferParams);

        console.log(`   ✅ Transfer eseguito: ${transfer.id}`);
        console.log(`      Amount: €${(transfer.amount / 100).toFixed(2)}`);

        // Aggiorna database
        payout.status = 'processing';
        payout.stripeTransferId = transfer.id;
        payout.paymentDate = new Date();
        await payout.save();

        console.log('   ✅ Database aggiornato');
        successCount++;

      } catch (error) {
        console.error(`   ❌ ERRORE: ${error.message}`);
        errorCount++;
        
        // Salva errore nel payout
        if (!dryRun) {
          try {
            payout.status = 'failed';
            payout.failureReason = error.message;
            await payout.save();
          } catch (saveError) {
            console.error('   ❌ Errore salvataggio stato failed:', saveError.message);
          }
        }
      }

      console.log('');
    }

    console.log('═══════════════════════════════════════');
    console.log('📊 RIEPILOGO:');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Successo: ${successCount}`);
    console.log(`⚠️  Skipped: ${skipCount}`);
    console.log(`❌ Errori: ${errorCount}`);
    console.log(`📦 Totale: ${pendingPayouts.length}`);
    console.log('═══════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERRORE GLOBALE:', error);
    try {
      await mongoose.disconnect();
    } catch (e) {
      // Ignora errori di disconnessione
    }
    process.exit(1);
  }
}

function getTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h`;
  return '<1h';
}

retryPendingPayouts();
