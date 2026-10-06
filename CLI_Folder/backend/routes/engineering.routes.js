"use strict";

const express = require("express");
const engineeringController = require("../controllers/engineering.controller");
const { optionalAuth } = require("../middleware/auth.middleware");

const router = express.Router();

// Deterministic solar engineering calculation (open for ARDE calculator)
router.post("/calculate", engineeringController.calculateSystem);

// Submit calculated project & generate quotation in database (with optional user context)
router.post("/submit-project", optionalAuth, engineeringController.submitEngineeringProject);

// Pre-Studio Client Intake & Site Assessment (Joint Admin/ARDE flow)
router.post("/client-intake", optionalAuth, engineeringController.createClientIntake);

// Pre-Studio Client Lookup / Autocomplete
router.get("/clients-lookup", optionalAuth, engineeringController.getClientsLookup);

module.exports = router;
