// @desc    Aggiorna profilo acquirente
// @route   PUT /api/auth/profile
// @access  Private/Buyer
export const updateProfile = async (req, res) => {
  try {
    if (req.user.role !== 'buyer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accesso negato. Solo acquirenti possono modificare il profilo personale.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    // Aggiorna indirizzo
    if (req.body.address) {
      user.address = {
        street: req.body.address.street || user.address?.street,
        city: req.body.address.city || user.address?.city,
        state: req.body.address.state || user.address?.state,
        zipCode: req.body.address.zipCode || user.address?.zipCode,
        country: req.body.address.country || user.address?.country,
        taxCode: req.body.address.taxCode || user.address?.taxCode
      };
    }

    // Aggiorna indirizzo di fatturazione
    if (req.body.billingAddress) {
      user.billingAddress = {
        street: req.body.billingAddress.street || user.billingAddress?.street,
        city: req.body.billingAddress.city || user.billingAddress?.city,
        state: req.body.billingAddress.state || user.billingAddress?.state,
        zipCode: req.body.billingAddress.zipCode || user.billingAddress?.zipCode,
        country: req.body.billingAddress.country || user.billingAddress?.country,
        taxCode: req.body.billingAddress.taxCode || user.billingAddress?.taxCode
      };
    }

    // Aggiorna password se fornita
    if (req.body.password && req.body.password.length >= 8) {
      user.password = req.body.password;
    }

    // Aggiorna metodo di pagamento preferito
    if (typeof req.body.paymentMethod === 'string') {
      user.paymentMethod = req.body.paymentMethod;
    }

    // Aggiorna dati carta se forniti
    if (req.body.cardDetails) {
      user.cardDetails = {
        cardHolder: req.body.cardDetails.cardHolder || user.cardDetails?.cardHolder,
        cardNumber: req.body.cardDetails.cardNumber || user.cardDetails?.cardNumber,
        expiryDate: req.body.cardDetails.expiryDate || user.cardDetails?.expiryDate,
        cardType: req.body.cardDetails.cardType || user.cardDetails?.cardType
      };
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      phone: user.phone,
      address: user.address,
      billingAddress: user.billingAddress,
      paymentMethod: user.paymentMethod,
      cardDetails: user.cardDetails,
      avatar: user.avatar,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { sendWelcomeEmail } from '../utils/emailTemplates.js';

// @desc    Registra un nuovo utente
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      role,
      businessName,
      vatNumber,
      phoneNumber,
      address,
      city,
      zipCode,
      uniqueCode,
      selectedCategories,
      paymentIntentId,
      subscriptionType,
      subscriptionPaid
    } = req.body;

    console.log('[Backend] Registrazione ricevuta:', { name, email, role, businessName, vatNumber });

    // Verifica se l'utente esiste già
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'Utente già registrato' });
    }

    // Prepara i dati utente base
    const userData = {
      name,
      email,
      password,
      role: role || 'buyer'
    };


    // Se è un seller, aggiungi i dati aziendali
    if (role === 'seller') {
      if (businessName) userData.businessName = businessName;
      if (vatNumber) userData.vatNumber = vatNumber;
      if (phoneNumber) userData.phone = phoneNumber;
      if (uniqueCode) userData.codiceSDI = uniqueCode;

      // Indirizzo aziendale
      if (address || city || zipCode) {
        userData.businessAddress = {
          street: address || '',
          city: city || '',
          zipCode: zipCode || '',
          country: 'IT'
        };
        // Copia anche in storeAddress
        userData.storeAddress = {
          street: address || '',
          city: city || '',
          zipCode: zipCode || '',
          country: 'IT'
        };
      }

      // Calcola e salva la scadenza abbonamento
      if (subscriptionType) {
        // 1, 2 o 3 anni
        let years = 1;
        if (String(subscriptionType) === '2') years = 2;
        if (String(subscriptionType) === '3') years = 3;
        const now = new Date();
        const endDate = new Date(now.setFullYear(now.getFullYear() + years));
        userData.subscriptionEndDate = endDate;
      }

      // Salva info abbonamento nei metadata (opzionale, per tracking)
      if (paymentIntentId) {
        userData.subscriptionPaymentId = paymentIntentId;
        userData.subscriptionType = subscriptionType;
        userData.subscriptionPaid = subscriptionPaid;
      }
    }

    console.log('[Backend] Dati utente preparati:', userData);

    // Crea nuovo utente
    const user = await User.create(userData);

    if (user) {
      console.log('[Backend] Utente creato con successo:', user._id);
      
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
        businessName: user.businessName,
        vatNumber: user.vatNumber,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Dati utente non validi' });
    }
  } catch (error) {
    console.error('[Backend] Errore registrazione:', error);
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
        billingAddress: user.billingAddress,
        paymentMethod: user.paymentMethod,
        cardDetails: user.cardDetails,
        avatar: user.avatar,
        createdAt: user.createdAt
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
    // Log dei dati ricevuti dal frontend
    console.log('📥 [BACKEND SAVE] Dati ricevuti dal frontend:', JSON.stringify(req.body?.shopSettings?.shipping?.shippingRates, null, 2));
    if (req.body?.shopSettings?.shipping?.shippingRates) {
      req.body.shopSettings.shipping.shippingRates.forEach((rate, i) => {
        console.log(`📥 [BACKEND SAVE] Tariffa ${i} ricevuta - shippingOptions:`, rate.shippingOptions);
      });
    }

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


    // Invio email di approvazione se lo stato passa a true
    if (!user.isApproved && req.body.isApproved === true) {
      // Approvazione appena avvenuta
      try {
        const { sendApprovalEmail } = await import('../utils/emailTemplates.js');
        await sendApprovalEmail(user.email, user.name);
      } catch (emailError) {
        console.error('Errore invio email di approvazione:', emailError);
      }
    }

    const updatedUser = await user.save();

    // Log di cosa è stato salvato
    console.log('💾 [BACKEND SAVE] Dati salvati nel database:', JSON.stringify(updatedUser?.shopSettings?.shipping?.shippingRates, null, 2));
    if (updatedUser?.shopSettings?.shipping?.shippingRates) {
      updatedUser.shopSettings.shipping.shippingRates.forEach((rate, i) => {
        console.log(`💾 [BACKEND SAVE] Tariffa ${i} salvata - shippingOptions:`, rate.shippingOptions);
      });
    }

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