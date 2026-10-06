"use strict";

const express = require("express");

const authController =
    require("../controllers/auth.controller");

const {
    requireAuth
} = require("../middleware/auth.middleware");


/* =========================================================
   AE RENEWABLE NETWORK
   AUTHENTICATION ROUTES
========================================================= */

const router = express.Router();


/* =========================================================
   INSTALLER REGISTRATION

   POST /api/auth/register-installer
========================================================= */

router.post(
    "/register-installer",
    authController.registerInstaller
);


/* =========================================================
   CLIENT REGISTRATION

   POST /api/auth/register-client
========================================================= */

router.post(
    "/register-client",
    authController.registerClient
);


/* =========================================================
   LOGIN

   POST /api/auth/login
========================================================= */

router.post(
    "/login",
    authController.login
);


/* =========================================================
   EMAIL VERIFICATION

   POST /api/auth/verify-email
========================================================= */

router.post(
    "/verify-email",
    authController.verifyEmail
);


/* =========================================================
   RESEND EMAIL VERIFICATION

   POST /api/auth/resend-verification
========================================================= */

router.post(
    "/resend-verification",
    authController.resendVerification
);


/* =========================================================
   CURRENT AUTHENTICATED USER

   GET /api/auth/me
========================================================= */



/* =========================================================
   PASSWORD RESET REQUEST

   POST /api/auth/request-password-reset
========================================================= */

router.post(
    "/request-password-reset",
    authController.requestPasswordReset
);

router.post(
    "/forgot-password",
    authController.requestPasswordReset
);


/* =========================================================
   PASSWORD RESET CODE VERIFICATION

   POST /api/auth/verify-password-reset
========================================================= */

router.post(
    "/verify-password-reset",
    authController.verifyPasswordResetCode
);


/* =========================================================
   PASSWORD RESET

   POST /api/auth/reset-password
========================================================= */

router.post(
    "/reset-password",
    authController.resetPassword
);

router.get(
    "/me",
    requireAuth,
    authController.me
);


/* =========================================================
   LOGOUT

   POST /api/auth/logout
========================================================= */

router.post(
    "/logout",
    requireAuth,
    authController.logout
);


/* =========================================================
   EXPORT ROUTER
========================================================= */

module.exports = router;
