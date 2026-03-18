import 'dotenv/config';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import Order from './models/Order.js';
import Product from './models/Product.js';
import User from './models/User.js';
import { sendOrderConfirmationEmail, sendNewOrderToVendorEmail } from './utils/emailTemplates.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Script per recuperare ordini pagati ma non registrati nel database
async function recoverMissingOrder(sessionId) {
  try {
    console.log('🔍 [RECOVER] Connessione MongoDB...');
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('❌ MONGODB_URI non trovato nel file .env');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ [RECOVER] Connesso a MongoDB');

    console.log(`🔍 [RECOVER] Recupero sessione Stripe: ${sessionId}`);
    
    // Recupera la sessione Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent'],
    });

    console.log('✅ [RECOVER] Sessione trovata:', session.id);
    console.log('💳 [RECOVER] Status:', session.payment_status);
    console.log('💰 [RECOVER] Totale:', session.amount_total / 100, 'EUR');

    // Verifica se l'ordine esiste già
    const existingOrder = await Order.findOne({ stripeSessionId: session.id });
    if (existingOrder) {
      console.log('⚠️ [RECOVER] Ordine già esistente nel database:', existingOrder._id);
      console.log('📋 [RECOVER] Numero ordine:', existingOrder.orderNumber);
      return existingOrder;
    }

    console.log('🆕 [RECOVER] Ordine NON trovato nel DB - procedo con creazione...');

    // Estrai dati dalla sessione
    const userId = session.metadata.userId;
    const guestEmail = session.metadata.guestEmail || session.customer_details?.email;
    const isGuestOrder = !userId || userId === 'guest';

    // SUPPORTO CHUNK: Leggi cartItems da chunk multipli
    let cartItemsData = [];
    if (session.metadata.cartItems_count) {
      const chunkCount = parseInt(session.metadata.cartItems_count);
      console.log(`📦 [RECOVER] Caricamento ${chunkCount} chunk di prodotti`);
      for (let i = 0; i < chunkCount; i++) {
        const chunkData = JSON.parse(session.metadata[`cartItems_${i}`]);
        cartItemsData = cartItemsData.concat(chunkData);
      }
      console.log(`📦 [RECOVER] Totale prodotti: ${cartItemsData.length}`);
    } else if (session.metadata.cartItems) {
      cartItemsData = JSON.parse(session.metadata.cartItems);
      console.log(`📦 [RECOVER] Formato legacy: ${cartItemsData.length} prodotti`);
    } else {
      throw new Error('❌ Nessun dato cartItems trovato nei metadata');
    }

    const shippingCost = parseFloat(session.metadata.shippingCost || '0');
    const discountAmount = parseFloat(session.metadata.discountAmount || '0');

    // Recupera prodotti dal database
    const orderItems = [];
    for (const item of cartItemsData) {
      const product = await Product.findById(item.productId).populate('seller');
      if (!product) {
        console.error(`⚠️ [RECOVER] Prodotto ${item.productId} non trovato`);
        continue;
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: item.price,
        seller: product.seller._id,
        ivaPercent: product.ivaPercent || 22,
      });
    }

    console.log(`✅ [RECOVER] ${orderItems.length} prodotti recuperati`);

    // Recupera utente
    let buyerUser = null;
    if (!isGuestOrder) {
      buyerUser = await User.findById(userId);
      console.log('👤 [RECOVER] Utente:', buyerUser ? buyerUser.email : 'guest');
    }

    // Recupera dati fatturazione
    const metadata = session.metadata;
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
        nazione: metadata.billing_nazione || '',
        telefono: metadata.billing_telefono || '',
        email: metadata.billing_email || '',
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
      firstName: billingData?.nome || 'N/A',
      lastName: billingData?.cognome || 'N/A',
      street: billingData?.useAltShipping ? billingData.altIndirizzo : billingData?.indirizzo || 'N/A',
      city: billingData?.useAltShipping ? billingData.altCitta : billingData?.citta || 'N/A',
      state: billingData?.useAltShipping ? billingData.altProvincia : billingData?.provincia || 'N/A',
      zipCode: billingData?.useAltShipping ? billingData.altCap : billingData?.cap || 'N/A',
      country: billingData?.useAltShipping ? billingData.altNazione : billingData?.nazione || 'IT',
      phone: billingData?.useAltShipping ? billingData.altTelefono : billingData?.telefono || 'N/A',
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

    // Calcola IVA
    let totalIva = 0;
    for (const item of orderItems) {
      const ivaItem = (item.price * item.quantity) * (item.ivaPercent / (100 + item.ivaPercent));
      totalIva += ivaItem;
    }

    // Calcola totale
    const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const finalTotal = totalAmount + shippingCost;

    // Crea ordine
    const newOrder = new Order({
      buyer: isGuestOrder ? null : buyerUser._id,
      isGuestOrder: isGuestOrder,
      guestEmail: isGuestOrder ? guestEmail : undefined,
      guestName: isGuestOrder ? `${finalBillingAddress.firstName} ${finalBillingAddress.lastName}` : undefined,
      items: orderItems,
      shippingAddress: finalShippingAddress,
      billingAddress: finalBillingAddress,
      totalAmount: finalTotal,
      totalIva: totalIva,
      shippingCost: shippingCost,
      discountAmount: discountAmount,
      deliveryMethod: session.metadata.deliveryType || 'shipping',
      paymentStatus: 'paid',
      paymentMethod: 'card',
      isPaid: true,
      paidAt: new Date(session.created * 1000),
      status: 'pending',
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent,
    });

    await newOrder.save();
    console.log('✅ [RECOVER] Ordine creato con successo!');
    console.log('📋 [RECOVER] Codice ordine:', newOrder.orderNumber);

    // Invia email
    try {
      const buyerEmail = isGuestOrder ? guestEmail : buyerUser.email;
      await sendOrderConfirmationEmail(buyerEmail, newOrder);
      console.log('📧 [RECOVER] Email buyer inviata');

      // Email ai venditori
      const vendorGroups = {};
      for (const item of orderItems) {
        const product = await Product.findById(item.product).populate('seller');
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

      for (const vendorGroup of Object.values(vendorGroups)) {
        await sendNewOrderToVendorEmail(vendorGroup.vendor.email, newOrder, vendorGroup.items);
        console.log('📧 [RECOVER] Email venditore inviata:', vendorGroup.vendor.email);
      }
    } catch (emailError) {
      console.error('⚠️ [RECOVER] Errore invio email:', emailError.message);
    }

    console.log('🎉 [RECOVER] Ordine recuperato con successo!');
    return newOrder;

  } catch (error) {
    console.error('❌ [RECOVER] Errore:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 [RECOVER] Disconnesso da MongoDB');
  }
}

// Uso: node recoverMissingOrder.js <session_id>
const sessionId = process.argv[2];

if (!sessionId) {
  console.error('❌ Uso: node recoverMissingOrder.js <stripe_session_id>');
  console.log('\n💡 Come trovare il session_id:');
  console.log('1. Vai su Stripe Dashboard > Pagamenti');
  console.log('2. Trova il pagamento del cliente');
  console.log('3. Clicca sul pagamento e cerca "Checkout Session ID"');
  process.exit(1);
}

recoverMissingOrder(sessionId)
  .then((order) => {
    console.log('\n✅ OPERAZIONE COMPLETATA');
    console.log('📋 Ordine ID:', order._id);
    console.log('📋 Numero ordine:', order.orderNumber);
    console.log('💰 Totale:', order.totalAmount, 'EUR');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ OPERAZIONE FALLITA:', error.message);
    process.exit(1);
  });
