"use strict";

const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const {
    query,
    transaction
} = require("../config/database");

const {
    sendPasswordResetCode
} = require("./email.service");


/* =========================================================
   CONFIGURATION
========================================================= */

const RESET_CODE_LENGTH = 6;

const RESET_CODE_EXPIRY_MINUTES = 10;

const MAX_RESET_ATTEMPTS = 5;

const RESEND_COOLDOWN_SECONDS = 5;

const RESET_TOKEN_BYTES = 32;

const RESET_TOKEN_EXPIRY_MINUTES = 10;

const BCRYPT_ROUNDS = 10;


/* =========================================================
   NORMALIZATION & HELPERS
========================================================= */

function normalizeEmail(email) {
    return String(email || "")
        .trim()
        .toLowerCase();
}

function maskEmail(email) {
    if (!email || typeof email !== "string" || !email.includes("@")) {
        return "";
    }
    const [user, domain] = email.split("@");
    if (user.length <= 2) {
        return `${user[0] || ""}*@${domain}`;
    }
    const firstChar = user[0];
    const lastChar = user[user.length - 1];
    return `${firstChar}***${lastChar}@${domain}`;
}


/* =========================================================
   VALIDATION
========================================================= */

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateResetCode(code) {
    return /^\d{6}$/.test(
        String(code || "").trim()
    );
}

function validatePassword(password) {
    if (typeof password !== "string") {
        return false;
    }
    return (
        password.length >= 8 &&
        password.length <= 128
    );
}


/* =========================================================
   ERROR HELPER
========================================================= */

function createError(
    message,
    statusCode,
    code
) {
    const error = new Error(message);
    error.status = statusCode;
    error.statusCode = statusCode;
    if (code) {
        error.code = code;
    }
    return error;
}


/* =========================================================
   GENERATE RESET CODE
========================================================= */

function generateResetCode() {
    const minimum = 10 ** (RESET_CODE_LENGTH - 1);
    const maximum = (10 ** RESET_CODE_LENGTH) - 1;
    return String(
        crypto.randomInt(
            minimum,
            maximum + 1
        )
    );
}


/* =========================================================
   GENERATE RESET TOKEN
========================================================= */

function generateResetToken() {
    return crypto
        .randomBytes(RESET_TOKEN_BYTES)
        .toString("hex");
}


/* =========================================================
   HASH RESET TOKEN
========================================================= */

function hashResetToken(token) {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
}


