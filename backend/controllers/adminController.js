import { User, Product, Order } from '../models/index.js';
import { sendApprovalEmail } from '../utils/emailTemplates.js';

// @desc    Get tutti i venditori in attesa di approvazione
// @route   GET /api/admin/pending-sellers
// @access  Private/Admin
export const getPendingSellers = async (req, res) => {
  try {
    const pendingSellers = await User.find({
      role: 'seller',
      isApproved: false,
    }).select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      count: pendingSellers.length,
      sellers: pendingSellers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get tutti i venditori (approvati e non)
// @route   GET /api/admin/sellers
// @access  Private/Admin
export const getAllSellers = async (req, res) => {
  try {
    const sellers = await User.find({
      role: 'seller',
    }).select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      count: sellers.length,
      sellers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approva un venditore
// @route   PUT /api/admin/approve-seller/:id
// @access  Private/Admin
export const approveSeller = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);

    if (!seller) {
      return res.status(404).json({ message: 'Venditore non trovato' });
    }

    if (seller.role !== 'seller') {
      return res.status(400).json({ message: 'L\'utente non è un venditore' });
    }

    seller.isApproved = true;
    await seller.save();

    // Invia email di approvazione
    try {
      await sendApprovalEmail(seller.email, seller.name);
    } catch (emailError) {
      console.error('[ADMIN] Errore invio email approvazione:', emailError);
    }

    res.status(200).json({
      message: 'Venditore approvato con successo',
      seller: {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        businessName: seller.businessName,
        isApproved: seller.isApproved,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Rifiuta un venditore (elimina account)
// @route   DELETE /api/admin/reject-seller/:id
// @access  Private/Admin
export const rejectSeller = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);

    if (!seller) {
      return res.status(404).json({ message: 'Venditore non trovato' });
    }

    if (seller.role !== 'seller') {
      return res.status(400).json({ message: 'L\'utente non è un venditore' });
    }

    await seller.deleteOne();

    res.status(200).json({
      message: 'Venditore rifiutato ed eliminato',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get statistiche admin
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const pendingSellers = await User.countDocuments({ role: 'seller', isApproved: false });
    const approvedSellers = await User.countDocuments({ role: 'seller', isApproved: true });
    const buyers = await User.countDocuments({ role: 'buyer' });

    res.status(200).json({
      totalUsers,
      totalSellers,
      pendingSellers,
      approvedSellers,
      buyers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Sospendi o riattiva abbonamento venditore
// @route   PUT /api/admin/sellers/:id/subscription
// @access  Private/Admin
export const toggleSubscriptionStatus = async (req, res) => {
  try {
    const { suspended } = req.body;
    const seller = await User.findById(req.params.id);

    if (!seller) {
      return res.status(404).json({ message: 'Venditore non trovato' });
    }

    if (seller.role !== 'seller') {
      return res.status(400).json({ message: 'L\'utente non è un venditore' });
    }

    seller.subscriptionSuspended = suspended === true;
    await seller.save();

    res.status(200).json({
      message: seller.subscriptionSuspended 
        ? 'Abbonamento sospeso. Il rinnovo automatico è stato disattivato.' 
        : 'Abbonamento riattivato. Il rinnovo automatico è stato attivato.',
      seller: {
        id: seller._id,
        name: seller.name,
        businessName: seller.businessName,
        subscriptionSuspended: seller.subscriptionSuspended,
        subscriptionEndDate: seller.subscriptionEndDate
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get profilo completo di un venditore specifico
// @route   GET /api/admin/sellers/:id
// @access  Private/Admin
export const getSellerProfile = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id).select('-password');

    if (!seller) {
      return res.status(404).json({ message: 'Venditore non trovato' });
    }

    if (seller.role !== 'seller') {
      return res.status(400).json({ message: 'L\'utente non è un venditore' });
    }

    res.status(200).json(seller);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Aggiorna profilo di un venditore specifico (admin)
// @route   PUT /api/admin/sellers/:id/profile
// @access  Private/Admin
export const updateSellerProfile = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);

    if (!seller) {
      return res.status(404).json({ message: 'Venditore non trovato' });
    }

    if (seller.role !== 'seller') {
      return res.status(400).json({ message: 'L\'utente non è un venditore' });
    }

    // Aggiorna tutti i campi come nella funzione updateVendorProfile
    seller.name = req.body.name || seller.name;
    seller.phone = req.body.phone || seller.phone;
    seller.avatar = req.body.avatar || seller.avatar;

    if (req.body.address) {
      seller.address = {
        street: req.body.address.street || seller.address?.street,
        city: req.body.address.city || seller.address?.city,
        state: req.body.address.state || seller.address?.state,
        zipCode: req.body.address.zipCode || seller.address?.zipCode,
        country: req.body.address.country || seller.address?.country
      };
    }

    seller.businessName = req.body.businessName || seller.businessName;
    seller.ragioneSociale = req.body.ragioneSociale || seller.ragioneSociale;
    seller.businessDescription = req.body.businessDescription || seller.businessDescription;
    seller.vatNumber = req.body.vatNumber || seller.vatNumber;
    seller.codiceSDI = req.body.codiceSDI || seller.codiceSDI;
    seller.pec = req.body.pec || seller.pec;

    // Aggiorna categorie aziendali
    if (req.body.businessCategories !== undefined) {
      seller.businessCategories = req.body.businessCategories;
    }

    if (req.body.logo) {
      seller.logo = {
        url: req.body.logo.url || seller.logo?.url,
        public_id: req.body.logo.public_id || seller.logo?.public_id
      };
    }

    seller.businessEmail = req.body.businessEmail || seller.businessEmail;
    seller.businessPhone = req.body.businessPhone || seller.businessPhone;
    seller.businessWhatsapp = req.body.businessWhatsapp || seller.businessWhatsapp;
    seller.website = req.body.website || seller.website;

    if (req.body.socialLinks) {
      seller.socialLinks = {
        facebook: req.body.socialLinks.facebook || seller.socialLinks?.facebook,
        instagram: req.body.socialLinks.instagram || seller.socialLinks?.instagram,
        twitter: req.body.socialLinks.twitter || seller.socialLinks?.twitter,
        linkedin: req.body.socialLinks.linkedin || seller.socialLinks?.linkedin,
        tiktok: req.body.socialLinks.tiktok || seller.socialLinks?.tiktok
      };
    }

    if (req.body.storeAddress) {
      seller.storeAddress = {
        street: req.body.storeAddress.street || seller.storeAddress?.street,
        city: req.body.storeAddress.city || seller.storeAddress?.city,
        state: req.body.storeAddress.state || seller.storeAddress?.state,
        zipCode: req.body.storeAddress.zipCode || seller.storeAddress?.zipCode,
        country: req.body.storeAddress.country || seller.storeAddress?.country,
        coordinates: {
          lat: req.body.storeAddress.coordinates?.lat || seller.storeAddress?.coordinates?.lat,
          lng: req.body.storeAddress.coordinates?.lng || seller.storeAddress?.coordinates?.lng
        }
      };
    }

    if (req.body.businessAddress) {
      seller.businessAddress = {
        street: req.body.businessAddress.street || seller.businessAddress?.street,
        city: req.body.businessAddress.city || seller.businessAddress?.city,
        state: req.body.businessAddress.state || seller.businessAddress?.state,
        zipCode: req.body.businessAddress.zipCode || seller.businessAddress?.zipCode,
        country: req.body.businessAddress.country || seller.businessAddress?.country
      };
    }

    if (req.body.bankAccount) {
      seller.bankAccount = {
        iban: req.body.bankAccount.iban || seller.bankAccount?.iban,
        bankName: req.body.bankAccount.bankName || seller.bankAccount?.bankName
      };
    }

    if (req.body.shopSettings) {
      seller.shopSettings = {
        ...seller.shopSettings,
        ...req.body.shopSettings
      };
    }

    if (req.body.paymentMethod) {
      seller.paymentMethod = req.body.paymentMethod;
    }

    // L'admin può cambiare la password senza verificare quella attuale (privilegio admin)
    if (req.body.password && req.body.password.length >= 8) {
      seller.password = req.body.password;
    }

    await seller.save();

    res.status(200).json(seller);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get tutti i prodotti (admin)
// @route   GET /api/admin/products
// @access  Private/Admin
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('seller', 'businessName email')
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get tutti gli ordini (admin)
// @route   GET /api/admin/orders
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('buyer', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Registra un nuovo venditore (admin)
// @route   POST /api/admin/register-vendor
// @access  Private/Admin
export const registerVendor = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password,
      businessName,
      vatNumber,
      phoneNumber,
      address,
      city,
      zipCode,
      uniqueCode,
      selectedCategories,
      subscription
    } = req.body;

    console.log('[ADMIN] Registrazione venditore ricevuta:', { name, email, businessName, vatNumber });

    // Verifica se l'utente esiste già
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'Utente già registrato con questa email' });
    }

    // Prepara i dati del venditore
    const userData = {
      name,
      email,
      password,
      role: 'seller',
      businessName,
      vatNumber,
      phone: phoneNumber,
      businessCategories: selectedCategories || [],
      isApproved: true, // Approvato automaticamente
      subscriptionPaid: true,
      subscriptionPaidAt: new Date(),
      subscriptionPaymentId: `ADMIN_REG_${Date.now()}`,
      subscriptionType: subscription || '1anno'
    };

    // Gestione Codice SDI o PEC
    if (uniqueCode) {
      if (uniqueCode.includes('@')) {
        userData.pec = uniqueCode; // È una PEC
      } else {
        userData.codiceSDI = uniqueCode; // È un codice SDI
      }
    }

    // Indirizzo aziendale
    if (address || city || zipCode) {
      userData.businessAddress = {
        street: address || '',
        city: city || '',
        zipCode: zipCode || '',
        country: 'IT'
      };
      userData.storeAddress = {
        street: address || '',
        city: city || '',
        zipCode: zipCode || '',
        country: 'IT'
      };
    }

    // Calcola scadenza abbonamento (1 anno)
    const now = new Date();
    const endDate = new Date(now.setFullYear(now.getFullYear() + 1));
    userData.subscriptionEndDate = endDate;

    // Crea l'utente
    const user = await User.create(userData);

    console.log('[ADMIN] Venditore registrato con successo:', user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      businessName: user.businessName,
      isApproved: user.isApproved,
      subscriptionEndDate: user.subscriptionEndDate,
      createdAt: user.createdAt
    });

  } catch (error) {
    console.error('[ADMIN] Errore registrazione venditore:', error);
    res.status(500).json({ message: error.message });
  }
};
