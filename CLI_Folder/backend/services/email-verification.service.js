"use strict";

const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const {
    query,
    transaction
} = require("../config/database");

const {
    sendInstallerVerificationCode
} = require("./email.service");


/* =========================================================
   AE RENEWABLE NETWORK
   EMAIL VERIFICATION SERVICE
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const VERIFICATION_CODE_LENGTH = 6;

const VERIFICATION_CODE_EXPIRY_MINUTES = 10;

const MAX_VERIFICATION_ATTEMPTS = 5;

const RESEND_COOLDOWN_SECONDS = 60;


/* =========================================================
   GENERATE SECURE NUMERIC CODE
========================================================= */

function generateVerificationCode() {

    const minimum =
        10 ** (
            VERIFICATION_CODE_LENGTH - 1
        );

    const maximum =
        10 ** VERIFICATION_CODE_LENGTH;

    const code =
        crypto.randomInt(
            minimum,
            maximum
        );

    return String(code);
}


/* =========================================================
   NORMALIZE EMAIL
========================================================= */

function normalizeEmail(email) {

    if (
        email === undefined ||
        email === null
    ) {
        return "";
    }

    return String(email)
        .trim()
        .toLowerCase();
}


/* =========================================================
   CREATE VERIFICATION CODE
========================================================= */

async function createVerificationCode(
    userId,
    email,
    firstName
) {

    if (!userId) {

        throw new Error(
            "User ID is required to create a verification code."
        );
    }

    const normalizedEmail =
        normalizeEmail(email);

    if (!normalizedEmail) {

        throw new Error(
            "Email address is required."
        );
    }


    /* =====================================================
       GENERATE CODE
    ===================================================== */

    const code =
        generateVerificationCode();


    /* =====================================================
       HASH CODE
    ===================================================== */

    const codeHash =
        await bcrypt.hash(
            code,
            10
        );


    /* =====================================================
       INVALIDATE PREVIOUS CODES
    ===================================================== */

    await query(
        `
        UPDATE email_verification_codes
        SET used_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
          AND used_at IS NULL
        `,
        [userId]
    );


    /* =====================================================
       STORE NEW CODE
    ===================================================== */

    await query(
        `
        INSERT INTO email_verification_codes (
            user_id,
            code_hash,
            expires_at
        )
        VALUES (
            $1,
            $2,
            CURRENT_TIMESTAMP
                + ($3 * INTERVAL '1 minute')
        )
        `,
        [
            userId,
            codeHash,
            VERIFICATION_CODE_EXPIRY_MINUTES
        ]
    );


    /* =====================================================
       SEND EMAIL
    ===================================================== */

    try {

        const mailResult =
            await sendInstallerVerificationCode({
                email: normalizedEmail,
                firstName,
                code
            });


        /* =================================================
           SMTP SUCCESS DIAGNOSTICS
        ================================================= */

        console.log(
            "========================================"
        );

        console.log(
            "EMAIL VERIFICATION SENT"
        );

        console.log(
            "Recipient:",
            normalizedEmail
        );

        console.log(
            "Message ID:",
            mailResult?.messageId || "N/A"
        );

        console.log(
            "Accepted:",
            mailResult?.accepted || []
        );

        console.log(
            "Rejected:",
            mailResult?.rejected || []
        );

        console.log(
            "Response:",
            mailResult?.response || "N/A"
        );

        console.log(
            "========================================"
        );


        return {
            sent: true,
            messageId:
                mailResult?.messageId || null
        };

    } catch (error) {


        /* =================================================
           SMTP FAILURE DIAGNOSTICS
        ================================================= */

        console.error(
            "========================================"
        );

        console.error(
            "EMAIL VERIFICATION DELIVERY ERROR"
        );

        console.error(
            "Recipient:",
            normalizedEmail
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "Code:",
            error.code
        );

        console.error(
            "Response:",
            error.response
        );

        console.error(
            "Response Code:",
            error.responseCode
        );

        console.error(
            "Command:",
            error.command
        );

        console.error(
            "========================================"
        );


        /* =================================================
           INVALIDATE FAILED OTP
        ================================================= */

        try {

            await query(
                `
                UPDATE email_verification_codes
                SET used_at = CURRENT_TIMESTAMP
                WHERE user_id = $1
                  AND used_at IS NULL
                `,
                [userId]
            );

        } catch (cleanupError) {

            console.error(
                "OTP CLEANUP ERROR:",
                cleanupError.message
            );
        }


        return {
            sent: false
        };
    }
}


