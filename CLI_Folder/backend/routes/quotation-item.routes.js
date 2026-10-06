"use strict";

const express = require("express");

const quotationItemController =
    require("../controllers/quotation-item.controller");

const {
    requireAuth,
    requireStaff
} = require("../middleware/auth.middleware");

const router = express.Router();

/* =========================================================
   AE RENEWABLE NETWORK
   QUOTATION ITEM ROUTES
========================================================= */

/* =========================================================
   GET QUOTATION ITEMS
   GET /api/quotation-items/quotation/:quotationId
========================================================= */

router.get(
    "/quotation/:quotationId",
    requireAuth,
    requireStaff,
    quotationItemController.getQuotationItems
);

/* =========================================================
   CALCULATE ITEM TOTAL
   POST /api/quotation-items/calculate
========================================================= */

router.post(
    "/calculate",
    requireAuth,
    requireStaff,
    quotationItemController.calculateItemTotal
);

/* =========================================================
   GET SINGLE QUOTATION ITEM
   GET /api/quotation-items/:id
========================================================= */

router.get(
    "/:id",
    requireAuth,
    requireStaff,
    quotationItemController.getQuotationItemById
);

/* =========================================================
   CREATE QUOTATION ITEM
   POST /api/quotation-items
========================================================= */

router.post(
    "/",
    requireAuth,
    requireStaff,
    quotationItemController.createQuotationItem
);

/* =========================================================
   UPDATE QUOTATION ITEM
   PATCH /api/quotation-items/:id
========================================================= */

router.patch(
    "/:id",
    requireAuth,
    requireStaff,
    quotationItemController.updateQuotationItem
);

/* =========================================================
   DELETE QUOTATION ITEM
   DELETE /api/quotation-items/:id
========================================================= */

router.delete(
    "/:id",
    requireAuth,
    requireStaff,
    quotationItemController.deleteQuotationItem
);

/* =========================================================
   EXPORT
========================================================= */

module.exports = router;