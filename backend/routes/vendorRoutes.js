import express from 'express';
import { getPublicVendorProfile, getAllVendors } from '../controllers/vendorController.js';

const router = express.Router();

// Rotte pubbliche
router.get('/', getAllVendors);
router.get('/:id', getPublicVendorProfile);

export default router;
