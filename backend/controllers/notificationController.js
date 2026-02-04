import Notification from '../models/Notification.js';

// GET /api/notifications - Ottieni notifiche utente
export const getNotifications = async (req, res) => {
  try {
    const { read } = req.query;
    const userId = req.user._id;

    const filter = { userId };
    if (read !== undefined) {
      filter.read = read === 'true';
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ 
      userId, 
      read: false 
    });

    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Errore recupero notifiche:', error);
    res.status(500).json({ 
      message: 'Errore nel recupero delle notifiche',
      error: error.message 
    });
  }
};

// PATCH /api/notifications/:id/read - Segna notifica come letta
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({ 
      _id: id, 
      userId 
    });

    if (!notification) {
      return res.status(404).json({ 
        message: 'Notifica non trovata' 
      });
    }

    notification.read = true;
    await notification.save();

    const unreadCount = await Notification.countDocuments({ 
      userId, 
      read: false 
    });

    res.json({
      success: true,
      notification,
      unreadCount
    });
  } catch (error) {
    console.error('Errore aggiornamento notifica:', error);
    res.status(500).json({ 
      message: 'Errore nell\'aggiornamento della notifica',
      error: error.message 
    });
  }
};

// PATCH /api/notifications/mark-all-read - Segna tutte le notifiche come lette
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: 'Tutte le notifiche sono state segnate come lette'
    });
  } catch (error) {
    console.error('Errore aggiornamento notifiche:', error);
    res.status(500).json({ 
      message: 'Errore nell\'aggiornamento delle notifiche',
      error: error.message 
    });
  }
};
