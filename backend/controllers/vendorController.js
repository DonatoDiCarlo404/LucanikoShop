import { User, Product, Review } from '../models/index.js';

// @desc    Ottieni profilo pubblico venditore (per ID o slug)
// @route   GET /api/vendors/:idOrSlug
// @access  Public
export const getPublicVendorProfile = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    
    // Cerca per ID MongoDB o per slug
    let vendor;
    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      // È un ID MongoDB valido
      vendor = await User.findById(idOrSlug).select(
        'name businessName ragioneSociale businessDescription logo businessEmail businessPhone businessWhatsapp website socialLinks isApproved createdAt role shopSettings news businessCategories slug'
      );
    } else {
      // È uno slug
      vendor = await User.findOne({ slug: idOrSlug }).select(
        'name businessName ragioneSociale businessDescription logo businessEmail businessPhone businessWhatsapp website socialLinks isApproved createdAt role shopSettings news businessCategories slug'
      );
    }

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

    // Calcola statistiche pubbliche dalle recensioni effettive
    const totalProducts = products.length;
    
    // Ottieni tutte le recensioni dei prodotti del venditore
    const productIds = products.map(p => p._id);
    const reviews = await Review.find({ product: { $in: productIds } });
    
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

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
        businessCategories: vendor.businessCategories,
        slug: vendor.slug
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
    }).select('name businessName ragioneSociale businessDescription logo storeAddress businessCategories createdAt slug');

    // Formatta i dati per includere la città, le categorie e lo slug
    const formattedVendors = vendors.map(vendor => ({
      _id: vendor._id,
      name: vendor.name,
      businessName: vendor.businessName,
      ragioneSociale: vendor.ragioneSociale,
      businessDescription: vendor.businessDescription,
      logo: vendor.logo,
      city: vendor.storeAddress?.city || '',
      businessCategories: vendor.businessCategories || [],
      slug: vendor.slug,
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
