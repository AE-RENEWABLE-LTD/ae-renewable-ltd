"use strict";

const express = require("express");

const paymentController =
    require("../controllers/payment.controller");

const {
    requireAuth,
    requireStaff
} = require("../middleware/auth.middleware");

const router = express.Router();

/* =========================================================
   AE RENEWABLE NETWORK
   PAYMENT ROUTES
========================================================= */

/* =========================================================
   GET ALL PAYMENTS
   GET /api/payments
========================================================= */

router.get(
    "/",
    requireAuth,
    paymentController.getPayments
);

/* =========================================================
   GET PAYMENT BY REFERENCE
   GET /api/payments/reference/:paymentReference
========================================================= */

router.get(
    "/reference/:paymentReference",
    requireAuth,
    paymentController.getPaymentByReference
);

/* =========================================================
   GET PAYMENT BY ID
   GET /api/payments/:id
========================================================= */

router.get(
    "/:id",
    requireAuth,
    paymentController.getPaymentById
);

/* =========================================================
   CREATE PAYMENT
   POST /api/payments
========================================================= */

router.post(
    "/",
    requireAuth,
    requireStaff,
    paymentController.createPayment
);

/* =========================================================
   UPDATE PAYMENT
   PATCH /api/payments/:id
========================================================= */

router.patch(
    "/:id",
    requireAuth,
    requireStaff,
    paymentController.updatePayment
);

/* =========================================================
   UPDATE PAYMENT STATUS
   PATCH /api/payments/:id/status
========================================================= */

router.patch(
    "/:id/status",
    requireAuth,
    requireStaff,
    paymentController.updatePaymentStatus
);

/* =========================================================
   VERIFY PAYMENT
   PATCH /api/payments/:id/verify & POST /api/payments/:id/verify
========================================================= */

router.patch(
    "/:id/verify",
    requireAuth,
    requireStaff,
    paymentController.verifyPayment
);

router.post(
    "/:id/verify",
    requireAuth,
    requireStaff,
    paymentController.verifyPayment
);

/* =========================================================
   UNVERIFY PAYMENT
   PATCH /api/payments/:id/unverify & POST /api/payments/:id/unverify
========================================================= */

router.patch(
    "/:id/unverify",
    requireAuth,
    requireStaff,
    paymentController.unverifyPayment
);

router.post(
    "/:id/unverify",
    requireAuth,
    requireStaff,
    paymentController.unverifyPayment
);

/* =========================================================
   DELETE PAYMENT
   DELETE /api/payments/:id
========================================================= */

router.delete(
    "/:id",
    requireAuth,
    requireStaff,
    paymentController.deletePayment
);

/* =========================================================
   EXPORT
========================================================= */

module.exports = router;