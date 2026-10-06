"use strict";

const express = require("express");

const quotationController =
    require("../controllers/quotation.controller");

const {
    requireAuth,
    requireAdmin,
    requireStaff,
    requireClient
} = require("../middleware/auth.middleware");

const router = express.Router();

/* =========================================================
   AE RENEWABLE NETWORK
   QUOTATION ROUTES
========================================================= */

/* =========================================================
   QUOTATION LIST
   ADMIN / STAFF
========================================================= */

/*
   GET /api/quotations
*/

router.get(
    "/",
    requireAuth,
    quotationController.getAllQuotations
);

/* =========================================================
   QUOTATION LOOKUP BY CODE
   AUTHENTICATED USERS
========================================================= */

/*
   GET /api/quotations/code/:quotationCode
*/

router.get(
    "/code/:quotationCode",
    requireAuth,
    quotationController.getQuotationByCode
);

/* =========================================================
   QUOTATION LOOKUP BY ID
   AUTHENTICATED USERS
========================================================= */

/*
   GET /api/quotations/:id
*/

router.get(
    "/:id",
    requireAuth,
    quotationController.getQuotationById
);

/* =========================================================
   CREATE QUOTATION
   ADMIN / STAFF
========================================================= */

/*
   POST /api/quotations
*/

router.post(
    "/",
    requireAuth,
    requireStaff,
    quotationController.createQuotation
);

/* =========================================================
   UPDATE QUOTATION
   ADMIN / STAFF
========================================================= */

/*
   PATCH /api/quotations/:id
*/

router.patch(
    "/:id",
    requireAuth,
    requireStaff,
    quotationController.updateQuotation
);

/* =========================================================
   SEND QUOTATION
   ADMIN / STAFF
========================================================= */

/*
   POST /api/quotations/:id/send
*/

router.post(
    "/:id/send",
    requireAuth,
    requireStaff,
    quotationController.sendQuotation
);

/* =========================================================
   MARK QUOTATION VIEWED
   CLIENT / STAFF / ADMIN
========================================================= */

/*
   POST /api/quotations/:id/view
*/

router.post(
    "/:id/view",
    requireAuth,
    requireClient,
    quotationController.markQuotationViewed
);

/* =========================================================
   ACCEPT QUOTATION
   CLIENT
========================================================= */

/*
   POST /api/quotations/:id/accept
*/

router.post(
    "/:id/accept",
    requireAuth,
    requireClient,
    quotationController.acceptQuotation
);

/* =========================================================
   REJECT QUOTATION
   CLIENT
========================================================= */

/*
   POST /api/quotations/:id/reject
*/

router.post(
    "/:id/reject",
    requireAuth,
    requireClient,
    quotationController.rejectQuotation
);

/* =========================================================
   CANCEL QUOTATION
   ADMIN / STAFF
========================================================= */

/*
   POST /api/quotations/:id/cancel
*/

router.post(
    "/:id/cancel",
    requireAuth,
    requireStaff,
    quotationController.cancelQuotation
);

/* =========================================================
   EXPORT
========================================================= */

module.exports = router;
