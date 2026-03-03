import Experience from '../models/Experience.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Get all active experiences (public)
// @route   GET /api/experiences
// @access  Public
export const getExperiences = async (req, res) => {
  try {
    const experiences = await Experience.find({ status: 'active' }).sort({ createdAt: -1 });
    res.json(experiences);
  } catch (error) {
    console.error('Errore recupero esperienze:', error);
    res.status(500).json({ message: 'Errore recupero esperienze' });
  }
};

// @desc    Get all experiences (admin)
// @route   GET /api/experiences/admin
// @access  Private/Admin
export const getAllExperiences = async (req, res) => {
  try {
    const experiences = await Experience.find().sort({ createdAt: -1 });
    res.json(experiences);
  } catch (error) {
    console.error('Errore recupero esperienze (admin):', error);
    res.status(500).json({ message: 'Errore recupero esperienze' });
  }
};

// @desc    Get single experience
// @route   GET /api/experiences/:id
// @access  Public
export const getExperienceById = async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.id);
    if (!experience) {
      return res.status(404).json({ message: 'Esperienza non trovata' });
    }
    res.json(experience);
  } catch (error) {
    console.error('Errore recupero esperienza:', error);
    res.status(500).json({ message: 'Errore recupero esperienza' });
  }
};

// @desc    Create new experience
// @route   POST /api/experiences
// @access  Private/Admin
export const createExperience = async (req, res) => {
  try {
    const { title, description, company, city, address, phone, website, category, images, status } = req.body;

    // Validazione campi obbligatori
    if (!title || !description || !company || !city || !phone || !category) {
      return res.status(400).json({ message: 'Campi obbligatori mancanti' });
    }

    const experience = new Experience({
      title,
      description,
      company,
      city,
      address,
      phone,
      website,
      category,
      images: images || [],
      status: status || 'active'
    });

    const createdExperience = await experience.save();
    res.status(201).json(createdExperience);
  } catch (error) {
    console.error('Errore creazione esperienza:', error);
    res.status(500).json({ message: 'Errore creazione esperienza' });
  }
};

// @desc    Update experience
// @route   PUT /api/experiences/:id
// @access  Private/Admin
export const updateExperience = async (req, res) => {
  try {
    const { title, description, company, city, address, phone, website, category, images, status } = req.body;

    const experience = await Experience.findById(req.params.id);
    if (!experience) {
      return res.status(404).json({ message: 'Esperienza non trovata' });
    }

    experience.title = title || experience.title;
    experience.description = description || experience.description;
    experience.company = company || experience.company;
    experience.city = city || experience.city;
    experience.address = address !== undefined ? address : experience.address;
    experience.phone = phone || experience.phone;
    experience.website = website !== undefined ? website : experience.website;
    experience.category = category || experience.category;
    experience.images = images !== undefined ? images : experience.images;
    experience.status = status || experience.status;

    const updatedExperience = await experience.save();
    res.json(updatedExperience);
  } catch (error) {
    console.error('Errore aggiornamento esperienza:', error);
    res.status(500).json({ message: 'Errore aggiornamento esperienza' });
  }
};

// @desc    Delete experience
// @route   DELETE /api/experiences/:id
// @access  Private/Admin
export const deleteExperience = async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.id);
    if (!experience) {
      return res.status(404).json({ message: 'Esperienza non trovata' });
    }

    // Elimina immagini da Cloudinary
    for (const image of experience.images) {
      if (image.public_id) {
        try {
          await cloudinary.uploader.destroy(image.public_id);
        } catch (err) {
          console.error('Errore eliminazione immagine Cloudinary:', err);
        }
      }
    }

    await Experience.findByIdAndDelete(req.params.id);
    res.json({ message: 'Esperienza eliminata' });
  } catch (error) {
    console.error('Errore eliminazione esperienza:', error);
    res.status(500).json({ message: 'Errore eliminazione esperienza' });
  }
};
