const express = require('express');

const router = express.Router();

const notificationController = require('../controllers/notification.controller');
const {
    requireAuth,
    requireAdmin
} = require('../middleware/auth.middleware');

/**
 * =========================================================
 * AE RENEWABLE NETWORK
 * NOTIFICATION ROUTES
 * =========================================================
 */

/**
 * GET /api/notifications
 * Get current user's notifications
 */
router.get(
    '/',
    requireAuth,
    notificationController.getNotifications
);

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
router.get(
    '/unread-count',
    requireAuth,
    notificationController.getUnreadCount
);

router.post(
    '/installer-broadcast',
    requireAuth,
    requireAdmin,
    notificationController.broadcastToInstallers
);

/**
 * GET /api/notifications/:id
 * Get one notification
 */
router.get(
    '/:id',
    requireAuth,
    notificationController.getNotification
);

/**
 * PATCH /api/notifications/:id/read
 * Mark one notification as read
 */
router.patch(
    '/:id/read',
    requireAuth,
    notificationController.markAsRead
);

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
router.patch(
    '/read-all',
    requireAuth,
    notificationController.markAllAsRead
);

/**
 * DELETE /api/notifications/:id
 * Delete one notification
 */
router.delete(
    '/:id',
    requireAuth,
    notificationController.deleteNotification
);

/**
 * DELETE /api/notifications
 * Delete all notifications
 */
router.delete(
    '/',
    requireAuth,
    notificationController.deleteAllNotifications
);

module.exports = router;