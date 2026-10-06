"use strict";

const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const {
    transaction
} = require("../config/database");

const {
    createVerificationCode
} = require("./email-verification.service");


/* =========================================================
   AE RENEWABLE NETWORK
   INSTALLER REGISTRATION SERVICE
========================================================= */


/* =========================================================
   GENERATE INSTALLER CODE
========================================================= */

function generateInstallerCode() {

    const random =
        crypto
            .randomBytes(4)
            .toString("hex")
            .toUpperCase();

    return `AEI-${random}`;
}


/* =========================================================
   NORMALIZE TEXT
========================================================= */

function clean(value) {

    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value).trim();
}


/* =========================================================
   REGISTER INSTALLER
========================================================= */

async function registerInstaller(data = {}) {

    const firstName =
        clean(data.firstName);

    const lastName =
        clean(data.lastName);

    const companyName =
        clean(data.companyName);

    const email =
        clean(data.email).toLowerCase();

    const phone =
        clean(data.phone);

    const password =
        data.password || "";

    const rcNumber =
        clean(data.rcNumber);

    const address =
        clean(data.address);

    const city =
        clean(data.city);

    const state =
        clean(data.state);

    const localGovernment =
        clean(data.localGovernment);

    const country =
        clean(data.country) ||
        "Nigeria";

    let specializations =
        data.specializations;


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (
        !firstName ||
        !lastName ||
        !companyName ||
        !email ||
        !phone ||
        !password ||
        !state ||
        !localGovernment ||
        !city
    ) {

        const error =
            new Error(
                "First name, last name, company name, email, phone, password, state, local government and city are required."
            );

        error.status = 400;

        throw error;
    }


    if (password.length < 8) {

        const error =
            new Error(
                "Password must contain at least 8 characters."
            );

        error.status = 400;

        throw error;
    }


    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {

        const error =
            new Error(
                "Please provide a valid email address."
            );

        error.status = 400;

        throw error;
    }


    if (!Array.isArray(specializations)) {
        specializations = [];
    }


    specializations =
        specializations
            .map(clean)
            .filter(Boolean);


    /* =====================================================
       HASH PASSWORD
    ===================================================== */

    const passwordHash =
        await bcrypt.hash(
            password,
            12
        );


    /* =====================================================
       DATABASE TRANSACTION
    ===================================================== */

    const result =
        await transaction(
            async client => {

                /* =========================================
                   CHECK EXISTING USER
                ========================================= */

                const existingUser =
                    await client.query(
                        `
                        SELECT
                            id,
                            email_verified,
                            status
                        FROM users
                        WHERE LOWER(email) = LOWER($1)
                        LIMIT 1
                        `,
                        [email]
                    );


                if (
                    existingUser.rows.length > 0
                ) {

                    const error =
                        new Error(
                            "An account with this email already exists."
                        );

                    error.status = 409;

                    throw error;
                }


                /* =========================================
                   CREATE USER
                ========================================= */

                const userResult =
                    await client.query(
                        `
                        INSERT INTO users (
                            email,
                            password_hash,
                            first_name,
                            last_name,
                            phone,
                            role,
                            status,
                            email_verified
                        )
                        VALUES (
                            $1,
                            $2,
                            $3,
                            $4,
                            $5,
                            'installer',
                            'active',
                            TRUE
                        )
                        RETURNING
                            id,
                            email,
                            first_name,
                            last_name,
                            phone,
                            role,
                            status,
                            email_verified,
                            created_at
                        `,
                        [
                            email,
                            passwordHash,
                            firstName,
                            lastName,
                            phone
                        ]
                    );


                const user =
                    userResult.rows[0];


                /* =========================================
                   GENERATE UNIQUE INSTALLER CODE
                ========================================= */

                let installerCode;

                let codeExists = true;


                while (codeExists) {

                    installerCode =
                        generateInstallerCode();


                    const codeResult =
                        await client.query(
                            `
                            SELECT id
                            FROM installers
                            WHERE installer_code = $1
                            LIMIT 1
                            `,
                            [installerCode]
                        );


                    codeExists =
                        codeResult.rows.length > 0;
                }


                /* =========================================
                   CREATE INSTALLER PROFILE
                ========================================= */

                const installerResult =
                    await client.query(
                        `
                        INSERT INTO installers (
                            user_id,
                            installer_code,
                            company_name,
                            contact_name,
                            email,
                            phone,
                            rc_number,
                            address,
                            city,
                            state,
                            local_government,
                            country,
                            specializations,
                            verification_status,
                            status
                        )
                        VALUES (
                            $1,
                            $2,
                            $3,
                            $4,
                            $5,
                            $6,
                            $7,
                            $8,
                            $9,
                            $10,
                            $11,
                            $12,
                            $13,
                            'pending',
                            'pending'
                        )
                        RETURNING *
                        `,
                        [
                            user.id,
                            installerCode,
                            companyName,
                            `${firstName} ${lastName}`,
                            email,
                            phone,
                            rcNumber || null,
                            address || null,
                            city,
                            state,
                            localGovernment,
                            country,
                            specializations
                        ]
                    );


                const installer =
                    installerResult.rows[0];


                /* =========================================
                   SAFE RETURN DATA
                ========================================= */

                return {

                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        phone: user.phone,
                        role: user.role,
                        status: user.status,
                        emailVerified:
                            user.email_verified,
                        createdAt:
                            user.created_at
                    },

                    installer: {
                        id: installer.id,
                        installerCode:
                            installer.installer_code,
                        companyName:
                            installer.company_name,
                        contactName:
                            installer.contact_name,
                        email:
                            installer.email,
                        phone:
                            installer.phone,
                        verificationStatus:
                            installer.verification_status,
                        status:
                            installer.status,
                        registrationDate:
                            installer.registration_date
                    }

                };

            }
        );


    /* =====================================================
       SEND VERIFICATION CODE
    ===================================================== */

    const verification =
        await createVerificationCode(
            result.user.id,
            result.user.email,
            result.user.firstName
        );


    /* =====================================================
       RETURN
    ===================================================== */

    return {

        ...result,

        verificationSent:
            verification.sent

    };
}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    registerInstaller
};