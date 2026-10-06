"use strict";

const Document = require("../models/Document");

/* =========================================================
   AE RENEWABLE NETWORK
   DOCUMENT SERVICE
========================================================= */

const DOCUMENT_TYPES = [
    "identity",
    "cac_certificate",
    "professional_certificate",
    "quotation",
    "invoice",
    "receipt",
    "contract",
    "agreement",
    "site_survey",
    "technical_report",
    "installation_report",
    "commissioning_report",
    "project_photo",
    "payment_proof",
    "warranty",
    "manual",
    "other"
];

const DOCUMENT_STATUSES = [
    "active",
    "archived",
    "deleted",
    "pending"
];

const DOCUMENT_VISIBILITIES = [
    "private",
    "client",
    "installer",
    "admin",
    "public"
];

/* =========================================================
   GENERATE DOCUMENT CODE
========================================================= */

function generateDocumentCode() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const random = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    return `AE-DOC-${year}${month}${day}-${random}`;
}

/* =========================================================
   VALIDATE ID
========================================================= */

function validateId(id, fieldName = "Document ID") {
    if (
        id === undefined ||
        id === null ||
        id === "" ||
        !Number.isInteger(Number(id)) ||
        Number(id) <= 0
    ) {
        const error = new Error(`${fieldName} is invalid.`);
        error.status = 400;
        throw error;
    }

    return Number(id);
}

/* =========================================================
   GET ALL DOCUMENTS
========================================================= */

async function getAllDocuments(filters = {}) {
    return Document.findAll(filters);
}

/* =========================================================
   GET DOCUMENT BY ID
========================================================= */

async function getDocumentById(id) {
    const documentId = validateId(id);

    const document =
        await Document.findById(documentId);

    if (!document) {
        const error =
            new Error("Document not found.");

        error.status = 404;

        throw error;
    }

    return document;
}

/* =========================================================
   GET DOCUMENT BY CODE
========================================================= */

async function getDocumentByCode(code) {
    if (!code || !String(code).trim()) {
        const error =
            new Error("Document code is required.");

        error.status = 400;

        throw error;
    }

    const document =
        await Document.findByCode(
            String(code).trim()
        );

    if (!document) {
        const error =
            new Error("Document not found.");

        error.status = 404;

        throw error;
    }

    return document;
}

/* =========================================================
   CREATE DOCUMENT
========================================================= */

async function createDocument(data = {}) {

    const {
        documentName,
        documentType,
        description = null,
        clientId = null,
        projectId = null,
        uploadedBy = null,
        fileName,
        originalFileName = null,
        fileUrl,
        filePath = null,
        mimeType = null,
        fileSize = null,
        status = "active",
        visibility = "private",
        version = 1,
        verified = false,
        verifiedBy = null,
        verifiedAt = null
    } = data;

    /* -----------------------------------------------------
       REQUIRED FIELDS
    ----------------------------------------------------- */

    if (!documentName || !documentName.trim()) {
        const error =
            new Error("Document name is required.");

        error.status = 400;

        throw error;
    }

    if (!documentType) {
        const error =
            new Error("Document type is required.");

        error.status = 400;

        throw error;
    }

    if (!DOCUMENT_TYPES.includes(documentType)) {
        const error =
            new Error(
                `Invalid document type: ${documentType}.`
            );

        error.status = 400;

        throw error;
    }

    if (!fileName || !fileName.trim()) {
        const error =
            new Error("File name is required.");

        error.status = 400;

        throw error;
    }

    if (!fileUrl || !String(fileUrl).trim()) {
        const error =
            new Error("File URL is required.");

        error.status = 400;

        throw error;
    }

    /* -----------------------------------------------------
       VALIDATE STATUS
    ----------------------------------------------------- */

    if (!DOCUMENT_STATUSES.includes(status)) {
        const error =
            new Error(
                `Invalid document status: ${status}.`
            );

        error.status = 400;

        throw error;
    }

    /* -----------------------------------------------------
       VALIDATE VISIBILITY
    ----------------------------------------------------- */

    if (!DOCUMENT_VISIBILITIES.includes(visibility)) {
        const error =
            new Error(
                `Invalid document visibility: ${visibility}.`
            );

        error.status = 400;

        throw error;
    }

    /* -----------------------------------------------------
       VALIDATE VERSION
    ----------------------------------------------------- */

    const numericVersion =
        Number(version);

    if (
        !Number.isInteger(numericVersion) ||
        numericVersion <= 0
    ) {
        const error =
            new Error(
                "Document version must be a positive integer."
            );

        error.status = 400;

        throw error;
    }

    /* -----------------------------------------------------
       VALIDATE FILE SIZE
    ----------------------------------------------------- */

    let numericFileSize = null;

    if (
        fileSize !== null &&
        fileSize !== undefined &&
        fileSize !== ""
    ) {
        numericFileSize =
            Number(fileSize);

        if (
            !Number.isInteger(numericFileSize) ||
            numericFileSize < 0
        ) {
            const error =
                new Error(
                    "File size must be a non-negative integer."
                );

            error.status = 400;

            throw error;
        }
    }

    /* -----------------------------------------------------
       GENERATE UNIQUE DOCUMENT CODE
    ----------------------------------------------------- */

    let documentCode =
        generateDocumentCode();

    /*
     * Extremely unlikely collision protection.
     */
    let existing =
        await Document.findByCode(documentCode);

    while (existing) {
        documentCode =
            generateDocumentCode();

        existing =
            await Document.findByCode(documentCode);
    }

    /* -----------------------------------------------------
       CREATE
    ----------------------------------------------------- */

    return Document.create({
        documentCode,
        documentName: documentName.trim(),
        documentType,
        description,
        clientId,
        projectId,
        uploadedBy,
        fileName: fileName.trim(),
        originalFileName,
        fileUrl: String(fileUrl).trim(),
        filePath,
        mimeType,
        fileSize: numericFileSize,
        status,
        visibility,
        version: numericVersion,
        verified,
        verifiedBy,
        verifiedAt
    });
}

