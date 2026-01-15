import { Product, Category } from '../models/index.js';
import CategoryAttribute from '../models/CategoryAttribute.js';
import cloudinary from '../config/cloudinary.js';

// Utility: genera SKU automatico per varianti
const generateSKU = (productName, attributes) => {
  const prefix = productName.substring(0, 3).toUpperCase();
  const attrCode = attributes
    .map(a => (a.value || '').substring(0, 2).toUpperCase())
    .join('-');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${attrCode}-${random}`;
};

// @desc    Ottieni tutti i prodotti (con filtri e ricerca)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const { search, category, subcategory, minPrice, maxPrice, sortBy, page = 1, limit = 12 } = req.query;

    // Costruisci query - solo prodotti attivi per catalogo pubblico
    let query = { isActive: true };

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

    // Determina l'ordinamento
    let sortOptions = { createdAt: -1 }; // default: più recenti

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

    const products = await Product.find(query)
      .populate('seller', 'name businessName email')
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .limit(Number(limit))
      .skip(skip)
      .sort(sortOptions);

    const total = await Product.countDocuments(query);

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
      .populate('seller', 'name businessName email avatar')
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
    // DEBUG: logga tutto il body ricevuto
    console.log('--- [DEBUG] Richiesta creazione prodotto ---');
    console.log('req.body:', JSON.stringify(req.body, null, 2));

    if (req.body.customAttributes) {
      console.log('typeof customAttributes:', typeof req.body.customAttributes);
      console.log('customAttributes:', req.body.customAttributes);
      if (Array.isArray(req.body.customAttributes)) {
        console.log('customAttributes è un array, length:', req.body.customAttributes.length);
      } else {
        console.log('customAttributes NON è un array');
        // Se è una stringa, prova a fare il parse
        if (typeof req.body.customAttributes === 'string') {
          try {
            req.body.customAttributes = JSON.parse(req.body.customAttributes);
            console.log('customAttributes dopo parse:', req.body.customAttributes);
          } catch (e) {
            console.error('Errore parsing customAttributes:', e);
          }
        }
      }
    }

    const { 
      name, description, price, category, subcategory, stock, unit, expiryDate, tags,
      attributes, hasVariants, variants, customAttributes, selectedVariantAttributes, sellerId 
    } = req.body;

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
        
        processedVariants.push(variant);
      }
    }

    // DEBUG: Log dei dati che stiamo per passare a Product.create
    const productData = {
      name,
      description,
      price,
      category,
      subcategory: subcategory || null,
      stock,
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
    
    console.log('--- [DEBUG] Dati per Product.create ---');
    console.log('productData.customAttributes:', JSON.stringify(productData.customAttributes, null, 2));
    console.log('typeof productData.customAttributes:', typeof productData.customAttributes);
    console.log('Array.isArray(productData.customAttributes):', Array.isArray(productData.customAttributes));
    
    const product = await Product.create(productData);

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
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Prodotto non trovato' });
    }

    // Verifica che sia il proprietario o admin
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorizzato a modificare questo prodotto' });
    }

    const { 
      name, description, price, category, subcategory, stock, unit, expiryDate, tags, isActive, images,
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
    if (price) product.price = price;
    if (category) product.category = category;
    if (subcategory !== undefined) product.subcategory = subcategory || null;
    if (stock !== undefined) product.stock = stock;
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
      // Genera SKU per varianti che ne sono prive
      product.variants = variants.map(v => ({
        ...v,
        sku: v.sku || generateSKU(product.name, v.attributes)
      }));
    }

    const updatedProduct = await product.save();

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
      .populate('seller', 'businessName name')
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