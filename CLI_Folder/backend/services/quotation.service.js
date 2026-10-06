"use strict";

const { query, transaction } = require("../config/database");
const emailService = require("./email.service");

/* =========================================================
   AE RENEWABLE NETWORK
   QUOTATION SERVICE
========================================================= */

/* =========================================================
   GENERATE QUOTATION CODE
========================================================= */

function generateQuotationCode() {
    const now = new Date();

    const year = now.getFullYear();

    const month = String(
        now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        now.getDate()
    ).padStart(2, "0");

    const random = Math.floor(
        1000 + Math.random() * 9000
    );

    return `AE-${year}${month}${day}-${random}`;
}

/* =========================================================
   GENERATE QUOTATION NUMBER
========================================================= */

async function generateQuotationNumber(client = null) {
    const db = client || { query };

    const result = await db.query(`
        SELECT quotation_number
        FROM quotations
        WHERE quotation_number LIKE 'AE-Q-%'
        ORDER BY id DESC
        LIMIT 1
    `);

    let nextNumber = 1;

    if (result.rows.length > 0) {
        const latest =
            result.rows[0].quotation_number;

        const match =
            latest.match(/AE-Q-(\d+)/);

        if (match) {
            nextNumber =
                Number(match[1]) + 1;
        }
    }

    return `AE-Q-${String(nextNumber).padStart(6, "0")}`;
}

/* =========================================================
   GET ALL QUOTATIONS
========================================================= */

