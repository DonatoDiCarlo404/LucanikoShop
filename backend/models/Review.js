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
      required: true
    },
    name: {
      type: String,
      required: true
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

// Indice composto per evitare recensioni duplicate dello stesso utente sullo stesso prodotto
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
