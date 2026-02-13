import Order from "../models/Order.js";
import { Discount } from "../models/index.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Notification from "../models/Notification.js";
import { calculateMultiVendorShipping } from "../utils/shippingCalculator.js";
import { cancelVendorEarnings, createRefundDebt } from "../utils/vendorEarningsCalculator.js";
import { sendRefundNotificationEmail } from "../utils/emailTemplates.js";

// @desc    Filtra ordini per query string (productId, buyer, isPaid)
// @route   GET /api/orders?productId=...&buyer=...&isPaid=true
// @access  Private
export const filterOrders = async (req, res) => {
    try {
        const { productId, buyer, isPaid } = req.query;
        const filter = {};
        if (buyer) filter.buyer = buyer;
        if (isPaid !== undefined) filter.isPaid = isPaid === 'true';
        if (productId) filter['items.product'] = productId;

        // Solo l'utente loggato o admin può vedere i propri ordini
        if (req.user.role !== 'admin' && buyer && buyer !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorizzato' });
        }

        const orders = await Order.find(filter);
        res.status(200).json(orders);
    } catch (error) {
        console.error('Errore nel filtro ordini:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Ottieni tutti gli ordini dell'utente loggato
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = async (req, res) => {
    try {
        console.log('\n📋 [GET_MY_ORDERS] ================ RICHIESTA ORDINI ================ ');
        console.log('👤 [GET_MY_ORDERS] User ID:', req.user._id);
        console.log('👤 [GET_MY_ORDERS] User email:', req.user.email);
        
        const orders = await Order.find({ buyer: req.user._id })
            .populate('items.product', 'name images')
            .sort({ createdAt: -1 }); // Ordini più recenti prima

        console.log('📦 [GET_MY_ORDERS] Ordini trovati:', orders.length);
        if (orders.length > 0) {
            orders.forEach((order, idx) => {
                console.log(`  • Ordine ${idx + 1}:`, {
                    id: order._id,
                    buyer: order.buyer,
                    isPaid: order.isPaid,
                    total: order.totalPrice,
                    items: order.items.length,
                    createdAt: order.createdAt
                });
            });
        } else {
            console.log('⚠️ [GET_MY_ORDERS] Nessun ordine trovato per questo utente');
            console.log('🔍 [GET_MY_ORDERS] Verifica manuale nel database...');
            // Cerca qualsiasi ordine per debug
            const allOrders = await Order.find().limit(5);
            console.log('🔍 [GET_MY_ORDERS] Ultimi 5 ordini nel database:', allOrders.map(o => ({
                id: o._id,
                buyer: o.buyer,
                buyerType: typeof o.buyer,
                isPaid: o.isPaid
            })));
        }

        res.status(200).json(orders);
    } catch (error) {
        console.error('❌ [GET_MY_ORDERS] Errore nel recupero degli ordini:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Ottieni dettagli di un singolo ordine
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('buyer', 'name email')
            .populate('items.product', 'name images category')
            .populate('items.seller', 'name email');

        if (!order) {
            return res.status(404).json({ message: 'Ordine non trovato' });
        }

        // Verifica che l'utente sia il proprietario dell'ordine
        if (order.buyer._id.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Non autorizzato a visualizzare questo ordine' });
        }

        res.status(200).json(order);
    } catch (error) {
        console.error('Errore nel recupero ordine:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Ottieni ordini ricevuti dal venditore
// @route   GET /api/orders/vendor/received
// @access  Private (seller/admin)
export const getVendorOrders = async (req, res) => {
    try {
        // Solo seller e admin possono accedere
        if (req.user.role !== 'seller' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accesso negato' });
        }

        const sellerId = req.user.role === 'admin' ? req.query.sellerId : req.user._id;

        // Trova ordini che contengono prodotti del venditore
        const orders = await Order.find({ 'items.seller': sellerId })
            .populate('buyer', 'name email')
            .populate('items.seller', 'name businessName')
            .populate('items.product', 'name images')
            .sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (error) {
        console.error('Errore nel recupero ordini venditore:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Ottieni statistiche vendite venditore
// @route   GET /api/orders/vendor/stats
// @access  Private (seller/admin)
export const getVendorStats = async (req, res) => {
    try {
        // Solo seller e admin possono accedere
        if (req.user.role !== 'seller' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accesso negato' });
        }

        const sellerId = req.user.role === 'admin' ? req.query.sellerId : req.user._id;

        // Trova ordini che contengono prodotti del venditore
        const orders = await Order.find({ 
            'items.seller': sellerId,
            isPaid: true 
        });

        // Calcola statistiche
        let totalRevenue = 0;
        let totalOrders = orders.length;
        let totalProducts = 0;

        const statusCount = {
            pending: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0
        };

        orders.forEach(order => {
            // Conta solo gli item del venditore
            order.items.forEach(item => {
                if (item.seller.toString() === sellerId.toString()) {
                    totalRevenue += item.price * item.quantity;
                    totalProducts += item.quantity;
                }
            });
            statusCount[order.status]++;
        });

        res.status(200).json({
            totalRevenue,
            totalOrders,
            totalProducts,
            statusCount
        });
    } catch (error) {
        console.error('Errore nel recupero statistiche venditore:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Aggiorna stato ordine (solo per item del venditore)
// @route   PUT /api/orders/:id/status
// @access  Private (seller/admin)
export const updateOrderStatus = async (req, res) => {
    try {
        const { status, trackingNumber, carrier } = req.body;

        // Solo seller e admin possono accedere
        if (req.user.role !== 'seller' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accesso negato' });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Ordine non trovato' });
        }

        // Verifica che il venditore abbia prodotti in questo ordine
        const hasSellerItems = order.items.some(
            item => item.seller.toString() === req.user._id.toString()
        );

        if (!hasSellerItems && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorizzato a modificare questo ordine' });
        }

        // Aggiorna stato
        if (status) {
            order.status = status;
            if (status === 'delivered') {
                order.isDelivered = true;
                order.deliveredAt = Date.now();
            }
        }

        // Aggiungi tracking info se fornito
        if (trackingNumber || carrier) {
            if (!order.trackingInfo) {
                order.trackingInfo = {};
            }
            if (trackingNumber) {
                order.trackingInfo.trackingNumber = trackingNumber;
            }
            if (carrier) {
                order.trackingInfo.carrier = carrier;
            }
            order.trackingInfo.updatedAt = Date.now();
        }

        const updatedOrder = await order.save();

        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error('Errore nell\'aggiornamento ordine:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Applica coupon/sconto a un ordine
// @route   POST /api/orders/:id/apply-discount
// @access  Private
export const applyDiscountToOrder = async (req, res) => {
    try {
        const { couponCode } = req.body;

        if (!couponCode) {
            return res.status(400).json({
                success: false,
                message: 'Il codice coupon è obbligatorio'
            });
        }

        // Trova l'ordine
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Ordine non trovato'
            });
        }

        // Verifica che l'ordine appartenga all'utente
        if (order.buyer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Non autorizzato ad applicare sconti a questo ordine'
            });
        }

        // Verifica che l'ordine non sia già stato pagato
        if (order.isPaid) {
            return res.status(400).json({
                success: false,
                message: 'Non puoi applicare uno sconto a un ordine già pagato'
            });
        }

        // Verifica che non ci sia già uno sconto applicato
        if (order.appliedDiscount) {
            return res.status(400).json({
                success: false,
                message: 'Questo ordine ha già uno sconto applicato'
            });
        }

        // Trova il coupon/sconto
        const discount = await Discount.findOne({
            couponCode: couponCode.toUpperCase(),
            applicationType: 'coupon',
            isActive: true
        });

        if (!discount) {
            return res.status(404).json({
                success: false,
                message: 'Codice coupon non valido'
            });
        }

        // Verifica che il coupon sia valido (date e limiti)
        if (!discount.isValidNow()) {
            return res.status(400).json({
                success: false,
                message: 'Questo coupon è scaduto o non è più valido'
            });
        }

        // Verifica l'importo minimo di acquisto
        if (order.itemsPrice < discount.minPurchaseAmount) {
            return res.status(400).json({
                success: false,
                message: `Importo minimo di acquisto richiesto: €${discount.minPurchaseAmount}`
            });
        }

        // Calcola lo sconto
        let discountAmount = 0;
        if (discount.discountType === 'percentage') {
            discountAmount = (order.itemsPrice * discount.discountValue) / 100;
            
            // Applica il limite massimo di sconto se presente
            if (discount.maxDiscountAmount && discountAmount > discount.maxDiscountAmount) {
                discountAmount = discount.maxDiscountAmount;
            }
        } else if (discount.discountType === 'fixed') {
            discountAmount = discount.discountValue;
            
            // Lo sconto non può essere maggiore dell'importo totale
            if (discountAmount > order.itemsPrice) {
                discountAmount = order.itemsPrice;
            }
        }

        // Arrotonda a 2 decimali
        discountAmount = Math.round(discountAmount * 100) / 100;

        // Applica lo sconto all'ordine
        // NOTA: itemsPrice è già IVA inclusa, taxPrice è solo informativo
        order.appliedDiscount = discount._id;
        order.discountAmount = discountAmount;
        order.totalPrice = order.itemsPrice + order.shippingPrice - discountAmount;

        // Incrementa il contatore di utilizzo del coupon
        discount.usageCount += 1;
        await discount.save();

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Sconto applicato con successo',
            order,
            discountAmount
        });
    } catch (error) {
        console.error('Errore nell\'applicazione dello sconto:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Calcola costo di spedizione per il carrello
// @route   POST /api/orders/calculate-shipping
// @access  Private
export const calculateShippingCost = async (req, res) => {
    try {
        const { items, shippingAddress } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Il carrello è vuoto' 
            });
        }

        // Raggruppa items per venditore e calcola il totale del carrello
        const itemsByVendor = {};
        let totalCartValue = 0;

        for (const item of items) {
            const product = await Product.findById(item.product).populate('seller', 'shopSettings businessName');
            
            if (!product) {
                return res.status(404).json({ 
                    success: false,
                    message: `Prodotto non trovato: ${item.product}` 
                });
            }

            const vendorId = product.seller._id.toString();

            if (!itemsByVendor[vendorId]) {
                itemsByVendor[vendorId] = {
                    vendorId,
                    vendorName: product.seller.businessName || product.seller.name || 'Venditore',
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
                price: item.price || product.price || 0
            });

            // Accumula il totale del carrello usando il prezzo dal carrello
            totalCartValue += (item.price || product.price || 0) * item.quantity;
        }

        // Calcola spedizione per ogni venditore
        const vendorShippingArray = Object.values(itemsByVendor);
        const shippingResult = calculateMultiVendorShipping(
            vendorShippingArray,
            shippingAddress || { country: 'Italia', state: '' },
            totalCartValue
        );

        // Aggiungi info sui prodotti non spedibili nella nazione/regione selezionata
        const selectedCountry = shippingAddress?.country || 'Italia';
        const selectedRegion = shippingAddress?.state || '';
        const unshippableVendors = [];
        
        for (const vendorData of vendorShippingArray) {
            const shippingSettings = vendorData.vendorShippingSettings;
            let canShip = false;

            if (shippingSettings?.shippingRates && shippingSettings.shippingRates.length > 0) {
                // Verifica se esiste una tariffa per la nazione selezionata
                canShip = shippingSettings.shippingRates.some(rate => {
                    // Controllo paese
                    const countryMatch = rate.country === selectedCountry || !rate.country;
                    if (!countryMatch) return false;

                    // Se Italia, controlla anche la regione
                    if (selectedCountry === 'Italia' && selectedRegion) {
                        const isSardegnaSicilia = selectedRegion === 'Sardegna' || selectedRegion === 'Sicilia';
                        
                        // Se la tariffa è per isole escluse e la regione è Sardegna/Sicilia, non può spedire
                        if (rate.italiaIsoleEscluse && isSardegnaSicilia) {
                            return false;
                        }
                        
                        // Se la tariffa è solo per Sardegna/Sicilia e la regione non è una di queste, non può spedire
                        if (rate.italiaSardegnaSicilia && !isSardegnaSicilia) {
                            return false;
                        }
                    }

                    return true;
                });
            } else {
                // Nessuna tariffa avanzata = spedisce solo in Italia con tutte le regioni
                canShip = selectedCountry === 'Italia';
            }

            if (!canShip) {
                unshippableVendors.push({
                    vendorId: vendorData.vendorId,
                    vendorName: vendorData.vendorName,
                    productIds: vendorData.items.map(item => item.product._id.toString())
                });
            }
        }

        res.status(200).json({
            success: true,
            ...shippingResult,
            unshippableVendors,
            selectedCountry
        });
    } catch (error) {
        console.error('Errore nel calcolo spedizione:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Rimborsa un ordine e cancella earnings venditori (entro 14 giorni)
// @route   POST /api/orders/:id/refund
// @access  Private/Admin
export const refundOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        console.log('\n💸 [REFUND_ORDER] ============ RICHIESTA RIMBORSO ============');
        console.log('💸 [REFUND_ORDER] Ordine ID:', id);
        console.log('💸 [REFUND_ORDER] Admin:', req.user.email);
        console.log('💸 [REFUND_ORDER] Motivo:', reason || 'Non specificato');

        // Verifica permessi admin
        if (req.user.role !== 'admin') {
            console.log('❌ [REFUND_ORDER] Accesso negato: utente non admin');
            return res.status(403).json({ 
                message: 'Solo gli amministratori possono effettuare rimborsi' 
            });
        }

        // Trova l'ordine
        const order = await Order.findById(id);
        
        if (!order) {
            console.log('❌ [REFUND_ORDER] Ordine non trovato');
            return res.status(404).json({ message: 'Ordine non trovato' });
        }

        // Verifica se ordine già rimborsato
        if (order.status === 'refunded' || order.isRefunded) {
            console.log('⚠️  [REFUND_ORDER] Ordine già rimborsato');
            return res.status(400).json({ 
                message: 'Questo ordine è già stato rimborsato' 
            });
        }

        console.log('📦 [REFUND_ORDER] Ordine trovato:');
        console.log('   - Status:', order.status);
        console.log('   - Totale:', order.totalPrice, '€');
        console.log('   - isPaid:', order.isPaid);

        // Gestione earnings venditori
        let earningsCancellation = null;
        let debtCreation = null;
        
        try {
            // Prova prima a cancellare earnings pending (rimborso entro 14 giorni)
            earningsCancellation = await cancelVendorEarnings(id);
            console.log('✅ [REFUND_ORDER] Earnings cancellati:', earningsCancellation.success);
            
            // Se non ci sono pending da cancellare, crea debiti (rimborso post-pagamento)
            if (!earningsCancellation.success) {
                console.log('⚠️  [REFUND_ORDER] Nessun pending trovato, creo debiti...');
                debtCreation = await createRefundDebt(id);
                console.log('💳 [REFUND_ORDER] Debiti creati:', debtCreation.success);
            }
        } catch (err) {
            console.error('⚠️  [REFUND_ORDER] Errore gestione earnings:', err.message);
            // Continua comunque con il rimborso, ma logga l'errore
        }

        // Aggiorna stato ordine
        order.status = 'refunded';
        order.isRefunded = true;
        order.refundedAt = new Date();
        order.refundReason = reason || 'Rimborso richiesto da amministratore';
        
        await order.save();

        console.log('✅ [REFUND_ORDER] Ordine aggiornato a "refunded"');

        // Notifica venditori coinvolti
        try {
            console.log('📧 [REFUND_ORDER] Invio notifiche ai venditori...');
            
            // Recupera tutti i venditori coinvolti nell'ordine
            const vendorIds = [...new Set(order.items.map(item => item.seller.toString()))];
            const vendors = await User.find({ _id: { $in: vendorIds }, role: 'seller' });

            console.log(`📧 [REFUND_ORDER] Trovati ${vendors.length} venditori da notificare`);

            const isPostPayment = debtCreation?.success || false;
            const notificationPromises = [];

            for (const vendor of vendors) {
                console.log(`📧 [REFUND_ORDER] Notifica a: ${vendor.companyName} (${vendor.email})`);

                // Calcola importo venditore specifico
                const vendorItems = order.items.filter(item => item.seller.toString() === vendor._id.toString());
                const vendorAmount = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

                // Email notifica
                const emailPromise = sendRefundNotificationEmail(
                    vendor.email,
                    vendor.companyName || vendor.name,
                    order.orderNumber,
                    vendorAmount,
                    order.refundReason,
                    isPostPayment,
                    isPostPayment ? { debtAmount: vendorAmount } : null
                ).catch(err => {
                    console.error(`❌ [REFUND_ORDER] Errore invio email a ${vendor.email}:`, err.message);
                });

                // Notifica in-app
                const notificationData = {
                    userId: vendor._id,
                    type: 'order_status_change',
                    message: isPostPayment 
                        ? `⚠️ Ordine #${order.orderNumber} rimborsato. Debito di €${vendorAmount.toFixed(2)} detratto dal prossimo pagamento.`
                        : `🔄 Ordine #${order.orderNumber} rimborsato. Earnings di €${vendorAmount.toFixed(2)} cancellati.`,
                    data: {
                        orderId: order._id,
                        orderNumber: order.orderNumber,
                        refundAmount: vendorAmount,
                        refundReason: order.refundReason,
                        isPostPayment,
                        refundedAt: order.refundedAt
                    }
                };

                const notificationPromise = Notification.create(notificationData).catch(err => {
                    console.error(`❌ [REFUND_ORDER] Errore creazione notifica per ${vendor._id}:`, err.message);
                });

                notificationPromises.push(emailPromise, notificationPromise);
            }

            // Attendi tutte le notifiche (email + in-app)
            await Promise.all(notificationPromises);
            console.log('✅ [REFUND_ORDER] Notifiche inviate con successo');

        } catch (notificationError) {
            console.error('⚠️  [REFUND_ORDER] Errore invio notifiche:', notificationError);
            // Non bloccare il rimborso se le notifiche falliscono
        }

        console.log('✅ [REFUND_ORDER] ============ RIMBORSO COMPLETATO ============\n');

        res.status(200).json({
            success: true,
            message: 'Ordine rimborsato con successo',
            order: {
                _id: order._id,
                status: order.status,
                isRefunded: order.isRefunded,
                refundedAt: order.refundedAt,
                refundReason: order.refundReason
            },
            earningsCancellation: earningsCancellation || null,
            debtCreation: debtCreation || null,
            warning: debtCreation?.success ? 
                'ATTENZIONE: Creati debiti per venditori. Verranno detratti dai prossimi pagamenti.' : 
                null
        });

    } catch (error) {
        console.error('❌ [REFUND_ORDER] Errore rimborso ordine:', error);
        res.status(500).json({ 
            message: 'Errore durante il rimborso dell\'ordine',
            error: error.message 
        });
    }
};

// @desc    Ottieni nazioni disponibili per spedizione in base ai prodotti nel carrello
// @route   POST /api/orders/available-countries
// @access  Public
export const getAvailableCountries = async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Il carrello è vuoto' 
            });
        }

        // Mappa vendorId -> { vendorName, countries: Set, italianRegions: Set }
        const vendorCountries = {};
        const allCountries = new Set(['Italia']); // Italia sempre disponibile di default
        const italianRegions = new Set(); // Regioni italiane disponibili

        for (const item of items) {
            const product = await Product.findById(item.product).populate('seller', 'shopSettings businessName');
            
            if (!product || !product.seller) continue;

            const vendorId = product.seller._id.toString();
            const vendorName = product.seller.businessName || 'Venditore';
            const shippingSettings = product.seller.shopSettings?.shipping;

            if (!vendorCountries[vendorId]) {
                vendorCountries[vendorId] = {
                    vendorName,
                    countries: new Set(),
                    italianRegions: new Set()
                };
            }

            // Estrai nazioni e regioni italiane dalle tariffe configurate
            if (shippingSettings?.shippingRates && shippingSettings.shippingRates.length > 0) {
                shippingSettings.shippingRates.forEach(rate => {
                    // Aggiungi paese
                    if (rate.country) {
                        vendorCountries[vendorId].countries.add(rate.country);
                        allCountries.add(rate.country);
                    }

                    // Se è Italia, gestisci le regioni
                    if (rate.country === 'Italia' || !rate.country) {
                        if (rate.italiaIsoleEscluse) {
                            // Tutte le regioni TRANNE Sardegna e Sicilia
                            const allRegions = ['Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna', 
                                'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche', 'Molise', 
                                'Piemonte', 'Puglia', 'Toscana', 'Trentino-Alto Adige', 'Umbria', 'Valle d\'Aosta', 'Veneto'];
                            allRegions.forEach(region => {
                                vendorCountries[vendorId].italianRegions.add(region);
                                italianRegions.add(region);
                            });
                        } else if (rate.italiaSardegnaSicilia) {
                            // Solo Sardegna e Sicilia
                            vendorCountries[vendorId].italianRegions.add('Sardegna');
                            vendorCountries[vendorId].italianRegions.add('Sicilia');
                            italianRegions.add('Sardegna');
                            italianRegions.add('Sicilia');
                        } else {
                            // Tutte le regioni italiane
                            const allRegions = ['Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna', 
                                'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche', 'Molise', 
                                'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana', 'Trentino-Alto Adige', 
                                'Umbria', 'Valle d\'Aosta', 'Veneto'];
                            allRegions.forEach(region => {
                                vendorCountries[vendorId].italianRegions.add(region);
                                italianRegions.add(region);
                            });
                        }
                    }
                });
            } else {
                // Se non ha tariffe avanzate, assume Italia con tutte le regioni
                vendorCountries[vendorId].countries.add('Italia');
                const allRegions = ['Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna', 
                    'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche', 'Molise', 
                    'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana', 'Trentino-Alto Adige', 
                    'Umbria', 'Valle d\'Aosta', 'Veneto'];
                allRegions.forEach(region => {
                    vendorCountries[vendorId].italianRegions.add(region);
                    italianRegions.add(region);
                });
            }
        }

        // Converti Set in Array per JSON
        const vendorCountriesFormatted = {};
        Object.keys(vendorCountries).forEach(vendorId => {
            vendorCountriesFormatted[vendorId] = {
                vendorName: vendorCountries[vendorId].vendorName,
                countries: Array.from(vendorCountries[vendorId].countries).sort(),
                italianRegions: Array.from(vendorCountries[vendorId].italianRegions).sort()
            };
        });

        res.status(200).json({
            success: true,
            allCountries: Array.from(allCountries).sort(),
            availableItalianRegions: Array.from(italianRegions).sort(),
            vendorCountries: vendorCountriesFormatted
        });
    } catch (error) {
        console.error('Errore nel recupero nazioni disponibili:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};