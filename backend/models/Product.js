import mongoose from 'mongoose';

// Schema per le opzioni degli attributi personalizzati
const customAttributeOptionSchema = new mongoose.Schema({
  label: String,
  value: String,
  color: String
}, { _id: false });

// Schema per gli attributi personalizzati
const customAttributeSchema = new mongoose.Schema({
  name: String,
  key: String,
  type: String,
  required: Boolean,
  allowVariants: Boolean,
  order: Number,
  options: [customAttributeOptionSchema],
  placeholder: String,
  validation: mongoose.Schema.Types.Mixed
}, { _id: false });

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
      required: [function() { return !this.hasVariants; }, 'Il prezzo è obbligatorio'],
      min: [0, 'Il prezzo non può essere negativo'],
      default: 0
    },
    ivaPercent: {
      type: Number,
      required: [true, 'La percentuale IVA è obbligatoria'],
      min: [0, 'La percentuale IVA non può essere negativa'],
      max: [100, 'La percentuale IVA non può superare 100'],
      default: 22
    },
    // Gestione prezzi e sconti
    originalPrice: {
      type: Number,
      min: [0, 'Il prezzo originale non può essere negativo']
    },
    discountedPrice: {
      type: Number,
      min: [0, 'Il prezzo scontato non può essere negativo']
    },
    activeDiscount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Discount'
    },
    hasActiveDiscount: {
      type: Boolean,
      default: false
    },
    discountPercentage: { // Per visualizzazione rapida
      type: Number,
      min: [0, 'La percentuale di sconto non può essere negativa'],
      max: [100, 'La percentuale di sconto non può superare 100']
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'La categoria è obbligatoria']
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: false
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
      required: false,
      min: [0, 'Lo stock non può essere negativo'],
      default: 0
    },
    weight: {
      type: Number,
      required: false,
      min: [0, 'Il peso non può essere negativo'],
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
    }],
    // NUOVO: Attributi dinamici per categoria
    attributes: [{
      key: {
        type: String,
        required: true
      },
      value: {
        type: String,
        required: false
      }
    }],
    // NUOVO: Attributi personalizzati definiti dal venditore
    customAttributes: [customAttributeSchema],
    // NUOVO: Chiavi degli attributi selezionati per le varianti
    selectedVariantAttributes: [String],
    // NUOVO: Gestione varianti
    hasVariants: {
      type: Boolean,
      default: false
    },
    variants: [{
      sku: {
        type: String,
        unique: true,
        sparse: true
      },
      attributes: [{
        key: String,
        value: String
      }],
      price: Number,  // Se null, usa il prezzo base del prodotto
      stock: {
        type: Number,
        default: 0,
        min: 0
      },
      image: String,  // URL o base64 dell'immagine specifica per variante
      active: {
        type: Boolean,
        default: true
      }
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
productSchema.index({ hasActiveDiscount: 1 });

// Metodo virtuale per ottenere il prezzo corrente (scontato o originale)
productSchema.virtual('currentPrice').get(function() {
  return this.hasActiveDiscount && this.discountedPrice ? this.discountedPrice : this.price;
});

// Metodo per applicare uno sconto al prodotto
productSchema.methods.applyDiscount = function(discount) {
  if (!discount || !discount.isValidNow()) {
    this.removeDiscount();
    return;
  }

  this.originalPrice = this.price;
  this.discountedPrice = discount.calculateDiscountedPrice(this.price);
  this.activeDiscount = discount._id;
  this.hasActiveDiscount = true;
  
  // Calcola la percentuale di sconto effettiva
  if (this.price > 0) {
    this.discountPercentage = Math.round(((this.price - this.discountedPrice) / this.price) * 100);
  }
};

// Metodo per rimuovere lo sconto
productSchema.methods.removeDiscount = function() {
  this.originalPrice = undefined;
  this.discountedPrice = undefined;
  this.activeDiscount = undefined;
  this.hasActiveDiscount = false;
  this.discountPercentage = undefined;
};

// Assicura che i virtual siano inclusi nella serializzazione JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

export default Product;
