import mongoose from 'mongoose';
import dotenv from 'dotenv';
import VendorPayout from './models/VendorPayout.js';
import User from './models/User.js';

dotenv.config();

// FORZA connessione a PRODUCTION
const MONGODB_URI = process.env.MONGODB_URI_PRODUCTION || process.env.MONGODB_URI;

async function findOrphanPayouts() {
  try {
    console.log(`🔌 Connessione a: ${MONGODB_URI.substring(0, 50)}...`);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connesso al database\n');

    // Trova TUTTI i VendorPayouts
    const allPayouts = await VendorPayout.find({}).sort('-createdAt');
    console.log(`📊 TOTALE VendorPayouts trovati: ${allPayouts.length}\n`);

    if (allPayouts.length === 0) {
      console.log('❌ Nessun VendorPayout trovato!');
      await mongoose.connection.close();
      return;
    }

    // Verifica quali hanno vendorId inesistente
    console.log('═══════════════════════════════════════');
    console.log('🔍 VERIFICA VENDITORI');
    console.log('═══════════════════════════════════════\n');

    const orphanPayouts = [];
    const validPayouts = [];

    for (const payout of allPayouts) {
      console.log(`Payout ID: ${payout._id}`);
      console.log(`  Amount: €${payout.amount.toFixed(2)}`);
      console.log(`  Status: ${payout.status}`);
      console.log(`  VendorId: ${payout.vendorId || 'NULL'}`);
      
      if (payout.vendorId) {
        // Verifica se il venditore esiste
        const vendor = await User.findById(payout.vendorId);
        if (vendor) {
          console.log(`  ✅ Venditore: ${vendor.businessName || vendor.name}`);
          validPayouts.push({ payout, vendor });
        } else {
          console.log(`  ❌ Venditore NON ESISTE PIÙ`);
          orphanPayouts.push(payout);
        }
      } else {
        console.log(`  ❌ VendorId è NULL`);
        orphanPayouts.push(payout);
      }
      console.log('');
    }

    // Riepilogo
    console.log('═══════════════════════════════════════');
    console.log('📋 RIEPILOGO');
    console.log('═══════════════════════════════════════\n');
    console.log(`✅ Payouts VALIDI: ${validPayouts.length}`);
    console.log(`❌ Payouts ORFANI (senza venditore): ${orphanPayouts.length}\n`);

    if (orphanPayouts.length > 0) {
      let totalOrphanAmount = 0;
      console.log('📋 Dettagli payouts orfani:');
      orphanPayouts.forEach(p => {
        totalOrphanAmount += p.amount;
        console.log(`  - ID: ${p._id}, €${p.amount.toFixed(2)}, Status: ${p.status}, Created: ${p.createdAt?.toISOString().split('T')[0] || 'N/A'}`);
      });
      console.log(`\n💰 Totale importo orfano: €${totalOrphanAmount.toFixed(2)}`);

      // Calcola quanti sono per status
      const orphanByStatus = {};
      orphanPayouts.forEach(p => {
        orphanByStatus[p.status] = (orphanByStatus[p.status] || 0) + 1;
      });
      console.log('\n📊 Per status:');
      Object.entries(orphanByStatus).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });

      console.log('\n⚠️  AZIONE CONSIGLIATA: Eliminare questi payouts orfani');
      console.log('   Sono dati di test vecchi che non hanno più senso');
    }

    if (validPayouts.length > 0) {
      console.log('\n✅ Payouts validi:');
      validPayouts.forEach(({ payout, vendor }) => {
        console.log(`  - ${vendor.businessName || vendor.name}: €${payout.amount.toFixed(2)} (${payout.status})`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Analisi completata');
    
  } catch (error) {
    console.error('❌ Errore:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

findOrphanPayouts();
