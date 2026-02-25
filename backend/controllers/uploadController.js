import cloudinary from '../config/cloudinary.js';
import User from '../models/User.js';

// @desc    Lista PDF caricati per venditore
// @route   GET /api/upload/vendor/:vendorId/list
// @access  Admin/Vendor
export const listVendorDocuments = async (req, res) => {
  try {
    const vendorId = req.params.vendorId;
    
    console.log('🔍 Ricerca documenti per vendorId:', vendorId);
    
    // Recupera vendorDocuments dal database
    const vendor = await User.findById(vendorId).select('vendorDocuments');
    
    if (!vendor) {
      return res.status(404).json({ message: 'Venditore non trovato' });
    }
    
    const files = (vendor.vendorDocuments || []).map(doc => ({
      name: doc.name,
      url: doc.url,
      filename: doc.public_id, // Per compatibilità con il frontend (usato per eliminazione)
      uploadedAt: doc.uploadedAt
    }));
    
    console.log('✅ File trovati per questo vendor:', files.length);
    res.json({ files });
  } catch (error) {
    console.error('❌ Errore in listVendorDocuments:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Elimina documento PDF venditore
// @route   DELETE /api/upload/vendor/:vendorId/document/:public_id
// @access  Admin
export const deleteVendorDocument = async (req, res) => {
  try {
    const { vendorId, public_id } = req.params;
    
    console.log('🗑️ Eliminazione documento:', { vendorId, public_id });
    
    // Elimina da Cloudinary
    await cloudinary.uploader.destroy(public_id, { resource_type: 'raw' });
    
    // Rimuovi dal database
    await User.findByIdAndUpdate(vendorId, {
      $pull: { vendorDocuments: { public_id: public_id } }
    });
    
    console.log('✅ Documento eliminato con successo');
    res.status(200).json({ message: 'Documento eliminato con successo' });
  } catch (error) {
    console.error('❌ Errore eliminazione documento:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload PDF documento venditore
// @route   POST /api/upload/vendor/:vendorId
// @access  Admin
export const uploadVendorDocumentController = async (req, res) => {
  try {
    const vendorId = req.params.vendorId;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Nessun file PDF caricato' });
    }
    
    console.log('📄 File caricato su Cloudinary:', req.file.path);
    console.log('📄 Public ID:', req.file.filename);
    
    // Salva riferimento nel database
    const documentData = {
      name: req.file.originalname,
      url: req.file.path,
      public_id: req.file.filename,
      uploadedAt: new Date()
    };
    
    await User.findByIdAndUpdate(vendorId, {
      $push: { vendorDocuments: documentData }
    });
    
    console.log('✅ Documento salvato nel database');
    
    res.status(200).json({
      message: 'Documento PDF caricato con successo',
      url: req.file.path,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('❌ Errore upload documento:', error);
    res.status(500).json({ message: error.message });
  }
};


// @desc    Upload immagine prodotto
// @route   POST /api/upload/product
// @access  Private (seller/admin)
export const uploadProductImage = async (req, res) => {
  try {
    console.log('🔵 uploadProductImage chiamato');
    console.log('📁 req.file:', req.file);
    console.log('👤 req.user:', req.user);
    
    if (!req.file) {
      console.log('❌ Nessun file trovato');
      return res.status(400).json({ message: 'Nessuna immagine caricata' });
    }

    console.log('✅ Immagine caricata:', req.file.path);
    res.status(200).json({
      message: 'Immagine caricata con successo',
      url: req.file.path,
      public_id: req.file.filename,
    });
  } catch (error) {
    console.log('❌ Errore in uploadProductImage:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload avatar utente
// @route   POST /api/upload/avatar
// @access  Private
export const uploadAvatarImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nessuna immagine caricata' });
    }

    res.status(200).json({
      message: 'Avatar caricato con successo',
      url: req.file.path,
      public_id: req.file.filename,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Elimina immagine da Cloudinary
// @route   DELETE /api/upload/:public_id
// @access  Private
export const deleteImage = async (req, res) => {
  try {
    const { public_id } = req.params;
    
    await cloudinary.uploader.destroy(public_id);

    res.status(200).json({
      message: 'Immagine eliminata con successo',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};