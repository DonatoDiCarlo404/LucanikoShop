import Stripe from "stripe";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { calculateMultiVendorShipping } from "../utils/shippingCalculator.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Crea sessione Stripe per il checkout
// @route   POST /api/checkout/create-session
// @access  Public (supporta guest checkout)
export const createCheckoutSession = async (req, res) => {
    console.log('🚀 [CHECKOUT] ========== INIZIO SESSIONE ==========');
    console.log('🚀 [CHECKOUT] req.body ricevuto:', JSON.stringify(req.body, null, 2));
    console.log('🚀 [CHECKOUT] req.user:', req.user ? req.user._id : 'guest');
    
    try {
        const { cartItems, guestEmail, appliedCoupon, discountAmount, deliveryType = 'shipping' } = req.body;

        console.log('🚀 [CHECKOUT] cartItems estratto:', Array.isArray(cartItems) ? cartItems.length : 'non è array');
        console.log('🚀 [CHECKOUT] guestEmail:', guestEmail);

        if (!cartItems || cartItems.length === 0) {
            console.log('❌ [CHECKOUT] Carrello vuoto');
            return res.status(400).json({ message: 'Il carrello è vuoto' });
        }

        console.log('🛒 [CHECKOUT] Ricevuti', cartItems.length, 'prodotti');
        console.log('🎫 [CHECKOUT] appliedCoupon ricevuto:', JSON.stringify(appliedCoupon));
        console.log('🎫 [CHECKOUT] discountAmount ricevuto:', discountAmount, 'tipo:', typeof discountAmount);
        console.log('📦 [CHECKOUT] deliveryType:', deliveryType);

        // Calcola totale carrello
        console.log('💰 [CHECKOUT] Calcolo totale carrello...');
        const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountedTotal = cartTotal - (discountAmount || 0);

        console.log('💰 [CHECKOUT] Totale: €' + cartTotal.toFixed(2), '| Dopo sconto: €' + discountedTotal.toFixed(2));

        // Raggruppa items per venditore
        console.log('🔍 [CHECKOUT] Inizio loop prodotti...');
        const itemsByVendor = {};
        // SECURITY FIX: Mappa prodotti con sellerId dal database (non dal frontend)
        const productsWithSeller = {};

        for (let i = 0; i < cartItems.length; i++) {
            const item = cartItems[i];
            console.log(`🔍 [CHECKOUT] Prodotto ${i + 1}/${cartItems.length}: ${item._id}`);
            
            const product = await Product.findById(item._id).populate('seller', 'shopSettings name businessName storeAddress businessPhone businessEmail paymentMethods');
            
            console.log(`🔍 [CHECKOUT] Prodotto trovato: ${product ? product.name : 'NULL'}`);
            
            if (!product) {
                console.log(`❌ [CHECKOUT] Prodotto non trovato in DB: ${item._id}`);
                return res.status(404).json({ message: `Prodotto non trovato: ${item._id}` });
            }

            // Controllo sicurezza: verifica che seller sia popolato
            console.log(`🔍 [CHECKOUT] Verifica seller per ${product.name}...`);
            console.log(`🔍 [CHECKOUT] product.seller:`, product.seller ? 'EXISTS' : 'NULL');
            
            if (!product.seller || !product.seller._id) {
                console.error('❌ [CHECKOUT] Prodotto senza seller valido:', {
                    productId: item._id,
                    productName: product.name,
                    seller: product.seller
                });
                return res.status(500).json({ 
                    message: `Il prodotto "${product.name}" non ha un venditore valido associato. Contatta l'assistenza.` 
                });
            }

            const vendorId = product.seller._id.toString();

            // SECURITY FIX: Salva sellerId corretto dal database
            productsWithSeller[item._id] = vendorId;

            if (!itemsByVendor[vendorId]) {
                itemsByVendor[vendorId] = {
                    vendorId,
                    vendorName: product.seller.name,
                    businessName: product.seller.businessName,
                    items: [],
                    vendorShippingSettings: product.seller.shopSettings?.shipping || null,
                    storeAddress: product.seller.storeAddress,
                    businessPhone: product.seller.businessPhone,
                    businessEmail: product.seller.businessEmail
                };
            }

            // Assicurati che il peso sia sempre un numero
            const productWeight = typeof product.weight === 'string' 
                ? parseFloat(product.weight.replace(',', '.')) || 0
                : (typeof product.weight === 'number' ? product.weight : 0);

            itemsByVendor[vendorId].items.push({
                product: {
                    _id: product._id,
                    name: product.name,
                    weight: productWeight,
                    price: product.price
                },
                quantity: item.quantity,
                price: item.price
            });
        }

        // Log carrello multivendor
        const vendorCount = Object.keys(itemsByVendor).length;
        console.log(`🏪 [CHECKOUT] Carrello multivendor: ${vendorCount} venditore/i`);

        // Verifica per ritiro in negozio: solo carrelli single-vendor
        if (deliveryType === 'pickup' && vendorCount > 1) {
            return res.status(400).json({ 
                message: 'Il ritiro in negozio è disponibile solo per ordini da un singolo venditore. Rimuovi i prodotti di altri venditori o scegli la spedizione.' 
            });
        }

        let shippingResult = { totalShipping: 0 };
        let pickupInfo = null;

        if (deliveryType === 'pickup') {
            // Recupera info negozio del venditore per il ritiro
            const vendor = Object.values(itemsByVendor)[0];
            if (!vendor.storeAddress || !vendor.storeAddress.street) {
                return res.status(400).json({ 
                    message: 'Questo venditore non ha configurato un indirizzo per il ritiro in negozio. Scegli la spedizione a domicilio.' 
                });
            }
            
            pickupInfo = {
                businessName: vendor.businessName || vendor.vendorName,
                street: vendor.storeAddress.street,
                city: vendor.storeAddress.city,
                state: vendor.storeAddress.state,
                zipCode: vendor.storeAddress.zipCode,
                country: vendor.storeAddress.country,
                phone: vendor.businessPhone || '',
                email: vendor.businessEmail || '',
            };
            
            console.log('🏪 [CHECKOUT] Ritiro in negozio - Indirizzo:', pickupInfo.businessName);
        } else {
            // Calcola spedizione usando il totale SCONTATO per i range
            const vendorShippingArray = Object.values(itemsByVendor);
            shippingResult = calculateMultiVendorShipping(
                vendorShippingArray,
                { country: 'Italia', state: '' },
                discountedTotal // Passa il totale scontato
            );

            console.log('📦 [CHECKOUT] Costo spedizione calcolato: €' + shippingResult.totalShipping.toFixed(2));
        }

        console.log('💳 [CHECKOUT] Tutti i pagamenti vanno a Lucaniko Shop');

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
                            sellerId: productsWithSeller[item._id], // SECURITY FIX: usa sellerId dal database
                        },
                    },
                    unit_amount: Math.round(price * 100),
                },
                quantity: item.quantity,
            };
        });

        // Aggiungi spedizione come line item SOLO se spedizione a domicilio
        if (deliveryType === 'shipping' && shippingResult.totalShipping > 0) {
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
        } else if (deliveryType === 'pickup') {
            console.log('🏪 [CHECKOUT] Ritiro in negozio - Nessun costo di spedizione');
        }

        // Determina l'email del cliente
        const customerEmail = req.user ? req.user.email : guestEmail;

        if (!customerEmail) {
            return res.status(400).json({ message: 'Email cliente richiesta per il checkout' });
        }

        // Prepara le opzioni per la sessione Stripe
        console.log('📝 [CHECKOUT] Preparazione metadata...');
        console.log('👤 [CHECKOUT] req.user:', req.user ? 'Present' : 'Missing');
        if (req.user) {
            console.log('👤 [CHECKOUT] req.user._id:', req.user._id);
            console.log('👤 [CHECKOUT] req.user._id.toString():', req.user._id.toString());
        }
        
        const sessionOptions = {
            payment_method_types: ['card'], // Solo card - altri metodi (klarna, paypal) devono essere attivati in Stripe Dashboard
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
            billing_address_collection: 'auto',
            metadata: {
                userId: req.user ? req.user._id.toString() : 'guest',
                guestEmail: guestEmail || '',
                deliveryType: deliveryType,
                shippingCost: shippingResult.totalShipping.toString(),
                // Salva breakdown shipping per venditore (formato compatto)
                vendorShippingCosts: JSON.stringify(
                    Object.entries(shippingResult.vendorShippingCosts || {}).reduce((acc, [vendorId, data]) => {
                        acc[vendorId] = data.shippingCost || 0;
                        return acc;
                    }, {})
                ),
                appliedCouponCode: appliedCoupon?.couponCode || '',
                appliedCouponId: appliedCoupon?._id?.toString() || '',
                discountAmount: discountAmount ? discountAmount.toString() : '0',
                // SECURITY FIX: Usa sellerId dal database, non dal frontend
                cartItems: JSON.stringify(cartItems.map(item => ({
                    productId: item._id,
                    sellerId: productsWithSeller[item._id], // <-- Dal database!
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                }))),
            },
        };

        // Aggiungi shipping_address_collection SOLO per spedizione
        if (deliveryType === 'shipping') {
            sessionOptions.shipping_address_collection = {
                allowed_countries: ['IT', 'FR', 'DE', 'ES', 'AT', 'BE', 'NL', 'PT', 'GR', 'IE', 'LU', 'MT', 'CY', 'SI', 'SK', 'EE', 'LV', 'LT', 'FI', 'SE', 'DK', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR'],
            };
        } else if (deliveryType === 'pickup') {
            // Per il ritiro, salva info negozio nei metadata
            sessionOptions.metadata.pickupInfo = JSON.stringify(pickupInfo);
        }
        
        console.log('📦 [CHECKOUT] Metadata preparati:', {
            userId: sessionOptions.metadata.userId,
            isGuest: sessionOptions.metadata.userId === 'guest',
            deliveryType: deliveryType,
            itemsCount: cartItems.length
        });

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
        console.error('❌ [CHECKOUT] ========== ERRORE CRITICO ==========');
        console.error('❌ [CHECKOUT] Message:', error.message);
        console.error('❌ [CHECKOUT] Stack:', error.stack);
        console.error('❌ [CHECKOUT] Name:', error.name);
        console.error('❌ [CHECKOUT] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.error('❌ [CHECKOUT] =====================================');
        
        res.status(500).json({ 
            message: error.message || 'Errore durante il checkout',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};