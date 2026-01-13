import CategoryAttribute from '../models/CategoryAttribute.js';
import Category from '../models/Category.js';

// GET /api/categories/:id/attributes - Ottieni attributi per categoria
export const getCategoryAttributes = async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica che la categoria esista
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Categoria non trovata' });
    }

    // Recupera tutti gli attributi attivi per questa categoria
    const attributes = await CategoryAttribute.find({ 
      category: id,
      active: true 
    }).sort({ order: 1, name: 1 });

    res.json(attributes);
  } catch (error) {
    console.error('Errore nel recupero degli attributi:', error);
    res.status(500).json({ message: 'Errore del server', error: error.message });
  }
};

// POST /api/category-attributes - Crea nuovo attributo (ADMIN)
export const createCategoryAttribute = async (req, res) => {
  try {
    const { category, name, key, type, required, allowVariants, options, placeholder, validation, order } = req.body;

    // Verifica che la categoria esista
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({ message: 'Categoria non trovata' });
    }

    // Verifica che non esista già un attributo con la stessa key per questa categoria
    const existingAttribute = await CategoryAttribute.findOne({ category, key });
    if (existingAttribute) {
      return res.status(400).json({ message: 'Esiste già un attributo con questa chiave per questa categoria' });
    }

    const attribute = await CategoryAttribute.create({
      category,
      name,
      key,
      type: type || 'text',
      required: required || false,
      allowVariants: allowVariants || false,
      options: options || [],
      placeholder,
      validation,
      order: order || 0
    });

    res.status(201).json(attribute);
  } catch (error) {
    console.error('Errore nella creazione dell\'attributo:', error);
    res.status(500).json({ message: 'Errore del server', error: error.message });
  }
};

// PUT /api/category-attributes/:id - Aggiorna attributo (ADMIN)
export const updateCategoryAttribute = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const attribute = await CategoryAttribute.findById(id);
    if (!attribute) {
      return res.status(404).json({ message: 'Attributo non trovato' });
    }

    // Aggiorna solo i campi forniti
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        attribute[key] = updates[key];
      }
    });

    await attribute.save();
    res.json(attribute);
  } catch (error) {
    console.error('Errore nell\'aggiornamento dell\'attributo:', error);
    res.status(500).json({ message: 'Errore del server', error: error.message });
  }
};

// DELETE /api/category-attributes/:id - Elimina attributo (ADMIN)
export const deleteCategoryAttribute = async (req, res) => {
  try {
    const { id } = req.params;

    const attribute = await CategoryAttribute.findById(id);
    if (!attribute) {
      return res.status(404).json({ message: 'Attributo non trovato' });
    }

    await attribute.deleteOne();
    res.json({ message: 'Attributo eliminato con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione dell\'attributo:', error);
    res.status(500).json({ message: 'Errore del server', error: error.message });
  }
};

// GET /api/category-attributes - Lista tutti gli attributi (ADMIN)
export const getAllCategoryAttributes = async (req, res) => {
  try {
    const attributes = await CategoryAttribute.find()
      .populate('category', 'name')
      .sort({ category: 1, order: 1 });

    res.json(attributes);
  } catch (error) {
    console.error('Errore nel recupero di tutti gli attributi:', error);
    res.status(500).json({ message: 'Errore del server', error: error.message });
  }
};
