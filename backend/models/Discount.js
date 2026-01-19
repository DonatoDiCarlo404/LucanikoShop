import mongoose from 'mongoose';

const discountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Il nome dello sconto è obbligatorio'],
      trim: true,
      maxlength: [100, 'Il nome non può superare 100 caratteri']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'La descrizione non può superare 500 caratteri']
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // Tipo di sconto
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'], // percentage = %, fixed = valore fisso in €
      required: true
    },
    discountValue: {
      type: Number,
      required: [true, 'Il valore dello sconto è obbligatorio'],
      min: [0, 'Il valore dello sconto non può essere negativo']
    },
    // Applicazione dello sconto
    applicationType: {
      type: String,
      enum: ['product', 'category', 'coupon'], // sconto su prodotto, categoria o tramite coupon
      required: true
    },
    // Prodotti specifici (se applicationType = 'product')
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    // Categorie (se applicationType = 'category')
    categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }],
    // Codice coupon (se applicationType = 'coupon')
    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true, // Permette null ma deve essere unico se presente
      unique: true
    },
    // Validità temporale
    startDate: {
      type: Date,
      required: [true, 'La data di inizio è obbligatoria']
    },
    endDate: {
      type: Date,
      required: [true, 'La data di fine è obbligatoria']
    },
    // Limiti di utilizzo (per coupon)
    usageLimit: {
      type: Number,
      min: [0, 'Il limite di utilizzo non può essere negativo']
    },
    usageCount: {
      type: Number,
      default: 0,
      min: [0, 'Il conteggio utilizzi non può essere negativo']
    },
    // Condizioni minime per applicare lo sconto
    minPurchaseAmount: {
      type: Number,
      min: [0, 'L\'importo minimo non può essere negativo'],
      default: 0
    },
    // Sconto massimo applicabile (utile per sconti percentuali)
    maxDiscountAmount: {
      type: Number,
      min: [0, 'Lo sconto massimo non può essere negativo']
    },
    // Stato dello sconto
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Validazione custom
discountSchema.pre('save', function(next) {
  // Valida che endDate sia dopo startDate
  if (this.endDate <= this.startDate) {
    next(new Error('La data di fine deve essere successiva alla data di inizio'));
    return;
  }

  // Valida che il valore percentuale non superi 100
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    next(new Error('Lo sconto percentuale non può superare 100%'));
    return;
  }

  // Valida che i prodotti siano specificati per applicationType = 'product'
  if (this.applicationType === 'product' && (!this.products || this.products.length === 0)) {
    next(new Error('Devi specificare almeno un prodotto per questo tipo di sconto'));
    return;
  }

  // Valida che le categorie siano specificate per applicationType = 'category'
  if (this.applicationType === 'category' && (!this.categories || this.categories.length === 0)) {
    next(new Error('Devi specificare almeno una categoria per questo tipo di sconto'));
    return;
  }

  // Valida che il couponCode sia specificato per applicationType = 'coupon'
  if (this.applicationType === 'coupon' && !this.couponCode) {
    next(new Error('Devi specificare un codice coupon per questo tipo di sconto'));
    return;
  }

  next();
});

// Metodo per verificare se lo sconto è valido ora
discountSchema.methods.isValidNow = function() {
  const now = new Date();
  
  return (
    this.isActive &&
    this.startDate <= now &&
    this.endDate >= now &&
    (!this.usageLimit || this.usageCount < this.usageLimit)
  );
};

// Metodo per calcolare il prezzo scontato
discountSchema.methods.calculateDiscountedPrice = function(originalPrice) {
  if (!this.isValidNow()) {
    return originalPrice;
  }

  let discount = 0;
  
  if (this.discountType === 'percentage') {
    discount = (originalPrice * this.discountValue) / 100;
    // Applica lo sconto massimo se specificato
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }
  } else if (this.discountType === 'fixed') {
    discount = this.discountValue;
  }

  const discountedPrice = originalPrice - discount;
  return Math.max(0, discountedPrice); // Il prezzo non può essere negativo
};

// Indici
discountSchema.index({ seller: 1, isActive: 1 });
discountSchema.index({ startDate: 1, endDate: 1 });
discountSchema.index({ couponCode: 1 }, { sparse: true });
discountSchema.index({ products: 1 });
discountSchema.index({ categories: 1 });

const Discount = mongoose.model('Discount', discountSchema);

export default Discount;
