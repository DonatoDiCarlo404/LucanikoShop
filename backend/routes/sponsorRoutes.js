import express from 'express';
const router = express.Router();
import { protect, admin } from '../middlewares/auth.js';
import {
  getSponsors,
  getAllSponsors,
  getSponsorById,
  createSponsor,
  updateSponsor,
  deleteSponsor
} from '../controllers/sponsorController.js';

// Route pubbliche
router.get('/', getSponsors);
router.get('/:id', getSponsorById);

// Route admin
router.get('/admin/all', protect, admin, getAllSponsors);
router.post('/', protect, admin, createSponsor);
router.put('/:id', protect, admin, updateSponsor);
router.delete('/:id', protect, admin, deleteSponsor);

export default router;
