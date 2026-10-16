"use strict";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {
    query
} = require("../config/database");

const config =
    require("../config/environment");


/* =========================================================
   AE RENEWABLE NETWORK
   AUTHENTICATION SERVICE
========================================================= */


/* =========================================================
   FIND USER BY EMAIL, USERNAME OR FULL NAME
========================================================= */

async function findUserByEmail(emailOrUsername) {
    const raw = String(emailOrUsername || "").trim();
    if (!raw) return null;

    const altCode = raw.startsWith("AE-")
        ? raw.replace("AE-", "PRJ-")
        : (raw.startsWith("PRJ-") ? raw.replace("PRJ-", "AE-") : raw);

    // 1. If identifier contains '@', match exact email, Gmail dot variations, or domain aliases
    if (raw.includes("@")) {
        const lowerRaw = raw.toLowerCase();
        const isGmail = lowerRaw.endsWith("@gmail.com");
        const cleanGmailUser = isGmail ? lowerRaw.replace("@gmail.com", "").replace(/\./g, "") : "";
        let domainVariant = "";
        if (lowerRaw.endsWith("@a.e.renewablesolution.com")) {
            domainVariant = lowerRaw.replace("@a.e.renewablesolution.com", "@aerenewablesolution.com");
        } else if (lowerRaw.endsWith("@aerenewablesolution.com")) {
            domainVariant = lowerRaw.replace("@aerenewablesolution.com", "@a.e.renewablesolution.com");
        }

        const emailResult = await query(
            `
            SELECT
                id,
                email,
                username,
                password_hash,
                first_name,
                last_name,
                phone,
                role,
                status,
                email_verified,
                last_login_at,
                failed_login_attempts,
                locked_until,
                created_at,
                updated_at
            FROM users
            WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
               OR ($2 != '' AND LOWER(TRIM(email)) = LOWER(TRIM($2)))
               OR ($3 != '' AND LOWER(TRIM(email)) LIKE '%@gmail.com' AND REPLACE(REPLACE(LOWER(TRIM(email)), '@gmail.com', ''), '.', '') = $3)
            ORDER BY (CASE WHEN role IN ('admin', 'staff') THEN 0 ELSE 1 END), id ASC
            LIMIT 1
            `,
            [raw, domainVariant, cleanGmailUser]
        );
        if (emailResult.rows[0]) return emailResult.rows[0];

        const clientEmailResult = await query(
            `
            SELECT u.*
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
        SELECT u.*
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
        SELECT u.*
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
        SELECT u.*
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

    // 5. Query installers table by installer_code, contact_name, or company_name
    const installerResult = await query(
        `
        SELECT u.*
        FROM installers i
        JOIN users u ON i.user_id = u.id
        WHERE LOWER(TRIM(i.installer_code)) = LOWER(TRIM($1))
           OR LOWER(TRIM(i.company_name)) = LOWER(TRIM($1))
           OR LOWER(TRIM(i.contact_name)) = LOWER(TRIM($1))
           OR LOWER(TRIM(i.email)) = LOWER(TRIM($1))
        LIMIT 1
        `,
        [raw]
    );

    if (installerResult.rows[0]) {
        return installerResult.rows[0];
    }

    // 6. Query users table directly
    const result = await query(
        `
        SELECT
            id,
            email,
            username,
            password_hash,
            first_name,
            last_name,
            phone,
            role,
            status,
            email_verified,
            last_login_at,
            failed_login_attempts,
            locked_until,
            created_at,
            updated_at
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

    if (result.rows[0]) {
        return result.rows[0];
    }

    return null;
}


/* =========================================================
   FIND USER BY ID
========================================================= */

async function findUserById(userId) {

    const result =
        await query(
            `
            SELECT
                id,
                email,
                first_name,
                last_name,
                phone,
                role,
                status,
                email_verified,
                last_login_at,
                failed_login_attempts,
                locked_until,
                created_at,
                updated_at
            FROM users
            WHERE id = $1
            LIMIT 1
            `,
            [userId]
        );

    return result.rows[0] || null;
}


/* =========================================================
   CHECK ACCOUNT LOCK
========================================================= */

function isAccountLocked(user) {

    if (!user.locked_until) {
        return false;
    }

    return (
        new Date(user.locked_until)
        > new Date()
    );
}


/* =========================================================
   RESET LOGIN ATTEMPTS
========================================================= */

async function resetLoginAttempts(userId) {

    await query(
        `
        UPDATE users
        SET
            failed_login_attempts = 0,
            locked_until = NULL,
            last_login_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [userId]
    );
}


/* =========================================================
   REGISTER FAILED LOGIN
========================================================= */

async function registerFailedLogin(user) {

    const attempts =
        user.failed_login_attempts + 1;

    const maximumAttempts = 5;


    if (
        attempts >= maximumAttempts
    ) {

        await query(
            `
            UPDATE users
            SET
                failed_login_attempts = $1,
                locked_until =
                    CURRENT_TIMESTAMP
                    + INTERVAL '15 minutes',
                updated_at =
                    CURRENT_TIMESTAMP
            WHERE id = $2
            `,
            [
                attempts,
                user.id
            ]
        );

        return;
    }


    await query(
        `
        UPDATE users
        SET
            failed_login_attempts = $1,
            updated_at =
                CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [
            attempts,
            user.id
        ]
    );
}


/* =========================================================
   GENERATE JWT
========================================================= */

function generateToken(user, portal = null) {

    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            role: user.role,
            portal: portal || user.role
        },
        config.jwtSecret,
        {
            expiresIn: "7d"
        }
    );
}


