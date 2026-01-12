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
      country: String,
      taxCode: String // Codice fiscale
    },
    billingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      taxCode: String
    },
    avatar: {
      type: String,
      default: 'https://via.placeholder.com/150'
    },

    // Metodo di pagamento preferito (acquirente)
    paymentMethod: {
      type: String,
      enum: ['carta', ''],
      default: ''
    },
    // Dati carta di credito (salvati in modo sicuro, criptati)
    cardDetails: {
      cardHolder: String,
      cardNumber: String, // Salvare solo ultime 4 cifre in produzione
      expiryDate: String,
      cardType: String // Visa, Mastercard, etc.
    },
    // Campi specifici per i seller (aziende)
    businessName: {
      type: String,
      trim: true
    },
    ragioneSociale: {
      type: String,
      trim: true
    },
    businessDescription: {
      type: String,
      maxlength: [500, 'La descrizione non può superare 500 caratteri']
    },
    logo: {
      url: String,
      public_id: String // Per Cloudinary
    },
    // Contatti negozio
    businessEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    businessPhone: String,
    businessWhatsapp: String,
    website: String,
    socialLinks: {
      facebook: String,
      instagram: String,
      twitter: String,
      linkedin: String,
      tiktok: String
    },
    // Indirizzo punto vendita fisico
    storeAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    vatNumber: { // Partita IVA
      type: String,
      trim: true,
      sparse: true // Permette null ma deve essere unico se presente
    },
    codiceSDI: { // Codice SDI per fatturazione elettronica
      type: String,
      trim: true,
      maxlength: [7, 'Il codice SDI non può superare 7 caratteri']
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
      // Metodi di pagamento
      paymentMethods: {
        bankTransfer: {
          enabled: {
            type: Boolean,
            default: true
          },
          iban: String,
          bankName: String,
          accountHolder: String
        },
        paypal: {
          enabled: {
            type: Boolean,
            default: false
          },
          email: String
        },
        stripe: {
          enabled: {
            type: Boolean,
            default: false
          },
          accountId: String, // Stripe Connect Account ID
          onboardingComplete: {
            type: Boolean,
            default: false
          }
        },
        cashOnDelivery: {
          enabled: {
            type: Boolean,
            default: false
          },
          extraFee: Number
        }
      },
      // Termini e condizioni personalizzati
      termsAndConditions: {
        content: String,
        lastUpdated: Date,
        version: {
          type: Number,
          default: 1
        }
      },
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
            enum: ['fixed', 'weight', 'price', 'zone'], // fisso, peso, prezzo, zona geografica
            default: 'fixed'
          },
          baseRate: Number, // Tariffa base
          ratePerUnit: Number, // Tariffa per kg o per euro
          estimatedDays: String, // Es: "3-5 giorni"
          zones: [{ // Zone geografiche per spedizioni
            name: String, // Es: "Nord Italia", "Sud Italia", "Isole", "Estero UE"
            regions: [String], // Es: ["Lombardia", "Piemonte"], oppure ["IT", "FR", "DE"]
            rate: Number,
            estimatedDays: String
          }]
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
