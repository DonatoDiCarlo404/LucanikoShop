import { User, Product } from '../models/index.js';

// @desc    Ottieni profilo pubblico venditore
// @route   GET /api/vendors/:id
// @access  Public
export const getPublicVendorProfile = async (req, res) => {
  try {
    const vendor = await User.findById(req.params.id).select(
      'name businessName ragioneSociale businessDescription logo businessEmail businessPhone businessWhatsapp website socialLinks isApproved createdAt role shopSettings news businessCategories'
    );

    if (!vendor) {
      return res.status(404).json({ message: 'Venditore non trovato' });
    }

    if (vendor.role !== 'seller' && vendor.role !== 'admin') {
      return res.status(404).json({ message: 'Questo utente non è un venditore' });
    }

    // Ottieni prodotti attivi del venditore
    const products = await Product.find({ 
      seller: vendor._id, 
      isActive: true
    })
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .populate('seller', 'name businessName')
      .select('name description price images category subcategory stock rating numReviews hasActiveDiscount discountedPrice discountPercentage unit isActive variants originalPrice ivaPercent seller')
      .sort('-createdAt')
      .limit(50);

    // Calcola statistiche pubbliche
    const totalProducts = products.length;
    const avgRating = products.length > 0
      ? products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length
      : 0;
    const totalReviews = products.reduce((sum, p) => sum + (p.numReviews || 0), 0);

    res.json({
      vendor: {
        _id: vendor._id,
        name: vendor.name,
        businessName: vendor.businessName,
        ragioneSociale: vendor.ragioneSociale,
        businessDescription: vendor.businessDescription,
        logo: vendor.logo,
        businessEmail: vendor.businessEmail,
        businessPhone: vendor.businessPhone,
        businessWhatsapp: vendor.businessWhatsapp,
        website: vendor.website,
        socialLinks: vendor.socialLinks,
        isApproved: vendor.isApproved,
        memberSince: vendor.createdAt,
        shopSettings: vendor.shopSettings,
        news: vendor.news,
        businessCategories: vendor.businessCategories
      },
      products,
      stats: {
        totalProducts,
        avgRating: avgRating.toFixed(1),
        totalReviews
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Ottieni tutti i venditori approvati
// @route   GET /api/vendors
// @access  Public
export const getAllVendors = async (req, res) => {
  try {
    const vendors = await User.find({ 
      role: 'seller', 
      isApproved: true 
    }).select('name businessName ragioneSociale businessDescription logo storeAddress businessCategories createdAt');

    // Formatta i dati per includere la città e le categorie
    const formattedVendors = vendors.map(vendor => ({
      _id: vendor._id,
      name: vendor.name,
      businessName: vendor.businessName,
      ragioneSociale: vendor.ragioneSociale,
      businessDescription: vendor.businessDescription,
      logo: vendor.logo,
      city: vendor.storeAddress?.city || '',
      businessCategories: vendor.businessCategories || [],
      memberSince: vendor.createdAt
    }));

    res.json({
      count: formattedVendors.length,
      vendors: formattedVendors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
