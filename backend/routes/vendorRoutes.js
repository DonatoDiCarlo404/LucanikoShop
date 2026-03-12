import express from 'express';
import { getPublicVendorProfile, getAllVendors } from '../controllers/vendorController.js';
import { cache } from '../middlewares/cache.js';

const router = express.Router();

// Rotte pubbliche con cache
router.get('/all', cache(600), getAllVendors); // Lista tutti i venditori approvati - 10 min
router.get('/', cache(600), getAllVendors);    // Alias per retrocompatibilità - 10 min
router.get('/:idOrSlug', cache(600), getPublicVendorProfile); // Profilo vendor - 10 min

export default router;
