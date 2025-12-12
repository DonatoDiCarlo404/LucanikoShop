import express from "express";
import { getCategories, createCategory } from "../controllers/categoryController.js";

const router = express.Router();

// Route per ottenere tutte le categorie
router.get("/", getCategories);

// Route per creare una nuova categoria
router.post("/", createCategory);

export default router;