/* =========================================================
   VERIFY EMAIL
========================================================= */

async function verifyEmail(
    email,
    code
) {

    const normalizedEmail =
        normalizeEmail(email);

    const normalizedCode =
        String(code || "").trim();


    /* =====================================================
       BASIC VALIDATION
    ===================================================== */

    if (
        !normalizedEmail ||
        !normalizedCode
    ) {

        const error =
            new Error(
                "Email and verification code are required."
            );

        error.status = 400;

        throw error;
    }


    if (
        !/^\d{6}$/.test(
            normalizedCode
        )
    ) {

        const error =
            new Error(
                "Verification code must be 6 digits."
            );

        error.status = 400;

        throw error;
    }


    /* =====================================================
       FIND USER
    ===================================================== */

    const userResult =
        await query(
            `
            SELECT
                id,
                email,
                first_name,
                last_name,
                email_verified,
                status
            FROM users
            WHERE LOWER(email) = LOWER($1)
            LIMIT 1
            `,
            [normalizedEmail]
        );


    if (
        userResult.rows.length === 0
    ) {

        const error =
            new Error(
                "Invalid or expired verification code."
            );

        error.status = 400;

        throw error;
    }


    const user =
        userResult.rows[0];


    /* =====================================================
       ALREADY VERIFIED
    ===================================================== */

    if (
        user.email_verified
    ) {

        return {
            verified: true,
            alreadyVerified: true,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                emailVerified: true
            }
        };
    }


    /* =====================================================
       FIND ACTIVE CODE
    ===================================================== */

    const codeResult =
        await query(
            `
            SELECT
                id,
                code_hash,
                expires_at,
                attempts
            FROM email_verification_codes
            WHERE user_id = $1
              AND used_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [user.id]
        );


    if (
        codeResult.rows.length === 0
    ) {

        const error =
            new Error(
                "Invalid or expired verification code."
            );

        error.status = 400;

        throw error;
    }


    const verification =
        codeResult.rows[0];


    /* =====================================================
       CHECK EXPIRY
    ===================================================== */

    if (
        new Date(
            verification.expires_at
        ) <= new Date()
    ) {

        await query(
            `
            UPDATE email_verification_codes
            SET used_at = CURRENT_TIMESTAMP
            WHERE id = $1
            `,
            [verification.id]
        );


        const error =
            new Error(
                "This verification code has expired. Please request a new code."
            );

        error.status = 400;

        throw error;
    }


    /* =====================================================
       CHECK ATTEMPTS
    ===================================================== */

    if (
        Number(
            verification.attempts
        ) >= MAX_VERIFICATION_ATTEMPTS
    ) {

        const error =
            new Error(
                "Too many verification attempts. Please request a new code."
            );

        error.status = 429;

        throw error;
    }


    /* =====================================================
       COMPARE CODE
    ===================================================== */

    const codeMatches =
        await bcrypt.compare(
            normalizedCode,
            verification.code_hash
        );


    /* =====================================================
       INVALID CODE
    ===================================================== */

    if (!codeMatches) {

        const attemptResult =
            await query(
                `
                UPDATE email_verification_codes
                SET attempts = attempts + 1
                WHERE id = $1
                RETURNING attempts
                `,
                [verification.id]
            );


        const newAttempts =
            Number(
                attemptResult.rows[0]?.attempts || 0
            );


        if (
            newAttempts >=
            MAX_VERIFICATION_ATTEMPTS
        ) {

            const error =
                new Error(
                    "Too many verification attempts. Please request a new code."
                );

            error.status = 429;

            throw error;
        }


        const remaining =
            MAX_VERIFICATION_ATTEMPTS -
            newAttempts;


        const error =
            new Error(
                `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
            );

        error.status = 400;

        throw error;
    }


    /* =====================================================
       SUCCESSFUL VERIFICATION
    ===================================================== */

    await transaction(
        async client => {

            const usedResult =
                await client.query(
                    `
                    UPDATE email_verification_codes
                    SET used_at = CURRENT_TIMESTAMP
                    WHERE id = $1
                      AND used_at IS NULL
                    RETURNING id
                    `,
                    [verification.id]
                );


            if (
                usedResult.rows.length === 0
            ) {

                const error =
                    new Error(
                        "This verification code has already been used."
                    );

                error.status = 400;

                throw error;
            }


            await client.query(
                `
                UPDATE users
                SET
                    email_verified = TRUE,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                `,
                [user.id]
            );
        }
    );


    /* =====================================================
       RETURN SUCCESS
    ===================================================== */

    return {
        verified: true,
        alreadyVerified: false,
        user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            emailVerified: true
        }
    };
}


