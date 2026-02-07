import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

// @desc    Ottieni wishlist dell'utente
// @route   GET /api/wishlist
// @access  Private
export const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.find({ user: req.user._id })
      .populate('product', 'name price images stock seller category rating numReviews hasActiveDiscount discountedPrice discountPercentage')
      .sort({ createdAt: -1 });

    // Filtra solo i prodotti esistenti (esclude quelli null/eliminati)
    const validWishlist = wishlist.filter(item => item.product != null);

    res.status(200).json(validWishlist);
  } catch (error) {
    console.error('[getWishlist] Errore:', error);
    res.status(500).json({ message: 'Errore nel recupero della wishlist' });
  }
};

// @desc    Aggiungi prodotto alla wishlist
// @route   POST /api/wishlist/:productId
// @access  Private
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // Verifica che il prodotto esista
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Prodotto non trovato' });
    }

    // Verifica se già presente in wishlist
    const existingItem = await Wishlist.findOne({
      user: req.user._id,
      product: productId
    });

    if (existingItem) {
      return res.status(400).json({ message: 'Prodotto già presente nella wishlist' });
    }

    // Aggiungi alla wishlist
    const wishlistItem = await Wishlist.create({
      user: req.user._id,
      product: productId
    });

    res.status(201).json({ message: 'Prodotto aggiunto alla wishlist', wishlistItem });
  } catch (error) {
    console.error('[addToWishlist] Errore:', error);
    res.status(500).json({ message: 'Errore nell\'aggiunta alla wishlist' });
  }
};

// @desc    Rimuovi prodotto dalla wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await Wishlist.findOneAndDelete({
      user: req.user._id,
      product: productId
    });

    if (!result) {
      return res.status(404).json({ message: 'Prodotto non trovato nella wishlist' });
    }

    res.status(200).json({ message: 'Prodotto rimosso dalla wishlist' });
  } catch (error) {
    console.error('[removeFromWishlist] Errore:', error);
    res.status(500).json({ message: 'Errore nella rimozione dalla wishlist' });
  }
};
