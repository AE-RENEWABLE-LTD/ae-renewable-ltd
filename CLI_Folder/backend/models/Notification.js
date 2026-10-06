"use strict";

const { query } = require("../config/database");

/* =========================================================
   AE RENEWABLE NETWORK
   NOTIFICATION MODEL
========================================================= */

/* =========================================================
   GET ALL NOTIFICATIONS
========================================================= */

async function findAll(filters = {}) {
    const conditions = [];
    const values = [];

    if (filters.userId !== undefined && filters.userId !== "") {
        values.push(filters.userId);
        conditions.push(`n.user_id = $${values.length}`);
    }

    if (filters.clientId !== undefined && filters.clientId !== "") {
        values.push(filters.clientId);
        conditions.push(`n.client_id = $${values.length}`);
    }

    if (filters.projectId !== undefined && filters.projectId !== "") {
        values.push(filters.projectId);
        conditions.push(`n.project_id = $${values.length}`);
    }

    if (filters.quotationId !== undefined && filters.quotationId !== "") {
        values.push(filters.quotationId);
        conditions.push(`n.quotation_id = $${values.length}`);
    }

    if (filters.paymentId !== undefined && filters.paymentId !== "") {
        values.push(filters.paymentId);
        conditions.push(`n.payment_id = $${values.length}`);
    }

    if (filters.type !== undefined && filters.type !== "") {
        values.push(filters.type);
        conditions.push(`n.type = $${values.length}`);
    }

    if (filters.priority !== undefined && filters.priority !== "") {
        values.push(filters.priority);
        conditions.push(`n.priority = $${values.length}`);
    }

    if (filters.isRead !== undefined && filters.isRead !== "") {
        values.push(
            filters.isRead === true ||
            filters.isRead === "true"
        );

        conditions.push(`n.is_read = $${values.length}`);
    }

    const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const result = await query(
        `
        SELECT
            n.id,
            n.user_id,
            n.type,
            n.title,
            n.message,
            n.client_id,
            n.project_id,
            n.quotation_id,
            n.payment_id,
            n.action_url,
            n.action_label,
            n.is_read,
            n.read_at,
            n.priority,
            n.created_at,
            n.updated_at
        FROM notifications n
        ${whereClause}
        ORDER BY n.created_at DESC
        `,
        values
    );

    return result.rows;
}

/* =========================================================
   GET NOTIFICATION BY ID
========================================================= */

async function findById(id) {
    const result = await query(
        `
        SELECT
            n.id,
            n.user_id,
            n.type,
            n.title,
            n.message,
            n.client_id,
            n.project_id,
            n.quotation_id,
            n.payment_id,
            n.action_url,
            n.action_label,
            n.is_read,
            n.read_at,
            n.priority,
            n.created_at,
            n.updated_at
        FROM notifications n
        WHERE n.id = $1
        LIMIT 1
        `,
        [id]
    );

    return result.rows[0] || null;
}

/* =========================================================
   CREATE NOTIFICATION
========================================================= */

async function create(data) {
    const result = await query(
        `
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
            is_read,
            priority
        )
        VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11, $12
        )
        RETURNING *
        `,
        [
            data.userId,
            data.type || "system",
            data.title,
            data.message,
            data.clientId || null,
            data.projectId || null,
            data.quotationId || null,
            data.paymentId || null,
            data.actionUrl || null,
            data.actionLabel || null,
            data.isRead || false,
            data.priority || "normal"
        ]
    );

    return result.rows[0];
}

/* =========================================================
   UPDATE NOTIFICATION
========================================================= */

async function update(id, data) {
    const result = await query(
        `
        UPDATE notifications
        SET
            type = COALESCE($1, type),
            title = COALESCE($2, title),
            message = COALESCE($3, message),
            client_id = COALESCE($4, client_id),
            project_id = COALESCE($5, project_id),
            quotation_id = COALESCE($6, quotation_id),
            payment_id = COALESCE($7, payment_id),
            action_url = COALESCE($8, action_url),
            action_label = COALESCE($9, action_label),
            is_read = COALESCE($10, is_read),
            priority = COALESCE($11, priority),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $12
        RETURNING *
        `,
        [
            data.type ?? null,
            data.title ?? null,
            data.message ?? null,
            data.clientId ?? null,
            data.projectId ?? null,
            data.quotationId ?? null,
            data.paymentId ?? null,
            data.actionUrl ?? null,
            data.actionLabel ?? null,
            data.isRead ?? null,
            data.priority ?? null,
            id
        ]
    );

    return result.rows[0] || null;
}

/* =========================================================
   MARK AS READ
========================================================= */

async function markAsRead(id) {
    const result = await query(
        `
        UPDATE notifications
        SET
            is_read = TRUE,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
        `,
        [id]
    );

    return result.rows[0] || null;
}

/* =========================================================
   MARK AS UNREAD
========================================================= */

async function markAsUnread(id) {
    const result = await query(
        `
        UPDATE notifications
        SET
            is_read = FALSE,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
        `,
        [id]
    );

    return result.rows[0] || null;
}

/* =========================================================
   MARK ALL USER NOTIFICATIONS AS READ
========================================================= */

async function markAllAsRead(userId) {
    const result = await query(
        `
        UPDATE notifications
        SET
            is_read = TRUE,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
          AND is_read = FALSE
        RETURNING *
        `,
        [userId]
    );

    return result.rows;
}

/* =========================================================
   DELETE NOTIFICATION
========================================================= */

async function remove(id) {
    const result = await query(
        `
        DELETE FROM notifications
        WHERE id = $1
        RETURNING *
        `,
        [id]
    );

    return result.rows[0] || null;
}

/* =========================================================
   GET UNREAD COUNT
========================================================= */

async function getUnreadCount(userId) {
    const result = await query(
        `
        SELECT COUNT(*)::INTEGER AS count
        FROM notifications
        WHERE user_id = $1
          AND is_read = FALSE
        `,
        [userId]
    );

    return result.rows[0].count;
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    findAll,
    findById,
    create,
    update,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    remove,
    getUnreadCount
};