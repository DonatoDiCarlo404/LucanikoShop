import mongoose from 'mongoose';

const CategoryAttributeSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  key: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  type: {
    type: String,
    enum: ['select', 'multiselect', 'text', 'number', 'color'],
    default: 'text'
  },
  required: {
    type: Boolean,
    default: false
  },
  allowVariants: {
    type: Boolean,
    default: false,
    description: 'Se true, questo attributo può generare varianti prodotto (es. taglia, colore)'
  },
  options: [{
    label: String,
    value: String,
    color: String  // per preview colori (es. #FF0000)
  }],
  placeholder: String,
  validation: {
    min: Number,
    max: Number,
    pattern: String
  },
  order: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index composto per garantire unicità key per categoria
CategoryAttributeSchema.index({ category: 1, key: 1 }, { unique: true });

const CategoryAttribute = mongoose.model('CategoryAttribute', CategoryAttributeSchema);

export default CategoryAttribute;
