import { Discount, Product } from '../models/index.js';
import { invalidateCache } from '../middlewares/cache.js';
import mongoose from 'mongoose';

// @desc    Crea un nuovo sconto
// @route   POST /api/discounts
// @access  Private/Seller
export const createDiscount = async (req, res) => {
  try {
    const {
      name,
      description,
      discountType,
      discountValue,
      applicationType,
      products,
      categories,
      couponCode,
      startDate,
      endDate,
      usageLimit,
      minPurchaseAmount,
      maxDiscountAmount,
      sellerId // Admin può specificare il venditore
    } = req.body;

    console.log('🟢 [COUPON DEBUG] Richiesta creazione coupon:', {
      couponCode,
      discountType,
      discountValue,
      applicationType,
      startDate,
      endDate
    });

    // Verifica che l'utente sia un seller o admin
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo i venditori possono creare sconti'
      });
    }

    // Determina il venditore: se admin e sellerId è fornito, usa quello; altrimenti usa req.user._id
    const targetSellerId = (req.user.role === 'admin' && sellerId) ? sellerId : req.user._id;

    // Verifica che i prodotti appartengano al venditore (se applicationType = 'product')
    if (applicationType === 'product' && products && products.length > 0) {
      const sellerProducts = await Product.find({
        _id: { $in: products },
        seller: targetSellerId
      });

      if (sellerProducts.length !== products.length) {
        return res.status(403).json({
          success: false,
          message: 'Puoi applicare sconti solo ai prodotti del venditore'
        });
      }
    }

    // Crea lo sconto
    const discount = await Discount.create({
      name,
      description,
      seller: targetSellerId,
      discountType,
      discountValue,
      applicationType,
      products,
      categories,
      couponCode: couponCode && couponCode.trim() !== '' ? couponCode : undefined, // Converti stringa vuota in undefined
      startDate,
      endDate,
      usageLimit,
      minPurchaseAmount,
      maxDiscountAmount
    });

    // Applica automaticamente lo sconto ai prodotti se applicationType = 'product'
    if (applicationType === 'product' && products && products.length > 0) {
      await applyDiscountToProducts(discount);
    }

    // Applica automaticamente lo sconto ai prodotti della categoria se applicationType = 'category'
    if (applicationType === 'category' && categories && categories.length > 0) {
      await applyDiscountToCategories(discount);
    }

    // Ricarica il discount con tutte le sue relazioni
    const populatedDiscount = await Discount.findById(discount._id)
      .populate('products', 'name price hasActiveDiscount discountedPrice')
      .populate('categories', 'name');

    // Invalida cache sconti e prodotti
    await invalidateCache('cache:/api/discounts*');
    await invalidateCache('cache:/api/products*');

    res.status(201).json({
      success: true,
      discount: populatedDiscount
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Ottieni tutti gli sconti del seller
// @route   GET /api/discounts?sellerId=xxx (admin può specificare sellerId)
// @access  Private/Seller
export const getMyDiscounts = async (req, res) => {
  try {
    // Se admin, può richiedere gli sconti di un venditore specifico tramite query param
    const targetSellerId = (req.user.role === 'admin' && req.query.sellerId) 
      ? req.query.sellerId 
      : req.user._id;

    const discounts = await Discount.find({ seller: targetSellerId })
      .populate('products', 'name price')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: discounts.length,
      discounts
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Ottieni un singolo sconto
// @route   GET /api/discounts/:id
// @access  Private/Seller
export const getDiscount = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id)
      .populate('products', 'name price images')
      .populate('seller', 'name businessName');

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Sconto non trovato'
      });
    }

    // Verifica che lo sconto appartenga al seller
    if (discount.seller._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorizzato ad accedere a questo sconto'
      });
    }

    res.status(200).json({
      success: true,
      discount
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Aggiorna uno sconto
// @route   PUT /api/discounts/:id
// @access  Private/Seller
export const updateDiscount = async (req, res) => {
  try {
    let discount = await Discount.findById(req.params.id);

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Sconto non trovato'
      });
    }

    // Verifica che lo sconto appartenga al seller
    if (discount.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorizzato a modificare questo sconto'
      });
    }

    // Rimuovi lo sconto dai prodotti precedenti
    if (discount.applicationType === 'product' && discount.products.length > 0) {
      await removeDiscountFromProducts(discount);
    }

    // Prepara i dati da aggiornare, convertendo stringhe vuote in undefined
    const updateData = { ...req.body };
    if (updateData.couponCode !== undefined && (!updateData.couponCode || updateData.couponCode.trim() === '')) {
      updateData.couponCode = undefined;
    }

    // Aggiorna lo sconto
    discount = await Discount.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    // Applica il nuovo sconto
    if (discount.applicationType === 'product' && discount.products.length > 0) {
      await applyDiscountToProducts(discount);
    } else if (discount.applicationType === 'category' && discount.categories.length > 0) {
      await applyDiscountToCategories(discount);
    }

    // Invalida cache
    await invalidateCache('cache:/api/discounts*');
    await invalidateCache('cache:/api/products*');

    res.status(200).json({
      success: true,
      discount
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Elimina uno sconto
// @route   DELETE /api/discounts/:id
// @access  Private/Seller
export const deleteDiscount = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Sconto non trovato'
      });
    }

    // Verifica che lo sconto appartenga al seller
    if (discount.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorizzato a eliminare questo sconto'
      });
    }

    // Rimuovi lo sconto dai prodotti
    if (discount.applicationType === 'product' && discount.products.length > 0) {
      await removeDiscountFromProducts(discount);
    } else if (discount.applicationType === 'category' && discount.categories.length > 0) {
      const products = await Product.find({
        $or: [
          { category: { $in: discount.categories } },
          { subcategory: { $in: discount.categories } }
        ],
        seller: discount.seller,
        activeDiscount: discount._id
      });
      
      for (const product of products) {
        product.removeDiscount();
        await product.save();
      }
    }

    await discount.deleteOne();

    // Invalida cache
    await invalidateCache('cache:/api/discounts*');
    await invalidateCache('cache:/api/products*');

    res.status(200).json({
      success: true,
      message: 'Sconto eliminato con successo'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Attiva/Disattiva uno sconto
// @route   PATCH /api/discounts/:id/toggle
// @access  Private/Seller
export const toggleDiscount = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Sconto non trovato'
      });
    }

    // Verifica che lo sconto appartenga al seller
    if (discount.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorizzato a modificare questo sconto'
      });
    }

    discount.isActive = !discount.isActive;
    await discount.save();

    // Applica o rimuovi lo sconto dai prodotti
    if (discount.isActive) {
      if (discount.applicationType === 'product') {
        await applyDiscountToProducts(discount);
      } else if (discount.applicationType === 'category') {
        await applyDiscountToCategories(discount);
      }
    } else {
      if (discount.applicationType === 'product') {
        await removeDiscountFromProducts(discount);
      } else if (discount.applicationType === 'category') {
        const products = await Product.find({
          category: { $in: discount.categories },
          seller: discount.seller,
          activeDiscount: discount._id
        });
        
        for (const product of products) {
          product.removeDiscount();
          await product.save();
        }
      }
    }

    // Invalida cache
    await invalidateCache('cache:/api/discounts*');
    await invalidateCache('cache:/api/products*');

    res.status(200).json({
      success: true,
      discount
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Ottieni tutti i prodotti in sconto (per clienti)
// @route   GET /api/discounts/active-products
// @access  Public
export const getActiveDiscountedProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      sortBy = 'random',  // random | discount-desc | discount-asc | date-desc
      category, 
      subcategory,
      minDiscount,
      maxDiscount,
      search
    } = req.query;

    // Query base: prodotti con sconto attivo + visibili
    let query = {
      hasActiveDiscount: true,
      isActive: true,
      $and: [
        {
          $or: [ // BACKWARD COMPATIBILITY: isVisible undefined = true
            { isVisible: true },
            { isVisible: { $exists: false } },
            { isVisible: null }
          ]
        },
        {
          $or: [
            { hasVariants: false, stock: { $gt: 0 } },
            { hasVariants: true, 'variants.0': { $exists: true } }
          ]
        }
      ]
    };

    // Filtro categoria - ⚡ Converti esplicitamente a ObjectId
    if (category) {
      try {
        query.category = new mongoose.Types.ObjectId(category);
      } catch (err) {
        // Se non è un ObjectId valido, usa la stringa (per retrocompatibilità)
        query.category = category;
      }
    }

    // Filtro sottocategoria - ⚡ Converti esplicitamente a ObjectId
    if (subcategory) {
      try {
        query.subcategory = new mongoose.Types.ObjectId(subcategory);
      } catch (err) {
        // Se non è un ObjectId valido, usa la stringa (per retrocompatibilità)
        query.subcategory = subcategory;
      }
    }

    // Filtro percentuale sconto
    if (minDiscount || maxDiscount) {
      query.discountPercentage = {};
      if (minDiscount) query.discountPercentage.$gte = Number(minDiscount);
      if (maxDiscount) query.discountPercentage.$lte = Number(maxDiscount);
    }

    // ⚡ Ricerca parziale case-insensitive (match anche stringhe parziali)
    if (search) {
      // Escape caratteri speciali regex
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.name = { $regex: escapedSearch, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    let products, total;

    // ⚡⚡⚡ PERFORMANCE: Usa $facet per count + data in una sola query
    if (sortBy === 'random') {
      const sampleSize = Math.min(Number(limit), 100); // Limit max per performance
      
      const pipeline = [
        { $match: query },
        // ⚡ $facet permette count e data in parallelo (1 query invece di 2)
        {
          $facet: {
            totalCount: [{ $count: 'count' }],
            products: [
              { $sample: { size: sampleSize } },
              // ⚡ Project PRIMA dei lookup per escludere campi pesanti subito
              {
                $project: {
                  // Escludi solo campi effettivamente non usati da ProductCard
                  description: 0,
                  customAttributes: 0,
                  attributes: 0,
                  reviews: 0
                  // ⚡ NON escludere images, name, price, stock, variants, ecc.
                  // ProductCard li usa tutti!
                }
              },
              // ⚡ Lookup ottimizzati: solo campi necessari
              {
                $lookup: {
                  from: 'users',
                  localField: 'seller',
                  foreignField: '_id',
                  pipeline: [
                    { $project: { name: 1, businessName: 1, slug: 1 } } // Solo campi usati da ProductCard
                  ],
                  as: 'seller'
                }
              },
              { $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } },
              {
                $lookup: {
                  from: 'categories',
                  localField: 'category',
                  foreignField: '_id',
                  pipeline: [{ $project: { name: 1 } }],
                  as: 'category'
                }
              },
              { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
              {
                $lookup: {
                  from: 'categories',
                  localField: 'subcategory',
                  foreignField: '_id',
                  pipeline: [{ $project: { name: 1 } }],
                  as: 'subcategory'
                }
              },
              { $unwind: { path: '$subcategory', preserveNullAndEmptyArrays: true } }
              // ⚡ RIMOSSO activeDiscount lookup: non usato da ProductCard!
            ]
          }
        }
      ];

      const result = await Product.aggregate(pipeline);
      total = result[0]?.totalCount[0]?.count || 0;
      products = result[0]?.products || [];
    } else {
      // ⚡ Sorting deterministico con aggregation per consistency e performance
      let sortOptions = {};
      if (sortBy === 'discount-desc') {
        sortOptions = { discountPercentage: -1, createdAt: -1 };
      } else if (sortBy === 'discount-asc') {
        sortOptions = { discountPercentage: 1, createdAt: -1 };
      } else if (sortBy === 'date-desc') {
        sortOptions = { createdAt: -1, _id: -1 };
      } else {
        // Fallback per altri casi
        sortOptions = { createdAt: -1, _id: -1 };
      }

      // ⚡ Usa aggregation anche per sorting (più veloce di populate)
      const pipeline = [
        { $match: query },
        {
          $facet: {
            totalCount: [{ $count: 'count' }],
            products: [
              { $sort: sortOptions },
              { $skip: skip },
              { $limit: Number(limit) },
              {
                $project: {
                  description: 0,
                  customAttributes: 0,
                  attributes: 0,
                  reviews: 0
                  // ⚡ RIMOSSO images slice per evitare errori con null/undefined
                }
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'seller',
                  foreignField: '_id',
                  pipeline: [{ $project: { name: 1, businessName: 1, slug: 1 } }],
                  as: 'seller'
                }
              },
              { $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } },
              {
                $lookup: {
                  from: 'categories',
                  localField: 'category',
                  foreignField: '_id',
                  pipeline: [{ $project: { name: 1 } }],
                  as: 'category'
                }
              },
              { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
              {
                $lookup: {
                  from: 'categories',
                  localField: 'subcategory',
                  foreignField: '_id',
                  pipeline: [{ $project: { name: 1 } }],
                  as: 'subcategory'
                }
              },
              { $unwind: { path: '$subcategory', preserveNullAndEmptyArrays: true } }
            ]
          }
        }
      ];

      const result = await Product.aggregate(pipeline);
      total = result[0]?.totalCount[0]?.count || 0;
      products = result[0]?.products || [];
    }

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      products
    });
  } catch (error) {
    console.error('[DISCOUNTS ERROR]:', error.message);
    
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Funzioni helper
async function applyDiscountToProducts(discount) {
  console.log('🔵 [APPLY DISCOUNT] Applicazione sconto ai prodotti:', {
    discountId: discount._id,
    discountName: discount.name,
    productIds: discount.products,
    startDate: discount.startDate,
    endDate: discount.endDate,
    isValidNow: discount.isValidNow(),
    now: new Date()
  });

  const products = await Product.find({
    _id: { $in: discount.products },
    seller: discount.seller
  });

  console.log('🔵 [APPLY DISCOUNT] Prodotti trovati:', products.length);

  for (const product of products) {
    console.log('🔵 [APPLY DISCOUNT] Applicando a prodotto:', {
      productId: product._id,
      productName: product.name,
      hasVariants: product.hasVariants,
      variantsCount: product.variants?.length || 0
    });
    product.applyDiscount(discount);
    await product.save();
    console.log('✅ [APPLY DISCOUNT] Sconto applicato a:', product.name, {
      hasActiveDiscount: product.hasActiveDiscount,
      discountedPrice: product.discountedPrice
    });
  }
}

async function applyDiscountToCategories(discount) {
  // Cerca prodotti che hanno category O subcategory negli _id specificati in discount.categories
  const products = await Product.find({
    $or: [
      { category: { $in: discount.categories } },
      { subcategory: { $in: discount.categories } }
    ],
    seller: discount.seller
  });

  for (const product of products) {
    // Applica solo se il prodotto non ha già uno sconto attivo
    if (!product.hasActiveDiscount) {
      product.applyDiscount(discount);
      await product.save();
    }
  }
}

async function removeDiscountFromProducts(discount) {
  const products = await Product.find({
    _id: { $in: discount.products },
    seller: discount.seller,
    activeDiscount: discount._id
  });

  for (const product of products) {
    product.removeDiscount();
    await product.save();
  }
}

// @desc    Valida un coupon per il carrello
// @route   POST /api/discounts/validate-coupon
// @access  Private
export const validateCoupon = async (req, res) => {
  try {
    const { couponCode, cartTotal } = req.body;
    
    console.log('🟢 [COUPON DEBUG] Richiesta validazione coupon:', { couponCode, cartTotal });

    if (!couponCode) {
      return res.status(400).json({
        success: false,
        message: 'Il codice coupon è obbligatorio'
      });
    }

    // Trova il coupon
    const discount = await Discount.findOne({
      couponCode: couponCode.toUpperCase(),
      applicationType: 'coupon',
      isActive: true
    });
    
    console.log('🟢 [COUPON DEBUG] Coupon cercato:', couponCode.toUpperCase());
    console.log('🟢 [COUPON DEBUG] Coupon trovato:', discount ? {
      _id: discount._id,
      couponCode: discount.couponCode,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      startDate: discount.startDate,
      endDate: discount.endDate,
      isActive: discount.isActive,
      minPurchaseAmount: discount.minPurchaseAmount
    } : null);

    if (!discount) {
      console.log('🔴 [COUPON DEBUG] Coupon non trovato o non attivo');
      return res.status(404).json({
        success: false,
        message: 'Codice coupon non valido'
      });
    }

    // Verifica validità temporale
    const isValid = discount.isValidNow();
    console.log('🟢 [COUPON DEBUG] Verifica validità temporale:', {
      isValid,
      now: new Date(),
      startDate: discount.startDate,
      endDate: discount.endDate
    });
    
    if (!isValid) {
      console.log('🔴 [COUPON DEBUG] Coupon scaduto o non ancora valido');
      return res.status(400).json({
        success: false,
        message: 'Questo coupon è scaduto o non è più valido'
      });
    }

    // Verifica importo minimo
    console.log('🟢 [COUPON DEBUG] Verifica importo minimo:', {
      cartTotal,
      minPurchaseAmount: discount.minPurchaseAmount,
      isPassing: cartTotal >= discount.minPurchaseAmount
    });
    
    if (cartTotal < discount.minPurchaseAmount) {
      console.log('🔴 [COUPON DEBUG] Importo minimo non raggiunto');
      return res.status(400).json({
        success: false,
        message: `Importo minimo di acquisto richiesto: €${discount.minPurchaseAmount}`
      });
    }

    console.log('🟢 [COUPON DEBUG] Coupon valido! Risposta inviata al frontend');
    res.status(200).json({
      success: true,
      discount: {
        _id: discount._id,
        name: discount.name,
        couponCode: discount.couponCode,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        maxDiscountAmount: discount.maxDiscountAmount,
        minPurchaseAmount: discount.minPurchaseAmount,
        seller: discount.seller // Aggiungi seller per applicare sconto solo ai suoi prodotti
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
