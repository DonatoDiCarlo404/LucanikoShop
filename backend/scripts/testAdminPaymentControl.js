/**
 * Script per testare gli endpoint del pannello admin pagamenti
 * 
 * Testa:
 * 1. GET /api/admin/payments/statistics
 * 2. GET /api/admin/payments/pending-payouts
 * 3. GET /api/admin/payments/vendors-list
 */

import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const MONGODB_URI = process.env.MONGODB_URI;

// Simuliamo un admin token (in produzione viene da login)
let adminToken = null;

async function loginAsAdmin() {
  try {
    console.log('\n🔐 [TEST] Login come admin...');
    
    // Trova un admin nel database
    const User = (await import('../models/User.js')).default;
    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('❌ [TEST] Nessun admin trovato nel database');
      console.log('💡 [TEST] Crea un admin oppure usa token esistente');
      return null;
    }

    console.log('✅ [TEST] Admin trovato:', admin.email);
    
    // In un test reale, dovresti fare login con email/password
    // Per ora simuliamo generando un token
    const generateTokenModule = await import('../utils/generateToken.js');
    const generateToken = generateTokenModule.default;
    adminToken = generateToken(admin._id.toString());
    
    console.log('✅ [TEST] Token generato\n');
    return adminToken;
    
  } catch (error) {
    console.error('❌ [TEST] Errore login admin:', error.message);
    return null;
  }
}

