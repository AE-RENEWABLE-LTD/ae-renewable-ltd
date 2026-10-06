"use strict";

const express = require("express");
const activityService = require("../services/activity.service");
const { requireAuth, requireStaff } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", requireAuth, requireStaff, async (req, res, next) => {
    try {
        const limit = Number(req.query.limit || 50);
        const activities = await activityService.getRecentActivities(limit);
        return res.status(200).json({ success: true, data: activities });
    } catch (error) {
        next(error);
    }
});

router.get("/my", requireAuth, async (req, res, next) => {
    try {
        const limit = Number(req.query.limit || 50);
        const activities = await activityService.getClientActivities(req.user.id, limit);
        return res.status(200).json({ success: true, data: activities });
    } catch (error) {
        next(error);
    }
});

router.get("/project/:projectId", requireAuth, async (req, res, next) => {
    try {
        const limit = Number(req.query.limit || 50);
        const activities = await activityService.getProjectActivities(req.params.projectId, limit);
        return res.status(200).json({ success: true, data: activities });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
