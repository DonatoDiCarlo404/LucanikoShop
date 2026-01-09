import Stripe from "stripe";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { calculateMultiVendorShipping } from "../utils/shippingCalculator.js";

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

        // Raggruppa items per venditore e calcola spedizione
        const itemsByVendor = {};

        for (const item of cartItems) {
            const product = await Product.findById(item._id).populate('seller', 'shopSettings name');
            
            if (!product) {
                return res.status(404).json({ 
                    message: `Prodotto non trovato: ${item._id}` 
                });
            }

            const vendorId = product.seller._id.toString();

            if (!itemsByVendor[vendorId]) {
                itemsByVendor[vendorId] = {
                    vendorId,
                    vendorName: product.seller.name,
                    items: [],
                    vendorShippingSettings: product.seller.shopSettings?.shipping || null
                };
            }

            itemsByVendor[vendorId].items.push({
                product: {
                    _id: product._id,
                    name: product.name,
                    weight: product.weight || 0
                },
                quantity: item.quantity,
                price: item.price
            });
        }

        // Calcola costo spedizione totale
        const vendorShippingArray = Object.values(itemsByVendor);
        const shippingResult = calculateMultiVendorShipping(
            vendorShippingArray,
            { country: 'Italia', state: '' } // Default, verrà aggiornato con l'indirizzo reale durante il checkout
        );

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
                    metadata: {
                        productId: item._id,
                        sellerId: item.seller._id || item.seller,
                    },
                },
                unit_amount: Math.round(item.price * 100), // Converti in centesimi
            },
            quantity: item.quantity,
        }));

        // Aggiungi costo spedizione come line item se > 0
        if (shippingResult.totalShipping > 0) {
            lineItems.push({
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'Spedizione',
                        description: 'Costo di spedizione per il tuo ordine',
                    },
                    unit_amount: Math.round(shippingResult.totalShipping * 100),
                },
                quantity: 1,
            });
        }

        // Crea la sessione di Stripe checkout
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
            customer_email: req.user.email,
            billing_address_collection: 'required', // Richiedi indirizzo di fatturazione
            shipping_address_collection: {
                allowed_countries: ['IT', 'FR', 'DE', 'ES', 'US'], // Paesi supportati per spedizione
            },
            metadata: {
                userId: req.user._id.toString(),
                shippingCost: shippingResult.totalShipping.toString(),
                cartItems: JSON.stringify(cartItems.map(item => ({
                    productId: item._id,
                    sellerId: item.seller._id || item.seller,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                }))),
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