import express from 'express';
const router = express.Router();
import { protect, admin } from '../middlewares/auth.js';
import { cache } from '../middlewares/cache.js';
import {
  getSponsors,
  getAllSponsors,
  getSponsorById,
  createSponsor,
  updateSponsor,
  deleteSponsor
} from '../controllers/sponsorController.js';

// Route pubbliche con cache
router.get('/', cache(600), getSponsors); // 10 minuti
router.get('/:id', cache(600), getSponsorById); // 10 minuti

// Route admin
router.get('/admin/all', protect, admin, getAllSponsors);
router.post('/', protect, admin, createSponsor);
router.put('/:id', protect, admin, updateSponsor);
router.delete('/:id', protect, admin, deleteSponsor);

export default router;
