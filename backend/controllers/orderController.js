import Order from "../models/Order.js";

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
        const orders = await Order.find({ buyer: req.user._id })
            .populate('items.product', 'name images')
            .sort({ createdAt: -1 }); // Ordini più recenti prima

        res.status(200).json(orders);
    } catch (error) {
        console.error('Errore nel recupero degli ordini:', error);
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
            .populate('items.product', 'name images price')
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