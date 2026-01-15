import express from "express";
import { getCategories, createCategory, getMainCategories, getSubcategories } from "../controllers/categoryController.js";
import { getCategoryAttributes } from "../controllers/categoryAttributeController.js";

const router = express.Router();

// Route per ottenere tutte le categorie
router.get("/", getCategories);

// Route per ottenere solo le macrocategorie
router.get("/main", getMainCategories);

// Route per creare una nuova categoria
router.post("/", createCategory);

// Route per ottenere le sottocategorie di una categoria parent
router.get("/:parentId/subcategories", getSubcategories);

// NUOVO: Route per ottenere attributi di una categoria specifica
router.get("/:id/attributes", getCategoryAttributes);

export default router;