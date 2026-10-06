"use strict";

const { query } = require("../config/database");

/* =========================================================
   AE RENEWABLE NETWORK
   PAYMENT SERVICE
========================================================= */

/* =========================================================
   PAYMENT SELECT
========================================================= */

const paymentSelect = `
    SELECT
        p.id,
        p.payment_reference,
        p.client_id,
        p.project_id,
        p.quotation_id,
        p.amount,
        p.currency,
        p.payment_method,
        p.payment_status,
        p.transaction_reference,
        p.transaction_date,
        p.description,
        p.notes,
        p.verified,
        p.verified_by,
        p.verified_at,
        p.receipt_url,
        p.created_at,
        p.updated_at,
        COALESCE(c.company_name, c.contact_name, 'Commercial Client') AS client_name,
        c.email AS client_email,
        c.phone AS client_phone,
        proj.project_name,
        proj.project_code,
        proj.system_capacity_kw AS system_capacity,
        q.quotation_code
    FROM payments p
    LEFT JOIN clients c ON p.client_id = c.id
    LEFT JOIN projects proj ON p.project_id = proj.id
    LEFT JOIN quotations q ON p.quotation_id = q.id
`;

/* =========================================================
   GET ALL PAYMENTS
========================================================= */

async function getPayments(filters = {}) {
    const {
        clientId,
        projectId,
        quotationId,
        paymentStatus,
        paymentMethod,
        verified
    } = filters;

    const conditions = [];
    const params = [];

    function addCondition(column, value) {
        params.push(value);
        conditions.push(`${column} = $${params.length}`);
    }

    if (clientId !== undefined && clientId !== "") {
        addCondition("p.client_id", clientId);
    }

    if (projectId !== undefined && projectId !== "") {
        addCondition("p.project_id", projectId);
    }

    if (quotationId !== undefined && quotationId !== "") {
        addCondition("p.quotation_id", quotationId);
    }

    if (
        paymentStatus !== undefined &&
        paymentStatus !== ""
    ) {
        addCondition("p.payment_status", paymentStatus);
    }

    if (
        paymentMethod !== undefined &&
        paymentMethod !== ""
    ) {
        addCondition("p.payment_method", paymentMethod);
    }

    if (verified !== undefined && verified !== "") {
        addCondition(
            "p.verified",
            verified === true || verified === "true"
        );
    }

    const whereClause =
        conditions.length > 0
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

    const result = await query(
        `
        ${paymentSelect}
        ${whereClause}
        ORDER BY p.created_at DESC
        `,
        params
    );

    return result.rows;
}

/* =========================================================
   GET PAYMENT BY ID
========================================================= */

async function getPaymentById(paymentId) {
    const result = await query(
        `
        ${paymentSelect}
        WHERE p.id = $1
        LIMIT 1
        `,
        [paymentId]
    );

    return result.rows[0] || null;
}

/* =========================================================
   GET PAYMENT BY REFERENCE
========================================================= */

async function getPaymentByReference(
    paymentReference
) {
    const result = await query(
        `
        ${paymentSelect}
        WHERE p.payment_reference = $1
        LIMIT 1
        `,
        [paymentReference]
    );

    return result.rows[0] || null;
}

/* =========================================================
   CREATE PAYMENT
========================================================= */

async function createPayment(data) {
    const {
        paymentReference,
        clientId,
        projectId,
        quotationId,
        amount,
        currency,
        paymentMethod,
        paymentStatus,
        transactionReference,
        transactionDate,
        description,
        notes,
        receiptUrl
    } = data;

    const result = await query(
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
            receipt_url
        )
        VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11, $12, $13
        )
        RETURNING
            id,
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
            receipt_url,
            created_at,
            updated_at
        `,
        [
            paymentReference,
            clientId,
            projectId || null,
            quotationId || null,
            amount,
            currency || "NGN",
            paymentMethod || "bank_transfer",
            paymentStatus || "pending",
            transactionReference || null,
            transactionDate || null,
            description || null,
            notes || null,
            receiptUrl || null
        ]
    );

    return result.rows[0];
}

/* =========================================================
   UPDATE PAYMENT
========================================================= */

async function updatePayment(paymentId, data) {
    const {
        amount,
        currency,
        paymentMethod,
        transactionReference,
        transactionDate,
        description,
        notes,
        receiptUrl
    } = data;

    const result = await query(
        `
        UPDATE payments
        SET
            amount = COALESCE($1, amount),
            currency = COALESCE($2, currency),
            payment_method = COALESCE($3, payment_method),
            transaction_reference =
                COALESCE($4, transaction_reference),
            transaction_date =
                COALESCE($5, transaction_date),
            description = COALESCE($6, description),
            notes = COALESCE($7, notes),
            receipt_url = COALESCE($8, receipt_url)
        WHERE id = $9
        RETURNING
            id,
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
            receipt_url,
            created_at,
            updated_at
        `,
        [
            amount ?? null,
            currency ?? null,
            paymentMethod ?? null,
            transactionReference ?? null,
            transactionDate ?? null,
            description ?? null,
            notes ?? null,
            receiptUrl ?? null,
            paymentId
        ]
    );

    return result.rows[0] || null;
}

/* =========================================================
   UPDATE PAYMENT STATUS
========================================================= */

async function updatePaymentStatus(
    paymentId,
    paymentStatus
) {
    const result = await query(
        `
        UPDATE payments
        SET
            payment_status = $1
        WHERE id = $2
        RETURNING
            id,
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
            receipt_url,
            created_at,
            updated_at
        `,
        [
            paymentStatus,
            paymentId
        ]
    );

    return result.rows[0] || null;
}

/* =========================================================
   VERIFY PAYMENT
========================================================= */

async function verifyPayment(
    paymentId,
    verifiedBy
) {
    const result = await query(
        `
        UPDATE payments
        SET
            verified = TRUE,
            verified_by = $1,
            verified_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING
            id,
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
            receipt_url,
            created_at,
            updated_at
        `,
        [
            verifiedBy,
            paymentId
        ]
    );

    return result.rows[0] || null;
}

/* =========================================================
   UNVERIFY PAYMENT
========================================================= */

async function unverifyPayment(paymentId) {
    const result = await query(
        `
        UPDATE payments
        SET
            verified = FALSE,
            verified_by = NULL,
            verified_at = NULL
        WHERE id = $1
        RETURNING
            id,
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
            receipt_url,
            created_at,
            updated_at
        `,
        [paymentId]
    );

    return result.rows[0] || null;
}

/* =========================================================
   DELETE PAYMENT
========================================================= */

async function deletePayment(paymentId) {
    const result = await query(
        `
        DELETE FROM payments
        WHERE id = $1
        RETURNING
            id,
            payment_reference
        `,
        [paymentId]
    );

    return result.rows[0] || null;
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    getPayments,
    getPaymentById,
    getPaymentByReference,
    createPayment,
    updatePayment,
    updatePaymentStatus,
    verifyPayment,
    unverifyPayment,
    deletePayment
};