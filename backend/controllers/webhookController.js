import Stripe from 'stripe';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { sendPurchaseConfirmationEmail } from '../utils/emailTemplates.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Gestisce il webhook di Stripe
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verifica che il webhook provenga davvero da Stripe
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('⚠️ Errore verifica webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gestisci l'evento checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      // Recupera i dettagli completi della sessione con line_items
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items'],
      });

      // Estrai userId dai metadata
      const userId = session.metadata.userId;

      if (!userId) {
        console.error('❌ userId mancante nei metadata');
        return res.status(400).send('userId mancante');
      }

      // Recupera i dati del carrello dai metadata
      const cartItemsData = JSON.parse(session.metadata.cartItems)

      // Crea gli orderItems usando i dati completi dai metadata
      const orderItems = cartItemsData.map((item) => ({
        product: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        seller: item.sellerId,
      }));

      // Ottieni indirizzo di spedizione (se presente)
      const shippingAddress = session.shipping_details?.address || session.customer_details?.address;

      // Crea l'ordine nel database
      const order = await Order.create({
        buyer: userId,
        items: orderItems,
        shippingAddress: {
          street: shippingAddress?.line1 || 'N/A',
          city: shippingAddress?.city || 'N/A',
          state: shippingAddress?.state || 'N/A',
          zipCode: shippingAddress?.postal_code || 'N/A',
          country: shippingAddress?.country || 'IT',
          phone: session.customer_details?.phone || 'N/A',
        },
        paymentMethod: 'stripe',
        paymentResult: {
          id: session.payment_intent,
          status: session.payment_status,
          email_address: session.customer_details?.email,
        },
        itemsPrice: session.amount_subtotal / 100,
        shippingPrice: 0,
        taxPrice: 0,
        totalPrice: session.amount_total / 100,
        status: 'processing',
        isPaid: true,
        paidAt: new Date(),
        stripeSessionId: session.id,
      });

      console.log('✅ Ordine creato:', order._id);

      // Invia email di conferma acquisto
      try {
        const user = await User.findById(userId);
        if (user) {
          await sendPurchaseConfirmationEmail(user.email, user.name, {
            orderId: order._id,
            total: order.totalPrice
          });
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
            comment: 'Recensione automatica: nessun feedback lasciato dall’acquirente.',
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