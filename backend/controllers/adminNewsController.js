import AdminNews from '../models/AdminNews.js';

// @desc    Ottieni tutte le news attive
// @route   GET /api/admin/news
// @access  Public
export const getAllActiveNews = async (req, res) => {
  try {
    const news = await AdminNews.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5);
    res.status(200).json(news);
  } catch (error) {
    console.error('[getAllActiveNews] Errore:', error);
    res.status(500).json({ message: 'Errore nel recupero delle news' });
  }
};

// @desc    Ottieni tutte le news (admin)
// @route   GET /api/admin/news/all
// @access  Private/Admin
export const getAllNews = async (req, res) => {
  try {
    const news = await AdminNews.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');
    res.status(200).json(news);
  } catch (error) {
    console.error('[getAllNews] Errore:', error);
    res.status(500).json({ message: 'Errore nel recupero delle news' });
  }
};

// @desc    Crea nuova news
// @route   POST /api/admin/news
// @access  Private/Admin
export const createNews = async (req, res) => {
  try {
    const { content } = req.body;

    const news = await AdminNews.create({
      content: content || '',
      createdBy: req.user._id
    });

    res.status(201).json(news);
  } catch (error) {
    console.error('[createNews] Errore:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Aggiorna news
// @route   PUT /api/admin/news/:id
// @access  Private/Admin
export const updateNews = async (req, res) => {
  try {
    const { content, isActive } = req.body;
    const news = await AdminNews.findById(req.params.id);

    if (!news) {
      return res.status(404).json({ message: 'News non trovata' });
    }

    if (content !== undefined) news.content = content;
    if (isActive !== undefined) news.isActive = isActive;

    await news.save();
    res.status(200).json(news);
  } catch (error) {
    console.error('[updateNews] Errore:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Elimina news
// @route   DELETE /api/admin/news/:id
// @access  Private/Admin
export const deleteNews = async (req, res) => {
  try {
    const news = await AdminNews.findById(req.params.id);

    if (!news) {
      return res.status(404).json({ message: 'News non trovata' });
    }

    await news.deleteOne();
    res.status(200).json({ message: 'News eliminata con successo' });
  } catch (error) {
    console.error('[deleteNews] Errore:', error);
    res.status(500).json({ message: error.message });
  }
};
