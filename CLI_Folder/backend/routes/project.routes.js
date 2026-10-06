"use strict";

const express = require("express");
const projectController = require("../controllers/project.controller");
const { uploadSingle } = require("../middleware/upload.middleware");
const {
    requireAuth,
    requireStaff,
    requireAdmin,
    requireInstaller
} = require("../middleware/auth.middleware");

const router = express.Router();

/* =========================================================
   AE RENEWABLE NETWORK — PROJECT ROUTES
   The authoritative ONE PROJECT RECORD endpoints
========================================================= */

// Query projects (with filters: clientId, installerId, status, projectType)
router.get("/", requireAuth, projectController.getProjects);

// Create project
router.post("/", requireAuth, requireStaff, projectController.createProject);

// Get single project
router.get("/:id", requireAuth, projectController.getProjectById);

// Get full project details (includes evidence, payments, quotation items, activities)
router.get("/:id/full", requireAuth, projectController.getProjectFullDetails);

// Update project
router.patch("/:id", requireAuth, requireStaff, projectController.updateProject);

// Update project status
router.patch("/:id/status", requireAuth, requireStaff, projectController.updateProjectStatus);

// Assign installer to project
router.post("/:id/assign-installer", requireAuth, requireStaff, projectController.assignInstaller);

// Installer accepts assigned project
router.post("/:id/accept", requireAuth, requireInstaller, projectController.acceptProject);

// Submit site execution evidence (by installer)
router.post("/:id/evidence", requireAuth, requireInstaller, (req, res, next) => {
    uploadSingle("image")(req, res, (err) => {
        if (err) return next(err);
        next();
    });
}, projectController.submitEvidence);

// Review evidence (by staff/admin)
router.patch("/:id/evidence/:evidenceId/review", requireAuth, requireStaff, projectController.reviewEvidence);

// Request payment (by installer upon completing required evidence)
router.post("/:id/request-payment", requireAuth, requireInstaller, projectController.requestPayment);

// Approve payment (by admin)
router.post("/:id/approve-payment/:paymentId", requireAuth, requireAdmin, projectController.approvePayment);

// Create client account from project/quotation (Admin onboarding rule: username=quotation_code, password=middle_name)
router.post("/:id/create-client-account", requireAuth, requireStaff, projectController.createClientAccount);

// Propose bargain (Max 5% discount, client or admin)
router.post("/:id/bargain", requireAuth, projectController.submitBargain);

// Accept proposed bargain (Admin review)
router.post("/:id/bargain/accept", requireAuth, requireStaff, projectController.acceptBargain);

// Reject proposed bargain (Admin review)
router.post("/:id/bargain/reject", requireAuth, requireStaff, projectController.rejectBargain);

// Client accepts original quotation after negotiation
router.post("/:id/bargain/client-accept-original", requireAuth, projectController.clientAcceptOriginalQuotation);

// Delete project
router.delete("/:id", requireAuth, requireStaff, projectController.deleteProject);

module.exports = router;
