import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { sendWelcomeEmail } from '../utils/emailTemplates.js';

// @desc    Registra un nuovo utente
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Verifica se l'utente esiste già
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'Utente già registrato' });
    }

    // Crea nuovo utente
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'buyer'
    });

    if (user) {
      // Invia email di benvenuto (non blocca la registrazione se fallisce)
      try {
        await sendWelcomeEmail(user.email, user.name);
      } catch (emailError) {
        console.error('Errore invio email di benvenuto:', emailError);
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Dati utente non validi' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login utente
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Trova l'utente e includi la password
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Email o password non validi' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Ottieni profilo utente
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar
      });
    } else {
      res.status(404).json({ message: 'Utente non trovato' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
export const googleCallback = async (req, res) => {
  try {
    // L'utente è già stato autenticato da Passport
    const token = generateToken(req.user._id);
    
    // Reindirizza al frontend con il token
    res.redirect(`http://localhost:5173/auth/success?token=${token}`);
  } catch (error) {
    res.redirect('http://localhost:5173/auth/error');
  }
};

// @desc    Ottieni profilo completo venditore
// @route   GET /api/auth/vendor-profile
// @access  Private/Seller
export const getVendorProfile = async (req, res) => {
  try {
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accesso negato. Solo venditori possono accedere a questa risorsa.' });
    }

    const user = await User.findById(req.user._id).select('-password');

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'Utente non trovato' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Aggiorna profilo venditore
// @route   PUT /api/auth/vendor-profile
// @access  Private/Seller
export const updateVendorProfile = async (req, res) => {
  try {
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accesso negato. Solo venditori possono modificare il profilo aziendale.' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    // Aggiorna informazioni personali
    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.avatar = req.body.avatar || user.avatar;

    // Aggiorna indirizzo personale
    if (req.body.address) {
      user.address = {
        street: req.body.address.street || user.address?.street,
        city: req.body.address.city || user.address?.city,
        state: req.body.address.state || user.address?.state,
        zipCode: req.body.address.zipCode || user.address?.zipCode,
        country: req.body.address.country || user.address?.country
      };
    }

    // Aggiorna informazioni aziendali
    user.businessName = req.body.businessName || user.businessName;
    user.ragioneSociale = req.body.ragioneSociale || user.ragioneSociale;
    user.businessDescription = req.body.businessDescription || user.businessDescription;
    user.vatNumber = req.body.vatNumber || user.vatNumber;
    user.codiceSDI = req.body.codiceSDI || user.codiceSDI;

    // Aggiorna logo
    if (req.body.logo) {
      user.logo = {
        url: req.body.logo.url || user.logo?.url,
        public_id: req.body.logo.public_id || user.logo?.public_id
      };
    }

    // Aggiorna contatti negozio
    user.businessEmail = req.body.businessEmail || user.businessEmail;
    user.businessPhone = req.body.businessPhone || user.businessPhone;
    user.businessWhatsapp = req.body.businessWhatsapp || user.businessWhatsapp;
    user.website = req.body.website || user.website;

    // Aggiorna social links
    if (req.body.socialLinks) {
      user.socialLinks = {
        facebook: req.body.socialLinks.facebook || user.socialLinks?.facebook,
        instagram: req.body.socialLinks.instagram || user.socialLinks?.instagram,
        twitter: req.body.socialLinks.twitter || user.socialLinks?.twitter,
        linkedin: req.body.socialLinks.linkedin || user.socialLinks?.linkedin,
        tiktok: req.body.socialLinks.tiktok || user.socialLinks?.tiktok
      };
    }

    // Aggiorna indirizzo punto vendita
    if (req.body.storeAddress) {
      user.storeAddress = {
        street: req.body.storeAddress.street || user.storeAddress?.street,
        city: req.body.storeAddress.city || user.storeAddress?.city,
        state: req.body.storeAddress.state || user.storeAddress?.state,
        zipCode: req.body.storeAddress.zipCode || user.storeAddress?.zipCode,
        country: req.body.storeAddress.country || user.storeAddress?.country,
        coordinates: req.body.storeAddress.coordinates || user.storeAddress?.coordinates
      };
    }

    // Aggiorna indirizzo aziendale
    if (req.body.businessAddress) {
      user.businessAddress = {
        street: req.body.businessAddress.street || user.businessAddress?.street,
        city: req.body.businessAddress.city || user.businessAddress?.city,
        state: req.body.businessAddress.state || user.businessAddress?.state,
        zipCode: req.body.businessAddress.zipCode || user.businessAddress?.zipCode,
        country: req.body.businessAddress.country || user.businessAddress?.country
      };
    }

    // Aggiorna dati bancari
    if (req.body.bankAccount) {
      user.bankAccount = {
        iban: req.body.bankAccount.iban || user.bankAccount?.iban,
        bankName: req.body.bankAccount.bankName || user.bankAccount?.bankName
      };
    }

    // Aggiorna impostazioni negozio
    if (req.body.shopSettings) {
      user.shopSettings = {
        ...user.shopSettings,
        ...req.body.shopSettings
      };
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone,
      address: updatedUser.address,
      avatar: updatedUser.avatar,
      businessName: updatedUser.businessName,
      ragioneSociale: updatedUser.ragioneSociale,
      businessDescription: updatedUser.businessDescription,
      vatNumber: updatedUser.vatNumber,
      codiceSDI: updatedUser.codiceSDI,
      logo: updatedUser.logo,
      businessEmail: updatedUser.businessEmail,
      businessPhone: updatedUser.businessPhone,
      businessWhatsapp: updatedUser.businessWhatsapp,
      website: updatedUser.website,
      socialLinks: updatedUser.socialLinks,
      storeAddress: updatedUser.storeAddress,
      businessAddress: updatedUser.businessAddress,
      bankAccount: updatedUser.bankAccount,
      shopSettings: updatedUser.shopSettings,
      isApproved: updatedUser.isApproved
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};