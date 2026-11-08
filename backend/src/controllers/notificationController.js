import { db } from '../config/database.js';

export const notificationController = {
  getNotifications: async (req, res, next) => {
    try {
      const notifications = await db.notifications.findByUserId(req.user.id);
      res.json({ success: true, notifications });
    } catch (err) {
      next(err);
    }
  },

  markAsRead: async (req, res, next) => {
    try {
      const updated = await db.notifications.markAsRead(req.params.id, req.user.id);
      res.json({ success: true, notification: updated });
    } catch (err) {
      next(err);
    }
  },

  markAllAsRead: async (req, res, next) => {
    try {
      await db.notifications.markAllAsRead(req.user.id);
      res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (err) {
      next(err);
    }
  }
};