async function testStatistics() {
  try {
    console.log('📊 [TEST] ============ TEST STATISTICHE ============\n');
    
    const response = await axios.get(`${API_URL}/admin/payments/statistics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const stats = response.data;

    console.log('✅ [TEST] Statistiche recuperate con successo!\n');
    
    console.log('💰 [STATS] Totale da Pagare Oggi:');
    console.log(`   - Importo: €${stats.toPay.amount.toFixed(2)}`);
    console.log(`   - Payouts: ${stats.toPay.count}`);
    
    console.log('\n💸 [STATS] Totale Pagato Questo Mese:');
    console.log(`   - Importo: €${stats.paidThisMonth.amount.toFixed(2)}`);
    console.log(`   - Transfer: ${stats.paidThisMonth.count}`);
    
    console.log('\n❌ [STATS] Transfer Falliti:');
    console.log(`   - Importo: €${stats.failed.amount.toFixed(2)}`);
    console.log(`   - Fallimenti: ${stats.failed.count}`);
    
    console.log('\n💳 [STATS] Debiti Attivi:');
    console.log(`   - Importo: €${stats.debts.amount.toFixed(2)}`);
    console.log(`   - Count: ${stats.debts.count}`);
    
    console.log('\n👥 [STATS] Venditori:');
    console.log(`   - Con Stripe Connect: ${stats.vendors.withStripeConnect}`);
    console.log(`   - In attesa onboarding: ${stats.vendors.pendingOnboarding}`);
    
    console.log('\n💵 [STATS] Fee Questo Mese:');
    console.log(`   - Stripe: €${stats.fees.stripeFees.toFixed(2)}`);
    console.log(`   - Transfer: €${stats.fees.transferFees.toFixed(2)}`);
    console.log(`   - Totale: €${stats.fees.total.toFixed(2)}`);
    
    console.log('\n✅ [TEST] ============================================\n');
    
  } catch (error) {
    console.error('❌ [TEST] Errore test statistiche:', error.response?.data || error.message);
  }
}

async function testPendingPayouts() {
  try {
    console.log('📋 [TEST] ============ TEST PENDING PAYOUTS ============\n');
    
    const response = await axios.get(`${API_URL}/admin/payments/pending-payouts?limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const { payouts, pagination, summary } = response.data;

    console.log('✅ [TEST] Pending payouts recuperati con successo!\n');
    
    console.log('📊 [SUMMARY] Riepilogo:');
    console.log(`   - Totale importo: €${summary.totalAmount.toFixed(2)}`);
    console.log(`   - Pronti per pagamento: ${summary.readyToPay}`);
    console.log(`   - Bloccati (no Stripe): ${summary.blocked}`);
    
    console.log('\n📄 [PAGINATION] Paginazione:');
    console.log(`   - Pagina corrente: ${pagination.currentPage}`);
    console.log(`   - Totale pagine: ${pagination.totalPages}`);
    console.log(`   - Totale payouts: ${pagination.totalPayouts}`);
    
    if (payouts.length > 0) {
      console.log(`\n📋 [PAYOUTS] Primi ${payouts.length} payouts:\n`);
      
      payouts.forEach((payout, idx) => {
        console.log(`${idx + 1}. ${payout.vendorName}`);
        console.log(`   - Ordine: #${payout.orderNumber}`);
        console.log(`   - Importo: €${payout.amount.toFixed(2)}`);
        console.log(`   - Giorni trascorsi: ${payout.daysSinceSale}`);
        console.log(`   - Può essere pagato: ${payout.canBePaid ? '✅ Sì' : '❌ No'}`);
        console.log(`   - Stripe account: ${payout.hasStripeAccount ? '✅' : '❌'}`);
        console.log(`   - Onboarding completo: ${payout.isOnboardingComplete ? '✅' : '❌'}`);
        console.log('');
      });
    } else {
      console.log('\n✅ [PAYOUTS] Nessun payout in attesa di pagamento!\n');
    }
    
    console.log('✅ [TEST] ============================================\n');
    
  } catch (error) {
    console.error('❌ [TEST] Errore test pending payouts:', error.response?.data || error.message);
  }
}

async function testVendorsList() {
  try {
    console.log('👥 [TEST] ============ TEST VENDORS LIST ============\n');
    
    const response = await axios.get(`${API_URL}/admin/payments/vendors-list`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const { vendors, count } = response.data;

    console.log('✅ [TEST] Lista venditori recuperata con successo!\n');
    console.log(`📊 [COUNT] Totale venditori con payouts: ${count}\n`);
    
    if (vendors.length > 0) {
      console.log('👥 [VENDORS] Lista venditori:\n');
      
      vendors.forEach((vendor, idx) => {
        console.log(`${idx + 1}. ${vendor.name}`);
        console.log(`   - Email: ${vendor.email}`);
        console.log(`   - Stripe account: ${vendor.hasStripeAccount ? '✅' : '❌'}`);
        console.log(`   - Onboarding completo: ${vendor.isOnboardingComplete ? '✅' : '❌'}`);
        console.log('');
      });
    } else {
      console.log('ℹ️ [VENDORS] Nessun venditore con payouts\n');
    }
    
    console.log('✅ [TEST] ============================================\n');
    
  } catch (error) {
    console.error('❌ [TEST] Errore test vendors list:', error.response?.data || error.message);
  }
}

async function runTests() {
  try {
    console.log('\n🧪 [TEST] ============ TEST ADMIN PAYMENT CONTROL ============\n');
    
    // Connetti al database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ [TEST] Database connesso\n');

    // Login come admin
    const token = await loginAsAdmin();
    if (!token) {
      console.log('❌ [TEST] Impossibile procedere senza token admin');
      return;
    }

    // Esegui i test
    await testStatistics();
    await testPendingPayouts();
    await testVendorsList();

    console.log('\n🎉 [TEST] ============ TUTTI I TEST COMPLETATI! ============\n');
    console.log('📋 [SUMMARY] Cosa hai testato:');
    console.log('   ✅ Statistiche pagamenti (da pagare, pagato, falliti, fee)');
    console.log('   ✅ Lista payouts pending >14 giorni con filtri');
    console.log('   ✅ Lista venditori con payouts');
    console.log('\n📊 [NEXT] Accedi a: http://localhost:5173/admin/payment-control');
    console.log('   per vedere il pannello admin completo!\n');

  } catch (error) {
    console.error('❌ [TEST] Errore durante i test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ [TEST] Connessione database chiusa\n');
  }
}

runTests();
