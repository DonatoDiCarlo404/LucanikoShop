import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Il nome del prodotto è obbligatorio'],
      trim: true,
      maxlength: [100, 'Il nome non può superare 100 caratteri']
    },
    description: {
      type: String,
      required: [true, 'La descrizione è obbligatoria'],
      maxlength: [2000, 'La descrizione non può superare 2000 caratteri']
    },
    price: {
      type: Number,
      required: [true, 'Il prezzo è obbligatorio'],
      min: [0, 'Il prezzo non può essere negativo']
    },
    category: {
      type: String,
      required: [true, 'La categoria è obbligatoria'],
      enum: [
        'Frutta e Verdura',
        'Carne e Pesce',
        'Latticini',
        'Pane e Dolci',
        'Pasta e Cereali',
        'Bevande',
        'Condimenti',
        'Snack',
        'Surgelati',
        'Altro'
      ]
    },
    images: [{
      url: {
        type: String,
        required: true
      },
      public_id: String // Per Cloudinary
    }],
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    stock: {
      type: Number,
      required: [true, 'Lo stock è obbligatorio'],
      min: [0, 'Lo stock non può essere negativo'],
      default: 0
    },
    sold: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Il rating minimo è 0'],
      max: [5, 'Il rating massimo è 5']
    },
    numReviews: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      default: 'pz',
      enum: ['pz', 'kg', 'g', 'l', 'ml']
    },
    expiryDate: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    },
    tags: [{
      type: String,
      trim: true
    }]
  },
  {
    timestamps: true
  }
);

// Indici per ricerca full-text
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Indici per filtri e ordinamento
productSchema.index({ category: 1, price: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
