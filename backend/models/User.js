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
        minlength: [8, 'La password deve essere di almeno 8 caratteri'], // Modificato per la lunghezza minima
        validate: {
          validator: function (v) {
            // Almeno una maiuscola, una minuscola, un numero, un simbolo
            return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(v);
          },
          message: 'La password deve contenere almeno una maiuscola, una minuscola, un numero e un simbolo'
        },
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
    // Configurazioni negozio (per seller)
    shopSettings: {
      // Configurazioni spedizioni
      shipping: {
        freeShipping: {
          type: Boolean,
          default: false
        },
        freeShippingThreshold: { // Spedizione gratuita sopra questo importo
          type: Number,
          min: [0, 'La soglia non può essere negativa']
        },
        shippingRates: [{
          name: String, // Es: "Standard", "Express"
          description: String,
          calculationType: {
            type: String,
            enum: ['fixed', 'weight', 'price'], // fisso, basato su peso, basato su prezzo
            default: 'fixed'
          },
          baseRate: Number, // Tariffa base
          ratePerUnit: Number, // Tariffa per kg o per euro
          estimatedDays: String // Es: "3-5 giorni"
        }],
        defaultShippingRate: Number // Tariffa predefinita
      },
      // Configurazioni prodotti e varianti
      productSettings: {
        // Per abbigliamento
        enableColors: {
          type: Boolean,
          default: false
        },
        availableColors: [String], // Es: ["Rosso", "Blu", "Nero"]
        enableSizes: {
          type: Boolean,
          default: false
        },
        availableSizes: [String], // Es: ["XS", "S", "M", "L", "XL"]
        // Per calzature
        enableShoeNumbers: {
          type: Boolean,
          default: false
        },
        availableShoeNumbers: [String], // Es: ["38", "39", "40"]
        // Altre varianti personalizzate
        customVariants: [{
          name: String, // Es: "Materiale"
          values: [String] // Es: ["Cotone", "Lino"]
        }]
      },
      // Configurazioni resi e garanzie
      returnPolicy: {
        enabled: {
          type: Boolean,
          default: false
        },
        days: Number, // Giorni per il reso
        description: String
      },
      // Altre impostazioni
      minOrderAmount: { // Importo minimo ordine
        type: Number,
        min: [0, 'L\'importo minimo non può essere negativo'],
        default: 0
      },
      currency: {
        type: String,
        default: 'EUR'
      },
      taxRate: { // Aliquota IVA
        type: Number,
        min: [0, 'L\'aliquota IVA non può essere negativa'],
        max: [100, 'L\'aliquota IVA non può superare 100'],
        default: 22
      }
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
