"use strict";

const QuotationItem = require("../models/QuotationItem");

/* =========================================================
   AE RENEWABLE NETWORK
   QUOTATION ITEM SERVICE
========================================================= */

/**
 * Get all items belonging to a quotation.
 */
async function getQuotationItems(quotationId) {
    return QuotationItem.findByQuotationId(quotationId);
}

/**
 * Get a single quotation item.
 */
async function getQuotationItemById(id) {
    return QuotationItem.findById(id);
}

/**
 * Create a quotation item.
 */
async function createQuotationItem(data) {
    validateQuotationItem(data);

    return QuotationItem.create(data);
}

/**
 * Update a quotation item.
 */
async function updateQuotationItem(id, data) {
    if (!id) {
        throw new Error("Quotation item ID is required.");
    }

    if (data.quantity !== undefined && Number(data.quantity) <= 0) {
        throw new Error("Quantity must be greater than zero.");
    }

    if (data.unitPrice !== undefined && Number(data.unitPrice) < 0) {
        throw new Error("Unit price cannot be negative.");
    }

    return QuotationItem.update(id, data);
}

/**
 * Delete a quotation item.
 */
async function deleteQuotationItem(id) {
    if (!id) {
        throw new Error("Quotation item ID is required.");
    }

    return QuotationItem.remove(id);
}

/**
 * Recalculate a quotation item's total.
 */
function calculateItemTotal({
    quantity = 1,
    unitPrice = 0,
    discount = 0,
    tax = 0
}) {
    const qty = Number(quantity);
    const price = Number(unitPrice);
    const discountAmount = Number(discount);
    const taxAmount = Number(tax);

    if (qty < 0) {
        throw new Error("Quantity cannot be negative.");
    }

    if (price < 0) {
        throw new Error("Unit price cannot be negative.");
    }

    if (discountAmount < 0) {
        throw new Error("Discount cannot be negative.");
    }

    if (taxAmount < 0) {
        throw new Error("Tax cannot be negative.");
    }

    const subtotal = qty * price;
    const total = subtotal - discountAmount + taxAmount;

    return Number(Math.max(total, 0).toFixed(2));
}

/**
 * Validate quotation item input.
 */
function validateQuotationItem(data) {
    if (!data || typeof data !== "object") {
        throw new Error("Quotation item data is required.");
    }

    if (!data.quotationId) {
        throw new Error("Quotation ID is required.");
    }

    if (!data.name || !String(data.name).trim()) {
        throw new Error("Quotation item name is required.");
    }

    if (
        data.quantity !== undefined &&
        Number(data.quantity) <= 0
    ) {
        throw new Error("Quantity must be greater than zero.");
    }

    if (
        data.unitPrice !== undefined &&
        Number(data.unitPrice) < 0
    ) {
        throw new Error("Unit price cannot be negative.");
    }

    if (
        data.discount !== undefined &&
        Number(data.discount) < 0
    ) {
        throw new Error("Discount cannot be negative.");
    }

    if (
        data.tax !== undefined &&
        Number(data.tax) < 0
    ) {
        throw new Error("Tax cannot be negative.");
    }

    return true;
}

module.exports = {
    getQuotationItems,
    getQuotationItemById,
    createQuotationItem,
    updateQuotationItem,
    deleteQuotationItem,
    calculateItemTotal,
    validateQuotationItem
};
