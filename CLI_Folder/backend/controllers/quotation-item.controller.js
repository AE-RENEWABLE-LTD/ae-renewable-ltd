"use strict";

const quotationItemService =
    require("../services/quotationItem.service");

/* =========================================================
   AE RENEWABLE NETWORK
   QUOTATION ITEM CONTROLLER
========================================================= */


/**
 * =========================================================
 * GET ALL ITEMS FOR QUOTATION
 * =========================================================
 * GET /api/quotation-items/quotation/:quotationId
 */
async function getQuotationItems(req, res, next) {
    try {
        const { quotationId } = req.params;

        if (!quotationId) {
            return res.status(400).json({
                success: false,
                message: "Quotation ID is required."
            });
        }

        const items =
            await quotationItemService.getQuotationItems(
                quotationId
            );

        return res.status(200).json({
            success: true,
            count: items.length,
            data: items
        });

    } catch (error) {
        next(error);
    }
}


/**
 * =========================================================
 * GET QUOTATION ITEM BY ID
 * =========================================================
 * GET /api/quotation-items/:id
 */
async function getQuotationItemById(req, res, next) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Quotation item ID is required."
            });
        }

        const item =
            await quotationItemService.getQuotationItemById(
                id
            );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Quotation item not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: item
        });

    } catch (error) {
        next(error);
    }
}


/**
 * =========================================================
 * CREATE QUOTATION ITEM
 * =========================================================
 * POST /api/quotation-items
 */
async function createQuotationItem(req, res, next) {
    try {
        const item =
            await quotationItemService.createQuotationItem(
                req.body
            );

        return res.status(201).json({
            success: true,
            message: "Quotation item created successfully.",
            data: item
        });

    } catch (error) {
        next(error);
    }
}


/**
 * =========================================================
 * UPDATE QUOTATION ITEM
 * =========================================================
 * PATCH /api/quotation-items/:id
 */
async function updateQuotationItem(req, res, next) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Quotation item ID is required."
            });
        }

        const item =
            await quotationItemService.updateQuotationItem(
                id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message: "Quotation item updated successfully.",
            data: item
        });

    } catch (error) {
        next(error);
    }
}


/**
 * =========================================================
 * DELETE QUOTATION ITEM
 * =========================================================
 * DELETE /api/quotation-items/:id
 */
async function deleteQuotationItem(req, res, next) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Quotation item ID is required."
            });
        }

        const item =
            await quotationItemService.deleteQuotationItem(
                id
            );

        return res.status(200).json({
            success: true,
            message: "Quotation item deleted successfully.",
            data: item
        });

    } catch (error) {
        next(error);
    }
}


/**
 * =========================================================
 * CALCULATE QUOTATION ITEM TOTAL
 * =========================================================
 * POST /api/quotation-items/calculate
 *
 * subtotal = quantity × unitPrice
 * total    = subtotal - discount + tax
 */
function calculateItemTotal(req, res, next) {
    try {
        const {
            quantity = 1,
            unitPrice = 0,
            discount = 0,
            tax = 0
        } = req.body;

        const numericQuantity = Number(quantity);
        const numericUnitPrice = Number(unitPrice);
        const numericDiscount = Number(discount);
        const numericTax = Number(tax);

        if (
            !Number.isFinite(numericQuantity) ||
            numericQuantity <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be greater than zero."
            });
        }

        if (
            !Number.isFinite(numericUnitPrice) ||
            numericUnitPrice < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Unit price cannot be negative."
            });
        }

        if (
            !Number.isFinite(numericDiscount) ||
            numericDiscount < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Discount cannot be negative."
            });
        }

        if (
            !Number.isFinite(numericTax) ||
            numericTax < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Tax cannot be negative."
            });
        }

        const total =
            quotationItemService.calculateItemTotal(
                numericQuantity,
                numericUnitPrice,
                numericDiscount,
                numericTax
            );

        return res.status(200).json({
            success: true,
            data: {
                quantity: numericQuantity,
                unitPrice: numericUnitPrice,
                discount: numericDiscount,
                tax: numericTax,
                totalAmount: total
            }
        });

    } catch (error) {
        next(error);
    }
}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    getQuotationItems,
    getQuotationItemById,
    createQuotationItem,
    updateQuotationItem,
    deleteQuotationItem,
    calculateItemTotal
};