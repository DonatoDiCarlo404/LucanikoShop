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
        const { cartItems, guestEmail, appliedCoupon, discountAmount } = req.body;

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: 'Il carrello è vuoto' });
        }

        console.log('🛒 [CHECKOUT] Ricevuti', cartItems.length, 'prodotti');
        console.log('🎫 [CHECKOUT] appliedCoupon ricevuto:', JSON.stringify(appliedCoupon));
        console.log('🎫 [CHECKOUT] discountAmount ricevuto:', discountAmount, 'tipo:', typeof discountAmount);

        // Calcola totale carrello
        const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountedTotal = cartTotal - (discountAmount || 0);

        console.log('💰 [CHECKOUT] Totale: €' + cartTotal.toFixed(2), '| Dopo sconto: €' + discountedTotal.toFixed(2));

        // Raggruppa items per venditore
        const itemsByVendor = {};

        for (const item of cartItems) {
            const product = await Product.findById(item._id).populate('seller', 'shopSettings name');
            
            if (!product) {
                return res.status(404).json({ message: `Prodotto non trovato: ${item._id}` });
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
                    weight: product.weight || 0,
                    price: product.price
                },
                quantity: item.quantity,
                price: item.price
            });
        }

        // Calcola spedizione usando il totale SCONTATO per i range
        const vendorShippingArray = Object.values(itemsByVendor);
        const shippingResult = calculateMultiVendorShipping(
            vendorShippingArray,
            { country: 'Italia', state: '' },
            discountedTotal // Passa il totale scontato
        );

        console.log('📦 [CHECKOUT] Costo spedizione calcolato: €' + shippingResult.totalShipping.toFixed(2));

        // Converti i prodotti del carrello in formato Stripe
        const lineItems = cartItems.map(item => {
            const price = item.price || 0;
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
                    unit_amount: Math.round(price * 100),
                },
                quantity: item.quantity,
            };
        });

        // Aggiungi spedizione come line item
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

        // Determina l'email del cliente
        const customerEmail = req.user ? req.user.email : guestEmail;

        if (!customerEmail) {
            return res.status(400).json({ message: 'Email cliente richiesta per il checkout' });
        }

        // Prepara le opzioni per la sessione Stripe
        const sessionOptions = {
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
            billing_address_collection: 'auto',
            metadata: {
                userId: req.user ? req.user._id.toString() : 'guest',
                guestEmail: guestEmail || '',
                shippingCost: shippingResult.totalShipping.toString(),
                appliedCouponCode: appliedCoupon?.couponCode || '',
                appliedCouponId: appliedCoupon?._id?.toString() || '',
                discountAmount: discountAmount ? discountAmount.toString() : '0',
                cartItems: JSON.stringify(cartItems.map(item => ({
                    productId: item._id,
                    sellerId: item.seller._id || item.seller,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                }))),
            },
        };

        // Per utenti registrati, usa customer_email per pre-compilare
        sessionOptions.customer_email = customerEmail;

        // Se c'è uno sconto, crea un Coupon Stripe al volo e applicalo
        if (discountAmount && discountAmount > 0) {
            console.log('🎫 [CHECKOUT] Condizione sconto verificata - discountAmount:', discountAmount);
            console.log('🎫 [CHECKOUT] Creazione coupon Stripe per:', appliedCoupon?.couponCode, '- Sconto: €' + discountAmount.toFixed(2));
            
            try {
                // Crea un coupon Stripe temporaneo
                const stripeCoupon = await stripe.coupons.create({
                    amount_off: Math.round(discountAmount * 100),
                    currency: 'eur',
                    duration: 'once',
                    name: appliedCoupon?.couponCode || 'Sconto',
                });

                console.log('✅ [CHECKOUT] Coupon Stripe creato:', stripeCoupon.id, '| amount_off:', stripeCoupon.amount_off);

                // Applica il coupon alla sessione
                sessionOptions.discounts = [{
                    coupon: stripeCoupon.id
                }];

                console.log('✅ [CHECKOUT] Discount applicato a sessionOptions');
            } catch (couponError) {
                console.error('⚠️ [CHECKOUT] Errore creazione coupon Stripe:', couponError.message);
                console.error('⚠️ [CHECKOUT] Stack:', couponError.stack);
                // Fallback: usa line item negativo
                lineItems.push({
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: appliedCoupon?.couponCode ? `Sconto (${appliedCoupon.couponCode})` : 'Sconto',
                            description: 'Sconto applicato al carrello',
                        },
                        unit_amount: -Math.round(discountAmount * 100),
                    },
                    quantity: 1,
                });
                console.log('⚠️ [CHECKOUT] Fallback: aggiunto line item negativo');
            }
        } else {
            console.log('⚠️ [CHECKOUT] Nessuno sconto da applicare - discountAmount:', discountAmount);
        }

        // Crea la sessione Stripe
        console.log('🔧 [CHECKOUT] Creazione sessione con discounts:', sessionOptions.discounts);
        const session = await stripe.checkout.sessions.create(sessionOptions);

        console.log('✅ [CHECKOUT] Sessione Stripe creata con successo - ID:', session.id);
        console.log('✅ [CHECKOUT] Sessione amount_total:', session.amount_total, '(centesimi)');

        res.status(200).json({
            sessionId: session.id,
            url: session.url,
        });
    } catch (error) {
        console.error('❌ [CHECKOUT] Errore:', error.message);
        res.status(500).json({ message: error.message });
    }
};