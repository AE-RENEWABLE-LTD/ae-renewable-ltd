"use strict";

const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* =========================================================
   AE RENEWABLE NETWORK
   UPLOAD MIDDLEWARE
========================================================= */

/* =========================================================
   UPLOAD DIRECTORY
========================================================= */

const uploadDirectory = path.join(
    process.cwd(),
    "uploads"
);

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
        recursive: true
    });
}

/* =========================================================
   STORAGE
========================================================= */

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {

        const extension =
            path.extname(file.originalname)
                .toLowerCase();

        const baseName =
            path.basename(
                file.originalname,
                extension
            )
                .replace(/[^a-zA-Z0-9-_]/g, "-")
                .replace(/-+/g, "-")
                .toLowerCase();

        const uniqueSuffix =
            `${Date.now()}-${Math.round(
                Math.random() * 1e9
            )}`;

        cb(
            null,
            `${baseName}-${uniqueSuffix}${extension}`
        );
    }

});

/* =========================================================
   ALLOWED MIME TYPES
========================================================= */

const allowedMimeTypes = new Set([
    "application/pdf",

    "image/jpeg",
    "image/png",
    "image/webp",

    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    "text/plain"
]);

/* =========================================================
   FILE FILTER
========================================================= */

function fileFilter(req, file, cb) {

    if (!allowedMimeTypes.has(file.mimetype)) {

        const error = new Error(
            "Unsupported file type."
        );

        error.status = 400;
        error.code = "UNSUPPORTED_FILE_TYPE";

        return cb(error, false);
    }

    cb(null, true);
}

/* =========================================================
   MULTER CONFIGURATION
========================================================= */

const upload = multer({

    storage,

    fileFilter,

    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 10
    }

});

/* =========================================================
   SINGLE FILE
========================================================= */

const uploadSingle = (fieldName = "file") => {
    return upload.single(fieldName);
};

/* =========================================================
   MULTIPLE FILES
========================================================= */

const uploadMultiple = (
    fieldName = "files",
    maxCount = 10
) => {
    return upload.array(fieldName, maxCount);
};

/* =========================================================
   NAMED FILE FIELDS
========================================================= */

const uploadFields = (fields) => {
    return upload.fields(fields);
};

/* =========================================================
   UPLOAD ERROR HANDLER
========================================================= */

function uploadErrorHandler(err, req, res, next) {

    if (!err) {
        return next();
    }

    if (err instanceof multer.MulterError) {

        let message =
            "File upload failed.";

        if (err.code === "LIMIT_FILE_SIZE") {
            message =
                "File is too large. Maximum size is 10MB.";
        }

        if (err.code === "LIMIT_FILE_COUNT") {
            message =
                "Too many files were uploaded.";
        }

        if (err.code === "LIMIT_UNEXPECTED_FILE") {
            message =
                "Unexpected file field.";
        }

        return res.status(400).json({
            success: false,
            message,
            code: err.code
        });
    }

    if (err.code === "UNSUPPORTED_FILE_TYPE") {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    next(err);
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    upload,
    uploadSingle,
    uploadMultiple,
    uploadFields,
    uploadErrorHandler,
    allowedMimeTypes,
    uploadDirectory
};