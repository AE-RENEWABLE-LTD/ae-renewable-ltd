"use strict";

const express = require("express");
const equipmentController = require("../controllers/equipment.controller");
const { requireAuth, requireStaff } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", equipmentController.getAllEquipment);
router.get("/:id", equipmentController.getEquipmentById);
router.patch("/:id", requireAuth, requireStaff, equipmentController.updateEquipment);

module.exports = router;
