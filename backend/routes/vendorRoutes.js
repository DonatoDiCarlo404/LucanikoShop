import express from 'express';
import { getPublicVendorProfile, getAllVendors } from '../controllers/vendorController.js';

const router = express.Router();

// Rotte pubbliche
router.get('/all', getAllVendors); // Lista tutti i venditori approvati
router.get('/', getAllVendors);    // Alias per retrocompatibilità
router.get('/:id', getPublicVendorProfile);

export default router;
