import User from '../models/User.js';

// @desc    Get tutti i venditori in attesa di approvazione
// @route   GET /api/admin/pending-sellers
// @access  Private/Admin
export const getPendingSellers = async (req, res) => {
  try {
    const pendingSellers = await User.find({
      role: 'seller',
      isApproved: false,
    }).select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      count: pendingSellers.length,
      sellers: pendingSellers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get tutti i venditori (approvati e non)
// @route   GET /api/admin/sellers
// @access  Private/Admin
export const getAllSellers = async (req, res) => {
  try {
    const sellers = await User.find({
      role: 'seller',
    }).select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      count: sellers.length,
      sellers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approva un venditore
// @route   PUT /api/admin/approve-seller/:id
// @access  Private/Admin
export const approveSeller = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);

    if (!seller) {
      return res.status(404).json({ message: 'Venditore non trovato' });
    }

    if (seller.role !== 'seller') {
      return res.status(400).json({ message: 'L\'utente non è un venditore' });
    }

    seller.isApproved = true;
    await seller.save();

    res.status(200).json({
      message: 'Venditore approvato con successo',
      seller: {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        businessName: seller.businessName,
        isApproved: seller.isApproved,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Rifiuta un venditore (elimina account)
// @route   DELETE /api/admin/reject-seller/:id
// @access  Private/Admin
export const rejectSeller = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);

    if (!seller) {
      return res.status(404).json({ message: 'Venditore non trovato' });
    }

    if (seller.role !== 'seller') {
      return res.status(400).json({ message: 'L\'utente non è un venditore' });
    }

    await seller.deleteOne();

    res.status(200).json({
      message: 'Venditore rifiutato ed eliminato',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get statistiche admin
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const pendingSellers = await User.countDocuments({ role: 'seller', isApproved: false });
    const approvedSellers = await User.countDocuments({ role: 'seller', isApproved: true });
    const buyers = await User.countDocuments({ role: 'buyer' });

    res.status(200).json({
      totalUsers,
      totalSellers,
      pendingSellers,
      approvedSellers,
      buyers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
