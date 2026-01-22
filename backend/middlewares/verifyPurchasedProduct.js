import Order from "../models/Order.js";

export const verifyPurchasedProduct = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const productId = req.params.productId;

        console.log('🔍 [VERIFY] Controllo acquisto - User:', userId, 'Product:', productId);

        // Cerca ordini completati dell'utente che contengono il prodotto
        const order = await Order.findOne({
            buyer: userId,
            isPaid: true,
            'items.product': productId
        });

        console.log('🔍 [VERIFY] Ordine trovato:', order ? order._id : 'Nessuno');

        if (!order) {
            return res.status(403).json({ 
                message: 'Puoi recensire solo i prodotti che hai acquistato.'
            });
        }

        next();
    } catch (error) {
        console.error('[verifyPurchasedProduct] Errore:', error);
        res.status(500).json({ message: 'Errore server' });
    }
};