/* =========================================================
   RESEND VERIFICATION CODE
========================================================= */

async function resendVerificationCode(
    email
) {

    const normalizedEmail =
        normalizeEmail(email);


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!normalizedEmail) {

        const error =
            new Error(
                "Email address is required."
            );

        error.status = 400;

        throw error;
    }


    /* =====================================================
       FIND USER
    ===================================================== */

    const userResult =
        await query(
            `
            SELECT
                id,
                email,
                first_name,
                last_name,
                email_verified,
                status
            FROM users
            WHERE LOWER(email) = LOWER($1)
            LIMIT 1
            `,
            [normalizedEmail]
        );


    /*
     * Generic response prevents email enumeration.
     */

    if (
        userResult.rows.length === 0
    ) {

        return {
            sent: true,
            alreadyVerified: false
        };
    }


    const user =
        userResult.rows[0];


    /* =====================================================
       ALREADY VERIFIED
    ===================================================== */

    if (
        user.email_verified
    ) {

        return {
            sent: true,
            alreadyVerified: true
        };
    }


    /* =====================================================
       ACCOUNT STATUS
    ===================================================== */

    if (
        user.status !== "active"
    ) {

        const error =
            new Error(
                "This account is not active."
            );

        error.status = 403;

        throw error;
    }


    /* =====================================================
       RESEND COOLDOWN
    ===================================================== */

    const recentCodeResult =
        await query(
            `
            SELECT
                created_at
            FROM email_verification_codes
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [user.id]
        );


    if (
        recentCodeResult.rows.length > 0
    ) {

        const createdAt =
            new Date(
                recentCodeResult.rows[0].created_at
            );

        const elapsedSeconds =
            Math.floor(
                (
                    Date.now() -
                    createdAt.getTime()
                ) / 1000
            );


        if (
            elapsedSeconds <
            RESEND_COOLDOWN_SECONDS
        ) {

            const remaining =
                RESEND_COOLDOWN_SECONDS -
                elapsedSeconds;


            const error =
                new Error(
                    `Please wait ${remaining} seconds before requesting another code.`
                );

            error.status = 429;

            throw error;
        }
    }


    /* =====================================================
       CREATE + SEND
    ===================================================== */

    const result =
        await createVerificationCode(
            user.id,
            user.email,
            user.first_name
        );


    /* =====================================================
       DELIVERY FAILURE
    ===================================================== */

    if (!result.sent) {

        const error =
            new Error(
                "Unable to send verification email. Please try again later."
            );

        error.status = 503;

        throw error;
    }


    /* =====================================================
       SUCCESS
    ===================================================== */

    return {
        sent: true,
        alreadyVerified: false,
        messageId:
            result.messageId || null
    };
}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {

    createVerificationCode,

    verifyEmail,

    resendVerificationCode

};