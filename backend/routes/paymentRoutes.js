import express from 'express';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Crea PaymentIntent per abbonamento venditore
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, email, subscriptionType, metadata } = req.body;
    
    if (!amount || !email || !subscriptionType) {
      return res.status(400).json({ error: 'Parametri mancanti' });
    }

    // Crea il PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe usa centesimi
      currency: 'eur',
      description: `Abbonamento ${subscriptionType} - Lucaniko Shop`,
      receipt_email: email,
      metadata: {
        subscriptionType,
        userEmail: email,
        ...metadata
      },
      // Abilita 3D Secure per sicurezza
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
    });
    
    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Errore creazione PaymentIntent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verifica stato pagamento
router.post('/verify-payment', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'PaymentIntent ID mancante' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    res.json({ 
      status: paymentIntent.status,
      paid: paymentIntent.status === 'succeeded',
      amount: paymentIntent.amount / 100,
      paymentMethod: paymentIntent.payment_method
    });
  } catch (error) {
    console.error('Errore verifica pagamento:', error);
    res.status(500).json({ error: error.message });
  }
});

// Recupera dati payment method
router.post('/get-payment-method', async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    
    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Payment Method ID mancante' });
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    // Estrai solo i dati non sensibili della carta
    const cardDetails = paymentMethod.card ? {
      brand: paymentMethod.card.brand,
      last4: paymentMethod.card.last4,
      exp_month: paymentMethod.card.exp_month,
      exp_year: paymentMethod.card.exp_year
    } : null;
    
    res.json({ cardDetails });
  } catch (error) {
    console.error('Errore recupero payment method:', error);
    res.status(500).json({ error: error.message });
  }
});

// Crea un rimborso (solo admin)
router.post('/refund', async (req, res) => {
  try {
    const { paymentIntentId, reason } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'PaymentIntent ID mancante' });
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: reason || 'requested_by_customer'
    });
    
    res.json({ 
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount / 100
    });
  } catch (error) {
    console.error('Errore rimborso:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