async function getAllQuotations(filters = {}) {
    const values = [];

    const conditions = [];

    if (filters.clientId) {
        values.push(filters.clientId);

        conditions.push(
            `q.client_id = $${values.length}`
        );
    }

    if (filters.projectId) {
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

    const result = await query(
        `
        SELECT
            q.id,
            q.quotation_code,
            q.quotation_number,
            q.client_id,
            q.project_id,
            q.title,
            q.description,
            q.version,
            q.subtotal,
            q.discount,
            q.tax,
            q.installation_fee,
            q.total_amount,
            q.amount_paid,
            q.balance_due,
            q.currency,
            q.status,
            q.issue_date,
            q.valid_until,
            q.client_viewed_at,
            q.client_responded_at,
            q.rejection_reason,
            q.approved_at,
            q.approved_by,
            q.pdf_url,
            q.notes,
            q.created_at,
            q.updated_at
        FROM quotations q
        ${whereClause}
        ORDER BY q.created_at DESC
        `,
        values
    );

    return result.rows;
}

/* =========================================================
   GET QUOTATION BY ID
========================================================= */

async function getQuotationById(id) {
    const result = await query(
        `
        SELECT
            q.id,
            q.quotation_code,
            q.quotation_number,
            q.client_id,
            q.project_id,
            q.title,
            q.description,
            q.version,
            q.subtotal,
            q.discount,
            q.tax,
            q.installation_fee,
            q.total_amount,
            q.amount_paid,
            q.balance_due,
            q.currency,
            q.status,
            q.issue_date,
            q.valid_until,
            q.client_viewed_at,
            q.client_responded_at,
            q.rejection_reason,
            q.approved_at,
            q.approved_by,
            q.pdf_url,
            q.notes,
            q.created_at,
            q.updated_at
        FROM quotations q
        WHERE q.id = $1
        LIMIT 1
        `,
        [id]
    );

    return result.rows[0] || null;
}

/* =========================================================
   GET QUOTATION BY CODE
========================================================= */

async function getQuotationByCode(code) {
    const result = await query(
        `
        SELECT
            q.id,
            q.quotation_code,
            q.quotation_number,
            q.client_id,
            q.project_id,
            q.title,
            q.description,
            q.version,
            q.subtotal,
            q.discount,
            q.tax,
            q.installation_fee,
            q.total_amount,
            q.amount_paid,
            q.balance_due,
            q.currency,
            q.status,
            q.issue_date,
            q.valid_until,
            q.client_viewed_at,
            q.client_responded_at,
            q.rejection_reason,
            q.approved_at,
            q.approved_by,
            q.pdf_url,
            q.notes,
            q.created_at,
            q.updated_at
        FROM quotations q
        WHERE q.quotation_code = $1
        LIMIT 1
        `,
        [code]
    );

    return result.rows[0] || null;
}

/* =========================================================
   CREATE QUOTATION
========================================================= */

async function createQuotation(data) {
    const {
        clientId,
        projectId = null,
        title,
        description = null,
        subtotal = 0,
        discount = 0,
        tax = 0,
        installationFee = 0,
        amountPaid = 0,
        currency = "NGN",
        status = "draft",
        issueDate = null,
        validUntil = null,
        notes = null
    } = data;

    if (!clientId) {
        const error =
            new Error("Client ID is required.");

        error.status = 400;

        throw error;
    }

    if (!title || !title.trim()) {
        const error =
            new Error("Quotation title is required.");

        error.status = 400;

        throw error;
    }

    const numericSubtotal =
        Number(subtotal) || 0;

    const numericDiscount =
        Number(discount) || 0;

    const numericTax =
        Number(tax) || 0;

    const numericInstallationFee =
        Number(installationFee) || 0;

    const numericAmountPaid =
        Number(amountPaid) || 0;

    if (
        numericSubtotal < 0 ||
        numericDiscount < 0 ||
        numericTax < 0 ||
        numericInstallationFee < 0 ||
        numericAmountPaid < 0
    ) {
        const error =
            new Error(
                "Quotation financial values cannot be negative."
            );

        error.status = 400;

        throw error;
    }

    const totalAmount =
        numericSubtotal
        - numericDiscount
        + numericTax
        + numericInstallationFee;

    if (totalAmount < 0) {
        const error =
            new Error(
                "Quotation total cannot be negative."
            );

        error.status = 400;

        throw error;
    }

    if (numericAmountPaid > totalAmount) {
        const error =
            new Error(
                "Amount paid cannot exceed quotation total."
            );

        error.status = 400;

        throw error;
    }

    const balanceDue =
        totalAmount - numericAmountPaid;

    return transaction(async (client) => {

        const quotationCode =
            generateQuotationCode();

        const quotationNumber =
            await generateQuotationNumber(client);

        const result = await client.query(
            `
            INSERT INTO quotations (
                quotation_code,
                quotation_number,
                client_id,
                project_id,
                title,
                description,
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
                COALESCE($16, CURRENT_DATE),
                $17,
                $18
            )
            RETURNING *
            `,
            [
                quotationCode,
                quotationNumber,
                clientId,
                projectId,
                title.trim(),
                description,
                numericSubtotal,
                numericDiscount,
                numericTax,
                numericInstallationFee,
                totalAmount,
                numericAmountPaid,
                balanceDue,
                currency,
                status,
                issueDate,
                validUntil,
                notes
            ]
        );

        return result.rows[0];
    });
}

/* =========================================================
   UPDATE QUOTATION
========================================================= */

async function updateQuotation(id, data) {
    const existing =
        await getQuotationById(id);

    if (!existing) {
        const error =
            new Error("Quotation not found.");

        error.status = 404;

        throw error;
    }

    const {
        title,
        description,
        subtotal,
        discount,
        tax,
        installationFee,
        amountPaid,
        currency,
        status,
        validUntil,
        notes,
        projectId
    } = data;

    const newSubtotal =
        subtotal !== undefined
            ? Number(subtotal)
            : Number(existing.subtotal);

    const newDiscount =
        discount !== undefined
            ? Number(discount)
            : Number(existing.discount);

    const newTax =
        tax !== undefined
            ? Number(tax)
            : Number(existing.tax);

    const newInstallationFee =
        installationFee !== undefined
            ? Number(installationFee)
            : Number(existing.installation_fee);

    const newAmountPaid =
        amountPaid !== undefined
            ? Number(amountPaid)
            : Number(existing.amount_paid);

    if (
        newSubtotal < 0 ||
        newDiscount < 0 ||
        newTax < 0 ||
        newInstallationFee < 0 ||
        newAmountPaid < 0
    ) {
        const error =
            new Error(
                "Quotation financial values cannot be negative."
            );

        error.status = 400;

        throw error;
    }

    const totalAmount =
        newSubtotal
        - newDiscount
        + newTax
        + newInstallationFee;

    if (totalAmount < 0) {
        const error =
            new Error(
                "Quotation total cannot be negative."
            );

        error.status = 400;

        throw error;
    }

    if (newAmountPaid > totalAmount) {
        const error =
            new Error(
                "Amount paid cannot exceed quotation total."
            );

        error.status = 400;

        throw error;
    }

    const balanceDue =
        totalAmount - newAmountPaid;

    const result = await query(
        `
        UPDATE quotations
        SET
            title = COALESCE($1, title),
            description = COALESCE($2, description),
            project_id = COALESCE($3, project_id),
            subtotal = $4,
            discount = $5,
            tax = $6,
            installation_fee = $7,
            total_amount = $8,
            amount_paid = $9,
            balance_due = $10,
            currency = COALESCE($11, currency),
            status = COALESCE($12, status),
            valid_until = COALESCE($13, valid_until),
            notes = COALESCE($14, notes)
        WHERE id = $15
        RETURNING *
        `,
        [
            title !== undefined
                ? title.trim()
                : null,
            description !== undefined
                ? description
                : null,
            projectId !== undefined
                ? projectId
                : null,
            newSubtotal,
            newDiscount,
            newTax,
            newInstallationFee,
            totalAmount,
            newAmountPaid,
            balanceDue,
            currency !== undefined
                ? currency
                : null,
            status !== undefined
                ? status
                : null,
            validUntil !== undefined
                ? validUntil
                : null,
            notes !== undefined
                ? notes
                : null,
            id
        ]
    );

    return result.rows[0];
}

/* =========================================================
   SEND QUOTATION
========================================================= */

async function sendQuotation(id) {
    const updateRes = await query(
        `
        UPDATE quotations
        SET
            status = 'sent',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
        `,
        [id]
    );

    const quotation = updateRes.rows[0] || (await getQuotationById(id));
    if (!quotation) {
        const error = new Error("Quotation not found.");
        error.status = 404;
        throw error;
    }

    // Fetch linked client details
    let clientRow = null;
    if (quotation.client_id) {
        const cRes = await query(`SELECT * FROM clients WHERE id = $1`, [quotation.client_id]);
        clientRow = cRes.rows[0];
    }

    // Fetch quotation items
    const itemsRes = await query(
        `SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY sort_order ASC, id ASC`,
        [id]
    );
    const boqItems = itemsRes.rows;

    // Fetch project if linked
    let projectRow = null;
    if (quotation.project_id) {
        const pRes = await query(`SELECT * FROM projects WHERE id = $1`, [quotation.project_id]);
        projectRow = pRes.rows[0];
    }

    let emailDispatched = false;
    const clientEmail = clientRow?.email;
    if (clientEmail && emailService && emailService.sendClientQuotationEmail) {
        try {
            const clientName = clientRow.contact_name || clientRow.company_name || "Valued Client";
            const firstName = clientName.trim().split(" ")[0] || "Client";
            const projectCode = projectRow?.project_code || quotation.quotation_code || `PRJ-${id}`;

            await emailService.sendClientQuotationEmail({
                email: clientEmail,
                fullName: clientName,
                projectCode,
                username: projectCode,
                password: firstName,
                finalAmount: Number(quotation.total_amount || 0),
                pvCapacityKw: projectRow?.system_capacity_kw || 5.0,
                batteryCapacityKwh: projectRow?.battery_capacity_kwh || 10.0,
                address: clientRow.address || "Abuja, Nigeria",
                loginUrl: `${process.env.CLIENT_URL || "http://localhost:5000"}/client/login`,
                boqItems,
                commercial: {
                    finalQuotationAmount: Number(quotation.total_amount || 0),
                    subtotalEquipment: Number(quotation.subtotal || 0),
                    vatAmount: Number(quotation.tax || 0),
                    installationLabour: Number(quotation.installation_fee || 0)
                }
            });
            emailDispatched = true;
            console.log(`[QuotationService] Quotation email dispatched successfully to ${clientEmail}`);
        } catch (mailErr) {
            console.warn("[QuotationService] Email dispatch warning:", mailErr.message);
        }
    }

    return {
        ...quotation,
        emailSent: emailDispatched
    };
}

/* =========================================================
   MARK QUOTATION AS VIEWED
========================================================= */

async function markQuotationViewed(id) {
    const result = await query(
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
                )
        WHERE id = $1
        RETURNING *
        `,
        [id]
    );

    if (!result.rows[0]) {
        const error =
            new Error("Quotation not found.");

        error.status = 404;

        throw error;
    }

    return result.rows[0];
}

/* =========================================================
   ACCEPT QUOTATION
========================================================= */

async function acceptQuotation(id, approvedBy) {
    const result = await query(
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
            rejection_reason = NULL
        WHERE id = $2
        AND status IN ('sent', 'viewed')
        RETURNING *
        `,
        [
            approvedBy,
            id
        ]
    );

    if (!result.rows[0]) {
        const quotation =
            await getQuotationById(id);

        if (!quotation) {
            const error =
                new Error("Quotation not found.");

            error.status = 404;

            throw error;
        }

        const error =
            new Error(
                "This quotation cannot be accepted in its current status."
            );

        error.status = 400;

        throw error;
    }

    return result.rows[0];
}

