import Category from "../models/Category.js";
import { invalidateCache } from '../middlewares/cache.js';

export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Ottieni solo le macrocategorie (senza parent)
export const getMainCategories = async (req, res) => {
    try {
        const categories = await Category.find({ parent: null });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Ottieni le sottocategorie di una macrocategoria specifica
export const getSubcategories = async (req, res) => {
    try {
        const { parentId } = req.params;
        const subcategories = await Category.find({ parent: parentId });
        res.json(subcategories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const category = await Category.create({ name });
        
        // Invalida cache categorie dopo creazione
        await invalidateCache('cache:/api/categories*');
        
        res.status(201).json(category);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};