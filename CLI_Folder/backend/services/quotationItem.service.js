"use strict";

const { query, transaction } = require("../config/database");

/* =========================================================
   AE RENEWABLE NETWORK
   QUOTATION ITEM SERVICE
========================================================= */

/* =========================================================
   GET ALL ITEMS FOR QUOTATION
========================================================= */

async function getQuotationItems(quotationId) {

    const result = await query(
        `
        SELECT
            id,
            quotation_id,
            item_type,
            item_code,
            name,
            description,
            quantity,
            unit,
            unit_price,
            discount,
            tax,
            total_amount,
            sort_order,
            created_at,
            updated_at
        FROM quotation_items
        WHERE quotation_id = $1
        ORDER BY sort_order ASC, id ASC
        `,
        [quotationId]
    );

    return result.rows;
}

/* =========================================================
   GET ITEM BY ID
========================================================= */

async function getQuotationItemById(id) {

    const result = await query(
        `
        SELECT
            id,
            quotation_id,
            item_type,
            item_code,
            name,
            description,
            quantity,
            unit,
            unit_price,
            discount,
            tax,
            total_amount,
            sort_order,
            created_at,
            updated_at
        FROM quotation_items
        WHERE id = $1
        LIMIT 1
        `,
        [id]
    );

    return result.rows[0] || null;
}

/* =========================================================
   CALCULATE ITEM TOTAL
========================================================= */

function calculateItemTotal(
    quantity,
    unitPrice,
    discount,
    tax
) {

    const numericQuantity = Number(quantity) || 0;
    const numericUnitPrice = Number(unitPrice) || 0;
    const numericDiscount = Number(discount) || 0;
    const numericTax = Number(tax) || 0;

    const subtotal =
        numericQuantity * numericUnitPrice;

    const total =
        subtotal
        - numericDiscount
        + numericTax;

    return Number(total.toFixed(2));
}

/* =========================================================
   CREATE QUOTATION ITEM
========================================================= */

async function createQuotationItem(data) {

    const {
        quotationId,
        itemType = "product",
        itemCode = null,
        name,
        description = null,
        quantity = 1,
        unit = "unit",
        unitPrice = 0,
        discount = 0,
        tax = 0,
        sortOrder = 0
    } = data;

    if (!quotationId) {
        const error = new Error(
            "Quotation ID is required."
        );

        error.status = 400;

        throw error;
    }

    if (!name || !name.trim()) {
        const error = new Error(
            "Quotation item name is required."
        );

        error.status = 400;

        throw error;
    }

    const numericQuantity = Number(quantity);
    const numericUnitPrice = Number(unitPrice);
    const numericDiscount = Number(discount);
    const numericTax = Number(tax);

    if (
        !Number.isFinite(numericQuantity) ||
        numericQuantity <= 0
    ) {
        const error = new Error(
            "Quantity must be greater than zero."
        );

        error.status = 400;

        throw error;
    }

    if (
        !Number.isFinite(numericUnitPrice) ||
        numericUnitPrice < 0
    ) {
        const error = new Error(
            "Unit price cannot be negative."
        );

        error.status = 400;

        throw error;
    }

    if (
        !Number.isFinite(numericDiscount) ||
        numericDiscount < 0
    ) {
        const error = new Error(
            "Discount cannot be negative."
        );

        error.status = 400;

        throw error;
    }

    if (
        !Number.isFinite(numericTax) ||
        numericTax < 0
    ) {
        const error = new Error(
            "Tax cannot be negative."
        );

        error.status = 400;

        throw error;
    }

    const totalAmount =
        calculateItemTotal(
            numericQuantity,
            numericUnitPrice,
            numericDiscount,
            numericTax
        );

    return transaction(async (client) => {

        const quotation =
            await client.query(
                `
                SELECT id
                FROM quotations
                WHERE id = $1
                LIMIT 1
                `,
                [quotationId]
            );

        if (!quotation.rows[0]) {
            const error = new Error(
                "Quotation not found."
            );

            error.status = 404;

            throw error;
        }

        const result =
            await client.query(
                `
                INSERT INTO quotation_items (
                    quotation_id,
                    item_type,
                    item_code,
                    name,
                    description,
                    quantity,
                    unit,
                    unit_price,
                    discount,
                    tax,
                    total_amount,
                    sort_order
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
                    $12
                )
                RETURNING *
                `,
                [
                    quotationId,
                    itemType,
                    itemCode,
                    name.trim(),
                    description,
                    numericQuantity,
                    unit,
                    numericUnitPrice,
                    numericDiscount,
                    numericTax,
                    totalAmount,
                    Number(sortOrder) || 0
                ]
            );

        return result.rows[0];
    });
}