/* =========================================================
   SANITIZE USER
========================================================= */

function sanitizeUser(user) {

    return {

        id: user.id,

        email: user.email,

        firstName:
            user.first_name,

        lastName:
            user.last_name,

        phone:
            user.phone,

        role:
            user.role,

        status:
            user.status,

        emailVerified:
            user.email_verified,

        lastLoginAt:
            user.last_login_at,

        createdAt:
            user.created_at

    };
}


/* =========================================================
   LOGIN
========================================================= */

async function login(
    email,
    password,
    portal = null
) {

    if (
        !email ||
        !password
    ) {

        const error =
            new Error(
                "Email and password are required."
            );

        error.status = 400;

        throw error;
    }


    const user =
        await findUserByEmail(
            email.trim()
        );


    if (!user) {

        const error =
            new Error(
                "Invalid email or password."
            );

        error.status = 401;

        throw error;
    }


    /* =====================================================
       ACCOUNT LOCK CHECK
    ===================================================== */

    if (
        isAccountLocked(user)
    ) {
        const remainingMs = Math.max(0, new Date(user.locked_until).getTime() - Date.now());
        const remainingMinutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));

        const error =
            new Error(
                `Account temporarily locked. Try again in ${remainingMinutes} minute${remainingMinutes > 1 ? "s" : ""}.`
            );

        error.status = 423;
        error.remainingMinutes = remainingMinutes;

        throw error;
    }


    /* =====================================================
       PASSWORD VERIFICATION (STRICT BCRYPT ONLY)
    ===================================================== */

    let passwordMatches =
        await bcrypt.compare(
            password,
            user.password_hash
        );

    if (!passwordMatches && typeof password === "string") {
        const cleanPassword = password.trim();
        passwordMatches = await bcrypt.compare(
            cleanPassword,
            user.password_hash
        );
    }

    if (!passwordMatches) {

        await registerFailedLogin(
            user
        );

        const error =
            new Error(
                "Invalid email or password."
            );

        error.status = 401;

        throw error;
    }


    /* =====================================================
       ROLE RESOLUTION & ENFORCEMENT
    ===================================================== */

    // Check if user has an associated installer profile
    if (user.role !== "admin" && user.role !== "super_admin" && user.role !== "staff") {
        const insCheck = await query(
            "SELECT id, installer_code, verification_status, status FROM installers WHERE user_id = $1 LIMIT 1",
            [user.id]
        );
        if (insCheck.rows.length > 0) {
            user.role = "installer";
        }
    }

    // Portal role validation
    const normalizedPortal = portal ? String(portal).trim().toLowerCase() : null;

    if (normalizedPortal === "admin") {
        if (user.role !== "admin" && user.role !== "super_admin" && user.role !== "staff") {
            const error = new Error("These credentials are not authorized for this portal. Please use the correct sign-in page.");
            error.status = 403;
            throw error;
        }
    } else if (normalizedPortal === "installer") {
        if (user.role !== "installer") {
            const error = new Error("These credentials are not authorized for this portal. Please use the correct sign-in page.");
            error.status = 403;
            throw error;
        }
    } else if (normalizedPortal === "client") {
        if (user.role !== "client") {
            const error = new Error("These credentials are not authorized for this portal. Please use the correct sign-in page.");
            error.status = 403;
            throw error;
        }
    }


    /* =====================================================
       EMAIL VERIFICATION
    ===================================================== */

    if (
        !user.email_verified
    ) {

        const error =
            new Error(
                "Please verify your email address before logging in."
            );

        error.status = 403;

        error.code =
            "EMAIL_NOT_VERIFIED";

        error.requiresVerification = true;
        error.email = user.email;

        throw error;
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
       SUCCESS
    ===================================================== */

    await resetLoginAttempts(
        user.id
    );

    const token =
        generateToken(user, normalizedPortal);


    return {

        token,

        user:
            sanitizeUser(user)

    };
}


/* =========================================================
   GET AUTHENTICATED USER
========================================================= */

async function getAuthenticatedUser(
    userId
) {

    const user =
        await findUserById(
            userId
        );


    if (!user) {

        const error =
            new Error(
                "User account not found."
            );

        error.status = 404;

        throw error;
    }


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


    return sanitizeUser(
        user
    );
}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {

    findUserByEmail,

    findUserById,

    login,

    getAuthenticatedUser,

    generateToken,

    sanitizeUser

};