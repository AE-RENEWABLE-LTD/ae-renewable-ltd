"use strict";

const { query } = require("../config/database");

/**
 * AE RENEWABLE AUDIT & ACTIVITY LOGGER
 * Logs every consequential operational and commercial event into the activities table.
 */

async function logActivity({
    projectId = null,
    actorUserId = null,
    actorName = "System",
    actorRole = "system",
    action,
    entityType = "project",
    entityId = null,
    title,
    description = null,
    metadata = {}
}) {
    try {
        const res = await query(
            `
            INSERT INTO activities (
                project_id,
                actor_user_id,
                actor_name,
                actor_role,
                action,
                entity_type,
                entity_id,
                title,
                description,
                metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
            `,
            [
                projectId,
                actorUserId,
                actorName,
                actorRole,
                action,
                entityType,
                entityId ? String(entityId) : null,
                title,
                description,
                JSON.stringify(metadata)
            ]
        );
        return res.rows[0];
    } catch (err) {
        console.error("[ActivityLogger] Failed to log activity:", err.message);
        return null;
    }
}

async function getProjectActivities(projectId, limit = 50) {
    const res = await query(
        `
        SELECT * FROM activities
        WHERE project_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        `,
        [projectId, limit]
    );
    return res.rows;
}

async function getRecentActivities(limit = 50) {
    const res = await query(
        `
        SELECT a.*, p.project_code, p.project_name
        FROM activities a
        LEFT JOIN projects p ON p.id = a.project_id
        ORDER BY a.created_at DESC
        LIMIT $1
        `,
        [limit]
    );
    return res.rows;
}

async function getClientActivities(userId, limit = 50) {
    const res = await query(
        `
        SELECT a.*, p.project_code, p.project_name
        FROM activities a
        LEFT JOIN projects p ON p.id = a.project_id
        LEFT JOIN clients c ON c.id = p.client_id
        WHERE c.user_id = $1 OR a.actor_user_id = $1 OR a.project_id IN (SELECT id FROM projects WHERE client_id IN (SELECT id FROM clients WHERE user_id = $1))
        ORDER BY a.created_at DESC
        LIMIT $2
        `,
        [userId, limit]
    );
    return res.rows;
}

module.exports = {
    logActivity,
    getProjectActivities,
    getRecentActivities,
    getClientActivities
};
