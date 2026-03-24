import 'dotenv/config';
import mongoose from 'mongoose';
import Order from './models/Order.js';
import Product from './models/Product.js';
import User from './models/User.js';

// Script per testare come vengono gestite le varianti nelle email

async function testEmailVariants(orderId, useProduction = false) {
  let isConnected = false;
  
  try {
    console.log('🔍 [TEST] Avvio test varianti email...\n');
    
    const mongoUri = useProduction 
      ? (process.env.MONGODB_URI_PROD || process.env.MONGODB_URI)
      : (process.env.MONGODB_URI || process.env.MONGODB_URI_PROD);
    
    if (!mongoUri) {
      throw new Error('❌ MONGODB_URI non trovato nel file .env');
    }
    
    const dbName = useProduction ? 'PRODUZIONE' : 'SVILUPPO';
    console.log(`📦 [TEST] Database: ${dbName}`);
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('✅ [TEST] Connesso a MongoDB\n');

    // Validazione ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new Error(`❌ Order ID non valido: ${orderId}`);
    }

    // Recupera l'ordine con populate
    console.log(`🔍 [TEST] Recupero ordine: ${orderId}`);
    const order = await Order.findById(orderId)
      .populate('buyer', 'name email')
      .populate({
        path: 'items.product',
        populate: { path: 'seller', select: 'name email businessName' }
      })
      .lean();

    if (!order) {
      throw new Error(`❌ Ordine ${orderId} non trovato`);
    }

    console.log('✅ [TEST] Ordine trovato');
    console.log(`📋 [TEST] Order ID: ${order._id}`);
    console.log(`📋 [TEST] Totale: €${order.totalPrice || 'N/A'}`);
    console.log(`📋 [TEST] Prodotti: ${order.items?.length || 0}\n`);

    // Analizza ogni prodotto
    if (!order.items || order.items.length === 0) {
      console.log('⚠️ [TEST] Ordine senza prodotti\n');
      return;
    }

    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i];
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📦 PRODOTTO #${i + 1}: ${item.product?.name || item.name || 'Sconosciuto'}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      
      console.log(`\n📊 Dati salvati nell'ordine:`);
      console.log(`   - Quantità: ${item.quantity || 'N/A'}`);
      console.log(`   - Prezzo: €${item.price || 'N/A'}`);
      
      // Varianti nell'item dell'ordine
      const hasVariantAttrs = item.selectedVariantAttributes && 
                              (Array.isArray(item.selectedVariantAttributes) 
                                ? item.selectedVariantAttributes.length > 0 
                                : Object.keys(item.selectedVariantAttributes).length > 0);
      
      if (hasVariantAttrs) {
        console.log(`\n   ✅ selectedVariantAttributes nell'ordine:`);
        try {
          console.log(`   ${JSON.stringify(item.selectedVariantAttributes, null, 2)}`);
        } catch (err) {
          console.log(`   ⚠️ Errore nella serializzazione: ${err.message}`);
        }
      } else {
        console.log(`\n   ℹ️ Nessuna selectedVariantAttributes nell'ordine`);
      }

      if (item.selectedVariantSku) {
        console.log(`\n   ✅ selectedVariantSku: ${item.selectedVariantSku}`);
      }

      // Controlla il prodotto originale
      if (item.product) {
        console.log(`\n📦 Dati del prodotto originale (ID: ${item.product._id}):`);
        
        if (item.product.customAttributes && item.product.customAttributes.length > 0) {
          console.log(`\n   ✅ customAttributes nel prodotto: ${item.product.customAttributes.length} attributi`);
          try {
            console.log(`   ${JSON.stringify(item.product.customAttributes.slice(0, 2), null, 2)}`);
            if (item.product.customAttributes.length > 2) {
              console.log(`   ... e altri ${item.product.customAttributes.length - 2} attributi`);
            }
          } catch (err) {
            console.log(`   ⚠️ Errore nella serializzazione: ${err.message}`);
          }
        } else {
          console.log(`\n   ℹ️ Nessun customAttributes nel prodotto`);
        }

        if (item.product.variants && item.product.variants.length > 0) {
          console.log(`\n   ✅ variants nel prodotto: ${item.product.variants.length} varianti`);
        } else {
          console.log(`\n   ℹ️ Nessun variants nel prodotto`);
        }
      } else {
        console.log(`\n   ⚠️ Prodotto non popolato o non trovato`);
      }

      // Test della traduzione
      console.log(`\n🔄 Test traduzione varianti:`);
      if (hasVariantAttrs) {
        try {
          const selectedAttrs = Array.isArray(item.selectedVariantAttributes) 
            ? item.selectedVariantAttributes 
            : Object.entries(item.selectedVariantAttributes).map(([key, value]) => ({ key, value }));
          const customAttrs = item.product?.customAttributes || [];
          
          console.log(`\n   Input:`);
          console.log(`   - selectedVariantAttributes: ${selectedAttrs.length} attributi`);
          console.log(`   - customAttributes: ${customAttrs.length > 0 ? `${customAttrs.length} disponibili ✅` : 'MANCANTI ❌'}`);
          
          if (customAttrs.length > 0 && selectedAttrs.length > 0) {
            console.log(`\n   Traduzione:`);
            selectedAttrs.forEach(selectedAttr => {
              const attribute = customAttrs.find(attr => attr.key === selectedAttr.key);
              
              if (attribute) {
                const option = attribute.options?.find(opt => opt.value === selectedAttr.value);
                const attributeName = attribute.name || selectedAttr.key;
                const optionName = option?.label || selectedAttr.value;
                
                console.log(`   ✅ ${selectedAttr.key} (${selectedAttr.value}) → ${attributeName}: ${optionName}`);
              } else {
                console.log(`   ⚠️ ${selectedAttr.key} → Attributo non trovato in customAttributes`);
              }
            });
          } else if (customAttrs.length === 0) {
            console.log(`\n   ❌ PROBLEMA: customAttributes mancanti, non posso tradurre`);
            console.log(`   📧 Nell'email apparirà: ${selectedAttrs.map(attr => `${attr.key}: ${attr.value}`).join(', ')}`);
          }
        } catch (err) {
          console.log(`   ❌ Errore durante la traduzione: ${err.message}`);
        }
      } else {
        console.log(`   ℹ️ Prodotto senza varianti`);
      }
    }

    // Simula i dati passati alle email (VERSIONE ATTUALE)
    console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📧 SIMULAZIONE DATI EMAIL (VERSIONE ATTUALE)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    try {
      const currentOrderData = {
        products: order.items.map(item => ({
          name: item.product?.name || item.name || 'Prodotto sconosciuto',
          quantity: item.quantity || 1,
          price: item.price || 0,
          selectedVariantAttributes: item.selectedVariantAttributes || []
          // ❌ MANCA: customAttributes
        })),
      };

      console.log(`\n📧 Dati prodotti passati alla funzione email:`);
      currentOrderData.products.forEach((p, i) => {
        console.log(`\n   Prodotto #${i + 1}: ${p.name}`);
        console.log(`   - selectedVariantAttributes: ${JSON.stringify(p.selectedVariantAttributes)}`);
        console.log(`   - customAttributes: ${p.customAttributes ? 'Presenti ✅' : 'MANCANTI ❌'}`);
        
        const hasAttrs = p.selectedVariantAttributes && 
                        (Array.isArray(p.selectedVariantAttributes) 
                          ? p.selectedVariantAttributes.length > 0 
                          : Object.keys(p.selectedVariantAttributes).length > 0);
        
        if (hasAttrs) {
          const attrs = Array.isArray(p.selectedVariantAttributes) 
            ? p.selectedVariantAttributes 
            : Object.entries(p.selectedVariantAttributes).map(([key, value]) => ({ key, value }));
          console.log(`   \n   ⚠️ Nell'email apparirà (CODICI GREZZI):`);
          console.log(`   "${attrs.map(attr => `${attr.key}: ${attr.value}`).join(', ')}"`);
        }
      });
    } catch (err) {
      console.error(`   ❌ Errore nella simulazione versione attuale: ${err.message}`);
    }

    // Simula i dati CORRETTI con customAttributes
    console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📧 SIMULAZIONE DATI EMAIL (VERSIONE CORRETTA)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    try {
      const fixedOrderData = {
        products: order.items.map(item => ({
          name: item.product?.name || item.name || 'Prodotto sconosciuto',
          quantity: item.quantity || 1,
          price: item.price || 0,
          selectedVariantAttributes: item.selectedVariantAttributes || [],
          customAttributes: item.product?.customAttributes || [] // ✅ AGGIUNTO
        })),
      };

      console.log(`\n📧 Dati prodotti corretti:`);
      fixedOrderData.products.forEach((p, i) => {
        console.log(`\n   Prodotto #${i + 1}: ${p.name}`);
        console.log(`   - selectedVariantAttributes: ${JSON.stringify(p.selectedVariantAttributes)}`);
        console.log(`   - customAttributes: ${p.customAttributes && p.customAttributes.length > 0 ? `${p.customAttributes.length} disponibili ✅` : 'Mancanti ❌'}`);
        
        const hasAttrs = p.selectedVariantAttributes && 
                        (Array.isArray(p.selectedVariantAttributes) 
                          ? p.selectedVariantAttributes.length > 0 
                          : Object.keys(p.selectedVariantAttributes).length > 0);
        
        if (hasAttrs) {
          if (p.customAttributes && p.customAttributes.length > 0) {
            // Simula la traduzione
            const attrs = Array.isArray(p.selectedVariantAttributes) 
              ? p.selectedVariantAttributes 
              : Object.entries(p.selectedVariantAttributes).map(([key, value]) => ({ key, value }));
            
            const translated = attrs.map(selectedAttr => {
              const attribute = p.customAttributes.find(attr => attr.key === selectedAttr.key);
              if (!attribute) return `${selectedAttr.key}: ${selectedAttr.value}`;
              
              const option = attribute.options?.find(opt => opt.value === selectedAttr.value);
              const attributeName = attribute.name || selectedAttr.key;
              const optionName = option?.label || selectedAttr.value;
              
              return `${attributeName}: ${optionName}`;
            }).join(', ');
            
            console.log(`   \n   ✅ Nell'email apparirà (LEGGIBILE):`);
            console.log(`   "${translated}"`);
          } else {
            const attrs = Array.isArray(p.selectedVariantAttributes) 
              ? p.selectedVariantAttributes 
              : Object.entries(p.selectedVariantAttributes).map(([key, value]) => ({ key, value }));
            console.log(`   \n   ⚠️ Nell'email apparirà (CODICI GREZZI):`);
            console.log(`   "${attrs.map(attr => `${attr.key}: ${attr.value}`).join(', ')}"`);
          }
        }
      });
    } catch (err) {
      console.error(`   ❌ Errore nella simulazione versione corretta: ${err.message}`);
    }

    console.log('\n\n🎯 [TEST] RIEPILOGO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📌 Per email leggibili, assicurati che i dati dei prodotti includano:');
    console.log('   1. selectedVariantAttributes (già presente)');
    console.log('   2. customAttributes (spesso mancante)');
    console.log('');
    console.log('📝 File da controllare/modificare:');
    console.log('   - sendOrderEmails.js');
    console.log('   - checkoutSuccessController.js');
    console.log('   - Tutti i controller che inviano email ordini');

    console.log('\n\n🎉 [TEST] Test completato!');

  } catch (error) {
    console.error('\n❌ [TEST] ERRORE:', error.message);
    if (error.stack) {
      console.error('\n📍 Stack trace:');
      console.error(error.stack);
    }
  } finally {
    if (isConnected && mongoose.connection.readyState === 1) {
      try {
        await mongoose.connection.close();
        console.log('\n🔌 [TEST] Disconnesso da MongoDB');
      } catch (err) {
        console.error('⚠️ [TEST] Errore durante la disconnessione:', err.message);
      }
    }
  }
}

