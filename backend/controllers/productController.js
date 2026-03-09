import { Product, Category } from '../models/index.js';
import CategoryAttribute from '../models/CategoryAttribute.js';
import cloudinary from '../config/cloudinary.js';
import { invalidateCache } from '../middlewares/cache.js';

// Utility: genera SKU automatico per varianti
const generateSKU = (productName, attributes) => {
  const prefix = productName.substring(0, 3).toUpperCase();
  const attrCode = attributes
    .map(a => (a.value || '').substring(0, 2).toUpperCase())
    .join('-');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${attrCode}-${random}`;
};

// Utility: converte valori numerici gestendo sia punto che virgola come separatore decimale
const parseNumericValue = (value) => {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Sostituisce la virgola con il punto e converte in numero
    const parsed = parseFloat(value.replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// @desc    Ottieni tutti i prodotti (con filtri e ricerca)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const { search, category, subcategory, minPrice, maxPrice, sortBy, page = 1, limit = 12 } = req.query;

    // Costruisci query - mostra tutti i prodotti (isActive gestito nel frontend)
    let query = {};

    // Ricerca full-text
    if (search) {
      query.$text = { $search: search };
    }

    // Filtro categoria - cerca per nome e usa l'ObjectId
    if (category) {
      const categoryDoc = await Category.findOne({ name: category });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      } else {
        // Se la categoria non esiste, ritorna array vuoto
        return res.json({
          products: [],
          page: Number(page),
          pages: 0,
          total: 0,
        });
      }
    }

    // Filtro sottocategoria
    if (subcategory) {
      const subcategoryDoc = await Category.findOne({ name: subcategory });
      if (subcategoryDoc) {
        query.subcategory = subcategoryDoc._id;
      }
    }

    // Filtro prezzo
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Paginazione
    const skip = (page - 1) * limit;

    // Seed per ordinamento random consistente
    const seed = req.query.seed ? parseInt(req.query.seed) : null;

    // Determina l'ordinamento - default RANDOM per varietà
    let sortOptions = null;
    let useRandom = !sortBy || sortBy === 'random'; // Default o esplicito random

    if (sortBy === 'price-asc') {
      sortOptions = { price: 1 };
    } else if (sortBy === 'price-desc') {
      sortOptions = { price: -1 };
    } else if (sortBy === 'name') {
      sortOptions = { name: 1 };
    } else if (sortBy === 'date-asc') {
      sortOptions = { createdAt: 1 };
    } else if (sortBy === 'date-desc') {
      sortOptions = { createdAt: -1 };
    }

    let products;
    const total = await Product.countDocuments(query);

    // Se ordinamento random CON seed, usa un ordinamento consistente
    if (useRandom && seed) {
      // Ordinamento pseudo-random ma consistente basato sul seed
      products = await Product.find(query)
        .populate('seller', 'name businessName email')
        .populate('category', 'name')
        .populate('subcategory', 'name')
        .lean()
        .exec();

      // Ordina i prodotti usando il seed in modo consistente
      products.sort((a, b) => {
        // Funzione hash migliorata che mescola meglio i dati
        const hash = (id) => {
          const str = seed + id.toString();
          let h = 0;
          for (let i = 0; i < str.length; i++) {
            h = ((h << 5) - h) + str.charCodeAt(i);
            h = h & h; // Convert to 32bit integer
          }
          return Math.abs(h);
        };
        
        return hash(a._id) - hash(b._id);
      });

      // Applica skip e limit manualmente
      products = products.slice(skip, skip + Number(limit));
    }
    // Se ordinamento random SENZA seed, usa aggregation con $sample
    else if (useRandom) {
      // Calcola quanti documenti servono per questa pagina
      const sampleSize = Math.min(Number(limit), total);
      
      const pipeline = [
        { $match: query },
        { $sample: { size: sampleSize + skip } }, // Prendi più elementi per simulare skip
        { $skip: skip },
        { $limit: Number(limit) },
        {
          $lookup: {
            from: 'users',
            localField: 'seller',
            foreignField: '_id',
            as: 'seller'
          }
        },
        { $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'categories',
            localField: 'subcategory',
            foreignField: '_id',
            as: 'subcategory'
          }
        },
        { $unwind: { path: '$subcategory', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            'seller.password': 0,
            'seller.paymentMethods': 0,
            'seller.role': 0
          }
        }
      ];

      products = await Product.aggregate(pipeline);
    } else {
      // Ordinamento classico
      products = await Product.find(query)
        .populate('seller', 'name businessName email slug')
        .populate('category', 'name')
        .populate('subcategory', 'name')
        .limit(Number(limit))
        .skip(skip)
        .sort(sortOptions);
    }

    res.json({
      products,
      page: Number(page),
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Ottieni singolo prodotto
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name businessName email avatar slug')
      .populate('category', 'name')
      .populate('subcategory', 'name');

    if (!product) {
      return res.status(404).json({ message: 'Prodotto non trovato' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Crea nuovo prodotto
// @route   POST /api/products
// @access  Private (seller/admin)
export const createProduct = async (req, res) => {

  try {
    console.log('📥 [BACKEND CREATE] Dati ricevuti:', req.body);
    console.log('📥 [BACKEND CREATE] Weight ricevuto:', req.body.weight);
    
    // Parse customAttributes se è stringa
    if (req.body.customAttributes) {
      if (!Array.isArray(req.body.customAttributes)) {
        if (typeof req.body.customAttributes === 'string') {
          try {
            req.body.customAttributes = JSON.parse(req.body.customAttributes);
          } catch (e) {
            console.error('Errore parsing customAttributes:', e);
          }
        }
      }
    }

    const { 
      name, description, price, ivaPercent, category, subcategory, stock, weight, unit, expiryDate, tags,
      attributes, hasVariants, variants, customAttributes, selectedVariantAttributes, sellerId 
    } = req.body;

    // Converti valori numerici gestendo virgola e punto
    const parsedPrice = parseNumericValue(price);
    const parsedIvaPercent = parseNumericValue(ivaPercent);
    const parsedStock = parseNumericValue(stock);
    const parsedWeight = parseNumericValue(weight);

    // Determina il seller: se admin e sellerId fornito, usa quello, altrimenti l'utente loggato
    let actualSellerId = req.user._id;
    if (req.user.role === 'admin' && sellerId) {
      actualSellerId = sellerId;
    }

    // Validazione attributi obbligatori per categoria (escludi quelli per varianti)
    const categoryAttrs = await CategoryAttribute.find({ 
      category,
      required: true,
      allowVariants: false  // Solo attributi obbligatori NON per varianti
    });
    
    // Verifica che tutti gli attributi obbligatori siano forniti
    for (const attr of categoryAttrs) {
      const provided = attributes?.find(a => a.key === attr.key);
      if (!provided || !provided.value) {
        return res.status(400).json({ 
          message: `Attributo obbligatorio mancante: ${attr.name}` 
        });
      }
    }
    
    // Se ha varianti, valida che ogni variante abbia attributi completi
    let processedVariants = [];
    if (hasVariants && variants?.length > 0) {
      const variantAttrs = categoryAttrs.filter(a => a.allowVariants);
      
      for (const variant of variants) {
        // Verifica che la variante abbia tutti gli attributi necessari
        for (const attr of variantAttrs) {
          const hasAttr = variant.attributes?.find(a => a.key === attr.key);
          if (!hasAttr) {
            return res.status(400).json({
              message: `Variante incompleta: manca ${attr.name}`
            });
          }
        }
        
        // Auto-genera SKU se mancante
        if (!variant.sku) {
          variant.sku = generateSKU(name, variant.attributes);
        }
        
        // Converti valori numerici nelle varianti
        const processedVariant = {
          ...variant,
          price: parseNumericValue(variant.price),
          stock: parseNumericValue(variant.stock),
          weight: parseNumericValue(variant.weight)
        };
        
        processedVariants.push(processedVariant);
      }
    }

    // DEBUG: Log dei dati che stiamo per passare a Product.create
    const productData = {
      name,
      description,
      price: parsedPrice,
      ivaPercent: parsedIvaPercent,
      category,
      subcategory: subcategory || null,
      stock: parsedStock,
      weight: parsedWeight,
      unit,
      expiryDate,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      seller: actualSellerId,
      images: [], // Le immagini vengono aggiunte dopo
      attributes: attributes ? attributes.filter(a => a.value && a.value.trim()) : [],
      customAttributes: customAttributes || [],
      selectedVariantAttributes: selectedVariantAttributes || [],
      hasVariants: hasVariants || false,
      variants: processedVariants
    };
    
    console.log('💾 [BACKEND CREATE] ProductData da creare:', productData);
    console.log('💾 [BACKEND CREATE] Weight in productData:', productData.weight);
    console.log('💾 [BACKEND CREATE] Weight originale:', weight, '-> parsato:', parsedWeight);
    
    const product = await Product.create(productData);
    
    console.log('✅ [BACKEND CREATE] Prodotto creato:', product);
    console.log('✅ [BACKEND CREATE] Weight del prodotto creato:', product.weight);

    // Invalida cache prodotti dopo creazione
    await invalidateCache('cache:/api/products*');

    res.status(201).json(product);
  } catch (error) {
    console.error('--- [DEBUG] Errore durante createProduct ---');
    console.error('error.name:', error.name);
    console.error('error.message:', error.message);
    console.error('error.errors:', error.errors);
    console.error('Full error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Aggiorna prodotto
// @route   PUT /api/products/:id
// @access  Private (seller proprietario o admin)
export const updateProduct = async (req, res) => {
  try {
    console.log('📥 [BACKEND UPDATE] Dati ricevuti:', req.body);
    console.log('📥 [BACKEND UPDATE] Weight ricevuto:', req.body.weight);
    
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Prodotto non trovato' });
    }

    // Verifica che sia il proprietario o admin
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorizzato a modificare questo prodotto' });
    }

    const { 
      name, description, price, ivaPercent, category, subcategory, stock, weight, unit, expiryDate, tags, isActive, images,
      attributes, hasVariants, variants, customAttributes, selectedVariantAttributes 
    } = req.body;

    // Se la categoria cambia, validazione attributi (escludi quelli per varianti)
    if (category && category !== product.category.toString()) {
      const categoryAttrs = await CategoryAttribute.find({ 
        category,
        required: true,
        allowVariants: false  // Solo attributi obbligatori NON per varianti
      });
      
      for (const attr of categoryAttrs) {
        const provided = attributes?.find(a => a.key === attr.key);
        if (!provided || !provided.value) {
          return res.status(400).json({ 
            message: `Attributo obbligatorio mancante: ${attr.name}` 
          });
        }
      }
    }

    // Aggiorna solo i campi forniti
    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined) {
      product.price = parseNumericValue(price);
      // Se il prodotto ha uno sconto attivo, riapplicalo con il nuovo prezzo
      if (product.hasActiveDiscount && product.activeDiscount) {
        const Discount = (await import('../models/index.js')).Discount;
        const discount = await Discount.findById(product.activeDiscount);
        if (discount && discount.isValidNow()) {
          product.applyDiscount(discount);
        } else {
          // Lo sconto non è più valido, rimuovilo
          product.removeDiscount();
        }
      }
    }
    if (ivaPercent !== undefined) product.ivaPercent = parseNumericValue(ivaPercent);
    if (category) product.category = category;
    if (subcategory !== undefined) product.subcategory = subcategory || null;
    if (stock !== undefined) product.stock = parseNumericValue(stock);
    if (weight !== undefined) {
      product.weight = parseNumericValue(weight);
      console.log('✅ [BACKEND UPDATE] Weight originale:', weight, '-> parsato:', product.weight);
    }
    if (unit) product.unit = unit;
    if (expiryDate) product.expiryDate = expiryDate;
    if (tags) product.tags = tags.split(',').map(tag => tag.trim());
    if (isActive !== undefined) product.isActive = isActive;
    if (Array.isArray(images)) product.images = images;
    
    // NUOVO: aggiorna attributi e varianti
    if (attributes) product.attributes = attributes.filter(a => a.value && a.value.trim());
    if (customAttributes) product.customAttributes = customAttributes;
    if (selectedVariantAttributes) product.selectedVariantAttributes = selectedVariantAttributes;
    if (hasVariants !== undefined) product.hasVariants = hasVariants;
    if (variants) {
      // Genera SKU e converte valori numerici per varianti
      product.variants = variants.map(v => ({
        ...v,
        sku: v.sku || generateSKU(product.name, v.attributes),
        price: parseNumericValue(v.price),
        stock: parseNumericValue(v.stock),
        weight: parseNumericValue(v.weight)
      }));
    }

    console.log('💾 [BACKEND UPDATE] Prima del salvataggio - weight:', product.weight);
    const updatedProduct = await product.save();
    console.log('✅ [BACKEND UPDATE] Dopo il salvataggio - weight:', updatedProduct.weight);

    // Invalida cache prodotti dopo aggiornamento
    await invalidateCache('cache:/api/products*');

    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Elimina prodotto
// @route   DELETE /api/products/:id
// @access  Private (seller proprietario o admin)
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Prodotto non trovato' });
    }

    // Verifica che sia il proprietario o admin
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorizzato a eliminare questo prodotto' });
    }

    // Elimina immagini da Cloudinary
    for (const image of product.images) {
      if (image.public_id) {
        await cloudinary.uploader.destroy(image.public_id);
      }
    }
// Invalida cache prodotti dopo eliminazione
    await invalidateCache('cache:/api/products*');

    
    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: 'Prodotto eliminato con successo' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Aggiungi immagine al prodotto
// @route   POST /api/products/:id/images
// @access  Private (seller proprietario o admin)
export const addProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Prodotto non trovato' });
    }

    // Verifica che sia il proprietario o admin
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    const { url, public_id } = req.body;

    product.images.push({ url, public_id });
    await product.save();

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Ottieni prodotti del seller
// @route   GET /api/products/seller/my-products
// @access  Private (seller)
export const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id })
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .populate('seller', 'businessName name slug')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Conta prodotti in attesa di approvazione (DEPRECATO - approvazione rimossa)
// @route   GET /api/products/pending-count
// @access  Private (admin)
export const getPendingProductsCount = async (req, res) => {
  try {
    res.json({ count: 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Ottieni prodotti suggeriti basati sul carrello
// @route   POST /api/products/suggested
// @access  Public
export const getSuggestedProducts = async (req, res) => {
  try {
    const { cartItems, sameVendor = true, limit = 8 } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.json({ products: [] });
    }

    // Estrai categorie e venditori dal carrello
    const categoryIds = [...new Set(cartItems.map(item => item.category?.toString() || item.category))];
    const vendorIds = [...new Set(cartItems.map(item => item.seller?._id?.toString() || item.seller?.toString() || item.seller))];
    const productIds = cartItems.map(item => item._id?.toString() || item._id);

    // Costruisci query base
    let query = {
      _id: { $nin: productIds }, // Escludi prodotti già nel carrello
      isActive: true // Solo prodotti attivi
    };

    // Se cerchiamo prodotti dello stesso venditore
    if (sameVendor) {
      query.seller = { $in: vendorIds };
    } else {
      // Prodotti di altri venditori
      query.seller = { $nin: vendorIds };
    }

    // Filtra per categorie simili
    if (categoryIds.length > 0 && categoryIds[0]) {
      query.category = { $in: categoryIds };
    }

    // Recupera prodotti suggeriti (prendi più risultati per poi randomizzarli)
    const fetchLimit = Number(limit) * 3; // Prendi 3x per avere varietà
    
    const allProducts = await Product.find(query)
      .populate('seller', 'businessName name slug')
      .populate('category', 'name')
      .select('name description price images category subcategory stock rating numReviews hasActiveDiscount discountedPrice discountPercentage discountAmount discountType unit isActive variants originalPrice ivaPercent seller hasVariants')
      .limit(fetchLimit);

    // Randomizza i risultati usando Fisher-Yates shuffle
    const shuffled = [...allProducts];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Prendi solo il numero richiesto
    const products = shuffled.slice(0, Number(limit));

    res.json({ products });
  } catch (error) {
    console.error('Errore recupero prodotti suggeriti:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Ottieni prodotti randomizzati da altre categorie
// @route   GET /api/products/other-categories
// @access  Public
export const getOtherCategoriesProducts = async (req, res) => {
  try {
    const { excludeCategory, limit = 12 } = req.query;

    // Costruisci query - escludi categoria specificata
    let query = {
      isActive: true
    };

    // Se c'è una categoria da escludere, trova il suo ID
    if (excludeCategory) {
      const categoryDoc = await Category.findOne({ name: excludeCategory });
      if (categoryDoc) {
        query.category = { $ne: categoryDoc._id };
      }
    }

    // Usa aggregation con $sample per una randomizzazione vera a livello database
    // Questo garantisce varietà equa tra TUTTE le categorie
    const pipeline = [
      { $match: query },
      { $sample: { size: Number(limit) } }, // Randomizzazione MongoDB nativa
      {
        $lookup: {
          from: 'users',
          localField: 'seller',
          foreignField: '_id',
          as: 'seller'
        }
      },
      { $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: 1,
          description: 1,
          price: 1,
          images: 1,
          category: { _id: 1, name: 1 },
          subcategory: 1,
          stock: 1,
          rating: 1,
          numReviews: 1,
          hasActiveDiscount: 1,
          discountedPrice: 1,
          discountPercentage: 1,
          discountAmount: 1,
          discountType: 1,
          unit: 1,
          isActive: 1,
          variants: 1,
          originalPrice: 1,
          ivaPercent: 1,
          hasVariants: 1,
          seller: { _id: 1, businessName: 1, name: 1, slug: 1 }
        }
      }
    ];

    const products = await Product.aggregate(pipeline);

    res.json({ products });
  } catch (error) {
    console.error('Errore recupero prodotti altre categorie:', error);
    res.status(500).json({ message: error.message });
  }
};