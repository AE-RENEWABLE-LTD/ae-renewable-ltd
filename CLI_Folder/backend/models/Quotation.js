"use strict";

const db = require("../config/database");

/* =========================================================
   AE RENEWABLE NETWORK
   QUOTATION MODEL
========================================================= */

/* =========================================================
   FIND ALL QUOTATIONS
========================================================= */

async function findAll(filters = {}) {
    const conditions = [];
    const values = [];

    if (filters.clientId !== undefined && filters.clientId !== null) {
        values.push(filters.clientId);

        conditions.push(
            `q.client_id = $${values.length}`
        );
    }

    if (filters.projectId !== undefined && filters.projectId !== null) {
        values.push(filters.projectId);

        conditions.push(
            `q.project_id = $${values.length}`
        );
    }

    if (filters.status) {
        values.push(filters.status);

        conditions.push(
            `q.status = $${values.length}`
        );
    }

    const whereClause =
        conditions.length > 0
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

    const result = await db.query(
        `
        SELECT
            q.*
        FROM quotations q
        ${whereClause}
        ORDER BY q.created_at DESC
        `,
        values
    );

    return result.rows;
}

/* =========================================================
   FIND QUOTATION BY ID
========================================================= */

async function findById(id) {
    if (!id) {
        return null;
    }

    const result = await db.query(
        `
        SELECT
            q.*
        FROM quotations q
        WHERE q.id = $1
        LIMIT 1
        `,
        [id]
    );

    return result.rows[0] || null;
}

/* =========================================================
   FIND QUOTATION BY CODE
========================================================= */

async function findByCode(quotationCode) {
    if (!quotationCode) {
        return null;
    }

    const result = await db.query(
        `
        SELECT
            q.*
        FROM quotations q
        WHERE q.quotation_code = $1
        LIMIT 1
        `,
        [quotationCode]
    );

    return result.rows[0] || null;
}

/* =========================================================
   FIND QUOTATION BY NUMBER
========================================================= */

async function findByNumber(quotationNumber) {
    if (!quotationNumber) {
        return null;
    }

    const result = await db.query(
        `
        SELECT
            q.*
        FROM quotations q
        WHERE q.quotation_number = $1
        LIMIT 1
        `,
        [quotationNumber]
    );

    return result.rows[0] || null;
}

/* =========================================================
   CREATE QUOTATION
========================================================= */

async function create(data) {
    const result = await db.query(
        `
        INSERT INTO quotations (
            quotation_code,
            quotation_number,
            client_id,
            project_id,
            title,
            description,
            version,
            subtotal,
            discount,
            tax,
            installation_fee,
            total_amount,
            amount_paid,
            balance_due,
            currency,
            status,
            issue_date,
            valid_until,
            notes
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13,
            $14,
            $15,
            $16,
            COALESCE($17, CURRENT_DATE),
            $18,
            $19
        )
        RETURNING *
        `,
        [
            data.quotationCode,
            data.quotationNumber,
            data.clientId,
            data.projectId ?? null,
            data.title,
            data.description ?? null,
            data.version ?? 1,
            data.subtotal ?? 0,
            data.discount ?? 0,
            data.tax ?? 0,
            data.installationFee ?? 0,
            data.totalAmount ?? 0,
            data.amountPaid ?? 0,
            data.balanceDue ?? 0,
            data.currency ?? "NGN",
            data.status ?? "draft",
            data.issueDate ?? null,
            data.validUntil ?? null,
            data.notes ?? null
        ]
    );

    return result.rows[0];
}

/* =========================================================
   UPDATE QUOTATION
========================================================= */

async function update(id, data) {
    const result = await db.query(
        `
        UPDATE quotations
        SET
            title = COALESCE($1, title),
            description = COALESCE($2, description),
            project_id = COALESCE($3, project_id),
            subtotal = COALESCE($4, subtotal),
            discount = COALESCE($5, discount),
            tax = COALESCE($6, tax),
            installation_fee = COALESCE($7, installation_fee),
            total_amount = COALESCE($8, total_amount),
            amount_paid = COALESCE($9, amount_paid),
            balance_due = COALESCE($10, balance_due),
            currency = COALESCE($11, currency),
            status = COALESCE($12, status),
            valid_until = COALESCE($13, valid_until),
            notes = COALESCE($14, notes),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $15
        RETURNING *
        `,
        [
            data.title ?? null,
            data.description ?? null,
            data.projectId ?? null,
            data.subtotal ?? null,
            data.discount ?? null,
            data.tax ?? null,
            data.installationFee ?? null,
            data.totalAmount ?? null,
            data.amountPaid ?? null,
            data.balanceDue ?? null,
            data.currency ?? null,
            data.status ?? null,
            data.validUntil ?? null,
            data.notes ?? null,
            id
        ]
    );

    return result.rows[0] || null;
}

/* =========================================================
   UPDATE STATUS
========================================================= */

async function updateStatus(id, status) {
    const result = await db.query(
        `
        UPDATE quotations
        SET
            status = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
        `,
        [
            status,
            id
        ]
    );

    return result.rows[0] || null;
}

/* =========================================================
   MARK QUOTATION VIEWED
========================================================= */

async function markViewed(id) {
    const result = await db.query(
        `
        UPDATE quotations
        SET
            status =
                CASE
                    WHEN status = 'sent'
                    THEN 'viewed'
                    ELSE status
                END,
            client_viewed_at =
                COALESCE(
                    client_viewed_at,
                    CURRENT_TIMESTAMP
                ),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
        `,
        [id]
    );

    return result.rows[0] || null;
}

/* =========================================================
   ACCEPT QUOTATION
========================================================= */

async function accept(id, approvedBy = null) {
    const result = await db.query(
        `
        UPDATE quotations
        SET
            status = 'accepted',
            approved_at = CURRENT_TIMESTAMP,
            approved_by = $1,
            client_responded_at =
                COALESCE(
                    client_responded_at,
                    CURRENT_TIMESTAMP
                ),
            rejection_reason = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        AND status IN (
            'sent',
            'viewed'
        )
        RETURNING *
        `,
        [
            approvedBy,
            id
        ]
    );

    return result.rows[0] || null;
}

/* =========================================================
   REJECT QUOTATION
========================================================= */

async function reject(id, rejectionReason) {
    const result = await db.query(
        `
        UPDATE quotations
        SET
            status = 'rejected',
            rejection_reason = $1,
            client_responded_at =
                COALESCE(
                    client_responded_at,
                    CURRENT_TIMESTAMP
                ),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        AND status IN (
            'sent',
            'viewed'
        )
        RETURNING *
        `,
        [
            rejectionReason,
            id
        ]
    );

    return result.rows[0] || null;
}

/* =========================================================
   CANCEL QUOTATION
========================================================= */

async function cancel(id) {
    const result = await db.query(
        `
        UPDATE quotations
        SET
            status = 'cancelled',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        AND status IN (
            'draft',
            'sent',
            'viewed'
        )
        RETURNING *
        `,
        [id]
    );

    return result.rows[0] || null;
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    findAll,
    findById,
    findByCode,
    findByNumber,
    create,
    update,
    updateStatus,
    markViewed,
    accept,
    reject,
    cancel
};