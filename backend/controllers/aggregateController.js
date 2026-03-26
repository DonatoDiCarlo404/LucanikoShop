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
    
    // ⚡ PERFORMANCE: Select solo campi necessari per ShopPage (invece di tutto il documento)
    const vendorSelect = 'businessName name slug logo businessDescription isApproved createdAt storeAddress businessCategories news';
    
    let vendor;
    if (isObjectId) {
      vendor = await User.findOne({ _id: idOrSlug, role: 'seller', isApproved: true })
        .select(vendorSelect)
        .lean();
    } else {
      vendor = await User.findOne({ slug: idOrSlug, role: 'seller', isApproved: true })
        .select(vendorSelect)
        .lean();
    }

    if (!vendor) {
      return res.status(404).json({ message: 'Negozio non trovato' });
    }

    // ⚡⚡⚡ CRITICAL PERFORMANCE: Usa aggregation invece di populate
    // Con 200+ prodotti, populate fa 400+ query separate (lentissimo!)
    // Aggregation con $lookup fa JOIN a livello DB (10-50x più veloce)
    const products = await Product.aggregate([
      // 1. Match prodotti visibili del vendor
      {
        $match: {
          seller: vendor._id,
          $or: [ // BACKWARD COMPATIBILITY
            { isVisible: true },
            { isVisible: { $exists: false } },
            { isVisible: null }
          ]
        }
      },
      // 2. Sort per data
      { $sort: { createdAt: -1 } },
      // 3. Join con categories per category
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryData'
        }
      },
      // 4. Join con categories per subcategory
      {
        $lookup: {
          from: 'categories',
          localField: 'subcategory',
          foreignField: '_id',
          as: 'subcategoryData'
        }
      },
      // 5. Proietta solo campi necessari per ProductCard
      {
        $project: {
          name: 1,
          price: 1,
          originalPrice: 1,
          discountPercentage: 1,
          hasActiveDiscount: 1,
          ivaPercent: 1,
          stock: 1,
          images: { $slice: ['$images', 2] }, // Solo prime 2 immagini invece di tutte
          category: { $arrayElemAt: ['$categoryData.name', 0] },
          subcategory: { $arrayElemAt: ['$subcategoryData.name', 0] },
          seller: 1,
          isActive: 1,
          hasVariants: 1,
          variants: {
            $cond: {
              if: '$hasVariants',
              then: {
                $map: {
                  input: '$variants',
                  as: 'v',
                  in: {
                    _id: '$$v._id',
                    stock: '$$v.stock',
                    price: '$$v.price',
                    attributes: '$$v.attributes'
                  }
                }
              },
              else: []
            }
          },
          rating: 1,
          numReviews: 1,
          createdAt: 1
          // ⚠️ ESCLUSI per performance: description, customAttributes, reviews, attributes, customFields
        }
      }
    ]);

    // ⚡ Calcola statistiche dalle recensioni usando aggregation (più efficiente)
    const productIds = products.map(p => p._id);
    
    // Una sola aggregation per calcolare count e avg in un colpo solo
    const statsResult = await Review.aggregate([
      { $match: { product: { $in: productIds } } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      }
    ]);

    const totalReviews = statsResult[0]?.totalReviews || 0;
    const avgRating = statsResult[0]?.avgRating || 0;

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
