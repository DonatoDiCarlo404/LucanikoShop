import { User } from '../models/index.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * ⚡ PERFORMANCE: Endpoint aggregato per AdminDashboard
 * Unisce 3 chiamate API in una sola: stats + pendingSellers + allSellers
 * 
 * @desc    Get dati completi dashboard admin
 * @route   GET /api/aggregate/admin-dashboard
 * @access  Private/Admin
 */
export const getAdminDashboardData = async (req, res) => {
  try {
    // ⚡ Esegui tutte le query in parallelo con Promise.all
    const [
      totalUsers,
      totalSellers,
      pendingSellers,
      approvedSellers,
      buyers,
      pendingSellersList,
      allSellersList
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'seller' }),
      User.countDocuments({ role: 'seller', isApproved: false }),
      User.countDocuments({ role: 'seller', isApproved: true }),
      User.countDocuments({ role: 'buyer' }),
      User.find({ role: 'seller', isApproved: false })
        .select('-password')
        .sort({ createdAt: -1 })
        .lean(), // ⚡ .lean() per performance
      User.find({ role: 'seller' })
        .select('-password')
        .sort({ createdAt: -1 })
        .lean() // ⚡ .lean() per performance
    ]);

    // Carica documenti per tutti i venditori in parallelo
    const vendorDocs = {};
    const docsPath = path.join(process.cwd(), 'uploads', 'vendor_docs');
    
    await Promise.all(
      allSellersList.map(async (seller) => {
        try {
          const sellerPath = path.join(docsPath, seller._id.toString());
          const files = await fs.readdir(sellerPath);
          vendorDocs[seller._id] = files;
        } catch {
          vendorDocs[seller._id] = [];
        }
      })
    );

    // Risposta aggregata
    res.json({
      stats: {
        totalUsers,
        totalSellers,
        pendingSellers,
        approvedSellers,
        buyers
      },
      pendingSellers: {
        count: pendingSellersList.length,
        sellers: pendingSellersList
      },
      allSellers: {
        count: allSellersList.length,
        sellers: allSellersList
      },
      vendorDocs
    });
  } catch (error) {
    console.error('❌ Errore aggregateController.getAdminDashboardData:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * ⚡ PERFORMANCE: Endpoint aggregato per ShopPage
 * Unisce 2 chiamate API in una sola: vendor info + products
 * (Le reviews vengono caricate separatamente perché dipendono dai prodotti)
 * 
 * @desc    Get dati completi shop vendor (profilo + prodotti)
 * @route   GET /api/aggregate/shop/:idOrSlug
 * @access  Public
 */
export const getShopPageData = async (req, res) => {
  try {
    const { idOrSlug } = req.params;

    // Verifica se è un ObjectId o uno slug
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    
    let vendor;
    if (isObjectId) {
      vendor = await User.findOne({ _id: idOrSlug, role: 'seller', isApproved: true })
        .select('-password -paymentMethods')
        .lean();
    } else {
      vendor = await User.findOne({ slug: idOrSlug, role: 'seller', isApproved: true })
        .select('-password -paymentMethods')
        .lean();
    }

    if (!vendor) {
      return res.status(404).json({ message: 'Negozio non trovato' });
    }

    // Carica prodotti del vendor in parallelo
    // Mostra TUTTI i prodotti visibili (inclusi quelli in modalità vacanza)
    // ProductCard gestirà il badge "Non disponibile" per isActive: false
    const products = await Product.find({ 
      seller: vendor._id,
      $or: [ // BACKWARD COMPATIBILITY: isVisible undefined = true
        { isVisible: true },
        { isVisible: { $exists: false } },
        { isVisible: null }
      ]
    })
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .select('-description -customAttributes') // ⚡ Escludi campi pesanti
      .sort({ createdAt: -1 })
      .lean(); // ⚡ .lean() per performance

    // ⚡ Calcola statistiche dalle recensioni (come l'endpoint originale)
    const productIds = products.map(p => p._id);
    const reviews = await Review.find({ product: { $in: productIds } }).lean();
    
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    // Risposta aggregata (struttura identica all'endpoint originale)
    res.json({
      vendor,
      products,
      stats: {
        totalProducts: products.length,
        avgRating: avgRating.toFixed(1),
        totalReviews
      }
    });
  } catch (error) {
    console.error('❌ Errore aggregateController.getShopPageData:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * ⚡ PERFORMANCE: Endpoint aggregato per reviews di più prodotti
 * Ottimizza il caricamento delle reviews per ShopPage
 * 
 * @desc    Get reviews per lista di prodotti
 * @route   POST /api/aggregate/reviews-batch
 * @access  Public
 */
export const getBatchReviews = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.json({ reviews: {} });
    }

    // Una sola query per tutte le reviews
    const allReviews = await Review.find({ 
      product: { $in: productIds } 
    })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .lean(); // ⚡ .lean() per performance

    // Raggruppa reviews per prodotto
    const reviewsByProduct = {};
    allReviews.forEach(review => {
      const productId = review.product.toString();
      if (!reviewsByProduct[productId]) {
        reviewsByProduct[productId] = [];
      }
      reviewsByProduct[productId].push(review);
    });

    res.json({ reviews: reviewsByProduct });
  } catch (error) {
    console.error('❌ Errore aggregateController.getBatchReviews:', error);
    res.status(500).json({ message: error.message });
  }
};
