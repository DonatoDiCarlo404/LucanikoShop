import Stripe from 'stripe';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { sendOrderConfirmationEmail } from '../utils/emailTemplates.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Gestisce il success redirect dopo il pagamento
// Crea l'ordine se il webhook non è arrivato
export const handleCheckoutSuccess = async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Session ID mancante' 
      });
    }

    console.log('\n🔄 [SUCCESS] ================ VERIFICA PAGAMENTO ================ ');
    console.log('🔄 [SUCCESS] Session ID:', session_id);

    // Recupera la sessione da Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items', 'line_items.data.price.product']
    });

    console.log('🔄 [SUCCESS] Sessione recuperata:', session.payment_status);
    console.log('🔄 [SUCCESS] Metadata:', session.metadata);

    // Verifica che il pagamento sia completato
    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Pagamento non completato'
      });
    }

    // Verifica se l'ordine esiste già (creato dal webhook)
    const existingOrder = await Order.findOne({ stripeSessionId: session.id });
    
    if (existingOrder) {
      console.log('✅ [SUCCESS] Ordine già esistente:', existingOrder._id);
      return res.json({
        success: true,
        message: 'Ordine già processato dal webhook',
        order: {
          _id: existingOrder._id,
          orderNumber: existingOrder._id
        }
      });
    }

    console.log('⚠️ [SUCCESS] Ordine non trovato - creazione manuale');

    // Estrai dati dalla sessione
    const userId = session.metadata.userId;
    const guestEmail = session.metadata.guestEmail || session.customer_details?.email;
    const isGuestOrder = !userId || userId === 'guest';
    const cartItemsData = JSON.parse(session.metadata.cartItems);
    const shippingCost = parseFloat(session.metadata.shippingCost || '0');
    const discountAmount = parseFloat(session.metadata.discountAmount || '0');
    const appliedCouponId = session.metadata.appliedCouponId || null;

    // Recupera info prodotti e crea orderItems
    const orderItems = [];
    const productsMap = {};

    for (const item of cartItemsData) {
      const product = await Product.findById(item.productId);
      if (!product) {
        console.error(`⚠️ [SUCCESS] Prodotto ${item.productId} non trovato`);
        continue;
      }
      
      productsMap[item.productId] = product;
      
      orderItems.push({
        product: product._id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        seller: item.sellerId,
        ivaPercent: product.ivaPercent || 22,
        selectedVariant: item.selectedVariant || null
      });
    }

    // Calcola IVA totale
    let totalIva = 0;
    for (const item of orderItems) {
      const ivaItem = (item.price * item.quantity) * (item.ivaPercent / (100 + item.ivaPercent));
      totalIva += ivaItem;
    }

    // Recupera utente o usa dati guest
    let buyerUser = null;
    if (!isGuestOrder) {
      buyerUser = await User.findById(userId);
    }

    // Prepara indirizzo spedizione
    const shippingAddress = session.shipping_details?.address || session.customer_details?.address;
    const finalShippingAddress = {
      street: shippingAddress?.line1 || buyerUser?.address?.street || 'N/A',
      city: shippingAddress?.city || buyerUser?.address?.city || 'N/A',
      state: shippingAddress?.state || buyerUser?.address?.state || 'N/A',
      zipCode: shippingAddress?.postal_code || buyerUser?.address?.zipCode || 'N/A',
      country: shippingAddress?.country || buyerUser?.address?.country || 'IT',
      phone: session.customer_details?.phone || buyerUser?.phone || 'N/A',
    };

    // Crea orderData
    const orderData = {
      items: orderItems,
      shippingAddress: finalShippingAddress,
      paymentMethod: 'stripe',
      paymentResult: {
        id: session.payment_intent,
        status: session.payment_status,
        email_address: session.customer_details?.email,
      },
      itemsPrice: session.amount_subtotal / 100,
      shippingPrice: shippingCost,
      taxPrice: Math.round(totalIva * 100) / 100,
      discountAmount: discountAmount,
      appliedDiscount: appliedCouponId || undefined,
      totalPrice: session.amount_total / 100,
      status: 'processing',
      isPaid: true,
      paidAt: new Date(),
      stripeSessionId: session.id,
    };

    // Aggiungi campi specifici
    if (isGuestOrder) {
      orderData.isGuestOrder = true;
      orderData.guestEmail = guestEmail;
      orderData.guestName = session.customer_details?.name || 'Guest';
    } else {
      orderData.buyer = userId;
      orderData.isGuestOrder = false;
    }

    console.log('💾 [SUCCESS] Creazione ordine...');
    const order = await Order.create(orderData);
    console.log('✅ [SUCCESS] Ordine creato:', order._id);

    // Aggiorna stock
    console.log('📦 [SUCCESS] Aggiornamento stock...');
    for (const item of orderItems) {
      try {
        const product = productsMap[item.product];
        if (!product) continue;

        if (item.selectedVariant && product.variants && product.variants.length > 0) {
          const variantIndex = product.variants.findIndex(v => v._id.toString() === item.selectedVariant);
          if (variantIndex !== -1) {
            const oldStock = product.variants[variantIndex].stock;
            product.variants[variantIndex].stock = Math.max(0, oldStock - item.quantity);
            await product.save();
            console.log(`✅ [SUCCESS] Stock variante: ${product.name} da ${oldStock} a ${product.variants[variantIndex].stock}`);
          }
        } else {
          const oldStock = product.stock;
          product.stock = Math.max(0, oldStock - item.quantity);
          await product.save();
          console.log(`✅ [SUCCESS] Stock: ${product.name} da ${oldStock} a ${product.stock}`);
        }
      } catch (stockError) {
        console.error(`❌ [SUCCESS] Errore stock:`, stockError);
      }
    }

    // Invia email di conferma acquisto
    console.log('📧 [SUCCESS] Invio email di conferma...');
    try {
      let recipientEmail, recipientName;
      
      if (isGuestOrder) {
        recipientEmail = guestEmail;
        recipientName = session.customer_details?.name || 'Guest';
      } else {
        recipientEmail = buyerUser?.email;
        recipientName = buyerUser?.name;
      }

      if (recipientEmail) {
        const productsList = order.items.map(item => `${item.name} (${item.quantity}x)`).join(', ');
        const totalAmount = `€${order.totalPrice.toFixed(2)}`;
        const shippingAddress = `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.zipCode}`;
        
        await sendOrderConfirmationEmail(
          recipientEmail, 
          recipientName, 
          order._id.toString(), 
          productsList, 
          totalAmount, 
          shippingAddress
        );
        console.log(`✅ [SUCCESS] Email inviata a: ${recipientEmail}`);
      } else {
        console.log('⚠️ [SUCCESS] Email non inviata: recipientEmail mancante');
      }
    } catch (emailError) {
      console.error('❌ [SUCCESS] Errore invio email:', emailError);
      // Non bloccare la risposta se l'email fallisce
    }

    res.json({
      success: true,
      message: 'Ordine creato con successo',
      order: {
        _id: order._id,
        orderNumber: order._id
      }
    });

  } catch (error) {
    console.error('❌ [SUCCESS] Errore:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
