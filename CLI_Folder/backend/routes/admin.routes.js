"use strict";

const express = require("express");

const adminController =
    require("../controllers/admin.controller");

const {
    requireAuth,
    requireAdmin
} = require("../middleware/auth.middleware");


/* =========================================================
   AE RENEWABLE NETWORK
   ADMIN ROUTES
========================================================= */

const router =
    express.Router();


/* =========================================================
   ADMIN DASHBOARD
   GET /api/admin/dashboard
========================================================= */

router.get(
    "/dashboard",
    requireAuth,
    requireAdmin,
    adminController.getDashboard
);

router.get(
    "/pipeline",
    requireAuth,
    requireAdmin,
    adminController.getPipeline
);


/* =========================================================
   GET SYSTEM STATISTICS
   GET /api/admin/stats
========================================================= */

router.get(
    "/stats",
    requireAuth,
    requireAdmin,
    adminController.getStats
);


/* =========================================================
   GET ALL USERS
   GET /api/admin/users
========================================================= */

router.get(
    "/users",
    requireAuth,
    requireAdmin,
    adminController.getUsers
);


/* =========================================================
   GET USER BY ID
   GET /api/admin/users/:id
========================================================= */

router.get(
    "/users/:id",
    requireAuth,
    requireAdmin,
    adminController.getUserById
);


/* =========================================================
   UPDATE USER ROLE
   PATCH /api/admin/users/:id/role
========================================================= */

router.patch(
    "/users/:id/role",
    requireAuth,
    requireAdmin,
    adminController.updateUserRole
);


/* =========================================================
   UPDATE USER STATUS
   PATCH /api/admin/users/:id/status
========================================================= */

router.patch(
    "/users/:id/status",
    requireAuth,
    requireAdmin,
    adminController.updateUserStatus
);


/* =========================================================
   DELETE USER
   DELETE /api/admin/users/:id
========================================================= */

router.delete(
    "/users/:id",
    requireAuth,
    requireAdmin,
    adminController.deleteUser
);


/* =========================================================
   DISPATCHED INTAKE CONSULTATIONS ("✓ Admin Notification Dispatched")
========================================================= */

router.get(
    "/consultations/dispatched",
    requireAuth,
    requireAdmin,
    adminController.getDispatchedInquiries
);

router.post(
    "/consultations/:id/accept",
    requireAuth,
    requireAdmin,
    adminController.acceptDispatchedInquiry
);

/* =========================================================
   WEEKLY MAINTENANCE & SYSTEM CONSULTATION
========================================================= */

router.post(
    "/weekly-maintenance/broadcast",
    requireAuth,
    requireAdmin,
    adminController.broadcastWeeklyMaintenance
);

router.get(
    "/weekly-maintenance/records",
    requireAuth,
    requireAdmin,
    adminController.getWeeklyMaintenanceRecords
);

/* =========================================================
   WHILE YOU SLEEP OPERATIONAL SUMMARY
   GET /api/admin/while-you-sleep
========================================================= */

router.get(
    "/while-you-sleep",
    requireAuth,
    requireAdmin,
    adminController.getWhileYouSleep
);

/* =========================================================
   EXPORT ROUTER
========================================================= */

module.exports = router;