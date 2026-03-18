import 'dotenv/config';
import Stripe from 'stripe';

// Script per analizzare la sessione Stripe in dettaglio
async function analyzeStripeSession(paymentIntentId, useProduction = false) {
  try {
    const stripeKey = useProduction 
      ? (process.env.STRIPE_SECRET_KEY_PROD || process.env.STRIPE_SECRET_KEY)
      : process.env.STRIPE_SECRET_KEY;
    
    console.log('🔍 [ANALYZE] Recupero dati da Stripe...');
    const stripe = new Stripe(stripeKey);
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: paymentIntentId,
      limit: 1
    });
    
    if (sessions.data.length === 0) {
      throw new Error('❌ Nessuna sessione trovata per questo Payment Intent');
    }
    
    const fullSession = await stripe.checkout.sessions.retrieve(sessions.data[0].id, {
      expand: ['line_items', 'line_items.data.price.product']
    });
    
    console.log('✅ [ANALYZE] Dati Stripe recuperati\n');
    
    console.log('═══════════════════════════════════════');
    console.log('📋 PAYMENT INTENT');
    console.log('═══════════════════════════════════════');
    console.log('ID:', paymentIntent.id);
    console.log('Amount:', (paymentIntent.amount / 100).toFixed(2), 'EUR');
    console.log('Status:', paymentIntent.status);
    console.log('Customer Email:', paymentIntent.receipt_email || 'N/A');
    
    console.log('\n═══════════════════════════════════════');
    console.log('📋 CHECKOUT SESSION');
    console.log('═══════════════════════════════════════');
    console.log('ID:', fullSession.id);
    console.log('Amount Total:', (fullSession.amount_total / 100).toFixed(2), 'EUR');
    console.log('Amount Subtotal:', (fullSession.amount_subtotal / 100).toFixed(2), 'EUR');
    
    if (fullSession.total_details) {
      console.log('\n💰 TOTAL DETAILS:');
      console.log('   Amount Discount:', fullSession.total_details.amount_discount / 100, 'EUR');
      console.log('   Amount Shipping:', fullSession.total_details.amount_shipping / 100, 'EUR');
      console.log('   Amount Tax:', fullSession.total_details.amount_tax / 100, 'EUR');
    }
    
    if (fullSession.shipping_cost) {
      console.log('\n🚚 SHIPPING COST:');
      console.log('   Amount Total:', fullSession.shipping_cost.amount_total / 100, 'EUR');
      console.log('   Amount Subtotal:', fullSession.shipping_cost.amount_subtotal / 100, 'EUR');
      console.log('   Amount Tax:', fullSession.shipping_cost.amount_tax / 100, 'EUR');
    }
    
    console.log('\n═══════════════════════════════════════');
    console.log('📦 LINE ITEMS (' + fullSession.line_items.data.length + ')');
    console.log('═══════════════════════════════════════');
    
    fullSession.line_items.data.forEach((item, idx) => {
      console.log(`\n${idx + 1}. ${item.description}`);
      console.log('   Quantity:', item.quantity);
      console.log('   Unit Amount:', (item.price.unit_amount / 100).toFixed(2), 'EUR');
      console.log('   Amount Total:', (item.amount_total / 100).toFixed(2), 'EUR');
      console.log('   Amount Subtotal:', (item.amount_subtotal / 100).toFixed(2), 'EUR');
      if (item.amount_discount > 0) {
        console.log('   Amount Discount:', (item.amount_discount / 100).toFixed(2), 'EUR');
      }
      if (item.amount_tax > 0) {
        console.log('   Amount Tax:', (item.amount_tax / 100).toFixed(2), 'EUR');
      }
    });
    
    console.log('\n═══════════════════════════════════════');
    console.log('📝 METADATA');
    console.log('═══════════════════════════════════════');
    console.log(JSON.stringify(fullSession.metadata, null, 2));
    
    console.log('\n═══════════════════════════════════════');
    console.log('💡 ANALISI');
    console.log('═══════════════════════════════════════');
    
    const total = fullSession.amount_total / 100;
    const subtotal = fullSession.amount_subtotal / 100;
    const difference = total - subtotal;
    
    console.log('Totale:', total.toFixed(2), 'EUR');
    console.log('Subtotale prodotti:', subtotal.toFixed(2), 'EUR');
    console.log('Differenza (shipping + tax + discount):', difference.toFixed(2), 'EUR');
    
    if (fullSession.total_details) {
      const shipping = fullSession.total_details.amount_shipping / 100;
      const tax = fullSession.total_details.amount_tax / 100;
      const discount = fullSession.total_details.amount_discount / 100;
      
      console.log('\n📊 BREAKDOWN:');
      console.log('   Prodotti:', subtotal.toFixed(2), 'EUR');
      if (shipping > 0) console.log('   + Spedizione:', shipping.toFixed(2), 'EUR');
      if (tax > 0) console.log('   + IVA:', tax.toFixed(2), 'EUR');
      if (discount > 0) console.log('   - Sconto:', discount.toFixed(2), 'EUR');
      console.log('   = TOTALE:', total.toFixed(2), 'EUR');
      
      console.log('\n✅ VALORI DA USARE PER ORDER:');
      console.log('   itemsPrice:', subtotal.toFixed(2), 'EUR');
      console.log('   shippingPrice:', shipping.toFixed(2), 'EUR');
      console.log('   taxPrice:', tax.toFixed(2), 'EUR');
      console.log('   discountAmount:', discount.toFixed(2), 'EUR');
      console.log('   totalPrice:', total.toFixed(2), 'EUR');
    }

  } catch (error) {
    console.error('\n❌ [ANALYZE] ERRORE:', error.message);
    console.error(error);
  }
}

// Esegui script
const args = process.argv.slice(2);
const paymentIntentId = args[0];
const useProduction = args.includes('--prod');

if (!paymentIntentId) {
  console.error('❌ Uso: node analyzeStripeSession.js <paymentIntentId> [--prod]');
  console.error('   Esempio: node analyzeStripeSession.js pi_3TCIvDK9Lxisu9UD1fxHEX5n --prod');
  process.exit(1);
}

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║         🔍 ANALISI SESSIONE STRIPE                    ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log(`🌍 Ambiente: ${useProduction ? 'PRODUZIONE' : 'SVILUPPO'}\n`);

analyzeStripeSession(paymentIntentId, useProduction);
