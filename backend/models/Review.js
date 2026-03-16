import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false // Non obbligatorio per recensioni automatiche guest
    },
    name: {
      type: String,
      required: false // Non obbligatorio per recensioni automatiche
    },
    rating: {
      type: Number,
      required: [true, 'Il rating è obbligatorio'],
      min: [1, 'Il rating minimo è 1'],
      max: [5, 'Il rating massimo è 5']
    },
    comment: {
      type: String,
      required: [true, 'Il commento è obbligatorio'],
      maxlength: [500, 'Il commento non può superare 500 caratteri']
    },
    images: [{
      url: String,
      public_id: String
    }],
    isVerified: {
      type: Boolean,
      default: false // True se l'utente ha effettivamente acquistato il prodotto
    },
    isAutomatic: {
      type: Boolean,
      default: false // True se è una recensione automatica generata dal sistema (ordini guest)
    },
    guestOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: false // Collegamento all'ordine guest per recensioni automatiche
    },
    helpful: {
      type: Number,
      default: 0 // Contatore "utile" per la recensione
    }
  },
  {
    timestamps: true
  }
);

// Indici per query comuni
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1 });

// Indice unique per  recensioni utenti registrati (non guest)
reviewSchema.index(
  { product: 1, user: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { user: { $exists: true, $type: 'objectId' } }
  }
);

// Indice unique per recensioni automatiche guest (usa guestOrderId)
reviewSchema.index(
  { product: 1, guestOrderId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isAutomatic: true,
      guestOrderId: { $exists: true, $type: 'objectId' }
    }
  }
);

const Review = mongoose.model('Review', reviewSchema);

export default Review;
