import express from 'express';
import { protect } from '../middlewares/auth.js';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead 
} from '../controllers/notificationController.js';

const router = express.Router();

// Tutte le rotte richiedono autenticazione
router.use(protect);

// GET /api/notifications - Ottieni notifiche (query: ?read=true/false)
router.get('/', getNotifications);

// PATCH /api/notifications/:id/read - Segna come letta
router.patch('/:id/read', markAsRead);

// PATCH /api/notifications/mark-all-read - Segna tutte come lette
router.patch('/mark-all-read', markAllAsRead);

export default router;
