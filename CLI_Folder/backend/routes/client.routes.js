
"use strict";

const express = require("express");

const clientController = require("../controllers/client.controller");
const {
    requireAuth,
    requireAdmin
} = require("../middleware/auth.middleware");

const router = express.Router();

/* =========================================================
   AE RENEWABLE NETWORK
   CLIENT ROUTES
========================================================= */

/* =========================================================
   CURRENT AUTHENTICATED CLIENT
========================================================= */

/*
   GET /api/clients/me
*/

router.get(
    "/me",
    requireAuth,
    clientController.getMyClient
);

/*
   PATCH /api/clients/me
*/

router.patch(
    "/me",
    requireAuth,
    clientController.updateMyClient
);

/* =========================================================
   CLIENT LOOKUP
========================================================= */

/*
   GET /api/clients/code/:clientCode
*/

router.get(
    "/code/:clientCode",
    requireAuth,
    clientController.getClientByCode
);

/*
   GET /api/clients/:id
*/

router.get(
    "/:id",
    requireAuth,
    clientController.getClientById
);

/* =========================================================
   CLIENT MANAGEMENT
   ADMIN ONLY
========================================================= */

/*
   GET /api/clients
*/

router.get(
    "/",
    requireAuth,
    requireAdmin,
    clientController.getAllClients
);

/*
   POST /api/clients
*/

router.post(
    "/",
    requireAuth,
    requireAdmin,
    clientController.createClient
);

/*
   PATCH /api/clients/:id
*/

router.patch(
    "/:id",
    requireAuth,
    requireAdmin,
    clientController.updateClient
);

/*
   DELETE /api/clients/:id
*/

router.delete(
    "/:id",
    requireAuth,
    requireAdmin,
    clientController.deleteClient
);

/* =========================================================
   EXPORT
========================================================= */


/* =========================================================
   WEEKLY MAINTENANCE CHECK-UP
========================================================= */

router.get(
    "/weekly-maintenance/active",
    requireAuth,
    clientController.getActiveWeeklyMaintenance
);

router.post(
    "/weekly-maintenance/reply",
    requireAuth,
    clientController.submitWeeklyMaintenanceReply
);

module.exports = router;