/* =========================================================
   REJECT QUOTATION
========================================================= */

async function rejectQuotation(
    id,
    rejectionReason
) {
    if (
        !rejectionReason ||
        !rejectionReason.trim()
    ) {
        const error =
            new Error(
                "Rejection reason is required."
            );

        error.status = 400;

        throw error;
    }

    const result = await query(
        `
        UPDATE quotations
        SET
            status = 'rejected',
            rejection_reason = $1,
            client_responded_at =
                COALESCE(
                    client_responded_at,
                    CURRENT_TIMESTAMP
                )
        WHERE id = $2
        AND status IN ('sent', 'viewed')
        RETURNING *
        `,
        [
            rejectionReason.trim(),
            id
        ]
    );

    if (!result.rows[0]) {
        const quotation =
            await getQuotationById(id);

        if (!quotation) {
            const error =
                new Error("Quotation not found.");

            error.status = 404;

            throw error;
        }

        const error =
            new Error(
                "This quotation cannot be rejected in its current status."
            );

        error.status = 400;

        throw error;
    }

    return result.rows[0];
}

/* =========================================================
   DELETE / CANCEL QUOTATION
========================================================= */

async function cancelQuotation(id) {
    const result = await query(
        `
        UPDATE quotations
        SET
            status = 'cancelled'
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

    if (!result.rows[0]) {
        const quotation =
            await getQuotationById(id);

        if (!quotation) {
            const error =
                new Error("Quotation not found.");

            error.status = 404;

            throw error;
        }

        const error =
            new Error(
                "This quotation cannot be cancelled in its current status."
            );

        error.status = 400;

        throw error;
    }

    return result.rows[0];
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    generateQuotationCode,
    generateQuotationNumber,
    getAllQuotations,
    getQuotationById,
    getQuotationByCode,
    createQuotation,
    updateQuotation,
    sendQuotation,
    markQuotationViewed,
    acceptQuotation,
    rejectQuotation,
    cancelQuotation
};