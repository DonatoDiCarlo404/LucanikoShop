import Stripe from 'stripe';
import VendorPayout from '../models/VendorPayout.js';
import User from '../models/User.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Processa i pagamenti ai venditori dopo 14 giorni dalla vendita
 * Esegue transfer Stripe Connect per ogni VendorPayout con status "pending"
 */
export const processVendorPayouts = async () => {
  try {
    console.log('\n💰 [PAYOUT JOB] ========== INIZIO PROCESSAMENTO PAGAMENTI ==========');
    console.log('💰 [PAYOUT JOB] Data/ora:', new Date().toISOString());

    // Calcola la data limite (14 giorni fa)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    console.log('📅 [PAYOUT JOB] Data limite (14 giorni fa):', fourteenDaysAgo.toISOString());

    // Query VendorPayout da processare
    const payoutsToProcess = await VendorPayout.find({
      status: 'pending',
      saleDate: { $lte: fourteenDaysAgo }
    }).populate('vendorId', 'stripeConnectAccountId onboardingComplete email name companyName');

    console.log(`💰 [PAYOUT JOB] Trovati ${payoutsToProcess.length} pagamenti da processare`);

    if (payoutsToProcess.length === 0) {
      console.log('✅ [PAYOUT JOB] Nessun pagamento da processare oggi');
      return { processed: 0, success: 0, failed: 0 };
    }

    let successCount = 0;
    let failedCount = 0;

    // Processa ogni payout
    for (const payout of payoutsToProcess) {
      try {
        console.log(`\n💳 [PAYOUT JOB] Processando payout ${payout._id}`);
        console.log(`   - Venditore: ${payout.vendorId?.companyName || payout.vendorId?.name}`);
        console.log(`   - Importo: €${payout.amount}`);
        console.log(`   - Data vendita: ${payout.saleDate.toISOString()}`);

        // Verifica che il venditore esista
        if (!payout.vendorId) {
          throw new Error('Venditore non trovato nel database');
        }

        // Verifica che il venditore abbia Stripe Connect attivo
        if (!payout.vendorId.stripeConnectAccountId) {
          throw new Error('Venditore non ha configurato Stripe Connect');
        }

        // Verifica che l'onboarding sia completato
        if (!payout.vendorId.onboardingComplete) {
          throw new Error('Onboarding Stripe Connect non completato');
        }

        console.log(`   - Stripe Connect Account: ${payout.vendorId.stripeConnectAccountId}`);
        console.log(`   - Onboarding completato: ✅`);

        // Aggiorna status a "processing"
        payout.status = 'processing';
        await payout.save();

        // Crea transfer Stripe Connect
        console.log(`💸 [PAYOUT JOB] Esecuzione transfer Stripe...`);
        const transfer = await stripe.transfers.create({
          amount: Math.round(payout.amount * 100), // Converti in centesimi
          currency: 'eur',
          destination: payout.vendorId.stripeConnectAccountId,
          metadata: {
            orderId: payout.orderId.toString(),
            payoutId: payout._id.toString(),
            vendorId: payout.vendorId._id.toString(),
            saleDate: payout.saleDate.toISOString()
          },
          description: `Pagamento vendita ordine #${payout.orderId}`
        });

        console.log(`✅ [PAYOUT JOB] Transfer completato: ${transfer.id}`);

        // Aggiorna VendorPayout: status = "paid"
        payout.status = 'paid';
        payout.paymentDate = new Date();
        payout.stripeTransferId = transfer.id;
        await payout.save();

        // Aggiorna statistiche venditore
        const vendor = await User.findById(payout.vendorId._id);
        if (vendor) {
          vendor.paidEarnings = (vendor.paidEarnings || 0) + payout.amount;
          vendor.pendingEarnings = Math.max(0, (vendor.pendingEarnings || 0) - payout.amount);
          await vendor.save();

          console.log(`✅ [PAYOUT JOB] Statistiche venditore aggiornate:`);
          console.log(`   - Paid Earnings: €${vendor.paidEarnings.toFixed(2)}`);
          console.log(`   - Pending Earnings: €${vendor.pendingEarnings.toFixed(2)}`);
        }

        successCount++;

      } catch (error) {
        console.error(`❌ [PAYOUT JOB] Errore processamento payout ${payout._id}:`, error.message);

        // Aggiorna VendorPayout: status = "failed"
        payout.status = 'failed';
        payout.failureReason = error.message;
        await payout.save();

        failedCount++;

        // TODO: Invia email ad admin per notificare il fallimento
        console.error(`📧 [PAYOUT JOB] Notifica admin necessaria per payout ${payout._id}`);
      }
    }

    console.log('\n💰 [PAYOUT JOB] ========== RIEPILOGO ==========');
    console.log(`   - Totale processati: ${payoutsToProcess.length}`);
    console.log(`   - Successo: ${successCount}`);
    console.log(`   - Falliti: ${failedCount}`);
    console.log('💰 [PAYOUT JOB] ========== FINE PROCESSAMENTO ==========\n');

    return {
      processed: payoutsToProcess.length,
      success: successCount,
      failed: failedCount
    };

  } catch (error) {
    console.error('❌ [PAYOUT JOB] Errore critico nel job:', error);
    throw error;
  }
};
