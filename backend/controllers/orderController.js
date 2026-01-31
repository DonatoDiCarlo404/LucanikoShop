import Order from "../models/Order.js";
import { Discount } from "../models/index.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import { calculateMultiVendorShipping } from "../utils/shippingCalculator.js";

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
            const product = await Product.findById(item.product).populate('seller', 'shopSettings');
            
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

        res.status(200).json({
            success: true,
            ...shippingResult
        });
    } catch (error) {
        console.error('Errore nel calcolo spedizione:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};