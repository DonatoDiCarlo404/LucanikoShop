import mongoose from 'mongoose';

const vendorPayoutSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Venditore è obbligatorio'],
      index: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Ordine è obbligatorio'],
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Importo netto è obbligatorio'],
      default: 0.0
    },
    stripeFee: {
      type: Number,
      required: true,
      default: 0.0,
      min: [0, 'La fee Stripe non può essere negativa']
    },
    transferFee: {
      type: Number,
      required: true,
      default: 0.30,
      min: [0, 'La fee transfer non può essere negativa']
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'processing', 'paid', 'failed'],
        message: 'Status deve essere: pending, processing, paid o failed'
      },
      default: 'pending',
      index: true
    },
    saleDate: {
      type: Date,
      required: [true, 'Data vendita è obbligatoria'],
      index: true
    },
    paymentDate: {
      type: Date,
      default: null
    },
    stripeTransferId: {
      type: String,
      default: null,
      sparse: true // Permette null ma unico se presente
    },
    failureReason: {
      type: String,
      default: null
    },
    // Campi per gestione debiti da rimborsi post-pagamento (Fase 6.2)
    isRefundDebt: {
      type: Boolean,
      default: false,
      index: true
    },
    refundedPayoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VendorPayout',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indici composti per query comuni
vendorPayoutSchema.index({ vendorId: 1, status: 1 });
vendorPayoutSchema.index({ status: 1, saleDate: 1 });
vendorPayoutSchema.index({ vendorId: 1, createdAt: -1 });

// Metodo per calcolare i giorni mancanti al pagamento (14 giorni dalla vendita)
vendorPayoutSchema.methods.getDaysUntilPayment = function() {
  const fourteenDaysLater = new Date(this.saleDate);
  fourteenDaysLater.setDate(fourteenDaysLater.getDate() + 14);
  
  const now = new Date();
  const diffTime = fourteenDaysLater - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
};

// Metodo per verificare se il payout è pronto per essere processato (>= 14 giorni)
vendorPayoutSchema.methods.isReadyForPayment = function() {
  const fourteenDaysLater = new Date(this.saleDate);
  fourteenDaysLater.setDate(fourteenDaysLater.getDate() + 14);
  
  return new Date() >= fourteenDaysLater && this.status === 'pending';
};

const VendorPayout = mongoose.model('VendorPayout', vendorPayoutSchema);

export default VendorPayout;
