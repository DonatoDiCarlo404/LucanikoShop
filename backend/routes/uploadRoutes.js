import express from 'express';
import { uploadProductImage, uploadAvatarImage, deleteImage, uploadVendorDocumentController, listVendorDocuments, deleteVendorDocument } from '../controllers/uploadController.js';
import { uploadProduct, uploadAvatar, uploadVendorDocument } from '../config/cloudinary.js';
import { protect, seller, admin } from '../middlewares/auth.js';

const router = express.Router();

// Lista PDF venditore
router.get('/vendor/:vendorId/list', listVendorDocuments);

// Elimina documento PDF venditore (solo admin)
router.delete('/vendor/:vendorId/document/:public_id', protect, admin, deleteVendorDocument);

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

// Upload PDF venditore - usa Cloudinary
router.post('/vendor/:vendorId', uploadVendorDocument.single('pdf'), handleMulterError, uploadVendorDocumentController);

// Upload immagine prodotto (solo seller e admin)
router.post('/product', protect, seller, uploadProduct.single('image'), handleMulterError, uploadProductImage);

// Upload avatar (tutti gli utenti autenticati)
router.post('/avatar', protect, uploadAvatar.single('image'), uploadAvatarImage);

// Elimina immagine (protetto)
router.delete('/:public_id', protect, deleteImage);

export default router;