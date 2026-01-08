import { Product, Category } from '../models/index.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Ottieni tutti i prodotti (con filtri e ricerca)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, sortBy, page = 1, limit = 12 } = req.query;

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
    const product = await Product.findById(req.params.id).populate('seller', 'name businessName email avatar');

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
    const { name, description, price, category, stock, unit, expiryDate, tags } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock,
      unit,
      expiryDate,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      seller: req.user._id,
      images: [], // Le immagini vengono aggiunte dopo
    });

    res.status(201).json(product);
  } catch (error) {
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

    const { name, description, price, category, stock, unit, expiryDate, tags, isActive } = req.body;

    // Aggiorna solo i campi forniti
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (category) product.category = category;
    if (stock !== undefined) product.stock = stock;
    if (unit) product.unit = unit;
    if (expiryDate) product.expiryDate = expiryDate;
    if (tags) product.tags = tags.split(',').map(tag => tag.trim());
    if (isActive !== undefined) product.isActive = isActive;

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
    const products = await Product.find({ seller: req.user._id }).sort({ createdAt: -1 });

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