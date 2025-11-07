import express from 'express';
import { uploadProductImage, uploadAvatarImage, deleteImage } from '../controllers/uploadController.js';
import { uploadProduct, uploadAvatar } from '../config/cloudinary.js';
import { protect, seller } from '../middlewares/auth.js';

const router = express.Router();

// Middleware per gestire errori di multer
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.log('❌ Errore Multer:', err);
    return res.status(400).json({ 
      message: 'Errore durante l\'upload del file', 
      error: err.message 
    });
  }
  next();
};

// Upload immagine prodotto (solo seller e admin)
router.post('/product', protect, seller, uploadProduct.single('image'), handleMulterError, uploadProductImage);

// Upload avatar (tutti gli utenti autenticati)
router.post('/avatar', protect, uploadAvatar.single('image'), uploadAvatarImage);

// Elimina immagine (protetto)
router.delete('/:public_id', protect, deleteImage);

export default router;