/* =========================================================
   UPDATE QUOTATION ITEM
========================================================= */

async function updateQuotationItem(id, data) {

    const existing =
        await getQuotationItemById(id);

    if (!existing) {
        const error = new Error(
            "Quotation item not found."
        );

        error.status = 404;

        throw error;
    }

    const quantity =
        data.quantity !== undefined
            ? Number(data.quantity)
            : Number(existing.quantity);

    const unitPrice =
        data.unitPrice !== undefined
            ? Number(data.unitPrice)
            : Number(existing.unit_price);

    const discount =
        data.discount !== undefined
            ? Number(data.discount)
            : Number(existing.discount);

    const tax =
        data.tax !== undefined
            ? Number(data.tax)
            : Number(existing.tax);

    if (!Number.isFinite(quantity) || quantity <= 0) {
        const error = new Error(
            "Quantity must be greater than zero."
        );

        error.status = 400;

        throw error;
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        const error = new Error(
            "Unit price cannot be negative."
        );

        error.status = 400;

        throw error;
    }

    if (!Number.isFinite(discount) || discount < 0) {
        const error = new Error(
            "Discount cannot be negative."
        );

        error.status = 400;

        throw error;
    }

    if (!Number.isFinite(tax) || tax < 0) {
        const error = new Error(
            "Tax cannot be negative."
        );

        error.status = 400;

        throw error;
    }

    const totalAmount =
        calculateItemTotal(
            quantity,
            unitPrice,
            discount,
            tax
        );

    const result =
        await query(
            `
            UPDATE quotation_items
            SET
                item_type = COALESCE($1, item_type),
                item_code = COALESCE($2, item_code),
                name = COALESCE($3, name),
                description = COALESCE($4, description),
                quantity = $5,
                unit = COALESCE($6, unit),
                unit_price = $7,
                discount = $8,
                tax = $9,
                total_amount = $10,
                sort_order = COALESCE($11, sort_order),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $12
            RETURNING *
            `,
            [
                data.itemType !== undefined
                    ? data.itemType
                    : null,

                data.itemCode !== undefined
                    ? data.itemCode
                    : null,

                data.name !== undefined
                    ? data.name.trim()
                    : null,

                data.description !== undefined
                    ? data.description
                    : null,

                quantity,

                data.unit !== undefined
                    ? data.unit
                    : null,

                unitPrice,
                discount,
                tax,
                totalAmount,

                data.sortOrder !== undefined
                    ? Number(data.sortOrder)
                    : null,

                id
            ]
        );

    return result.rows[0];
}

/* =========================================================
   DELETE QUOTATION ITEM
========================================================= */

async function deleteQuotationItem(id) {

    const result =
        await query(
            `
            DELETE FROM quotation_items
            WHERE id = $1
            RETURNING *
            `,
            [id]
        );

    if (!result.rows[0]) {
        const error = new Error(
            "Quotation item not found."
        );

        error.status = 404;

        throw error;
    }

    return result.rows[0];
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    getQuotationItems,
    getQuotationItemById,
    calculateItemTotal,
    createQuotationItem,
    updateQuotationItem,
    deleteQuotationItem
};
