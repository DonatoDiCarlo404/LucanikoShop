import express from 'express';
import {
  getEvents,
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
} from '../controllers/eventController.js';
import { protect, admin } from '../middlewares/auth.js';
import { cache } from '../middlewares/cache.js';

const router = express.Router();

// Public routes (CACHE: 5 minuti per liste, 10 minuti per dettagli)
router.get('/', cache(300), getEvents);
router.get('/:id', cache(600), getEventById);

// Admin routes
router.get('/admin/all', protect, admin, getAllEvents);
router.post('/', protect, admin, createEvent);
router.put('/:id', protect, admin, updateEvent);
router.delete('/:id', protect, admin, deleteEvent);

export default router;
