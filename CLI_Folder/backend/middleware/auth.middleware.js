"use strict";

const jwt = require("jsonwebtoken");

const config = require("../config/environment");
const { findUserById } = require("../services/auth.service");

/* =========================================================
   AE RENEWABLE NETWORK
   AUTHENTICATION MIDDLEWARE
========================================================= */

/* =========================================================
   REQUIRE AUTHENTICATION
========================================================= */

async function requireAuth(req, res, next) {
    try {
        const authorization =
            req.headers.authorization;

        if (!authorization) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        const parts = authorization.split(" ");

        if (
            parts.length !== 2 ||
            parts[0].toLowerCase() !== "bearer"
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format."
            });
        }

        const token = parts[1];

        let payload;

        try {
            payload = jwt.verify(
                token,
                config.jwtSecret
            );
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired authentication token."
            });
        }

        if (!payload.sub) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token."
            });
        }

        const user = await findUserById(
            payload.sub
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account not found."
            });
        }

        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "User account is not active."
            });
        }

        /*
         * Attach authenticated user to request.
         */

        req.user = user;

        next();

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   ROLE AUTHORIZATION
========================================================= */

function requireRole(...allowedRoles) {
    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to access this resource."
            });
        }

        next();
    };
}

/* =========================================================
   ADMIN ONLY
========================================================= */

function requireAdmin(req, res, next) {
    return requireRole("admin")(req, res, next);
}

/* =========================================================
   STAFF OR ADMIN
========================================================= */

function requireStaff(req, res, next) {
    return requireRole(
        "admin",
        "staff"
    )(req, res, next);
}

/* =========================================================
   INSTALLER ACCESS
========================================================= */

function requireInstaller(req, res, next) {
    return requireRole(
        "admin",
        "staff",
        "installer"
    )(req, res, next);
}

/* =========================================================
   CLIENT ACCESS
========================================================= */

function requireClient(req, res, next) {
    return requireRole(
        "admin",
        "staff",
        "client"
    )(req, res, next);
}

/* =========================================================
   OPTIONAL AUTHENTICATION
========================================================= */

async function optionalAuth(req, res, next) {
    try {
        const authorization = req.headers.authorization;
        if (!authorization) {
            req.user = null;
            return next();
        }

        const parts = authorization.split(" ");
        if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
            const token = parts[1];
            try {
                const payload = jwt.verify(token, config.jwtSecret);
                if (payload && payload.sub) {
                    const user = await findUserById(payload.sub);
                    if (user && user.is_active) {
                        req.user = user;
                    }
                }
            } catch (err) {
                // Token invalid or expired, proceed unauthenticated
            }
        }
        return next();
    } catch (error) {
        return next();
    }
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    requireAuth,
    optionalAuth,
    requireRole,
    requireAdmin,
    requireStaff,
    requireInstaller,
    requireClient
};