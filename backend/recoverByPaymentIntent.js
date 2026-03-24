import 'dotenv/config';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import Order from './models/Order.js';
import Product from './models/Product.js';
import User from './models/User.js';
import { sendOrderConfirmationEmail, sendNewOrderToVendorEmail } from './utils/emailTemplates.js';

// Script per recuperare ordini usando Payment Intent ID
async function recoverByPaymentIntent(paymentIntentId, useProduction = false) {
  // Crea client Stripe con la chiave giusta
  const stripeKey = useProduction 
    ? (process.env.STRIPE_SECRET_KEY_PROD || process.env.STRIPE_SECRET_KEY)
    : (process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY_PROD);
  
  if (!stripeKey) {
    throw new Error('❌ STRIPE_SECRET_KEY non trovato nel file .env');
  }
  
  const stripe = new Stripe(stripeKey);
  console.log(`🔑 [RECOVER] Stripe: ${useProduction ? 'PRODUZIONE' : 'SVILUPPO'}`);
  
  try {
    console.log('🔍 [RECOVER] Connessione MongoDB...');
    
    // Scegli il database giusto (prod o dev)
    const mongoUri = useProduction 
      ? (process.env.MONGODB_URI_PROD || process.env.MONGODB_URI)
      : (process.env.MONGODB_URI || process.env.MONGODB_URI_PROD);
    
    if (!mongoUri) {
      throw new Error('❌ MONGODB_URI non trovato nel file .env');
    }
    
    const dbName = useProduction ? 'PRODUZIONE' : 'SVILUPPO';
    console.log(`📦 [RECOVER] Database: ${dbName}`);
    console.log(`🔗 [RECOVER] URI: ${mongoUri.substring(0, 30)}...`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ [RECOVER] Connesso a MongoDB');

    console.log(`🔍 [RECOVER] Recupero Payment Intent: ${paymentIntentId}`);
    
    // Recupera il PaymentIntent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log('✅ [RECOVER] Payment Intent trovato');
    console.log('💰 [RECOVER] Importo:', paymentIntent.amount / 100, 'EUR');

    // Cerca tutte le sessioni checkout recenti
    console.log('🔍 [RECOVER] Cerco la sessione checkout associata...');
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      payment_intent: paymentIntentId
    });

    if (sessions.data.length === 0) {
      throw new Error('❌ Nessuna sessione checkout trovata per questo Payment Intent');
    }

    const session = sessions.data[0];
    console.log('✅ [RECOVER] Sessione trovata:', session.id);

    // Verifica se l'ordine esiste già
    const existingOrder = await Order.findOne({ stripeSessionId: session.id });
    if (existingOrder) {
      console.log('⚠️ [RECOVER] Ordine già esistente nel database:', existingOrder._id);
      console.log('📋 [RECOVER] Numero ordine:', existingOrder.orderNumber);
      console.log('\n💡 L\'ordine esiste già - verifica nella dashboard');
      return existingOrder;
    }

    const existingOrderByPI = await Order.findOne({ stripePaymentIntentId: paymentIntentId });
    if (existingOrderByPI) {
      console.log('⚠️ [RECOVER] Ordine già esistente (trovato via PaymentIntent):', existingOrderByPI._id);
      console.log('📋 [RECOVER] Numero ordine:', existingOrderByPI.orderNumber);
      console.log('\n💡 L\'ordine esiste già - verifica nella dashboard');
      return existingOrderByPI;
    }

    console.log('🆕 [RECOVER] Ordine NON trovato nel DB - procedo con creazione...');

    // Espandi la sessione
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items', 'payment_intent'],
    });

    // Estrai dati dalla sessione
    const userId = fullSession.metadata.userId;
    const guestEmail = fullSession.metadata.guestEmail || fullSession.customer_details?.email;
    const isGuestOrder = !userId || userId === 'guest';

    console.log('👤 [RECOVER] Cliente:', guestEmail);
    console.log('📦 [RECOVER] Tipo ordine:', isGuestOrder ? 'Guest' : 'Registrato');

    // SUPPORTO CHUNK: Leggi cartItems da chunk multipli
    let cartItemsData = [];
    if (fullSession.metadata.cartItems_count) {
      const chunkCount = parseInt(fullSession.metadata.cartItems_count);
      console.log(`📦 [RECOVER] Caricamento ${chunkCount} chunk di prodotti`);
      for (let i = 0; i < chunkCount; i++) {
        const chunkData = JSON.parse(fullSession.metadata[`cartItems_${i}`]);
        cartItemsData = cartItemsData.concat(chunkData);
      }
      console.log(`📦 [RECOVER] Totale prodotti: ${cartItemsData.length}`);
    } else if (fullSession.metadata.cartItems) {
      cartItemsData = JSON.parse(fullSession.metadata.cartItems);
      console.log(`📦 [RECOVER] Formato legacy: ${cartItemsData.length} prodotti`);
    } else {
      throw new Error('❌ Nessun dato cartItems trovato nei metadata');
    }

    const shippingCost = parseFloat(fullSession.metadata.shippingCost || '0');
    const discountAmount = parseFloat(fullSession.metadata.discountAmount || '0');

    // Recupera prodotti dal database
    const orderItems = [];
    const productsMap = {};
    
    for (const item of cartItemsData) {
      const product = await Product.findById(item.productId).populate('seller');
      if (!product) {
        console.error(`⚠️ [RECOVER] Prodotto ${item.productId} non trovato - SKIP`);
        continue;
      }

      productsMap[item.productId] = product;

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: item.price,
        seller: product.seller._id,
        ivaPercent: product.ivaPercent || 22,
        selectedVariantSku: item.selectedVariantSku || null,
        selectedVariantAttributes: item.selectedVariantAttributes || null,
      });

      console.log(`  ✅ ${product.name} x${item.quantity} - €${item.price}`);
    }

    console.log(`✅ [RECOVER] ${orderItems.length} prodotti recuperati`);

    // Recupera utente
    let buyerUser = null;
    if (!isGuestOrder) {
      buyerUser = await User.findById(userId);
      console.log('👤 [RECOVER] Utente registrato:', buyerUser ? buyerUser.email : 'NON TROVATO');
    }

    // Recupera dati fatturazione/spedizione dai metadata
    const metadata = fullSession.metadata;
    let billingData = null;
    
    if (metadata.billing_buyerType) {
      billingData = {
        buyerType: metadata.billing_buyerType,
        nome: metadata.billing_nome || '',
        cognome: metadata.billing_cognome || '',
        codiceFiscale: metadata.billing_codiceFiscale || '',
        ragioneSociale: metadata.billing_ragioneSociale || '',
        partitaIVA: metadata.billing_partitaIVA || '',
        pecSdi: metadata.billing_pecSdi || '',
        indirizzo: metadata.billing_indirizzo || '',
        cap: metadata.billing_cap || '',
        citta: metadata.billing_citta || '',
        provincia: metadata.billing_provincia || '',
        nazione: metadata.billing_nazione || 'Italia',
        telefono: metadata.billing_telefono || '',
        email: metadata.billing_email || guestEmail,
        useAltShipping: metadata.billing_useAltShipping === 'true',
      };

      if (billingData.useAltShipping) {
        billingData.altDestinatario = metadata.billing_altDestinatario || '';
        billingData.altIndirizzo = metadata.billing_altIndirizzo || '';
        billingData.altCap = metadata.billing_altCap || '';
        billingData.altCitta = metadata.billing_altCitta || '';
        billingData.altProvincia = metadata.billing_altProvincia || '';
        billingData.altNazione = metadata.billing_altNazione || billingData.nazione || 'Italia';
        billingData.altTelefono = metadata.billing_altTelefono || '';
        billingData.altEmail = metadata.billing_altEmail || '';
      }
    }

    // Prepara indirizzi
    const finalShippingAddress = {
      firstName: billingData?.nome || billingData?.altDestinatario?.split(' ')[0] || 'N/A',
      lastName: billingData?.cognome || billingData?.altDestinatario?.split(' ').slice(1).join(' ') || 'N/A',
      street: billingData?.useAltShipping ? (billingData.altIndirizzo || 'N/A') : (billingData?.indirizzo || 'N/A'),
      city: billingData?.useAltShipping ? (billingData.altCitta || 'N/A') : (billingData?.citta || 'N/A'),
      state: billingData?.useAltShipping ? (billingData.altProvincia || 'N/A') : (billingData?.provincia || 'N/A'),
      zipCode: billingData?.useAltShipping ? (billingData.altCap || 'N/A') : (billingData?.cap || 'N/A'),
      country: billingData?.useAltShipping ? (billingData.altNazione || 'IT') : (billingData?.nazione || 'IT'),
      phone: billingData?.useAltShipping ? (billingData.altTelefono || 'N/A') : (billingData?.telefono || 'N/A'),
    };

    const finalBillingAddress = {
      firstName: billingData?.nome || 'N/A',
      lastName: billingData?.cognome || 'N/A',
      codiceFiscale: billingData?.codiceFiscale,
      ragioneSociale: billingData?.ragioneSociale,
      partitaIVA: billingData?.partitaIVA,
      pecSdi: billingData?.pecSdi,
      street: billingData?.indirizzo || 'N/A',
      city: billingData?.citta || 'N/A',
      state: billingData?.provincia || 'N/A',
      zipCode: billingData?.cap || 'N/A',
      country: billingData?.nazione || 'IT',
      phone: billingData?.telefono || 'N/A',
      email: billingData?.email || guestEmail || 'N/A',
    };

    // Calcola IVA totale
    let totalIva = 0;
    for (const item of orderItems) {
      const ivaItem = (item.price * item.quantity) * (item.ivaPercent / (100 + item.ivaPercent));
      totalIva += ivaItem;
    }

    // Calcola totale (CORREZIONE: usa nomi campi del modello Order)
    const itemsPrice = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingPrice = shippingCost;
    const taxPrice = totalIva;
    const totalPrice = itemsPrice + shippingPrice - discountAmount;

    console.log('\n💰 [RECOVER] Riepilogo:');
    console.log('   Subtotale:', itemsPrice.toFixed(2), 'EUR');
    console.log('   Spedizione:', shippingPrice.toFixed(2), 'EUR');
    console.log('   Sconto:', discountAmount.toFixed(2), 'EUR');
    console.log('   IVA:', taxPrice.toFixed(2), 'EUR');
    console.log('   TOTALE:', totalPrice.toFixed(2), 'EUR');

    console.log('\n📝 [RECOVER] Creazione ordine...');

    // Crea ordine (CORREZIONE: usa nomi campi del modello Order)
    const newOrder = new Order({
      buyer: isGuestOrder ? null : buyerUser?._id,
      isGuestOrder: isGuestOrder,
      guestEmail: isGuestOrder ? guestEmail : undefined,
      guestName: isGuestOrder ? `${finalBillingAddress.firstName} ${finalBillingAddress.lastName}` : undefined,
      items: orderItems,
      shippingAddress: finalShippingAddress,
      billingAddress: finalBillingAddress,
      itemsPrice: itemsPrice,
      shippingPrice: shippingPrice,
      taxPrice: taxPrice,
      discountAmount: discountAmount,
      totalPrice: totalPrice,
      deliveryType: fullSession.metadata.deliveryType || 'shipping',
      paymentMethod: 'card',
      isPaid: true,
      paidAt: new Date(fullSession.created * 1000),
      status: 'pending',
      stripeSessionId: fullSession.id,
      stripePaymentIntentId: paymentIntent.id,
    });

    await newOrder.save();
    console.log('✅ [RECOVER] Ordine creato con successo!');
    console.log('📋 [RECOVER] Codice ordine:', newOrder.orderNumber);
    console.log('📋 [RECOVER] Order ID:', newOrder._id);

    // Aggiorna stock prodotti
    console.log('\n📦 [RECOVER] Aggiornamento stock prodotti...');
    for (const item of orderItems) {
      const product = productsMap[item.product];
      if (product) {
        product.stock -= item.quantity;
        product.sold = (product.sold || 0) + item.quantity;
        await product.save();
        console.log(`  ✅ ${product.name}: stock aggiornato (${product.stock + item.quantity} → ${product.stock})`);
      }
    }

    // Invia email
    console.log('\n📧 [RECOVER] Invio email...');
    try {
      const buyerEmail = isGuestOrder ? guestEmail : buyerUser.email;
      const buyerName = isGuestOrder 
        ? (newOrder.billingAddress?.firstName || 'Cliente')
        : (buyerUser?.name || 'Cliente');
      const orderReference = newOrder.orderNumber || newOrder._id.toString().toUpperCase();
      
      // Prepara dati ordine per email buyer
      const orderDataForEmail = {
        products: orderItems.map(item => {
          const product = productsMap[item.product.toString()];
          return {
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            selectedVariantAttributes: item.selectedVariantAttributes || [],
            customAttributes: product?.customAttributes || [] // Per tradurre i codici
          };
        }),
        itemsPrice: newOrder.itemsPrice,
        shippingPrice: newOrder.shippingPrice,
        totalPrice: newOrder.totalPrice,
        billingAddress: newOrder.billingAddress,
        shippingAddress: newOrder.shippingAddress,
        deliveryType: newOrder.deliveryType,
        pickupAddress: newOrder.pickupAddress
      };
      
      await sendOrderConfirmationEmail(buyerEmail, buyerName, orderReference, orderDataForEmail);
      console.log('  ✅ Email buyer inviata:', buyerEmail);

      // Raggruppa prodotti per venditore
      const vendorGroups = {};
      for (const item of orderItems) {
        const product = productsMap[item.product.toString()];
        const vendorId = product.seller._id.toString();
        
        if (!vendorGroups[vendorId]) {
          vendorGroups[vendorId] = {
            vendor: product.seller,
            items: [],
          };
        }
        
        vendorGroups[vendorId].items.push({
          ...item,
          product: product,
        });
      }

      // Invia email a ogni venditore
      for (const vendorGroup of Object.values(vendorGroups)) {
        const vendorEmail = vendorGroup.vendor.email;
        const companyName = vendorGroup.vendor.businessName || vendorGroup.vendor.companyName || vendorGroup.vendor.name;
        const customerName = isGuestOrder ? (guestEmail || 'Cliente Guest') : (buyerUser?.name || 'Cliente');
        const vendorTotalAmount = vendorGroup.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Prepara dati ordine per email venditore
        const orderDataForVendor = {
          products: vendorGroup.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            selectedVariantAttributes: item.selectedVariantAttributes || [],
            customAttributes: item.product?.customAttributes || [] // Per tradurre i codici
          })),
          itemsPrice: vendorTotalAmount,
          shippingPrice: newOrder.shippingPrice,
          totalPrice: vendorTotalAmount + newOrder.shippingPrice,
          customerName: customerName,
          billingAddress: newOrder.billingAddress,
          shippingAddress: newOrder.shippingAddress,
          deliveryType: newOrder.deliveryType,
          pickupAddress: newOrder.pickupAddress
        };
        
        await sendNewOrderToVendorEmail(vendorEmail, companyName, orderReference, orderDataForVendor);
        console.log('  ✅ Email venditore inviata:', vendorEmail);
      }
    } catch (emailError) {
      console.error('⚠️ [RECOVER] Errore invio email:', emailError.message);
      console.log('⚠️ [RECOVER] L\'ordine è stato creato ma le email potrebbero non essere state inviate');
    }

    console.log('\n🎉 [RECOVER] OPERAZIONE COMPLETATA CON SUCCESSO!');
    return newOrder;

  } catch (error) {
    console.error('\n❌ [RECOVER] ERRORE:', error.message);
    console.error(error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 [RECOVER] Disconnesso da MongoDB');
  }
}

