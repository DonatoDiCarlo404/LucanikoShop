import Stripe from 'stripe';
import VendorPayout from '../models/VendorPayout.js';
import User from '../models/User.js';
import logger from '../config/logger.js';
import { sendTransferFailedAlert } from '../utils/alertService.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Processa i pagamenti ai venditori dopo 14 giorni dalla vendita
 * Esegue transfer Stripe Connect per ogni VendorPayout con status "pending"
 */
export const processVendorPayouts = async () => {
  try {
    logger.logCron('========== INIZIO PROCESSAMENTO PAGAMENTI ==========');
    logger.logCron('Job avviato', { timestamp: new Date().toISOString() });

    // Calcola la data limite (14 giorni fa)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    logger.logCron('Data limite calcolata', { cutoffDate: fourteenDaysAgo.toISOString() });

    // Query VendorPayout da processare
    const payoutsToProcess = await VendorPayout.find({
      status: 'pending',
      saleDate: { $lte: fourteenDaysAgo },
      isRefundDebt: { $ne: true } // Escludi i debiti da rimborso (gestiti separatamente)
    }).populate('vendorId', 'stripeConnectAccountId onboardingComplete email name companyName debtBalance');

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

        // Calcola importo finale detraendo eventuali debiti (Fase 6.2)
        const vendorDebt = payout.vendorId.debtBalance || 0;
        let finalAmount = payout.amount;

        if (vendorDebt > 0) {
          console.log(`⚠️  [PAYOUT JOB] DEBITO RILEVATO: €${vendorDebt.toFixed(2)}`);
          
          // Detrai il debito dall'importo da pagare
          finalAmount = payout.amount - vendorDebt;
          
          console.log(`💳 [PAYOUT JOB] Importo originale: €${payout.amount.toFixed(2)}`);
          console.log(`💳 [PAYOUT JOB] Debito da detrarre: €${vendorDebt.toFixed(2)}`);
          console.log(`💳 [PAYOUT JOB] Importo finale: €${finalAmount.toFixed(2)}`);

          // Se il debito è maggiore o uguale all'importo, segna come pagato ma importo 0
          if (finalAmount <= 0) {
            console.log(`⚠️  [PAYOUT JOB] DEBITO COPRE INTERO PAGAMENTO - Nessun transfer effettuato`);
            
            // Aggiorna solo il debito residuo
            const vendor = await User.findById(payout.vendorId._id);
            if (vendor) {
              const debtCovered = Math.min(vendorDebt, payout.amount);
              vendor.debtBalance = Math.max(0, vendorDebt - debtCovered);
              vendor.pendingEarnings = Math.max(0, (vendor.pendingEarnings || 0) - payout.amount);
              await vendor.save();
              
              console.log(`✅ [PAYOUT JOB] Debito ridotto di €${debtCovered.toFixed(2)}`);
              console.log(`   - Nuovo debito: €${vendor.debtBalance.toFixed(2)}`);
            }

            // Segna payout come "paid" ma senza transfer
            payout.status = 'paid';
            payout.paymentDate = new Date();
            payout.stripeTransferId = null;
            payout.failureReason = `Importo compensato con debito. Debito detratto: €${Math.min(vendorDebt, payout.amount).toFixed(2)}`;
            await payout.save();
            
            successCount++;
            continue; // Passa al prossimo payout
          }
        }

        // Aggiorna status a "processing"
        payout.status = 'processing';
        await payout.save();

        // Crea transfer Stripe Connect
        console.log(`💸 [PAYOUT JOB] Esecuzione transfer Stripe...`);
        const transfer = await stripe.transfers.create({
          amount: Math.round(finalAmount * 100), // Usa importo finale (dopo detrazione debito)
          currency: 'eur',
          destination: payout.vendorId.stripeConnectAccountId,
          metadata: {
            orderId: payout.orderId.toString(),
            payoutId: payout._id.toString(),
            vendorId: payout.vendorId._id.toString(),
            saleDate: payout.saleDate.toISOString(),
            originalAmount: payout.amount,
            debtDeducted: vendorDebt > 0 ? Math.min(vendorDebt, payout.amount) : 0,
            finalAmount: finalAmount
          },
          description: `Pagamento vendita ordine #${payout.orderId}${vendorDebt > 0 ? ` (debito detratto: €${Math.min(vendorDebt, payout.amount).toFixed(2)})` : ''}`
        });

        logger.info('Transfer Stripe completato con successo', {
          transferId: transfer.id,
          payoutId: payout._id,
          vendorId: payout.vendorId._id,
          amount: finalAmount
        });

        logger.logTransfer('SUCCESS', payout._id, payout.vendorId._id, finalAmount, 'paid', {
          stripeTransferId: transfer.id,
          originalAmount: payout.amount,
          debtDeducted: vendorDebt > 0 ? Math.min(vendorDebt, payout.amount) : 0
        });

        // Aggiorna VendorPayout: status = "paid"
        payout.status = 'paid';
        payout.paymentDate = new Date();
        payout.stripeTransferId = transfer.id;
        await payout.save();

        // Aggiorna statistiche venditore
        const vendor = await User.findById(payout.vendorId._id);
        if (vendor) {
          const debtDeducted = vendorDebt > 0 ? Math.min(vendorDebt, payout.amount) : 0;
          
          vendor.paidEarnings = (vendor.paidEarnings || 0) + payout.amount;
          vendor.pendingEarnings = Math.max(0, (vendor.pendingEarnings || 0) - payout.amount);
          
          // Riduci il debito se presente
          if (debtDeducted > 0) {
            vendor.debtBalance = Math.max(0, vendorDebt - debtDeducted);
            console.log(`💳 [PAYOUT JOB] Debito ridotto di €${debtDeducted.toFixed(2)}`);
          }
          
          await vendor.save();

          console.log(`✅ [PAYOUT JOB] Statistiche venditore aggiornate:`);
          console.log(`   - Paid Earnings: €${vendor.paidEarnings.toFixed(2)}`);
          console.log(`   - Pending Earnings: €${vendor.pendingEarnings.toFixed(2)}`);
          if (vendor.debtBalance > 0) {
            console.log(`   - Debt Balance: €${vendor.debtBalance.toFixed(2)} ⚠️`);
          }
        }

        successCount++;

      } catch (error) {
        logger.critical('Transfer fallito', error, {
          payoutId: payout._id,
          vendorId: payout.vendorId?._id,
          vendorName: payout.vendorId?.companyName || payout.vendorId?.name,
          amount: payout.amount,
          saleDate: payout.saleDate,
          stripeAccount: payout.vendorId?.stripeConnectAccountId
        });

        logger.logTransfer('FAILED', payout._id, payout.vendorId?._id, payout.amount, 'failed', {
          errorMessage: error.message,
          errorStack: error.stack
        });

        // Aggiorna VendorPayout: status = "failed"
        payout.status = 'failed';
        payout.failureReason = error.message;
        await payout.save();

        failedCount++;

        // Invia alert email ad admin
        try {
          await sendTransferFailedAlert(payout, payout.vendorId, error);
          logger.info('Alert email inviato per transfer fallito', { payoutId: payout._id });
        } catch (alertError) {
          logger.error('Errore invio alert email', { error: alertError.message });
        }
      }
    }

    logger.logCron('========== RIEPILOGO ==========', {
      totalProcessed: payoutsToProcess.length,
      successCount,
      failedCount,
      successRate: payoutsToProcess.length > 0 ? (successCount / payoutsToProcess.length * 100).toFixed(2) + '%' : 'N/A'
    });

    logger.logCron('========== FINE PROCESSAMENTO ==========');

    return {
      processed: payoutsToProcess.length,
      success: successCount,
      failed: failedCount
    };

  } catch (error) {
    logger.critical('Errore critico nel job pagamenti venditori', error);
    throw error;
  }
};
