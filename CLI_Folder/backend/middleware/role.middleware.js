"use strict";

/* =========================================================
   AE RENEWABLE NETWORK
   ROLE MIDDLEWARE
========================================================= */

/* =========================================================
   REQUIRE SPECIFIC ROLE
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
   STAFF ONLY
========================================================= */

function requireStaff(req, res, next) {
    return requireRole("staff", "admin")(req, res, next);
}

/* =========================================================
   INSTALLER ONLY
========================================================= */

function requireInstaller(req, res, next) {
    return requireRole("installer")(req, res, next);
}

/* =========================================================
   CLIENT ONLY
========================================================= */

function requireClient(req, res, next) {
    return requireRole("client")(req, res, next);
}

/* =========================================================
   ADMIN OR STAFF
========================================================= */

function requireAdminOrStaff(req, res, next) {
    return requireRole("admin", "staff")(req, res, next);
}

/* =========================================================
   ADMIN / STAFF / INSTALLER
========================================================= */

function requireInternalUser(req, res, next) {
    return requireRole(
        "admin",
        "staff",
        "installer"
    )(req, res, next);
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    requireRole,
    requireAdmin,
    requireStaff,
    requireInstaller,
    requireClient,
    requireAdminOrStaff,
    requireInternalUser
};