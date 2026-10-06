"use strict";

const express = require("express");

const documentController =
    require("../controllers/document.controller");

const {
    requireAuth,
    requireStaff
} = require("../middleware/auth.middleware");

const router = express.Router();

/* =========================================================
   AE RENEWABLE NETWORK
   DOCUMENT ROUTES
========================================================= */

/* =========================================================
   GET ALL DOCUMENTS
   ADMIN / STAFF
========================================================= */

router.get(
    "/",
    requireAuth,
    requireStaff,
    documentController.getAllDocuments
);

/* =========================================================
   GET DOCUMENT BY CODE
   ADMIN / STAFF
========================================================= */

router.get(
    "/code/:documentCode",
    requireAuth,
    requireStaff,
    documentController.getDocumentByCode
);

/* =========================================================
   GET DOCUMENT BY ID
   ADMIN / STAFF
========================================================= */

router.get(
    "/:id",
    requireAuth,
    requireStaff,
    documentController.getDocumentById
);

/* =========================================================
   CREATE DOCUMENT
   ADMIN / STAFF
========================================================= */

router.post(
    "/",
    requireAuth,
    requireStaff,
    documentController.createDocument
);

/* =========================================================
   UPDATE DOCUMENT
   ADMIN / STAFF
========================================================= */

router.patch(
    "/:id",
    requireAuth,
    requireStaff,
    documentController.updateDocument
);

/* =========================================================
   UPDATE DOCUMENT STATUS
   ADMIN / STAFF
========================================================= */

router.patch(
    "/:id/status",
    requireAuth,
    requireStaff,
    documentController.updateDocumentStatus
);

/* =========================================================
   VERIFY DOCUMENT
   ADMIN / STAFF
========================================================= */

router.patch(
    "/:id/verify",
    requireAuth,
    requireStaff,
    documentController.verifyDocument
);

/* =========================================================
   UNVERIFY DOCUMENT
   ADMIN / STAFF
========================================================= */

router.patch(
    "/:id/unverify",
    requireAuth,
    requireStaff,
    documentController.unverifyDocument
);

/* =========================================================
   ARCHIVE DOCUMENT
   ADMIN / STAFF
========================================================= */

router.patch(
    "/:id/archive",
    requireAuth,
    requireStaff,
    documentController.archiveDocument
);

/* =========================================================
   DELETE DOCUMENT
   ADMIN / STAFF
========================================================= */

router.delete(
    "/:id",
    requireAuth,
    requireStaff,
    documentController.deleteDocument
);

/* =========================================================
   EXPORT
========================================================= */

module.exports = router;