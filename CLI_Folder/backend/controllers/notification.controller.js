const notificationService = require('../services/notification.service');

/**
 * =========================================================
 * AE RENEWABLE NETWORK
 * NOTIFICATION CONTROLLER
 * =========================================================
 */

/**
 * GET USER NOTIFICATIONS
 */
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const limit = Number.parseInt(req.query.limit, 10) || 50;
        const offset = Number.parseInt(req.query.offset, 10) || 0;

        const unreadOnly = req.query.unreadOnly === 'true';

        const notifications =
            await notificationService.getUserNotifications(
                userId,
                {
                    limit,
                    offset,
                    unreadOnly
                }
            );

        return res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications
        });

    } catch (error) {
        console.error('Get notifications error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve notifications.'
        });
    }
};


/**
 * GET UNREAD NOTIFICATION COUNT
 */
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const unreadCount =
            await notificationService.getUnreadCount(userId);

        return res.status(200).json({
            success: true,
            unread_count: unreadCount
        });

    } catch (error) {
        console.error(
            'Get unread notification count error:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve unread notification count.'
        });
    }
};


/**
 * GET ONE NOTIFICATION
 */
const getNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = Number(req.params.id);

        if (!Number.isInteger(notificationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification ID.'
            });
        }

        const notification =
            await notificationService.getNotificationById(
                notificationId,
                userId
            );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found.'
            });
        }

        return res.status(200).json({
            success: true,
            data: notification
        });

    } catch (error) {
        console.error('Get notification error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve notification.'
        });
    }
};


/**
 * MARK ONE NOTIFICATION AS READ
 */
const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = Number(req.params.id);

        if (!Number.isInteger(notificationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification ID.'
            });
        }

        const notification =
            await notificationService.markAsRead(
                notificationId,
                userId
            );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Notification marked as read.',
            data: notification
        });

    } catch (error) {
        console.error(
            'Mark notification as read error:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read.'
        });
    }
};


/**
 * MARK ALL NOTIFICATIONS AS READ
 */
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        const result =
            await notificationService.markAllAsRead(userId);

        return res.status(200).json({
            success: true,
            message: 'All notifications marked as read.',
            updated_count: result.updatedCount
        });

    } catch (error) {
        console.error(
            'Mark all notifications as read error:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read.'
        });
    }
};


/**
 * DELETE ONE NOTIFICATION
 */
const deleteNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = Number(req.params.id);

        if (!Number.isInteger(notificationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification ID.'
            });
        }

        const notification =
            await notificationService.deleteNotification(
                notificationId,
                userId
            );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Notification deleted successfully.'
        });

    } catch (error) {
        console.error(
            'Delete notification error:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Failed to delete notification.'
        });
    }
};


/**
 * DELETE ALL NOTIFICATIONS
 */
const deleteAllNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const result =
            await notificationService.deleteAllNotifications(
                userId
            );

        return res.status(200).json({
            success: true,
            message: 'All notifications deleted successfully.',
            deleted_count: result.deletedCount
        });

    } catch (error) {
        console.error(
            'Delete all notifications error:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Failed to delete all notifications.'
        });
    }
};


module.exports = {
    getNotifications,
    getUnreadCount,
    getNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
};


const broadcastToInstallers = async (req, res) => {
    try {
        const title = String(req.body?.title || '').trim();
        const message = String(req.body?.message || '').trim();
        const priority = ['low', 'normal', 'high'].includes(req.body?.priority)
            ? req.body.priority
            : 'normal';

        if (!title || title.length > 120) {
            return res.status(400).json({
                success: false,
                message: 'A notification title is required and must be 120 characters or fewer.'
            });
        }

        if (!message || message.length > 2000) {
            return res.status(400).json({
                success: false,
                message: 'A notification message is required and must be 2,000 characters or fewer.'
            });
        }

        const notifications = await notificationService.createInstallerBroadcast({
            title,
            message,
            priority
        });

        return res.status(201).json({
            success: true,
            message: 'Notification sent to active installers.',
            data: {
                recipientCount: notifications.length
            }
        });
    } catch (error) {
        console.error('Broadcast installer notification error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to send installer notification.'
        });
    }
};


module.exports.broadcastToInstallers = broadcastToInstallers;