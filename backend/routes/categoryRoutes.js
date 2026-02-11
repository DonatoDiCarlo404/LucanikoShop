import express from "express";
import { getCategories, createCategory, getMainCategories, getSubcategories } from "../controllers/categoryController.js";
import { getCategoryAttributes } from "../controllers/categoryAttributeController.js";
import { cache } from "../middlewares/cache.js";

const router = express.Router();

// Route per ottenere tutte le categorie (CACHE: 10 minuti)
router.get("/", cache(600), getCategories);

// Route per ottenere solo le macrocategorie (CACHE: 10 minuti)
router.get("/main", cache(600), getMainCategories);

// Route per creare una nuova categoria
router.post("/", createCategory);

// Route per ottenere le sottocategorie di una categoria parent (CACHE: 10 minuti)
router.get("/:parentId/subcategories", cache(600), getSubcategories);

// NUOVO: Route per ottenere attributi di una categoria specifica (CACHE: 10 minuti)
router.get("/:id/attributes", cache(600), getCategoryAttributes);

export default router;