// Uso: node recoverByPaymentIntent.js <payment_intent_id> [--prod]
const args = process.argv.slice(2);
const paymentIntentId = args[0];
const useProduction = args.includes('--prod') || args.includes('-p');

if (!paymentIntentId || paymentIntentId.startsWith('--')) {
  console.error('❌ Uso: node recoverByPaymentIntent.js <payment_intent_id> [--prod]');
  console.log('\n💡 Il Payment Intent ID si trova su Stripe Dashboard:');
  console.log('   Pagamenti > Clicca sul pagamento > "ID pagamento" (inizia con pi_)');
  console.log('\n📋 Esempio SVILUPPO: node recoverByPaymentIntent.js pi_3TCIvDK9Lxisu9UD1fxHEX5n');
  console.log('📋 Esempio PRODUZIONE: node recoverByPaymentIntent.js pi_3TCIvDK9Lxisu9UD1fxHEX5n --prod');
  console.log('\n⚠️  ATTENZIONE: Usa --prod solo per ordini effettuati in produzione!');
  process.exit(1);
}

console.log('\n🚀 [RECOVER] ========== INIZIO RECUPERO ORDINE ==========');
console.log(`🌍 [RECOVER] Ambiente: ${useProduction ? 'PRODUZIONE' : 'SVILUPPO'}\n`);

recoverByPaymentIntent(paymentIntentId, useProduction)
  .then((order) => {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║           ✅ ORDINE RECUPERATO CON SUCCESSO!           ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('\n📋 Dettagli ordine:');
    console.log('   Order ID:', order._id);
    console.log('   Numero ordine:', order.orderNumber);
    console.log('   Cliente:', order.guestEmail || order.buyer?.email);
    console.log('   Totale:', order.totalAmount, 'EUR');
    console.log('   Prodotti:', order.items.length);
    console.log('   Status:', order.status);
    console.log('\n💡 L\'ordine è ora visibile nella dashboard!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n╔════════════════════════════════════════════════════════╗');
    console.error('║              ❌ OPERAZIONE FALLITA                     ║');
    console.error('╚════════════════════════════════════════════════════════╝');
    console.error('\n💬 Errore:', error.message);
    process.exit(1);
  });
