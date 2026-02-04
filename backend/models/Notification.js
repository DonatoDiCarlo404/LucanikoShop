import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['payment_received', 'new_order', 'order_status_change', 'system'],
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: 500
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Indice per query efficienti
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
