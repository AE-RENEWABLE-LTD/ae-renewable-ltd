"use strict";

const quotationItemService = require("../services/quotationItem.service");

/* =========================================================
   AE RENEWABLE NETWORK
   QUOTATION ITEM CONTROLLER
========================================================= */

/**
 * GET /api/quotation-items/quotation/:quotationId
 * Get all items belonging to a quotation.
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
            data: items
        });

    } catch (error) {
        next(error);
    }
}


/**
 * GET /api/quotation-items/:id
 * Get a single quotation item.
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
            await quotationItemService.getQuotationItemById(id);

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
 * POST /api/quotation-items
 * Create a quotation item.
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
 * PATCH /api/quotation-items/:id
 * Update a quotation item.
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

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Quotation item not found."
            });
        }

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
 * DELETE /api/quotation-items/:id
 * Delete a quotation item.
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
            await quotationItemService.deleteQuotationItem(id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Quotation item not found."
            });
        }

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
 * POST /api/quotation-items/calculate
 * Calculate quotation item total without saving.
 */
async function calculateItemTotal(req, res, next) {
    try {
        const total =
            quotationItemService.calculateItemTotal(
                req.body
            );

        return res.status(200).json({
            success: true,
            data: {
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