/* =========================================================
   UPDATE DOCUMENT
========================================================= */

async function updateDocument(id, data = {}) {

    const documentId =
        validateId(id);

    const existing =
        await Document.findById(documentId);

    if (!existing) {
        const error =
            new Error("Document not found.");

        error.status = 404;

        throw error;
    }

    if (
        data.documentType !== undefined &&
        !DOCUMENT_TYPES.includes(data.documentType)
    ) {
        const error =
            new Error(
                `Invalid document type: ${data.documentType}.`
            );

        error.status = 400;

        throw error;
    }

    if (
        data.status !== undefined &&
        !DOCUMENT_STATUSES.includes(data.status)
    ) {
        const error =
            new Error(
                `Invalid document status: ${data.status}.`
            );

        error.status = 400;

        throw error;
    }

    if (
        data.visibility !== undefined &&
        !DOCUMENT_VISIBILITIES.includes(data.visibility)
    ) {
        const error =
            new Error(
                `Invalid document visibility: ${data.visibility}.`
            );

        error.status = 400;

        throw error;
    }

    if (data.version !== undefined) {
        const version =
            Number(data.version);

        if (
            !Number.isInteger(version) ||
            version <= 0
        ) {
            const error =
                new Error(
                    "Document version must be a positive integer."
                );

            error.status = 400;

            throw error;
        }
    }

    if (data.fileSize !== undefined &&
        data.fileSize !== null) {

        const fileSize =
            Number(data.fileSize);

        if (
            !Number.isInteger(fileSize) ||
            fileSize < 0
        ) {
            const error =
                new Error(
                    "File size must be a non-negative integer."
                );

            error.status = 400;

            throw error;
        }
    }

    return Document.update(
        documentId,
        data
    );
}

/* =========================================================
   UPDATE STATUS
========================================================= */

async function updateDocumentStatus(
    id,
    status
) {
    const documentId =
        validateId(id);

    if (!DOCUMENT_STATUSES.includes(status)) {
        const error =
            new Error(
                `Invalid document status: ${status}.`
            );

        error.status = 400;

        throw error;
    }

    const document =
        await Document.updateStatus(
            documentId,
            status
        );

    if (!document) {
        const error =
            new Error("Document not found.");

        error.status = 404;

        throw error;
    }

    return document;
}

/* =========================================================
   VERIFY DOCUMENT
========================================================= */

async function verifyDocument(
    id,
    verifiedBy
) {
    const documentId =
        validateId(id);

    const document =
        await Document.findById(documentId);

    if (!document) {
        const error =
            new Error("Document not found.");

        error.status = 404;

        throw error;
    }

    return Document.verify(
        documentId,
        verifiedBy || null
    );
}

/* =========================================================
   UNVERIFY DOCUMENT
========================================================= */

async function unverifyDocument(id) {
    const documentId =
        validateId(id);

    const document =
        await Document.findById(documentId);

    if (!document) {
        const error =
            new Error("Document not found.");

        error.status = 404;

        throw error;
    }

    return Document.unverify(
        documentId
    );
}

/* =========================================================
   ARCHIVE DOCUMENT
========================================================= */

async function archiveDocument(id) {
    return updateDocumentStatus(
        id,
        "archived"
    );
}

/* =========================================================
   DELETE DOCUMENT
========================================================= */

async function deleteDocument(id) {
    return updateDocumentStatus(
        id,
        "deleted"
    );
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    DOCUMENT_TYPES,
    DOCUMENT_STATUSES,
    DOCUMENT_VISIBILITIES,

    generateDocumentCode,

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
