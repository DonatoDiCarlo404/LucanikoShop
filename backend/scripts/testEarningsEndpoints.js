import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Script di test per gli endpoint earnings (Fase 5.1)
 * 
 * Testa:
 * 1. GET /api/vendor/earnings/summary
 * 2. GET /api/vendor/earnings/payouts
 * 3. GET /api/vendor/earnings/sales-pending
 * 
 * PREREQUISITI:
 * - Server deve essere in esecuzione (npm start in altra finestra)
 * - Utente venditore con token JWT valido
 * 
 * USAGE:
 * node scripts/testEarningsEndpoints.js <JWT_TOKEN>
 */

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000/api';
const token = process.argv[2];

if (!token) {
  console.log('❌ Token JWT non fornito\n');
  console.log('USAGE: node scripts/testEarningsEndpoints.js <JWT_TOKEN>\n');
  console.log('Per ottenere un token:');
  console.log('1. Avvia il server: npm start');
  console.log('2. Login come venditore tramite frontend o API');
  console.log('3. Copia il JWT token dalla risposta o localStorage\n');
  process.exit(1);
}

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║   TEST ENDPOINTS EARNINGS VENDITORI (FASE 5.1)       ║');
console.log('╚════════════════════════════════════════════════════════╝\n');
console.log(`🔗 API Base: ${API_BASE}`);
console.log(`🔑 Token: ${token.substring(0, 20)}...\n`);

// Helper per fetch
const fetchAPI = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  const data = await response.json();
  return { status: response.status, data };
};

// Test 1: GET /api/vendor/earnings/summary
const testEarningsSummary = async () => {
  console.log('📊 TEST 1: GET /api/vendor/earnings/summary\n');
  
  try {
    const { status, data } = await fetchAPI('/vendor/earnings/summary');
    
    if (status === 200) {
      console.log('✅ Status: 200 OK');
      console.log('📦 Risposta:');
      console.log(`   - Total Earnings: €${data.totalEarnings?.toFixed(2) || 0}`);
      console.log(`   - Pending Earnings: €${data.pendingEarnings?.toFixed(2) || 0}`);
      console.log(`   - Paid Earnings: €${data.paidEarnings?.toFixed(2) || 0}\n`);
      
      // Verifica struttura
      if (typeof data.totalEarnings !== 'number' || 
          typeof data.pendingEarnings !== 'number' || 
          typeof data.paidEarnings !== 'number') {
        console.log('⚠️  Attenzione: struttura risposta non corretta\n');
        return false;
      }
      
      return true;
    } else {
      console.log(`❌ Status: ${status}`);
      console.log('📦 Errore:', data.message || JSON.stringify(data));
      console.log('');
      return false;
    }
  } catch (error) {
    console.log('❌ Errore:', error.message);
    console.log('💡 Verifica che il server sia in esecuzione\n');
    return false;
  }
};

// Test 2: GET /api/vendor/earnings/payouts
const testVendorPayouts = async () => {
  console.log('📋 TEST 2: GET /api/vendor/earnings/payouts\n');
  
  try {
    // Test senza filtri
    const { status, data } = await fetchAPI('/vendor/earnings/payouts?page=1&limit=5');
    
    if (status === 200) {
      console.log('✅ Status: 200 OK');
      console.log('📦 Risposta:');
      console.log(`   - Payouts trovati: ${data.totalPayouts}`);
      console.log(`   - Pagina corrente: ${data.currentPage}`);
      console.log(`   - Totale pagine: ${data.totalPages}`);
      console.log(`   - Ha altre pagine: ${data.hasMore}`);
      
      if (data.payouts && data.payouts.length > 0) {
        console.log(`\n   📄 Primi ${Math.min(3, data.payouts.length)} payouts:`);
        data.payouts.slice(0, 3).forEach((payout, i) => {
          console.log(`   ${i + 1}. ID: ${payout._id}`);
          console.log(`      - Importo: €${payout.amount?.toFixed(2)}`);
          console.log(`      - Status: ${payout.status}`);
          console.log(`      - Data vendita: ${new Date(payout.saleDate).toLocaleDateString()}`);
          if (payout.orderId) {
            console.log(`      - Ordine: #${payout.orderId.orderNumber}`);
          }
        });
      } else {
        console.log('\n   ℹ️  Nessun payout trovato (normale se non ci sono vendite)');
      }
      console.log('');
      
      // Verifica struttura
      if (!Array.isArray(data.payouts) || 
          typeof data.totalPayouts !== 'number') {
        console.log('⚠️  Attenzione: struttura risposta non corretta\n');
        return false;
      }
      
      return true;
    } else {
      console.log(`❌ Status: ${status}`);
      console.log('📦 Errore:', data.message || JSON.stringify(data));
      console.log('');
      return false;
    }
  } catch (error) {
    console.log('❌ Errore:', error.message);
    console.log('');
    return false;
  }
};

