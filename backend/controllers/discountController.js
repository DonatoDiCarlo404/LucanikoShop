import { Discount, Product } from '../models/index.js';

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
      couponCode,
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

    // Aggiorna lo sconto
    discount = await Discount.findByIdAndUpdate(
      req.params.id,
      req.body,
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
        category: { $in: discount.categories },
        seller: discount.seller,
        activeDiscount: discount._id
      });
      
      for (const product of products) {
        product.removeDiscount();
        await product.save();
      }
    }

    await discount.deleteOne();

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
    const products = await Product.find({
      hasActiveDiscount: true,
      isActive: true,
      stock: { $gt: 0 }
    })
      .populate('seller', 'name businessName')
      .populate('activeDiscount', 'name discountType discountValue endDate')
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .sort('-discountPercentage');

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Funzioni helper
async function applyDiscountToProducts(discount) {
  const products = await Product.find({
    _id: { $in: discount.products },
    seller: discount.seller
  });

  for (const product of products) {
    product.applyDiscount(discount);
    await product.save();
  }
}

async function applyDiscountToCategories(discount) {
  const products = await Product.find({
    category: { $in: discount.categories },
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

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Codice coupon non valido'
      });
    }

    // Verifica validità temporale
    if (!discount.isValidNow()) {
      return res.status(400).json({
        success: false,
        message: 'Questo coupon è scaduto o non è più valido'
      });
    }

    // Verifica importo minimo
    if (cartTotal < discount.minPurchaseAmount) {
      return res.status(400).json({
        success: false,
        message: `Importo minimo di acquisto richiesto: €${discount.minPurchaseAmount}`
      });
    }

    res.status(200).json({
      success: true,
      discount: {
        _id: discount._id,
        name: discount.name,
        couponCode: discount.couponCode,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        maxDiscountAmount: discount.maxDiscountAmount,
        minPurchaseAmount: discount.minPurchaseAmount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
