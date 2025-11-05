import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Il nome è obbligatorio'],
      trim: true,
      maxlength: [50, 'Il nome non può superare 50 caratteri']
    },
    email: {
      type: String,
      required: [true, 'L\'email è obbligatoria'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Inserisci un\'email valida']
    },
    password: {
      type: String,
      required: [true, 'La password è obbligatoria'],
      minlength: [6, 'La password deve essere di almeno 6 caratteri'],
      select: false // Non restituisce la password nelle query di default
    },
    role: {
      type: String,
      enum: ['buyer', 'seller', 'admin'],
      default: 'buyer'
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    avatar: {
      type: String,
      default: 'https://via.placeholder.com/150'
    },
    // Campi specifici per i seller (aziende)
    businessName: {
      type: String,
      trim: true
    },
    businessDescription: {
      type: String,
      maxlength: [500, 'La descrizione non può superare 500 caratteri']
    },
    vatNumber: { // Partita IVA
      type: String,
      trim: true,
      sparse: true // Permette null ma deve essere unico se presente
    },
    businessAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    bankAccount: {
      iban: String,
      bankName: String
    },
    // Status e verifiche
    isVerified: {
      type: Boolean,
      default: false
    },
    isApproved: { // Approvazione admin per i seller
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
  },
  {
    timestamps: true
  }
);

// Hash della password prima di salvare
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Metodo per confrontare la password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
