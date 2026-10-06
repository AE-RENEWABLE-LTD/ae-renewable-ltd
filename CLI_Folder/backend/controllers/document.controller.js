"use strict";

const documentService =
    require("../services/document.service");

/* =========================================================
   AE RENEWABLE NETWORK
   DOCUMENT CONTROLLER
========================================================= */

/* =========================================================
   GET ALL DOCUMENTS
========================================================= */

async function getAllDocuments(req, res, next) {
    try {
        const documents =
            await documentService.getAllDocuments(
                req.query
            );

        res.status(200).json({
            success: true,
            message: "Documents retrieved successfully.",
            data: {
                documents,
                count: documents.length
            }
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   GET DOCUMENT BY ID
========================================================= */

async function getDocumentById(req, res, next) {
    try {
        const document =
            await documentService.getDocumentById(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Document retrieved successfully.",
            data: document
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   GET DOCUMENT BY CODE
========================================================= */

async function getDocumentByCode(req, res, next) {
    try {
        const document =
            await documentService.getDocumentByCode(
                req.params.documentCode
            );

        res.status(200).json({
            success: true,
            message: "Document retrieved successfully.",
            data: document
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   CREATE DOCUMENT
========================================================= */

async function createDocument(req, res, next) {
    try {
        const document =
            await documentService.createDocument(
                {
                    ...req.body,
                    uploadedBy:
                        req.body.uploadedBy ||
                        req.user.id
                }
            );

        res.status(201).json({
            success: true,
            message: "Document created successfully.",
            data: document
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   UPDATE DOCUMENT
========================================================= */

async function updateDocument(req, res, next) {
    try {
        const document =
            await documentService.updateDocument(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Document updated successfully.",
            data: document
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   UPDATE DOCUMENT STATUS
========================================================= */

async function updateDocumentStatus(req, res, next) {
    try {
        const {
            status
        } = req.body;

        const document =
            await documentService.updateDocumentStatus(
                req.params.id,
                status
            );

        res.status(200).json({
            success: true,
            message: "Document status updated successfully.",
            data: document
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   VERIFY DOCUMENT
========================================================= */

async function verifyDocument(req, res, next) {
    try {
        const document =
            await documentService.verifyDocument(
                req.params.id,
                req.user.id
            );

        res.status(200).json({
            success: true,
            message: "Document verified successfully.",
            data: document
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   UNVERIFY DOCUMENT
========================================================= */

async function unverifyDocument(req, res, next) {
    try {
        const document =
            await documentService.unverifyDocument(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Document unverified successfully.",
            data: document
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   ARCHIVE DOCUMENT
========================================================= */

async function archiveDocument(req, res, next) {
    try {
        const document =
            await documentService.archiveDocument(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Document archived successfully.",
            data: document
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   DELETE DOCUMENT
========================================================= */

async function deleteDocument(req, res, next) {
    try {
        const document =
            await documentService.deleteDocument(
                req.params.id
            );

        res.status(200).json({
            success: true,
            message: "Document deleted successfully.",
            data: document
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    getAllDocuments,
    getDocumentById,
    getDocumentByCode,
    createDocument,
    updateDocument,
    updateDocumentStatus,
    verifyDocument,
    unverifyDocument,
    archiveDocument,
    deleteDocument
};