async function findUserForPasswordReset(identifier, requiredRole) {
    const raw = String(identifier || "").trim();
    if (!raw) return null;

    const normalizedRole = requiredRole ? String(requiredRole).toLowerCase().trim() : "";

    // If an admin/staff role is required, ONLY match active admin or staff
    if (normalizedRole === "admin" || normalizedRole === "staff") {
        const isGmail = raw.toLowerCase().endsWith("@gmail.com");
        const cleanUser = isGmail ? raw.toLowerCase().replace("@gmail.com", "").replace(/\./g, "") : "";

        const adminResult = await query(
            `
            SELECT id, email, username, first_name, last_name, role, status
            FROM users
            WHERE (
                LOWER(TRIM(email)) = LOWER(TRIM($1))
                OR ($2 != '' AND LOWER(TRIM(email)) LIKE '%@gmail.com' AND REPLACE(REPLACE(LOWER(TRIM(email)), '@gmail.com', ''), '.', '') = $2)
            )
              AND role IN ('admin', 'staff')
            ORDER BY id DESC
            LIMIT 1
            `,
            [raw, cleanUser]
        );
        return adminResult.rows[0] || null;
    }

    // If installer role is required
    if (normalizedRole === "installer") {
        const installerResult = await query(
            `
            SELECT id, email, username, first_name, last_name, role, status
            FROM users
            WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
              AND role = 'installer'
            LIMIT 1
            `,
            [raw]
        );
        return installerResult.rows[0] || null;
    }

    const altCode = raw.startsWith("AE-")
        ? raw.replace("AE-", "PRJ-")
        : (raw.startsWith("PRJ-") ? raw.replace("PRJ-", "AE-") : raw);

    // 1. If identifier contains '@', match exact email
    if (raw.includes("@")) {
        const emailResult = await query(
            `
            SELECT id, email, username, first_name, last_name, role, status
            FROM users
            WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
            LIMIT 1
            `,
            [raw]
        );
        if (emailResult.rows[0]) return emailResult.rows[0];

        const clientEmailResult = await query(
            `
            SELECT u.id, u.email, u.username, u.first_name, u.last_name, u.role, u.status
            FROM clients c
            JOIN users u ON c.user_id = u.id
            WHERE LOWER(TRIM(c.email)) = LOWER(TRIM($1))
            LIMIT 1
            `,
            [raw]
        );
        if (clientEmailResult.rows[0]) return clientEmailResult.rows[0];
    }

    // 2. Query projects table by project_code (e.g. PRJ-202610-2011, PRJ-202610-3833)
    const projectResult = await query(
        `
        SELECT u.id, u.email, u.username, u.first_name, u.last_name, u.role, u.status
        FROM projects p
        JOIN clients c ON p.client_id = c.id
        JOIN users u ON c.user_id = u.id
        WHERE LOWER(TRIM(p.project_code)) = LOWER(TRIM($1))
           OR LOWER(TRIM(p.project_code)) = LOWER(TRIM($2))
        ORDER BY p.id DESC
        LIMIT 1
        `,
        [raw, altCode]
    );
    if (projectResult.rows[0]) return projectResult.rows[0];

    // 3. Query quotations table by quotation_code or quotation_number
    const quotationResult = await query(
        `
        SELECT u.id, u.email, u.username, u.first_name, u.last_name, u.role, u.status
        FROM quotations q
        JOIN clients c ON q.client_id = c.id
        JOIN users u ON c.user_id = u.id
        WHERE LOWER(TRIM(q.quotation_code)) = LOWER(TRIM($1))
           OR LOWER(TRIM(q.quotation_number)) = LOWER(TRIM($1))
        ORDER BY q.id DESC
        LIMIT 1
        `,
        [raw]
    );
    if (quotationResult.rows[0]) return quotationResult.rows[0];

    // 4. Query clients table by contact_name, client_code, or username (prioritizing client role)
    const clientResult = await query(
        `
        SELECT
            u.id,
            u.email,
            u.username,
            u.first_name,
            u.last_name,
            u.role,
            u.status
        FROM clients c
        JOIN users u ON c.user_id = u.id
        WHERE LOWER(TRIM(c.contact_name)) = LOWER(TRIM($1))
           OR (c.client_code IS NOT NULL AND LOWER(TRIM(c.client_code)) = LOWER(TRIM($1)))
           OR (u.username IS NOT NULL AND (LOWER(TRIM(u.username)) = LOWER(TRIM($1)) OR LOWER(TRIM(u.username)) = LOWER(TRIM($2))))
        ORDER BY (CASE WHEN u.role = 'client' THEN 0 ELSE 1 END), u.id DESC
        LIMIT 1
        `,
        [raw, altCode]
    );

    if (clientResult.rows[0]) {
        return clientResult.rows[0];
    }

    // 3. Direct match on users table, prioritizing client role
    const userResult = await query(
        `
        SELECT
            id,
            email,
            username,
            first_name,
            last_name,
            role,
            status
        FROM users
        WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
           OR (username IS NOT NULL AND (LOWER(TRIM(username)) = LOWER(TRIM($1)) OR LOWER(TRIM(username)) = LOWER(TRIM($2))))
           OR (first_name IS NOT NULL AND last_name IS NOT NULL AND LOWER(TRIM(first_name || ' ' || last_name)) = LOWER(TRIM($1)))
           OR (first_name IS NOT NULL AND LOWER(TRIM(first_name)) = LOWER(TRIM($1)))
        ORDER BY (CASE WHEN role = 'client' THEN 0 ELSE 1 END), id DESC
        LIMIT 1
        `,
        [raw, altCode]
    );

    if (userResult.rows[0]) {
        return userResult.rows[0];
    }

    return null;
}


/* =========================================================
   CREATE PASSWORD RESET CODE
========================================================= */

