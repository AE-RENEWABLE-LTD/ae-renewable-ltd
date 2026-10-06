"use strict";

const express = require("express");
const router = express.Router();

const {
    getFieldPosts,
    createFieldPost,
    deleteFieldPost,
    reactToPost,
    addComment
} = require("../controllers/field-post.controller");

const {
    requireAuth,
    optionalAuth
} = require("../middleware/auth.middleware");

const {
    upload,
    uploadErrorHandler
} = require("../middleware/upload.middleware");

// Public endpoints
router.get("/", getFieldPosts);
router.post("/:id/react", reactToPost);
router.post("/:id/comment", addComment);

// Admin & Staff & Installer upload endpoints (supports multipart form data with image and avatar)
router.post(
    "/",
    requireAuth,
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "avatar", maxCount: 1 }
    ]),
    uploadErrorHandler,
    createFieldPost
);
router.delete("/:id", requireAuth, deleteFieldPost);

module.exports = router;


