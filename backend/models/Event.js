import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxLength: 1000
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
    required: false,
    trim: true
  },
  website: {
    type: String,
    required: false,
    trim: true
  },
  category: {
    type: String,
    enum: [
      'Sagre & Eventi Enogastronomici',
      'Tradizioni popolari & Religiose',
      'Festival, Spettacoli & Concerti',
      'Eventi Sportivi',
      'Fiere & Manifestazioni territoriali'
    ],
    required: true
  },
  eventDates: [{
    type: Date,
    required: true
  }],
  eventTime: {
    type: String, // Es: "18:00", "20:30"
    required: false
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

export default mongoose.model('Event', eventSchema);
