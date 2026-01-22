// DELETE recensione
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Recensione non trovata' });
    }

    // Solo autore entro 30 giorni o admin
    const now = new Date();
    const created = new Date(review.createdAt);
    const diffDays = (now - created) / (1000 * 60 * 60 * 24);
    const isAuthor = review.user.toString() === userId.toString();
    const isAdmin = userRole === 'admin';
    if (!(isAdmin || (isAuthor && diffDays <= 30))) {
      return res.status(403).json({ message: 'Non autorizzato a eliminare questa recensione' });
    }

    await review.deleteOne();

    // Aggiorna rating/numReviews del prodotto
    const product = await Product.findById(review.product);
    if (product) {
      const reviews = await Review.find({ product: product._id });
      product.numReviews = reviews.length;
      product.rating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : 0;
      await product.save();
      console.log('[deleteReview] Aggregazione aggiornata:', { productId: product._id, numReviews: product.numReviews, rating: product.rating });
    }

    res.status(200).json({ message: 'Recensione eliminata' });
  } catch (error) {
    console.error('[deleteReview] Errore:', error);
    res.status(500).json({ message: 'Errore server' });
  }
};

// @desc    Ottieni tutte le recensioni dell'utente loggato
// @route   GET /api/reviews/my-reviews
// @access  Private
export const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('product', 'name images')
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    console.error('[getMyReviews] Errore:', error);
    res.status(500).json({ message: 'Errore nel recupero delle recensioni' });
  }
};

import Review from '../models/Review.js';
import Product from '../models/Product.js';

// GET tutte le recensioni di un prodotto
export const getReviewsByProduct = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name') // << aggiunto
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore nel recupero delle recensioni' });
  }
};

// POST nuova recensione o aggiorna recensione automatica
export const createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    // Verifica se esiste già una recensione
    const existingReview = await Review.findOne({
      product: req.params.productId,
      user: req.user._id
    });

    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Prodotto non trovato' });
    }

    let review;

    if (existingReview) {
      // Se la recensione esistente è automatica (con commento predefinito), aggiornala
      const isAutoReview = existingReview.comment === 'Recensione automatica: nessun feedback lasciato dall\'acquirente.';
      
      if (isAutoReview) {
        // Aggiorna la recensione automatica con i dati dell'utente
        existingReview.rating = rating;
        existingReview.comment = comment;
        await existingReview.save();
        review = existingReview;
        console.log('✅ [REVIEW] Recensione automatica aggiornata con feedback utente');
      } else {
        // Se è una recensione manuale già esistente, blocca
        return res.status(400).json({ message: 'Hai già recensito questo prodotto' });
      }
    } else {
      // Creazione nuova recensione
      review = await Review.create({
        product: req.params.productId,
        user: req.user._id,
        name: req.user.name,
        rating,
        comment,
        isVerified: true // È verificata perché l'utente l'ha acquistato
      });
      console.log('✅ [REVIEW] Nuova recensione creata');
    }

    // Aggiornamento rating prodotto
    const allReviews = await Review.find({ product: req.params.productId });
    const numReviews = allReviews.length;
    const avgRating =
      numReviews > 0
        ? allReviews.reduce((acc, r) => acc + r.rating, 0) / numReviews
        : 0;

    product.rating = avgRating;
    product.numReviews = numReviews;
    await product.save();

    return res.status(201).json(review);

  } catch (error) {
    console.error('[createReview] Errore:', error);
    res.status(500).json({ message: 'Errore server' });
  }
};


// PUT modifica recensione
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    // Trova la recensione
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Recensione non trovata' });
    }

    // Verifica che l'utente sia l'autore
    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Non autorizzato a modificare questa recensione' });
    }

    // Permetti modifica solo entro 30 giorni dalla creazione
    const now = new Date();
    const created = new Date(review.createdAt);
    const diffDays = (now - created) / (1000 * 60 * 60 * 24);
    if (diffDays > 30) {
      return res.status(403).json({ message: 'Puoi modificare la recensione solo entro 30 giorni dalla creazione.' });
    }

    // Aggiorna rating/commento
    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    await review.save();

    // Ricalcola rating/numReviews del prodotto
    const product = await Product.findById(review.product);
    if (product) {
      const reviews = await Review.find({ product: product._id });
      product.numReviews = reviews.length;
      product.rating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : 0;
      await product.save();
      console.log('[updateReview] Aggregazione aggiornata:', { productId: product._id, numReviews: product.numReviews, rating: product.rating });
    }

    res.status(200).json(review);
  } catch (error) {
    console.error('[updateReview] Errore:', error);
    res.status(500).json({ message: 'Errore server' });
  }
};
