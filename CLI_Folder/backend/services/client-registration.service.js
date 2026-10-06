"use strict";

const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const {
    transaction
} = require("../config/database");


/* =========================================================
   AE RENEWABLE NETWORK
   CLIENT REGISTRATION SERVICE
========================================================= */


/* =========================================================
   GENERATE CLIENT CODE
========================================================= */

function generateClientCode() {

    const random =
        crypto
            .randomBytes(4)
            .toString("hex")
            .toUpperCase();

    return `AEC-${random}`;
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
   REGISTER CLIENT
========================================================= */

async function registerClient(data = {}) {

    const firstName =
        clean(data.firstName);

    const lastName =
        clean(data.lastName);

    const email =
        clean(data.email).toLowerCase();

    const phone =
        clean(data.phone);

    const password =
        data.password || "";

    const companyName =
        clean(data.companyName);

    const registrationNumber =
        clean(data.registrationNumber);

    const clientType =
        clean(data.clientType).toLowerCase();

    const country =
        clean(data.country) ||
        "Nigeria";


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (
        !firstName ||
        !lastName ||
        !email ||
        !phone ||
        !password ||
        !clientType
    ) {

        const error =
            new Error(
                "First name, last name, email, phone, password and account type are required."
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


    const allowedClientTypes = [
        "individual",
        "business",
        "corporate",
        "government",
        "organization"
    ];


    if (
        !allowedClientTypes.includes(
            clientType
        )
    ) {

        const error =
            new Error(
                "Invalid client account type."
            );

        error.status = 400;

        throw error;
    }


    /*
     * Business information is required for
     * non-individual account types.
     */

    if (
        clientType !== "individual" &&
        !companyName
    ) {

        const error =
            new Error(
                "Company or organization name is required for this account type."
            );

        error.status = 400;

        throw error;
    }


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

    return transaction(
        async client => {

            /* =============================================
               CHECK EXISTING USER
            ============================================= */

            const existingUser =
                await client.query(
                    `
                    SELECT id
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


            /* =============================================
               CREATE USER ACCOUNT
            ============================================= */

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
                        'client',
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


            /* =============================================
               GENERATE UNIQUE CLIENT CODE
            ============================================= */

            let clientCode;
            let codeExists = true;


            while (codeExists) {

                clientCode =
                    generateClientCode();


                const codeResult =
                    await client.query(
                        `
                        SELECT id
                        FROM clients
                        WHERE client_code = $1
                        LIMIT 1
                        `,
                        [clientCode]
                    );


                codeExists =
                    codeResult.rows.length > 0;
            }


            /* =============================================
               CREATE CLIENT PROFILE
            ============================================= */

            const clientResult =
                await client.query(
                    `
                    INSERT INTO clients (
                        user_id,
                        client_code,
                        company_name,
                        contact_name,
                        email,
                        phone,
                        country,
                        client_type,
                        registration_number,
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
                        'active'
                    )
                    RETURNING
                        id,
                        user_id,
                        client_code,
                        company_name,
                        contact_name,
                        email,
                        phone,
                        country,
                        client_type,
                        registration_number,
                        status,
                        created_at
                    `,
                    [
                        user.id,
                        clientCode,
                        companyName || null,
                        `${firstName} ${lastName}`,
                        email,
                        phone,
                        country,
                        clientType,
                        registrationNumber || null
                    ]
                );


            const clientProfile =
                clientResult.rows[0];


            /* =============================================
               RETURN SAFE DATA
            ============================================= */

            return {

                user: {
                    id:
                        user.id,

                    email:
                        user.email,

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

                    createdAt:
                        user.created_at
                },


                client: {

                    id:
                        clientProfile.id,

                    userId:
                        clientProfile.user_id,

                    clientCode:
                        clientProfile.client_code,

                    companyName:
                        clientProfile.company_name,

                    contactName:
                        clientProfile.contact_name,

                    email:
                        clientProfile.email,

                    phone:
                        clientProfile.phone,

                    country:
                        clientProfile.country,

                    clientType:
                        clientProfile.client_type,

                    registrationNumber:
                        clientProfile.registration_number,

                    status:
                        clientProfile.status,

                    registrationDate:
                        clientProfile.created_at
                }

            };

        }
    );
}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    registerClient
};