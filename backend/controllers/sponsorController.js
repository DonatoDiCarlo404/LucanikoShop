import Sponsor from '../models/Sponsor.js';

// @desc    Get all active sponsors (public)
// @route   GET /api/sponsors
// @access  Public
export const getSponsors = async (req, res) => {
  try {
    const sponsors = await Sponsor.find({ status: 'active' }).sort({ tier: 1, name: 1 });
    res.json(sponsors);
  } catch (error) {
    console.error('Errore recupero sponsor:', error);
    res.status(500).json({ message: 'Errore recupero sponsor' });
  }
};

// @desc    Get all sponsors (admin)
// @route   GET /api/sponsors/admin
// @access  Private/Admin
export const getAllSponsors = async (req, res) => {
  try {
    const sponsors = await Sponsor.find().sort({ tier: 1, name: 1 });
    res.json(sponsors);
  } catch (error) {
    console.error('Errore recupero sponsor (admin):', error);
    res.status(500).json({ message: 'Errore recupero sponsor' });
  }
};

// @desc    Get single sponsor
// @route   GET /api/sponsors/:id
// @access  Public
export const getSponsorById = async (req, res) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id);
    if (!sponsor) {
      return res.status(404).json({ message: 'Sponsor non trovato' });
    }
    res.json(sponsor);
  } catch (error) {
    console.error('Errore recupero sponsor:', error);
    res.status(500).json({ message: 'Errore recupero sponsor' });
  }
};

// @desc    Create new sponsor
// @route   POST /api/sponsors
// @access  Private/Admin
export const createSponsor = async (req, res) => {
  try {
    const { name, description, city, phone, website, logo, tier, status } = req.body;

    // Validazione campi obbligatori
    if (!name || !description || !city || !phone || !website || !tier) {
      return res.status(400).json({ message: 'Campi obbligatori mancanti' });
    }

    const sponsor = new Sponsor({
      name,
      description,
      city,
      phone,
      website,
      logo,
      tier,
      status: status || 'active'
    });

    const createdSponsor = await sponsor.save();
    res.status(201).json(createdSponsor);
  } catch (error) {
    console.error('Errore creazione sponsor:', error);
    res.status(500).json({ message: 'Errore creazione sponsor' });
  }
};

// @desc    Update sponsor
// @route   PUT /api/sponsors/:id
// @access  Private/Admin
export const updateSponsor = async (req, res) => {
  try {
    const { name, description, city, phone, website, logo, tier, status } = req.body;

    const sponsor = await Sponsor.findById(req.params.id);
    if (!sponsor) {
      return res.status(404).json({ message: 'Sponsor non trovato' });
    }

    sponsor.name = name || sponsor.name;
    sponsor.description = description || sponsor.description;
    sponsor.city = city || sponsor.city;
    sponsor.phone = phone || sponsor.phone;
    sponsor.website = website || sponsor.website;
    sponsor.logo = logo !== undefined ? logo : sponsor.logo;
    sponsor.tier = tier || sponsor.tier;
    sponsor.status = status || sponsor.status;

    const updatedSponsor = await sponsor.save();
    res.json(updatedSponsor);
  } catch (error) {
    console.error('Errore aggiornamento sponsor:', error);
    res.status(500).json({ message: 'Errore aggiornamento sponsor' });
  }
};

// @desc    Delete sponsor
// @route   DELETE /api/sponsors/:id
// @access  Private/Admin
export const deleteSponsor = async (req, res) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id);
    if (!sponsor) {
      return res.status(404).json({ message: 'Sponsor non trovato' });
    }

    await Sponsor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sponsor eliminato' });
  } catch (error) {
    console.error('Errore eliminazione sponsor:', error);
    res.status(500).json({ message: 'Errore eliminazione sponsor' });
  }
};
