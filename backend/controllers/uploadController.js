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