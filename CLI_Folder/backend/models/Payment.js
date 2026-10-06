"use strict";

const db = require("../config/database");

/* =========================================================
   AE RENEWABLE NETWORK
   PAYMENT MODEL
========================================================= */

/* =========================================================
   FIND ALL PAYMENTS
========================================================= */

async function findAll(filters = {}) {
    const conditions = [];
    const values = [];

    if (filters.clientId) {
        values.push(filters.clientId);
        conditions.push(`p.client_id = $${values.length}`);
    }

    if (filters.projectId) {
        values.push(filters.projectId);
        conditions.push(`p.project_id = $${values.length}`);
    }

    if (filters.quotationId) {
        values.push(filters.quotationId);
        conditions.push(`p.quotation_id = $${values.length}`);
    }

    if (filters.paymentStatus) {
        values.push(filters.paymentStatus);
        conditions.push(`p.payment_status = $${values.length}`);
    }

    if (filters.paymentMethod) {
        values.push(filters.paymentMethod);
        conditions.push(`p.payment_method = $${values.length}`);
    }

    if (filters.verified !== undefined) {
        values.push(filters.verified);
        conditions.push(`p.verified = $${values.length}`);
    }

    const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const result = await db.query(
        `
        SELECT
            p.*
        FROM payments p
        ${whereClause}
        ORDER BY p.created_at DESC
        `,
        values
    );

    return result.rows;
}

/* =========================================================
   FIND PAYMENT BY ID
========================================================= */

async function findById(id) {
    const result = await db.query(
        `
        SELECT
            p.*
        FROM payments p
        WHERE p.id = $1
        LIMIT 1
        `,
        [id]
    );

    return result.rows[0] || null;
}

/* =========================================================
   FIND PAYMENT BY REFERENCE
========================================================= */

async function findByReference(paymentReference) {
    const result = await db.query(
        `
        SELECT
            p.*
        FROM payments p
        WHERE p.payment_reference = $1
        LIMIT 1
        `,
        [paymentReference]
    );

    return result.rows[0] || null;
}

/* =========================================================
   FIND PAYMENT BY TRANSACTION REFERENCE
========================================================= */

async function findByTransactionReference(transactionReference) {
    const result = await db.query(
        `
        SELECT
            p.*
        FROM payments p
        WHERE p.transaction_reference = $1
        LIMIT 1
        `,
        [transactionReference]
    );

    return result.rows[0] || null;
}

/* =========================================================
   CREATE PAYMENT
========================================================= */

async function create(data) {
    const result = await db.query(
        `
        INSERT INTO payments (
            payment_reference,
            client_id,
            project_id,
            quotation_id,
            amount,
            currency,
            payment_method,
            payment_status,
            transaction_reference,
            transaction_date,
            description,
            notes,
            verified,
            verified_by,
            verified_at,
            receipt_url
        )
        VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13, $14, $15, $16
        )
        RETURNING *
        `,
        [
            data.paymentReference,
            data.clientId,
            data.projectId || null,
            data.quotationId || null,
            data.amount,
            data.currency || "NGN",
            data.paymentMethod || "bank_transfer",
            data.paymentStatus || "pending",
            data.transactionReference || null,
            data.transactionDate || null,
            data.description || null,
            data.notes || null,
            data.verified ?? false,
            data.verifiedBy || null,
            data.verifiedAt || null,
            data.receiptUrl || null
        ]
    );

    return result.rows[0];
}

/* =========================================================
   UPDATE PAYMENT
========================================================= */

async function update(id, data) {
    const result = await db.query(
        `
        UPDATE payments
        SET
            project_id = COALESCE($1, project_id),
            quotation_id = COALESCE($2, quotation_id),
            amount = COALESCE($3, amount),
            currency = COALESCE($4, currency),
            payment_method = COALESCE($5, payment_method),
            payment_status = COALESCE($6, payment_status),
            transaction_reference = COALESCE($7, transaction_reference),
            transaction_date = COALESCE($8, transaction_date),
            description = COALESCE($9, description),
            notes = COALESCE($10, notes),
            receipt_url = COALESCE($11, receipt_url),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $12
        RETURNING *
        `,
        [
            data.projectId ?? null,
            data.quotationId ?? null,
            data.amount ?? null,
            data.currency ?? null,
            data.paymentMethod ?? null,
            data.paymentStatus ?? null,
            data.transactionReference ?? null,
            data.transactionDate ?? null,
            data.description ?? null,
            data.notes ?? null,
            data.receiptUrl ?? null,
            id
        ]
    );

    return result.rows[0] || null;
}

/* =========================================================
   UPDATE PAYMENT STATUS
========================================================= */

async function updateStatus(id, paymentStatus) {
    const result = await db.query(
        `
        UPDATE payments
        SET
            payment_status = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
        `,
        [paymentStatus, id]
    );

    return result.rows[0] || null;
}

/* =========================================================
   VERIFY PAYMENT
========================================================= */

async function verify(id, verifiedBy = null) {
    const result = await db.query(
        `
        UPDATE payments
        SET
            verified = TRUE,
            verified_by = $1,
            verified_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
        `,
        [verifiedBy, id]
    );

    return result.rows[0] || null;
}

/* =========================================================
   UNVERIFY PAYMENT
========================================================= */

async function unverify(id) {
    const result = await db.query(
        `
        UPDATE payments
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

/* =========================================================
   MARK PAYMENT SUCCESSFUL
========================================================= */

async function markSuccessful(id) {
    const result = await db.query(
        `
        UPDATE payments
        SET
            payment_status = 'successful',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
        `,
        [id]
    );

    return result.rows[0] || null;
}

/* =========================================================
   MARK PAYMENT FAILED
========================================================= */

async function markFailed(id) {
    const result = await db.query(
        `
        UPDATE payments
        SET
            payment_status = 'failed',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
        `,
        [id]
    );

    return result.rows[0] || null;
}

/* =========================================================
   UPDATE RECEIPT
========================================================= */

async function updateReceipt(id, receiptUrl) {
    const result = await db.query(
        `
        UPDATE payments
        SET
            receipt_url = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
        `,
        [receiptUrl, id]
    );

    return result.rows[0] || null;
}

/* =========================================================
   DELETE PAYMENT
========================================================= */

async function remove(id) {
    const result = await db.query(
        `
        DELETE FROM payments
        WHERE id = $1
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
    findByReference,
    findByTransactionReference,
    create,
    update,
    updateStatus,
    verify,
    unverify,
    markSuccessful,
    markFailed,
    updateReceipt,
    remove
};