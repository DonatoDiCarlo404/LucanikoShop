import mongoose from 'mongoose';

const sponsorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxLength: 500
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  website: {
    type: String,
    required: true,
    trim: true
  },
  logo: {
    type: String, // URL dell'immagine
    default: null
  },
  tier: {
    type: String,
    enum: ['Main', 'Premium', 'Official', 'Support'],
    required: true,
    default: 'Support'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

export default mongoose.model('Sponsor', sponsorSchema);
