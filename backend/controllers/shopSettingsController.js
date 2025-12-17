import { User } from '../models/index.js';

// @desc    Ottieni le configurazioni del negozio del seller
// @route   GET /api/shop-settings
// @access  Private/Seller
export const getShopSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('shopSettings');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    res.status(200).json({
      success: true,
      shopSettings: user.shopSettings || {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Aggiorna le configurazioni del negozio
// @route   PUT /api/shop-settings
// @access  Private/Seller
export const updateShopSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    // Verifica che l'utente sia un seller
    if (user.role !== 'seller' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo i venditori possono configurare il negozio'
      });
    }

    // Aggiorna le impostazioni
    user.shopSettings = {
      ...user.shopSettings,
      ...req.body
    };

    await user.save();

    res.status(200).json({
      success: true,
      shopSettings: user.shopSettings,
      message: 'Configurazioni aggiornate con successo'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Aggiorna le configurazioni di spedizione
// @route   PUT /api/shop-settings/shipping
// @access  Private/Seller
export const updateShippingSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    if (user.role !== 'seller' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo i venditori possono configurare le spedizioni'
      });
    }

    // Aggiorna solo le impostazioni di spedizione
    if (!user.shopSettings) {
      user.shopSettings = {};
    }

    user.shopSettings.shipping = {
      ...user.shopSettings.shipping,
      ...req.body
    };

    await user.save();

    res.status(200).json({
      success: true,
      shipping: user.shopSettings.shipping,
      message: 'Configurazioni di spedizione aggiornate con successo'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Aggiorna le configurazioni prodotto (varianti, taglie, colori, ecc.)
// @route   PUT /api/shop-settings/products
// @access  Private/Seller
export const updateProductSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    if (user.role !== 'seller' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo i venditori possono configurare i prodotti'
      });
    }

    // Aggiorna solo le impostazioni prodotto
    if (!user.shopSettings) {
      user.shopSettings = {};
    }

    user.shopSettings.productSettings = {
      ...user.shopSettings.productSettings,
      ...req.body
    };

    await user.save();

    res.status(200).json({
      success: true,
      productSettings: user.shopSettings.productSettings,
      message: 'Configurazioni prodotto aggiornate con successo'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Ottieni le configurazioni pubbliche di un negozio (per clienti)
// @route   GET /api/shop-settings/public/:sellerId
// @access  Public
export const getPublicShopSettings = async (req, res) => {
  try {
    const user = await User.findById(req.params.sellerId)
      .select('businessName businessDescription shopSettings.shipping shopSettings.returnPolicy shopSettings.minOrderAmount');

    if (!user || user.role !== 'seller') {
      return res.status(404).json({
        success: false,
        message: 'Negozio non trovato'
      });
    }

    res.status(200).json({
      success: true,
      shop: {
        name: user.businessName,
        description: user.businessDescription,
        shipping: user.shopSettings?.shipping,
        returnPolicy: user.shopSettings?.returnPolicy,
        minOrderAmount: user.shopSettings?.minOrderAmount
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Calcola il costo di spedizione
// @route   POST /api/shop-settings/calculate-shipping
// @access  Public
export const calculateShipping = async (req, res) => {
  try {
    const { sellerId, cartTotal, totalWeight } = req.body;

    const seller = await User.findById(sellerId).select('shopSettings.shipping');

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Venditore non trovato'
      });
    }

    const shippingSettings = seller.shopSettings?.shipping;

    if (!shippingSettings) {
      return res.status(200).json({
        success: true,
        shippingCost: 0,
        isFree: false,
        message: 'Configurazioni di spedizione non disponibili'
      });
    }

    // Verifica se la spedizione è gratuita
    if (shippingSettings.freeShipping) {
      return res.status(200).json({
        success: true,
        shippingCost: 0,
        isFree: true,
        message: 'Spedizione gratuita'
      });
    }

    // Verifica se supera la soglia per la spedizione gratuita
    if (shippingSettings.freeShippingThreshold && cartTotal >= shippingSettings.freeShippingThreshold) {
      return res.status(200).json({
        success: true,
        shippingCost: 0,
        isFree: true,
        message: `Spedizione gratuita per ordini superiori a €${shippingSettings.freeShippingThreshold}`
      });
    }

    // Calcola il costo in base alle tariffe
    let shippingCost = shippingSettings.defaultShippingRate || 0;

    if (shippingSettings.shippingRates && shippingSettings.shippingRates.length > 0) {
      // Prendi la prima tariffa disponibile (puoi estendere questa logica)
      const rate = shippingSettings.shippingRates[0];

      if (rate.calculationType === 'fixed') {
        shippingCost = rate.baseRate || 0;
      } else if (rate.calculationType === 'weight' && totalWeight) {
        shippingCost = (rate.baseRate || 0) + (rate.ratePerUnit || 0) * totalWeight;
      } else if (rate.calculationType === 'price' && cartTotal) {
        shippingCost = (rate.baseRate || 0) + (rate.ratePerUnit || 0) * (cartTotal / 100);
      }
    }

    res.status(200).json({
      success: true,
      shippingCost: Math.max(0, shippingCost),
      isFree: false,
      freeShippingThreshold: shippingSettings.freeShippingThreshold
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
