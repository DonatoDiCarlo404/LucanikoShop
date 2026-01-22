import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        name: {
          type: String,
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'La quantità minima è 1']
        },
        price: {
          type: Number,
          required: true
        },
        seller: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        ivaPercent: {
          type: Number,
          default: 22
        }
      }
    ],
    shippingAddress: {
      street: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      zipCode: {
        type: String,
        required: true
      },
      country: {
        type: String,
        required: true
      },
      phone: {
        type: String,
        required: true
      }
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['card', 'paypal', 'stripe', 'cash_on_delivery']
    },
    paymentResult: {
      id: String,
      status: String,
      update_time: String,
      email_address: String
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    // Campi per gestione sconti/coupon
    appliedDiscount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Discount'
    },
    discountAmount: {
      type: Number,
      default: 0.0
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paidAt: {
      type: Date
    },
    stripeSessionId: {
      type: String,
      unique: true,
      sparse: true, // Permette null values per ordini non Stripe
    },
    isDelivered: {
      type: Boolean,
      default: false
    },
    deliveredAt: {
      type: Date
    },
    trackingInfo: {
      trackingNumber: {
        type: String
      },
      carrier: {
        type: String
      },
      updatedAt: {
        type: Date
      }
    }
  },
  {
    timestamps: true
  }
);

// Indici per query comuni
orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ 'items.seller': 1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
