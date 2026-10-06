"use strict";

const express = require("express");

const router = express.Router();

const {
    createTicket,
    getMyTickets,
    getTicket,
    getTicketByNumber,
    getAllTickets,
    updateTicket,
    assignTicket,
    updateTicketStatus,
    deleteTicket,
    getStatistics
} = require("../controllers/support.controller");

const {
    requireAuth
} = require("../middleware/auth.middleware");

/**
 * =========================================================
 * AE RENEWABLE NETWORK
 * SUPPORT TICKET ROUTES
 * =========================================================
 */

/**
 * CREATE SUPPORT TICKET
 * POST /api/support
 */
router.post(
    "/",
    requireAuth,
    createTicket
);

/**
 * GET AUTHENTICATED USER'S TICKETS
 * GET /api/support/my
 */
router.get(
    "/my",
    requireAuth,
    getMyTickets
);

/**
 * GET TICKET STATISTICS
 * GET /api/support/statistics
 */
router.get(
    "/statistics",
    requireAuth,
    getStatistics
);

/**
 * GET TICKET BY TICKET NUMBER
 * GET /api/support/ticket/:ticketNumber
 *
 * Must be BEFORE /:id
 */
router.get(
    "/ticket/:ticketNumber",
    requireAuth,
    getTicketByNumber
);

/**
 * GET ALL TICKETS
 * GET /api/support
 */
router.get(
    "/",
    requireAuth,
    getAllTickets
);

/**
 * GET TICKET BY ID
 * GET /api/support/:id
 */
router.get(
    "/:id",
    requireAuth,
    getTicket
);

/**
 * UPDATE TICKET
 * PUT /api/support/:id
 */
router.put(
    "/:id",
    requireAuth,
    updateTicket
);

/**
 * ASSIGN TICKET
 * PATCH /api/support/:id/assign
 */
router.patch(
    "/:id/assign",
    requireAuth,
    assignTicket
);

/**
 * UPDATE TICKET STATUS
 * PATCH /api/support/:id/status
 */
router.patch(
    "/:id/status",
    requireAuth,
    updateTicketStatus
);

/**
 * DELETE TICKET
 * DELETE /api/support/:id
 */
router.delete(
    "/:id",
    requireAuth,
    deleteTicket
);

module.exports = router;