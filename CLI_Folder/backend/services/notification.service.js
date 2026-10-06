const pool = require('../config/database');

/**
 * =========================================================
 * AE RENEWABLE NETWORK
 * NOTIFICATION SERVICE
 * =========================================================
 */

/**
 * Create a notification
 */
const VALID_TYPES = ['system', 'account', 'project', 'quotation', 'payment', 'document', 'installer', 'support', 'security', 'announcement'];
const createNotification = async ({
    user_id,
    type = 'system',
    title,
    message,
    client_id = null,
    project_id = null,
    quotation_id = null,
    payment_id = null,
    action_url = null,
    action_label = null,
    priority = 'normal'
}) => {
    const query = `
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            client_id,
            project_id,
            quotation_id,
            payment_id,
            action_url,
            action_label,
            priority
        )
        VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10, $11
        )
        RETURNING *;
    `;

    const values = [
        user_id,
        type,
        title,
        message,
        client_id,
        project_id,
        quotation_id,
        payment_id,
        action_url,
        action_label,
        priority
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
};


/**
 * Get all notifications for a user
 */
const getUserNotifications = async (userId, options = {}) => {
    const {
        limit = 50,
        offset = 0,
        unreadOnly = false
    } = options;

    let query = `
        SELECT
            id,
            user_id,
            type,
            title,
            message,
            client_id,
            project_id,
            quotation_id,
            payment_id,
            action_url,
            action_label,
            is_read,
            read_at,
            priority,
            created_at,
            updated_at
        FROM notifications
        WHERE user_id = $1
    `;

    const values = [userId];

    if (unreadOnly) {
        query += ` AND is_read = FALSE`;
    }

    query += `
        ORDER BY created_at DESC
        LIMIT $2
        OFFSET $3;
    `;

    values.push(limit, offset);

    const result = await pool.query(query, values);

    return result.rows;
};


/**
 * Get unread notification count
 */
const getUnreadCount = async (userId) => {
    const query = `
        SELECT COUNT(*)::INTEGER AS unread_count
        FROM notifications
        WHERE user_id = $1
          AND is_read = FALSE;
    `;

    const result = await pool.query(query, [userId]);

    return result.rows[0].unread_count;
};


const createInstallerBroadcast = async ({
    title,
    message,
    priority = 'normal'
}) => {
    const result = await pool.query(
        `
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            priority
        )
        SELECT
            u.id,
            'announcement',
            $1,
            $2,
            $3
        FROM users u
        INNER JOIN installers i
            ON i.user_id = u.id
        WHERE u.role = 'installer'
          AND u.status = 'active'
        RETURNING *;
        `,
        [title, message, priority]
    );

    return result.rows;
};


/**
 * Get a single notification
 */
const getNotificationById = async (notificationId, userId) => {
    const query = `
        SELECT *
        FROM notifications
        WHERE id = $1
          AND user_id = $2;
    `;

    const result = await pool.query(query, [
        notificationId,
        userId
    ]);

    return result.rows[0] || null;
};


/**
 * Mark one notification as read
 */
const markAsRead = async (notificationId, userId) => {
    const query = `
        UPDATE notifications
        SET is_read = TRUE
        WHERE id = $1
          AND user_id = $2
        RETURNING *;
    `;

    const result = await pool.query(query, [
        notificationId,
        userId
    ]);

    return result.rows[0] || null;
};


/**
 * Mark all notifications as read
 */
const markAllAsRead = async (userId) => {
    const query = `
        UPDATE notifications
        SET is_read = TRUE
        WHERE user_id = $1
          AND is_read = FALSE
        RETURNING id;
    `;

    const result = await pool.query(query, [userId]);

    return {
        updatedCount: result.rowCount
    };
};


/**
 * Delete one notification
 */
const deleteNotification = async (notificationId, userId) => {
    const query = `
        DELETE FROM notifications
        WHERE id = $1
          AND user_id = $2
        RETURNING id;
    `;

    const result = await pool.query(query, [
        notificationId,
        userId
    ]);

    return result.rows[0] || null;
};


/**
 * Delete all notifications for a user
 */
const deleteAllNotifications = async (userId) => {
    const query = `
        DELETE FROM notifications
        WHERE user_id = $1
        RETURNING id;
    `;

    const result = await pool.query(query, [userId]);

    return {
        deletedCount: result.rowCount
    };
};


module.exports = {
    createNotification,
    createInstallerBroadcast,
    getUserNotifications,
    getUnreadCount,
    getNotificationById,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
};