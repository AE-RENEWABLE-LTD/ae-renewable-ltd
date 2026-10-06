"use strict";

const authService =
    require("../services/auth.service");

const installerRegistrationService =
    require("../services/installer-registration.service");

const clientRegistrationService =
    require("../services/client-registration.service");

const emailVerificationService =
    require("../services/email-verification.service");
const passwordResetService =
    require("../services/password-reset.service");


/* =========================================================
   AE RENEWABLE NETWORK
   AUTHENTICATION CONTROLLER
========================================================= */


/* =========================================================
   INSTALLER REGISTRATION
   POST /api/auth/register-installer
========================================================= */

async function registerInstaller(req, res, next) {

    try {

        const result =
            await installerRegistrationService.registerInstaller(
                req.body
            );

        return res.status(201).json({

            success: true,

            message:
                "Installer registration submitted successfully.",

            data: result

        });

    } catch (error) {

        next(error);

    }
}


/* =========================================================
   CLIENT REGISTRATION
   POST /api/auth/register-client
========================================================= */

async function registerClient(req, res, next) {

    try {

        const result =
            await clientRegistrationService.registerClient(
                req.body
            );

        return res.status(201).json({

            success: true,

            message:
                "Client account created successfully.",

            data: result

        });

    } catch (error) {

        next(error);

    }
}


/* =========================================================
   LOGIN
   POST /api/auth/login
========================================================= */

async function login(req, res, next) {

    try {

        const {
            email,
            password
        } = req.body;


        const result =
            await authService.login(
                email,
                password
            );


        return res.status(200).json({

            success: true,

            message:
                "Login successful.",

            data: result

        });

    } catch (error) {

        next(error);

    }
}


/* =========================================================
   VERIFY EMAIL
   POST /api/auth/verify-email
========================================================= */

async function verifyEmail(req, res, next) {

    try {

        const {
            email,
            code
        } = req.body;


        const result =
            await emailVerificationService.verifyEmail(
                email,
                code
            );


        return res.status(200).json({

            success: true,

            message:
                result.alreadyVerified
                    ? "Email address is already verified."
                    : "Email address verified successfully.",

            data: result

        });

    } catch (error) {

        next(error);

    }
}


/* =========================================================
   RESEND VERIFICATION CODE
   POST /api/auth/resend-verification
========================================================= */

async function resendVerification(req, res, next) {

    try {

        const {
            email
        } = req.body;


        const result =
            await emailVerificationService
                .resendVerificationCode(
                    email
                );


        return res.status(200).json({

            success: true,

            message:
                result.alreadyVerified
                    ? "Email address is already verified."
                    : "If the account requires verification, a verification code has been sent.",

            data: result

        });

    } catch (error) {

        next(error);

    }
}


/* =========================================================
   CURRENT AUTHENTICATED USER
   GET /api/auth/me
========================================================= */


/* =========================================================
   PASSWORD RESET
   POST /api/auth/request-password-reset
========================================================= */

async function requestPasswordReset(req, res, next) {

    try {

        const result =
            await passwordResetService.requestPasswordReset(
                req.body.email,
                req.body.role || req.body.requiredRole || req.body.portal || ""
            );

        return res.status(200).json({

            success: true,

            message: result.message,

            data: result

        });

    } catch (error) {

        next(error);

    }
}


/* =========================================================
   PASSWORD RESET CODE VERIFICATION
   POST /api/auth/verify-password-reset
========================================================= */

async function verifyPasswordResetCode(req, res, next) {

    try {

        const result =
            await passwordResetService.verifyPasswordResetCode(
                req.body.email,
                req.body.code,
                req.body.role || req.body.requiredRole || req.body.portal || ""
            );

        return res.status(200).json({

            success: true,

            message: result.message,

            data: result

        });

    } catch (error) {

        next(error);

    }
}


/* =========================================================
   PASSWORD RESET
   POST /api/auth/reset-password
========================================================= */

async function resetPassword(req, res, next) {

    try {

        const result =
            await passwordResetService.resetPassword(
                req.body.email,
                req.body.resetToken,
                req.body.newPassword,
                req.body.role || req.body.requiredRole || req.body.portal || ""
            );

        return res.status(200).json({

            success: true,

            message: result.message,

            data: result

        });

    } catch (error) {

        next(error);

    }
}


async function me(req, res, next) {

    try {

        const user =
            await authService.getAuthenticatedUser(
                req.user.id
            );


        return res.status(200).json({

            success: true,

            message:
                "Authenticated user retrieved successfully.",

            data: {
                user
            }

        });

    } catch (error) {

        next(error);

    }
}


/* =========================================================
   LOGOUT
   POST /api/auth/logout
========================================================= */

async function logout(req, res) {

    return res.status(200).json({

        success: true,

        message:
            "Logout successful."

    });

}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {

    registerInstaller,

    registerClient,

    login,

    verifyEmail,

    resendVerification,

    requestPasswordReset,

    verifyPasswordResetCode,

    resetPassword,

    me,

    logout

};





