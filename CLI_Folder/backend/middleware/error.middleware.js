"use strict";

/* =========================================================
   AE RENEWABLE NETWORK
   GLOBAL ERROR MIDDLEWARE
========================================================= */

/* =========================================================
   404 NOT FOUND HANDLER
========================================================= */

function notFoundHandler(req, res, next) {
    const error = new Error(
        `Route not found: ${req.method} ${req.originalUrl}`
    );

    error.status = 404;

    next(error);
}

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

function errorHandler(err, req, res, next) {
    const statusCode =
        Number.isInteger(err.status)
            ? err.status
            : Number.isInteger(err.statusCode)
                ? err.statusCode
                : 500;

    const isProduction =
        process.env.NODE_ENV === "production";

    console.error("");
    console.error("==============================================");
    console.error("             AE RENEWABLE ERROR");
    console.error("==============================================");
    console.error("Method:", req.method);
    console.error("Path:", req.originalUrl);
    console.error("Status:", statusCode);
    console.error("Message:", err.message);

    if (err.code) {
        console.error("Code:", err.code);
    }

    if (!isProduction && err.stack) {
        console.error("Stack:", err.stack);
    }

    console.error("==============================================");
    console.error("");

    const response = {
        success: false,
        message:
            isProduction && statusCode >= 500
                ? "Internal server error."
                : err.message || "An unexpected error occurred."
    };

    if (err.remainingMinutes) {
        response.remainingMinutes = err.remainingMinutes;
    }

    if (!isProduction && err.code) {
        response.code = err.code;
    }

    res.status(statusCode).json(response);
}

/* =========================================================
   ASYNC ERROR WRAPPER
========================================================= */

function asyncHandler(fn) {
    return function asyncRouteHandler(req, res, next) {
        Promise
            .resolve(fn(req, res, next))
            .catch(next);
    };
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    notFoundHandler,
    errorHandler,
    asyncHandler
};