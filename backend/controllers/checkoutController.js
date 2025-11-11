import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Crea sessione Stripe per il checkout
// @route   POST /api/checkout/create-session
// @access  Private
export const createCheckoutSession = async (req, res) => {
    try {
        const { cartItems } = req.body;

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: 'Il carrello è vuoto' });
        }

        // Converti i prodotti del carrello in formato Stripe
        const lineItems = cartItems.map(item => ({
            price_data: {
                currency: 'eur',
                product_data: {
                    name: item.name,
                    description: item.category,
                    images: item.images && item.images.length > 0
                        ? [item.images[item.images.length - 1].url]
                        : [],
                },
                unit_amount: Math.round(item.price * 100), // Converti in centesimi
            },
            quantity: item.quantity,
        }));

        // Crea la sessione di Stripe checkout
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
            customer_email: req.user.email,
            metadata: {
                userId: req.user._id.toString(),
            },
        });

        res.status(200).json({
            sessionId: session.id,
            url: session.url,
        });
    } catch (error) {
        console.error('Errore nella creazione sessione Stripe:', error);
        res.status(500).json({ message: error.message });
    }
};