"use strict";

const quotationService = require("../services/quotation.service");
const clientService = require("../services/client.service");
const installerService = require("../services/installer.service");

/* =========================================================
   AE RENEWABLE NETWORK
   QUOTATION CONTROLLER
   Standalone isolation: Only Admin can access all quotations.
   Clients only see their own quotations.
========================================================= */

async function checkQuotationAccess(user, quotation) {
    if (!user) return false;
    if (user.role === "admin" || user.role === "staff") return true;

    if (user.role === "client") {
        const client = await clientService.getClientByUserId(user.id);
        if (!client) return false;
        return Number(quotation.client_id) === Number(client.id);
    }

    if (user.role === "installer") {
        const installer = await installerService.getInstallerByUserId(user.id);
        if (!installer) return false;
        return quotation.assigned_installer_id && Number(quotation.assigned_installer_id) === Number(installer.id);
    }

    return false;
}

async function getAllQuotations(req, res, next) {
    try {
        const filterParams = {
            status: req.query.status,
            projectId: req.query.projectId
        };

        if (req.user && (req.user.role === "admin" || req.user.role === "staff")) {
            if (req.query.clientId) filterParams.clientId = req.query.clientId;
        } else if (req.user && req.user.role === "client") {
            const client = await clientService.getClientByUserId(req.user.id);
            if (!client) {
                return res.status(200).json({ success: true, count: 0, data: [] });
            }
            filterParams.clientId = client.id;
        } else {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only administrators and client owners can query quotations."
            });
        }

        const quotations =
            await quotationService.getAllQuotations(filterParams);

        return res.status(200).json({
            success: true,
            count: quotations.length,
            data: quotations
        });
    } catch (error) {
        next(error);
    }
}

async function getQuotationById(req, res, next) {
    try {
        const quotation =
            await quotationService.getQuotationById(
                req.params.id
            );

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found."
            });
        }

        const hasAccess = await checkQuotationAccess(req.user, quotation);
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: "Access denied: you do not have permission to view this quotation."
            });
        }

        return res.status(200).json({
            success: true,
            data: quotation
        });
    } catch (error) {
        next(error);
    }
}

async function getQuotationByCode(req, res, next) {
    try {
        const quotation =
            await quotationService.getQuotationByCode(
                req.params.quotationCode
            );

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found."
            });
        }

        const hasAccess = await checkQuotationAccess(req.user, quotation);
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: "Access denied: you do not have permission to view this quotation."
            });
        }

        return res.status(200).json({
            success: true,
            data: quotation
        });
    } catch (error) {
        next(error);
    }
}

async function createQuotation(req, res, next) {
    try {
        const quotation =
            await quotationService.createQuotation(
                req.body
            );

        return res.status(201).json({
            success: true,
            message: "Quotation created successfully.",
            data: quotation
        });
    } catch (error) {
        next(error);
    }
}

async function updateQuotation(req, res, next) {
    try {
        const quotation =
            await quotationService.updateQuotation(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message: "Quotation updated successfully.",
            data: quotation
        });
    } catch (error) {
        next(error);
    }
}

async function sendQuotation(req, res, next) {
    try {
        const quotation =
            await quotationService.sendQuotation(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message: "Quotation sent successfully.",
            data: quotation
        });
    } catch (error) {
        next(error);
    }
}

async function markQuotationViewed(req, res, next) {
    try {
        const quotation =
            await quotationService.markQuotationViewed(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message: "Quotation marked as viewed.",
            data: quotation
        });
    } catch (error) {
        next(error);
    }
}

async function acceptQuotation(req, res, next) {
    try {
        const approvedBy =
            req.user ? req.user.id : null;

        const quotation =
            await quotationService.acceptQuotation(
                req.params.id,
                approvedBy
            );

        return res.status(200).json({
            success: true,
            message: "Quotation accepted successfully.",
            data: quotation
        });
    } catch (error) {
        next(error);
    }
}

async function rejectQuotation(req, res, next) {
    try {
        const quotation =
            await quotationService.rejectQuotation(
                req.params.id,
                req.body.rejectionReason
            );

        return res.status(200).json({
            success: true,
            message: "Quotation rejected.",
            data: quotation
        });
    } catch (error) {
        next(error);
    }
}

async function cancelQuotation(req, res, next) {
    try {
        const quotation =
            await quotationService.cancelQuotation(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message: "Quotation cancelled successfully.",
            data: quotation
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
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
