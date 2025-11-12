import Order from "../models/Order.js";

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