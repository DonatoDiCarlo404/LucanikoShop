import fs from 'fs';
import path from 'path';
// @desc    Lista PDF caricati per venditore
// @route   GET /api/upload/vendor/:vendorId/list
// @access  Admin
export const listVendorDocuments = async (req, res) => {
  try {
    const vendorId = req.params.vendorId;
    const dirPath = path.join(process.cwd(), 'uploads', 'vendor_docs');
    
    console.log('🔍 Ricerca documenti per vendorId:', vendorId);
    console.log('📁 Directory:', dirPath);
    
    if (!fs.existsSync(dirPath)) {
      console.log('⚠️ Directory non esiste');
      return res.json({ files: [] });
    }
    
    // Costruisci URL dinamicamente basato su req
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    const allFiles = fs.readdirSync(dirPath);
    console.log('📄 Tutti i file nella directory:', allFiles);
    
    const files = allFiles
      .filter(f => f.endsWith('.pdf') && f.startsWith(vendorId))
      .map(f => ({
        name: f.replace(`${vendorId}-`, '').replace(/^\d+-/, ''),
        url: `${baseUrl}/uploads/vendor_docs/${f}`,
        filename: f  // Nome completo del file per eliminazione
      }));
    
    console.log('✅ File trovati per questo vendor:', files.length);
    res.json({ files });
  } catch (error) {
    console.error('❌ Errore in listVendorDocuments:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Elimina documento PDF venditore
// @route   DELETE /api/upload/vendor/:vendorId/document/:filename
// @access  Admin
export const deleteVendorDocument = async (req, res) => {
  try {
    const { vendorId, filename } = req.params;
    const filePath = path.join(process.cwd(), 'uploads', 'vendor_docs', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File non trovato' });
    }

    // Verifica che il file appartenga al venditore
    if (!filename.startsWith(vendorId)) {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    fs.unlinkSync(filePath);
    
    res.status(200).json({ message: 'Documento eliminato con successo' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload PDF documento venditore
// @route   POST /api/upload/vendor/:vendorId
// @access  Admin
export const uploadVendorDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nessun file PDF caricato' });
    }
    // Qui puoi salvare il path nel profilo venditore se vuoi
    // Esempio: Vendor.findByIdAndUpdate(req.params.vendorId, { $push: { documents: req.file.path } })
    res.status(200).json({
      message: 'Documento PDF caricato con successo',
      url: req.file.path,
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
import cloudinary from '../config/cloudinary.js';

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