// Uso: node testEmailVariants.js <order_id> [--prod]
const args = process.argv.slice(2);
const orderId = args[0];
const useProduction = args.includes('--prod') || args.includes('-p');

if (!orderId || orderId.startsWith('--') || orderId.startsWith('-')) {
  console.error('\n❌ Uso: node testEmailVariants.js <order_id> [--prod]\n');
  console.log('💡 Esempi:');
  console.log('   node testEmailVariants.js 69babec16b1c88550245402a --prod');
  console.log('   node testEmailVariants.js 507f1f77bcf86cd799439011\n');
  process.exit(1);
}

console.log('\n🚀 [TEST] ========== TEST VARIANTI EMAIL ==========');
console.log(`🌍 [TEST] Ambiente: ${useProduction ? 'PRODUZIONE ⚠️' : 'SVILUPPO'}`);
console.log(`📋 [TEST] Order ID: ${orderId}\n`);

testEmailVariants(orderId, useProduction)
  .then(() => {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║           ✅ TEST COMPLETATO CON SUCCESSO!             ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n╔════════════════════════════════════════════════════════╗');
    console.error('║              ❌ TEST FALLITO                           ║');
    console.error('╚════════════════════════════════════════════════════════╝');
    console.error(`\n💥 Errore: ${error.message}\n`);
    process.exit(1);
  });
