"use strict";

const db = require("../config/database");

/* =========================================================
   AE RENEWABLE NETWORK
   DOCUMENT MODEL
========================================================= */

/**
 * Get all documents.
 */
async function findAll(filters = {}) {
    const conditions = [];
    const values = [];

    if (filters.clientId) {
        values.push(filters.clientId);
        conditions.push(`d.client_id = $${values.length}`);
    }

    if (filters.projectId) {
        values.push(filters.projectId);
        conditions.push(`d.project_id = $${values.length}`);
    }

    if (filters.uploadedBy) {
        values.push(filters.uploadedBy);
        conditions.push(`d.uploaded_by = $${values.length}`);
    }

    if (filters.documentType) {
        values.push(filters.documentType);
        conditions.push(`d.document_type = $${values.length}`);
    }

    if (filters.status) {
        values.push(filters.status);
        conditions.push(`d.status = $${values.length}`);
    }

    if (filters.visibility) {
        values.push(filters.visibility);
        conditions.push(`d.visibility = $${values.length}`);
    }

    if (filters.verified !== undefined) {
        values.push(filters.verified);
        conditions.push(`d.verified = $${values.length}`);
    }

    const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const result = await db.query(
        `
        SELECT
            d.*
        FROM documents d
        ${whereClause}
        ORDER BY d.created_at DESC
        `,
        values
    );

    return result.rows;
}

/**
 * Get document by ID.
 */
async function findById(id) {
    const result = await db.query(
        `
        SELECT
            d.*
        FROM documents d
        WHERE d.id = $1
        LIMIT 1
        `,
        [id]
    );

    return result.rows[0] || null;
}

/**
 * Get document by document code.
 */
async function findByCode(documentCode) {
    const result = await db.query(
        `
        SELECT
            d.*
        FROM documents d
        WHERE d.document_code = $1
        LIMIT 1
        `,
        [documentCode]
    );

    return result.rows[0] || null;
}

/**
 * Create document.
 */
async function create(data) {
    const result = await db.query(
        `
        INSERT INTO documents (
            document_code,
            document_name,
            document_type,
            description,
            client_id,
            project_id,
            uploaded_by,
            file_name,
            original_file_name,
            file_url,
            file_path,
            mime_type,
            file_size,
            status,
            visibility,
            version,
            verified,
            verified_by,
            verified_at
        )
        VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15,
            $16, $17, $18, $19
        )
        RETURNING *
        `,
        [
            data.documentCode,
            data.documentName,
            data.documentType,
            data.description || null,
            data.clientId || null,
            data.projectId || null,
            data.uploadedBy || null,
            data.fileName,
            data.originalFileName || null,
            data.fileUrl,
            data.filePath || null,
            data.mimeType || null,
            data.fileSize ?? null,
            data.status || "active",
            data.visibility || "private",
            data.version || 1,
            data.verified ?? false,
            data.verifiedBy || null,
            data.verifiedAt || null
        ]
    );

    return result.rows[0];
}

/**
 * Update document.
 */
async function update(id, data) {
    const result = await db.query(
        `
        UPDATE documents
        SET
            document_name = COALESCE($1, document_name),
            document_type = COALESCE($2, document_type),
            description = COALESCE($3, description),
            client_id = COALESCE($4, client_id),
            project_id = COALESCE($5, project_id),
            file_name = COALESCE($6, file_name),
            original_file_name = COALESCE($7, original_file_name),
            file_url = COALESCE($8, file_url),
            file_path = COALESCE($9, file_path),
            mime_type = COALESCE($10, mime_type),
            file_size = COALESCE($11, file_size),
            status = COALESCE($12, status),
            visibility = COALESCE($13, visibility),
            version = COALESCE($14, version),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $15
        RETURNING *
        `,
        [
            data.documentName ?? null,
            data.documentType ?? null,
            data.description ?? null,
            data.clientId ?? null,
            data.projectId ?? null,
            data.fileName ?? null,
            data.originalFileName ?? null,
            data.fileUrl ?? null,
            data.filePath ?? null,
            data.mimeType ?? null,
            data.fileSize ?? null,
            data.status ?? null,
            data.visibility ?? null,
            data.version ?? null,
            id
        ]
    );

    return result.rows[0] || null;
}

/**
 * Update document status.
 */
async function updateStatus(id, status) {
    const result = await db.query(
        `
        UPDATE documents
        SET
            status = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
        `,
        [status, id]
    );

    return result.rows[0] || null;
}

/**
 * Verify document.
 */
async function verify(id, verifiedBy) {
    const result = await db.query(
        `
        UPDATE documents
        SET
            verified = TRUE,
            verified_by = $1,
            verified_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
        `,
        [verifiedBy || null, id]
    );

    return result.rows[0] || null;
}

/**
 * Unverify document.
 */
async function unverify(id) {
    const result = await db.query(
        `
        UPDATE documents
        SET
            verified = FALSE,
            verified_by = NULL,
            verified_at = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
        `,
        [id]
    );

    return result.rows[0] || null;
}

/**
 * Archive document.
 */
async function archive(id) {
    return updateStatus(id, "archived");
}

/**
 * Delete document.
 *
 * The schema supports soft deletion through the "deleted"
 * status, so this method performs a soft delete.
 */
async function remove(id) {
    return updateStatus(id, "deleted");
}

module.exports = {
    findAll,
    findById,
    findByCode,
    create,
    update,
    updateStatus,
    verify,
    unverify,
    archive,
    remove
};
