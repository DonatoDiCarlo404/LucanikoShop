import dotenv from 'dotenv';
dotenv.config();

const API_URL = process.env.API_URL || 'https://api.lucanikoshop.it';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error('❌ ADMIN_TOKEN non trovato nel .env');
  console.log('\n💡 Per testare, aggiungi questa riga al file .env:');
  console.log('ADMIN_TOKEN=il_tuo_token_admin_qui');
  process.exit(1);
}

async function testStatisticsEndpoint() {
  try {
    console.log('🔄 Testing endpoint statistics...\n');
    console.log(`URL: ${API_URL}/admin/payments/statistics\n`);

    const response = await fetch(`${API_URL}/admin/payments/statistics`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('═══════════════════════════════════════');
    console.log('📊 RISPOSTA ENDPOINT STATISTICS');
    console.log('═══════════════════════════════════════\n');

    console.log('💰 Da Pagare Oggi:');
    console.log(`   Importo: €${data.toPay.amount.toFixed(2)}`);
    console.log(`   Count: ${data.toPay.count} payouts\n`);

    console.log('✅ Pagato Questo Mese:');
    console.log(`   Importo: €${data.paidThisMonth.amount.toFixed(2)}`);
    console.log(`   Count: ${data.paidThisMonth.count} transfer\n`);

    console.log('❌ Transfer Falliti:');
    console.log(`   Importo: €${data.failed.amount.toFixed(2)}`);
    console.log(`   Count: ${data.failed.count} fallimenti\n`);

    console.log('💵 Fee Questo Mese:');
    console.log(`   Stripe: €${data.fees.stripeFees.toFixed(2)}`);
    console.log(`   Transfer: €${data.fees.transferFees.toFixed(2)}`);
    console.log(`   Totale: €${data.fees.total.toFixed(2)}\n`);

    console.log('👥 Venditori:');
    console.log(`   Con Stripe Connect: ${data.vendors.withStripeConnect}`);
    console.log(`   In Attesa Onboarding: ${data.vendors.pendingOnboarding}\n`);

    console.log('═══════════════════════════════════════');
    console.log('\n✅ Test completato');

  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
}

testStatisticsEndpoint();