// Test 3: GET /api/vendor/earnings/sales-pending
const testSalesPending = async () => {
  console.log('⏳ TEST 3: GET /api/vendor/earnings/sales-pending\n');
  
  try {
    const { status, data } = await fetchAPI('/vendor/earnings/sales-pending');
    
    if (status === 200) {
      console.log('✅ Status: 200 OK');
      console.log('📦 Risposta:');
      console.log(`   - Vendite in attesa: ${data.count}`);
      console.log(`   - Totale in attesa: €${data.totalPendingAmount?.toFixed(2) || 0}`);
      
      if (data.pendingSales && data.pendingSales.length > 0) {
        console.log(`\n   ⏰ Countdown pagamenti:`);
        data.pendingSales.forEach((sale, i) => {
          console.log(`   ${i + 1}. Importo: €${sale.amount?.toFixed(2)}`);
          console.log(`      - Ordine: #${sale.orderNumber || 'N/A'}`);
          console.log(`      - Giorni trascorsi: ${sale.daysSinceSale}`);
          console.log(`      - Giorni mancanti: ${sale.daysRemaining} 🕐`);
          console.log(`      - Progresso: ${sale.progressPercentage}%`);
          console.log(`      - Pagamento stimato: ${new Date(sale.estimatedPaymentDate).toLocaleDateString()}`);
        });
      } else {
        console.log('\n   ℹ️  Nessuna vendita in attesa di pagamento');
      }
      console.log('');
      
      // Verifica struttura
      if (!Array.isArray(data.pendingSales) || 
          typeof data.totalPendingAmount !== 'number' ||
          typeof data.count !== 'number') {
        console.log('⚠️  Attenzione: struttura risposta non corretta\n');
        return false;
      }
      
      // Verifica countdown
      if (data.pendingSales.length > 0) {
        const firstSale = data.pendingSales[0];
        if (typeof firstSale.daysRemaining !== 'number' ||
            typeof firstSale.progressPercentage !== 'number') {
          console.log('⚠️  Attenzione: dati countdown non corretti\n');
          return false;
        }
      }
      
      return true;
    } else {
      console.log(`❌ Status: ${status}`);
      console.log('📦 Errore:', data.message || JSON.stringify(data));
      console.log('');
      return false;
    }
  } catch (error) {
    console.log('❌ Errore:', error.message);
    console.log('');
    return false;
  }
};

// Esegui tutti i test
const runAllTests = async () => {
  const results = {
    summary: await testEarningsSummary(),
    payouts: await testVendorPayouts(),
    pending: await testSalesPending()
  };
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 RIEPILOGO TEST\n');
  console.log(`   Test 1 (Earnings Summary): ${results.summary ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Test 2 (Vendor Payouts):   ${results.payouts ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Test 3 (Sales Pending):    ${results.pending ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = results.summary && results.payouts && results.pending;
  
  console.log('\n' + (allPassed ? 
    '✅ FASE 5.1 COMPLETATA CON SUCCESSO!' : 
    '⚠️  Alcuni test non sono passati'
  ));
  console.log('═══════════════════════════════════════════════════════\n');
  
  process.exit(allPassed ? 0 : 1);
};

runAllTests();
