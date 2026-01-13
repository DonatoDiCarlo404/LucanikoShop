import express from "express";
import { getCategories, createCategory } from "../controllers/categoryController.js";
import { getCategoryAttributes } from "../controllers/categoryAttributeController.js";

const router = express.Router();

// Route per ottenere tutte le categorie
router.get("/", getCategories);

// Route per creare una nuova categoria
router.post("/", createCategory);

// NUOVO: Route per ottenere attributi di una categoria specifica
router.get("/:id/attributes", getCategoryAttributes);

export default router;