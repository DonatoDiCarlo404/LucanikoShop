import mongoose from 'mongoose';

const experienceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxLength: 500
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: false,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  website: {
    type: String,
    required: false,
    trim: true
  },
  category: {
    type: String,
    enum: ['Enogastronomiche', 'Outdoor & Natura', 'Cultura & Tradizioni', 'Sport & Benessere', 'Family & Educational', 'Tour & Attività speciali'],
    required: true
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    public_id: String // Per Cloudinary
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

export default mongoose.model('Experience', experienceSchema);
