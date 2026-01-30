import Stripe from 'stripe';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { sendOrderConfirmationEmail } from '../utils/emailTemplates.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Gestisce il webhook di Stripe
export const handleStripeWebhook = async (req, res) => {
  console.log('\n🔔 [WEBHOOK] ================ WEBHOOK RICEVUTO ================ ');
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  console.log('🔑 [WEBHOOK] Webhook secret presente:', webhookSecret ? '✅ SI' : '❌ NO');
  if (!webhookSecret) {
    console.error('❌ [WEBHOOK] STRIPE_WEBHOOK_SECRET non configurato nel file .env!');
    console.error('❌ [WEBHOOK] Leggi il file WEBHOOK_DEBUG_INSTRUCTIONS.md per la configurazione');
    return res.status(500).send('Webhook secret non configurato');
  }

  let event;

  try {
    // Verifica che il webhook provenga davvero da Stripe
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log('✅ [WEBHOOK] Evento verificato:', event.type);
  } catch (err) {
    console.error('⚠️ Errore verifica webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gestisci l'evento checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    console.log('💳 [WEBHOOK] Processando checkout.session.completed');
    const session = event.data.object;
    console.log('📋 [WEBHOOK] Session ID:', session.id);

    try {
      // Recupera i dettagli completi della sessione con line_items
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items'],
      });

      // Estrai userId dai metadata
      console.log('📦 [WEBHOOK] Metadata completi:', JSON.stringify(session.metadata, null, 2));
      const userId = session.metadata.userId;
      const guestEmail = session.metadata.guestEmail || session.customer_details?.email;
      const isGuestOrder = !userId || userId === 'guest';
      console.log('👤 [WEBHOOK] userId estratto:', userId, 'typeof:', typeof userId);
      console.log('👤 [WEBHOOK] isGuestOrder:', isGuestOrder);
      console.log('📧 [WEBHOOK] guestEmail:', guestEmail);

      // Recupera utente solo se non è guest
      let buyerUser = null;
      if (!isGuestOrder) {
        buyerUser = await User.findById(userId);
        console.log('👤 [WEBHOOK] Utente registrato trovato:', buyerUser ? '✅' : '❌');
      }

      console.log('✅ [WEBHOOK] Procedo con creazione ordine');
      
      // Recupera i dati del carrello dai metadata
      const cartItemsData = JSON.parse(session.metadata.cartItems)
      console.log('🛒 [WEBHOOK] Cart items:', cartItemsData.length, 'prodotti');

      // Recupera info IVA per ogni prodotto
      const productsMap = {};
      for (const item of cartItemsData) {
        if (!productsMap[item.productId]) {
          const prod = await Product.findById(item.productId);
          productsMap[item.productId] = prod ? prod.ivaPercent : 22;
        }
      }

      // Crea gli orderItems con info IVA
      const orderItems = cartItemsData.map((item) => ({
        product: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        seller: item.sellerId,
        ivaPercent: productsMap[item.productId],
      }));

      // Ottieni indirizzo di spedizione da Stripe
      const shippingAddress = session.shipping_details?.address || session.customer_details?.address;

      console.log('📍 [WEBHOOK] Stripe shippingAddress:', shippingAddress);
      console.log('📍 [WEBHOOK] User address nel DB:', buyerUser?.address);
      
      // Utilizza indirizzo salvato nel profilo se Stripe non fornisce dati completi
      let finalShippingAddress = {
        street: shippingAddress?.line1 || buyerUser?.address?.street || 'N/A',
        city: shippingAddress?.city || buyerUser?.address?.city || 'N/A',
        state: shippingAddress?.state || buyerUser?.address?.state || 'N/A',
        zipCode: shippingAddress?.postal_code || buyerUser?.address?.zipCode || 'N/A',
        country: shippingAddress?.country || buyerUser?.address?.country || 'IT',
        phone: session.customer_details?.phone || buyerUser?.phone || 'N/A',
      };
      console.log('📍 [WEBHOOK] Indirizzo spedizione finale:', finalShippingAddress);

      // Ottieni costo spedizione dai metadata
      const shippingCost = parseFloat(session.metadata.shippingCost || '0');
      
      // Ottieni info sconto dai metadata
      const discountAmount = parseFloat(session.metadata.discountAmount || '0');
      const appliedCouponId = session.metadata.appliedCouponId || null;

      // Calcola importo IVA totale
      let totalIva = 0;
      for (const item of orderItems) {
        // Calcolo IVA su prezzo lordo (inclusa):
        // iva = prezzo * (ivaPercent / (100 + ivaPercent))
        const ivaItem = (item.price * item.quantity) * (item.ivaPercent / (100 + item.ivaPercent));
        totalIva += ivaItem;
      }

      // Crea l'ordine nel database
      console.log('💾 [WEBHOOK] Creazione ordine');
      console.log('💾 [WEBHOOK] isGuestOrder:', isGuestOrder);
      console.log('💾 [WEBHOOK] buyer:', isGuestOrder ? 'null (guest)' : userId);
      console.log('💾 [WEBHOOK] Items:', orderItems.length);
      console.log('💾 [WEBHOOK] Total:', session.amount_total / 100);
      
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

      // Aggiungi campi specifici per ordini registrati o guest
      if (isGuestOrder) {
        orderData.isGuestOrder = true;
        orderData.guestEmail = guestEmail;
        orderData.guestName = session.customer_details?.name || 'Guest';
      } else {
        orderData.buyer = userId;
        orderData.isGuestOrder = false;
      }
      
      console.log('💾 [WEBHOOK] Order data completo:', JSON.stringify(orderData, null, 2));
      
      const order = await Order.create(orderData);

      console.log('✅ [WEBHOOK] Ordine creato con successo!');
      console.log('✅ [WEBHOOK] Order ID:', order._id);
      console.log('✅ [WEBHOOK] Buyer salvato come:', order.buyer || 'Guest');
      console.log('✅ [WEBHOOK] Guest email:', order.guestEmail);
      console.log('✅ [WEBHOOK] isPaid:', order.isPaid);
      console.log('✅ [WEBHOOK] Total Price:', order.totalPrice);

      // AGGIORNA STOCK PRODOTTI
      console.log('📦 [WEBHOOK] Aggiornamento stock prodotti...');
      for (const item of orderItems) {
        try {
          const product = await Product.findById(item.product);
          if (!product) {
            console.error(`⚠️ [WEBHOOK] Prodotto ${item.product} non trovato per aggiornare stock`);
            continue;
          }

          // Se il prodotto ha varianti, aggiorna lo stock della variante specifica
          if (item.selectedVariant && product.variants && product.variants.length > 0) {
            const variantIndex = product.variants.findIndex(v => v._id.toString() === item.selectedVariant);
            if (variantIndex !== -1) {
              const oldStock = product.variants[variantIndex].stock;
              product.variants[variantIndex].stock = Math.max(0, oldStock - item.quantity);
              await product.save();
              console.log(`✅ [WEBHOOK] Stock variante aggiornato: ${product.name} - Variante ${variantIndex} da ${oldStock} a ${product.variants[variantIndex].stock}`);
            } else {
              console.error(`⚠️ [WEBHOOK] Variante ${item.selectedVariant} non trovata nel prodotto ${product.name}`);
            }
          } else {
            // Prodotto senza varianti, aggiorna lo stock principale
            const oldStock = product.stock;
            product.stock = Math.max(0, oldStock - item.quantity);
            await product.save();
            console.log(`✅ [WEBHOOK] Stock aggiornato: ${product.name} da ${oldStock} a ${product.stock}`);
          }
        } catch (stockError) {
          console.error(`❌ [WEBHOOK] Errore aggiornamento stock per prodotto ${item.product}:`, stockError);
        }
      }

      // Invia email di conferma acquisto
      try {
        let recipientEmail, recipientName;
        
        if (isGuestOrder) {
          // Ordine guest: usa email e nome dal guest order
          recipientEmail = order.guestEmail;
          recipientName = order.guestName;
        } else {
          // Ordine registrato: recupera email e nome dal profilo
          const user = await User.findById(userId);
          if (user) {
            recipientEmail = user.email;
            recipientName = user.name;
          }
        }

        if (recipientEmail) {
          // Prepara lista prodotti
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
        }
      } catch (emailError) {
        console.error('Errore invio email conferma acquisto:', emailError);
      }

      // Recensione automatica per ogni prodotto acquistato
      for (const item of order.items) {
        // Controlla se esiste già una review di questo utente per questo prodotto
        const alreadyReviewed = await Review.findOne({
          product: item.product,
          user: userId
        });

        if (!alreadyReviewed) {
          // Recupera nome utente per la review
          const user = await User.findById(userId);
          await Review.create({
            product: item.product,
            user: userId,
            name: user ? user.name : 'Acquirente',
            rating: 5,
            comment: 'Recensione automatica!',
            isVerified: true
          });

          // Aggiorna rating medio e numero recensioni del prodotto
          const reviews = await Review.find({ product: item.product });
          const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
          await Product.findByIdAndUpdate(item.product, {
            rating: avgRating,
            numReviews: reviews.length
          });
        }
      }

    } catch (error) {
      console.error('❌ Errore creazione ordine:', error);
      return res.status(500).send('Errore creazione ordine');
    }
  }

  // Rispondi a Stripe che il webhook è stato ricevuto
  res.json({ received: true });
};