async function createPasswordResetCode(user) {
    const email = normalizeEmail(user.email);
    const firstName = String(user.first_name || "").trim();

    if (!user.id || !validateEmail(email)) {
        throw createError(
            "Invalid user account for password reset.",
            400
        );
    }

    /* -----------------------------------------------------
       RESEND COOLDOWN
    ----------------------------------------------------- */
    const recentCodeResult = await query(
        `
        SELECT created_at
        FROM password_reset_codes
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [user.id]
    );

    if (recentCodeResult.rows.length > 0) {
        const createdAt = new Date(recentCodeResult.rows[0].created_at);
        const elapsedSeconds = (Date.now() - createdAt.getTime()) / 1000;

        if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
            const remainingSeconds = Math.ceil(
                RESEND_COOLDOWN_SECONDS - elapsedSeconds
            );

            const error = createError(
                "Please wait before requesting another password reset code.",
                429,
                "RESET_RESEND_COOLDOWN"
            );
            error.retryAfter = remainingSeconds;
            throw error;
        }
    }

    /* -----------------------------------------------------
       GENERATE AND HASH CODE
    ----------------------------------------------------- */
    const code = generateResetCode();
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);

    /* -----------------------------------------------------
       INVALIDATE PREVIOUS ACTIVE CODES
    ----------------------------------------------------- */
    await query(
        `
        UPDATE password_reset_codes
        SET used_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
          AND used_at IS NULL
        `,
        [user.id]
    );

    /* -----------------------------------------------------
       INSERT NEW CODE
    ----------------------------------------------------- */
    await query(
        `
        INSERT INTO password_reset_codes (
            user_id,
            code_hash,
            expires_at
        )
        VALUES (
            $1,
            $2,
            CURRENT_TIMESTAMP + INTERVAL '${RESET_CODE_EXPIRY_MINUTES} minutes'
        )
        `,
        [user.id, codeHash]
    );

    /* -----------------------------------------------------
       SEND EMAIL
    ----------------------------------------------------- */
    try {
        const emailResult = await sendPasswordResetCode({
            email,
            firstName,
            code
        });

        return {
            sent: true,
            messageId: emailResult && emailResult.messageId
        };
    } catch (error) {
        console.error(
            "[PASSWORD RESET] SMTP DELIVERY FAILED:",
            error.message
        );

        if (
            process.env.NODE_ENV === "development" ||
            !process.env.NODE_ENV
        ) {
            console.log("\n=======================================================");
            console.log("🔑 [DEV FALLBACK] PASSWORD RESET OTP GENERATED");
            console.log("Recipient:  ", email);
            console.log("OTP Code:   ", code);
            console.log("Expires in: ", RESET_CODE_EXPIRY_MINUTES, "minutes");
            console.log("SMTP Status:", error.message);
            console.log("👉 Enter this OTP code on your reset password screen!");
            console.log("=======================================================\n");

            return {
                sent: false,
                devFallback: true,
                message: "SMTP delivery failed, but OTP code is active for local development."
            };
        }

        await query(
            `
            UPDATE password_reset_codes
            SET used_at = CURRENT_TIMESTAMP
            WHERE user_id = $1
              AND used_at IS NULL
            `,
            [user.id]
        );

        throw error;
    }
}


/* =========================================================
   REQUEST PASSWORD RESET
========================================================= */

async function requestPasswordReset(identifier, requiredRole) {
    const raw = String(identifier || "").trim();
    const normalizedRole = requiredRole ? String(requiredRole).toLowerCase().trim() : "";

    if (!raw) {
        throw createError(
            normalizedRole === "admin" || normalizedRole === "staff"
                ? "Please enter your administrator email address."
                : "Please provide your Client Name, registered Email Address, or Project ID.",
            400
        );
    }

    const user = await findUserForPasswordReset(raw, normalizedRole);

    if (normalizedRole === "admin" || normalizedRole === "staff") {
        if (!user || (user.role !== "admin" && user.role !== "staff") || user.status !== "active") {
            throw createError(
                "Invalid administrator email address.",
                400
            );
        }
    }

    if (!user || user.status !== "active") {
        throw createError(
            "No active account found with this email address.",
            404
        );
    }

    const dispatchResult = await createPasswordResetCode(user);

    return {
        sent: true,
        generic: true,
        email: user.email,
        maskedEmail: maskEmail(user.email),
        message: `A 6-digit verification code has been dispatched to ${maskEmail(user.email) || user.email}.`,
        devFallback: dispatchResult && dispatchResult.devFallback
    };
}


/* =========================================================
   VERIFY PASSWORD RESET CODE
========================================================= */

async function verifyPasswordResetCode(identifier, code, requiredRole) {
    const raw = String(identifier || "").trim();
    const normalizedCode = String(code || "").trim();
    const normalizedRole = requiredRole ? String(requiredRole).toLowerCase().trim() : "";

    if (!raw) {
        throw createError(
            normalizedRole === "admin" || normalizedRole === "staff"
                ? "Please enter your administrator email address."
                : "Please provide your Client Name, Email, or Project ID.",
            400
        );
    }

    if (!validateResetCode(normalizedCode)) {
        throw createError(
            "Please enter the 6-digit reset code.",
            400
        );
    }

    const user = await findUserForPasswordReset(raw, normalizedRole);

    if (!user || user.status !== "active") {
        throw createError(
            "Invalid or expired password reset code.",
            400
        );
    }

    const resetResult = await query(
        `
        SELECT
            id,
            code_hash,
            expires_at,
            attempts,
            verified_at,
            used_at
        FROM password_reset_codes
        WHERE user_id = $1
          AND used_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [user.id]
    );

    if (resetResult.rows.length === 0) {
        throw createError(
            "Invalid or expired password reset code.",
            400
        );
    }

    const reset = resetResult.rows[0];

    if (reset.verified_at) {
        throw createError(
            "This password reset code has already been verified.",
            400,
            "RESET_CODE_ALREADY_VERIFIED"
        );
    }

    if (new Date(reset.expires_at) <= new Date()) {
        throw createError(
            "Invalid or expired password reset code.",
            400,
            "RESET_CODE_EXPIRED"
        );
    }

    if (reset.attempts >= MAX_RESET_ATTEMPTS) {
        throw createError(
            "Too many incorrect attempts. Please request a new reset code.",
            429,
            "RESET_CODE_ATTEMPTS_EXCEEDED"
        );
    }

    const matches = await bcrypt.compare(normalizedCode, reset.code_hash);

    if (!matches) {
        const attemptResult = await query(
            `
            UPDATE password_reset_codes
            SET attempts = attempts + 1
            WHERE id = $1
            RETURNING attempts
            `,
            [reset.id]
        );

        const attempts = attemptResult.rows[0] ? attemptResult.rows[0].attempts : reset.attempts + 1;
        const remaining = Math.max(0, MAX_RESET_ATTEMPTS - attempts);
        const error = createError(
            "Invalid or expired password reset code.",
            400,
            "RESET_CODE_INVALID"
        );
        error.remainingAttempts = remaining;
        throw error;
    }

    const resetToken = generateResetToken();
    const resetTokenHash = hashResetToken(resetToken);

    await transaction(async (client) => {
        const updateResult = await client.query(
            `
            UPDATE password_reset_codes
            SET
                verified_at = CURRENT_TIMESTAMP,
                reset_token_hash = $1,
                reset_token_expires_at = CURRENT_TIMESTAMP + INTERVAL '${RESET_TOKEN_EXPIRY_MINUTES} minutes'
            WHERE id = $2
              AND used_at IS NULL
              AND verified_at IS NULL
            RETURNING id
            `,
            [resetTokenHash, reset.id]
        );

        if (updateResult.rows.length === 0) {
            throw createError(
                "The password reset request is no longer valid.",
                400
            );
        }
    });

    return {
        verified: true,
        resetToken,
        email: user.email,
        message: "Code verified successfully."
    };
}


