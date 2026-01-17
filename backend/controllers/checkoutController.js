import Stripe from "stripe";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { calculateMultiVendorShipping } from "../utils/shippingCalculator.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Crea sessione Stripe per il checkout
// @route   POST /api/checkout/create-session
// @access  Public (supporta guest checkout)
export const createCheckoutSession = async (req, res) => {
    try {
        console.log('💳 [Backend] createCheckoutSession - Inizio');
        console.log('💳 [Backend] req.user:', req.user ? { id: req.user._id, email: req.user.email } : 'Non presente');
        console.log('💳 [Backend] req.body:', JSON.stringify(req.body, null, 2));
        
        const { cartItems, guestEmail } = req.body;

        if (!cartItems || cartItems.length === 0) {
            console.log('⚠️ [Backend] Carrello vuoto');
            return res.status(400).json({ message: 'Il carrello è vuoto' });
        }

        console.log('💳 [Backend] cartItems ricevuti:', cartItems.map(item => ({
            id: item._id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            seller: item.seller
        })));

        // Raggruppa items per venditore e calcola spedizione
        const itemsByVendor = {};

        for (const item of cartItems) {
            console.log(`💳 [Backend] Processando item: ${item._id}`);
            const product = await Product.findById(item._id).populate('seller', 'shopSettings name');
            
            if (!product) {
                console.log(`❌ [Backend] Prodotto non trovato: ${item._id}`);
                return res.status(404).json({ 
                    message: `Prodotto non trovato: ${item._id}` 
                });
            }

            console.log(`💳 [Backend] Prodotto trovato: ${product.name}, Venditore: ${product.seller.name}`);

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

        console.log('💳 [Backend] Items raggruppati per venditore:', Object.keys(itemsByVendor).length);

        // Calcola costo spedizione totale
        const vendorShippingArray = Object.values(itemsByVendor);
        const shippingResult = calculateMultiVendorShipping(
            vendorShippingArray,
            { country: 'Italia', state: '' } // Default, verrà aggiornato con l'indirizzo reale durante il checkout
        );

        console.log('💳 [Backend] Costo spedizione:', shippingResult.totalShipping);

        // Converti i prodotti del carrello in formato Stripe
        const lineItems = cartItems.map(item => {
            const price = item.price || 0;
            console.log(`💳 [Backend] Line item - ${item.name}: €${price} x ${item.quantity}`);
            
            // Estrai il nome della categoria se è un oggetto
            const categoryDescription = typeof item.category === 'string' 
                ? item.category 
                : item.category?.name || 'Prodotto';
            
            return {
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: item.name,
                        description: categoryDescription,
                        images: item.images && item.images.length > 0
                            ? [item.images[item.images.length - 1].url]
                            : [],
                        metadata: {
                            productId: item._id,
                            sellerId: item.seller._id || item.seller,
                        },
                    },
                    unit_amount: Math.round(price * 100), // Converti in centesimi
                },
                quantity: item.quantity,
            };
        });

        // Aggiungi costo spedizione come line item se > 0
        if (shippingResult.totalShipping > 0) {
            console.log(`💳 [Backend] Aggiungendo spedizione: €${shippingResult.totalShipping}`);
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

        // Determina l'email del cliente
        const customerEmail = req.user ? req.user.email : guestEmail;
        console.log('💳 [Backend] Email cliente per Stripe:', customerEmail);

        if (!customerEmail) {
            console.log('❌ [Backend] Email cliente mancante');
            return res.status(400).json({ message: 'Email cliente richiesta per il checkout' });
        }

        console.log('💳 [Backend] Creazione sessione Stripe...');
        
        // Crea la sessione di Stripe checkout
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
            customer_email: customerEmail,
            billing_address_collection: 'required', // Richiedi indirizzo di fatturazione
            shipping_address_collection: {
                allowed_countries: ['IT', 'FR', 'DE', 'ES', 'US'], // Paesi supportati per spedizione
            },
            metadata: {
                userId: req.user ? req.user._id.toString() : 'guest',
                guestEmail: guestEmail || '',
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

        console.log('✅ [Backend] Sessione Stripe creata:', session.id);

        res.status(200).json({
            sessionId: session.id,
            url: session.url,
        });
    } catch (error) {
        console.error('❌ [Backend] Errore nella creazione sessione Stripe:', error);
        console.error('❌ [Backend] Stack trace:', error.stack);
        res.status(500).json({ message: error.message });
    }
};