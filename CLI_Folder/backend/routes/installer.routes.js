"use strict";

const express = require("express");

const installerController =
    require("../controllers/installer.controller");

const notificationController =
    require("../controllers/notification.controller");

const {
    requireAuth,
    requireAdmin,
    requireStaff,
    requireInstaller
} = require("../middleware/auth.middleware");

const router = express.Router();

/* =========================================================
   AE RENEWABLE NETWORK
   INSTALLER ROUTES
========================================================= */


/* =========================================================
   CURRENT AUTHENTICATED INSTALLER
========================================================= */

// GET /api/installers/me
router.get(
    "/me",
    requireAuth,
    requireInstaller,
    installerController.getMyInstaller
);

// PATCH /api/installers/me
router.patch(
    "/me",
    requireAuth,
    requireInstaller,
    installerController.updateMyInstaller
);

// PUT /api/installers/me
router.put(
    "/me",
    requireAuth,
    requireInstaller,
    installerController.updateMyInstaller
);

// POST /api/installers/me/photo
router.post(
    "/me/photo",
    requireAuth,
    requireInstaller,
    installerController.uploadProfilePhoto
);

// POST /api/installers/photo
router.post(
    "/photo",
    requireAuth,
    requireInstaller,
    installerController.uploadProfilePhoto
);

// POST /api/installers/profile/photo
router.post(
    "/profile/photo",
    requireAuth,
    requireInstaller,
    installerController.uploadProfilePhoto
);

// POST /api/installers/:id/photo
router.post(
    "/:id/photo",
    requireAuth,
    requireStaff,
    installerController.uploadProfilePhoto
);

// POST /api/installers/request-change
router.post(
    "/request-change",
    requireAuth,
    requireInstaller,
    installerController.requestProfileChange
);


/* =========================================================
   INSTALLER PORTAL
   AUTHENTICATED INSTALLER
========================================================= */

// GET /api/installers/jobs
router.get(
    "/jobs",
    requireAuth,
    requireInstaller,
    installerController.getInstallerJobs
);

// GET /api/installers/jobs/:id
router.get(
    "/jobs/:id",
    requireAuth,
    requireInstaller,
    installerController.getInstallerJobDetail
);

// POST /api/installers/jobs/:id/accept
router.post(
    "/jobs/:id/accept",
    requireAuth,
    requireInstaller,
    installerController.acceptInstallerJob
);

// GET /api/installers/documents
router.get(
    "/documents",
    requireAuth,
    requireInstaller,
    installerController.getInstallerDocuments
);

// GET /api/installers/commissioning
router.get(
    "/commissioning",
    requireAuth,
    requireInstaller,
    installerController.getInstallerCommissioning
);

// POST /api/installers/commissioning
router.post(
    "/commissioning",
    requireAuth,
    requireInstaller,
    installerController.saveCommissioning
);

// GET /api/installers/payments
router.get(
    "/payments",
    requireAuth,
    requireInstaller,
    installerController.getInstallerPayments
);

// GET /api/installers/notifications
router.get(
    "/notifications",
    requireAuth,
    requireInstaller,
    installerController.getInstallerNotifications
);

// PATCH /api/installers/notifications/:id/read
router.patch(
    "/notifications/:id/read",
    requireAuth,
    requireInstaller,
    notificationController.markAsRead
);

// PATCH /api/installers/notifications/read-all
router.patch(
    "/notifications/read-all",
    requireAuth,
    requireInstaller,
    notificationController.markAllAsRead
);

// GET /api/installers/activity
router.get(
    "/activity",
    requireAuth,
    requireInstaller,
    installerController.getInstallerActivity
);


/* =========================================================
   INSTALLER DIRECTORY
   STAFF / ADMIN
========================================================= */

// GET /api/installers/befitted
router.get(
    "/befitted",
    requireAuth,
    requireStaff,
    installerController.getBefittedInstaller
);

// GET /api/installers
router.get(
    "/",
    requireAuth,
    requireStaff,
    installerController.getAllInstallers
);


/* =========================================================
   INSTALLER SEARCH
   STAFF / ADMIN
========================================================= */

// GET /api/installers/search?q=keyword
router.get(
    "/search",
    requireAuth,
    requireStaff,
    installerController.searchInstallers
);


/* =========================================================
   INSTALLER LOOKUP BY CODE
   STAFF / ADMIN
========================================================= */

// GET /api/installers/code/:installerCode
router.get(
    "/code/:installerCode",
    requireAuth,
    requireStaff,
    installerController.getInstallerByCode
);


/* =========================================================
   INSTALLER LOOKUP BY ID
   STAFF / ADMIN
========================================================= */

// GET /api/installers/:id
router.get(
    "/:id",
    requireAuth,
    requireStaff,
    installerController.getInstallerById
);


/* =========================================================
   CREATE INSTALLER
   ADMIN ONLY
========================================================= */

// POST /api/installers
router.post(
    "/",
    requireAuth,
    requireAdmin,
    installerController.createInstaller
);


/* =========================================================
   UPDATE INSTALLER
   ADMIN ONLY
========================================================= */

// PATCH /api/installers/:id
router.patch(
    "/:id",
    requireAuth,
    requireAdmin,
    installerController.updateInstaller
);


/* =========================================================
   DELETE INSTALLER
   ADMIN ONLY
========================================================= */

// DELETE /api/installers/:id
router.delete(
    "/:id",
    requireAuth,
    requireAdmin,
    installerController.deleteInstaller
);


/* =========================================================
   SEND NOTIFICATION TO INSTALLER
   ADMIN ONLY
========================================================= */

// POST /api/installers/:id/notify
router.post(
    "/:id/notify",
    requireAuth,
    requireAdmin,
    installerController.sendNotificationToInstaller
);


/* =========================================================
   INSTALLER CHANGE REQUESTS & AUDIT
   STAFF / ADMIN
========================================================= */

// GET /api/installers/:id/change-requests
router.get(
    "/:id/change-requests",
    requireAuth,
    requireStaff,
    installerController.getInstallerChangeRequests
);

// POST /api/installers/change-requests/:requestId/decision
router.post(
    "/change-requests/:requestId/decision",
    requireAuth,
    requireAdmin,
    installerController.decideInstallerChangeRequest
);


/* =========================================================
   EXPORT
========================================================= */

module.exports = router;