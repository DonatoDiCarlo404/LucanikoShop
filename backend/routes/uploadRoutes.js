import express from 'express';
import { uploadProductImage, uploadAvatarImage, deleteImage, uploadVendorDocument, listVendorDocuments } from '../controllers/uploadController.js';
import { uploadProduct, uploadAvatar } from '../config/cloudinary.js';
import multer from 'multer';
import { protect, seller } from '../middlewares/auth.js';

const router = express.Router();

// Lista PDF venditore
router.get('/vendor/:vendorId/list', listVendorDocuments);

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


// Multer per PDF vendor
const vendorPdfStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/vendor_docs');
  },
  filename: function (req, file, cb) {
    const vendorId = req.params.vendorId;
    cb(null, `${vendorId}-${Date.now()}-${file.originalname}`);
  }
});
const uploadVendorPdf = multer({ storage: vendorPdfStorage, fileFilter: (req, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('Solo file PDF sono ammessi'));
}});

// Upload PDF venditore
router.post('/vendor/:vendorId', uploadVendorPdf.single('pdf'), handleMulterError, uploadVendorDocument);

// Upload immagine prodotto (solo seller e admin)
router.post('/product', protect, seller, uploadProduct.single('image'), handleMulterError, uploadProductImage);

// Upload avatar (tutti gli utenti autenticati)
router.post('/avatar', protect, uploadAvatar.single('image'), uploadAvatarImage);

// Elimina immagine (protetto)
router.delete('/:public_id', protect, deleteImage);

export default router;