/* =========================================================
   RESET PASSWORD
========================================================= */

async function resetPassword(identifier, resetToken, newPassword, requiredRole) {
    const raw = String(identifier || "").trim();
    const normalizedRole = requiredRole ? String(requiredRole).toLowerCase().trim() : "";

    if (!raw) {
        throw createError(
            normalizedRole === "admin" || normalizedRole === "staff"
                ? "Please enter your administrator email address."
                : "Please provide your Client Name, Email, or Project ID.",
            400
        );
    }

    if (typeof resetToken !== "string" || resetToken.length < 32) {
        throw createError(
            "Invalid or expired password reset authorization.",
            400
        );
    }

    if (!validatePassword(newPassword)) {
        throw createError(
            "Password must be between 8 and 128 characters.",
            400,
            "PASSWORD_POLICY"
        );
    }

    const user = await findUserForPasswordReset(raw, normalizedRole);
    if (!user || user.status !== "active") {
        throw createError(
            "Invalid or expired password reset authorization.",
            400
        );
    }

    const resetTokenHash = hashResetToken(resetToken);
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await transaction(async (client) => {
        const userResult = await client.query(
            `
            SELECT id, status
            FROM users
            WHERE id = $1
            LIMIT 1
            FOR UPDATE
            `,
            [user.id]
        );

        if (userResult.rows.length === 0 || userResult.rows[0].status !== "active") {
            throw createError(
                "Invalid or expired password reset authorization.",
                400
            );
        }

        const userId = userResult.rows[0].id;

        const resetResult = await client.query(
            `
            SELECT id
            FROM password_reset_codes
            WHERE user_id = $1
              AND reset_token_hash = $2
              AND verified_at IS NOT NULL
              AND used_at IS NULL
              AND reset_token_expires_at > CURRENT_TIMESTAMP
            ORDER BY created_at DESC
            LIMIT 1
            FOR UPDATE
            `,
            [userId, resetTokenHash]
        );

        if (resetResult.rows.length === 0) {
            throw createError(
                "Invalid or expired password reset authorization.",
                400,
                "RESET_TOKEN_INVALID"
            );
        }

        const resetId = resetResult.rows[0].id;

        await client.query(
            `
            UPDATE users
            SET
                password_hash = $1,
                password_changed_at = CURRENT_TIMESTAMP,
                email_verified = TRUE,
                failed_login_attempts = 0,
                locked_until = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            `,
            [passwordHash, userId]
        );

        await client.query(
            `
            UPDATE password_reset_codes
            SET used_at = CURRENT_TIMESTAMP
            WHERE id = $1
            `,
            [resetId]
        );

        await client.query(
            `
            UPDATE password_reset_codes
            SET used_at = CURRENT_TIMESTAMP
            WHERE user_id = $1
              AND used_at IS NULL
            `,
            [userId]
        );
    });

    return {
        reset: true,
        message: "Password reset successfully. You can now sign in with your new password."
    };
}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    requestPasswordReset,
    verifyPasswordResetCode,
    resetPassword,
    findUserForPasswordReset
};
