import mongoose from 'mongoose';

const adminNewsSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: false,
      maxlength: [500, 'Il contenuto non può superare 500 caratteri'],
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

const AdminNews = mongoose.model('AdminNews', adminNewsSchema);

export default AdminNews;
