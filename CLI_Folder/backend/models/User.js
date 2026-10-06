"use strict";

const { query } = require("../config/database");

/* =========================================================
   AE RENEWABLE NETWORK
   USER MODEL
========================================================= */

/* =========================================================
   FIND USER BY ID
========================================================= */

async function findById(id) {
    const result = await query(
        `
        SELECT
            id,
            email,
            password_hash,
            first_name,
            last_name,
            phone,
            role,
            status,
            email_verified,
            last_login_at,
            created_at,
            updated_at
        FROM users
        WHERE id = $1
        LIMIT 1
        `,
        [id]
    );

    return result.rows[0] || null;
}

/* =========================================================
   FIND USER BY EMAIL
========================================================= */

async function findByEmail(email) {
    const result = await query(
        `
        SELECT
            id,
            email,
            password_hash,
            first_name,
            last_name,
            phone,
            role,
            status,
            email_verified,
            last_login_at,
            created_at,
            updated_at
        FROM users
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
        `,
        [email]
    );

    return result.rows[0] || null;
}

/* =========================================================
   CREATE USER
========================================================= */

async function create(data) {
    const result = await query(
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
            $1, $2, $3, $4,
            $5, $6, $7, $8
        )
        RETURNING
            id,
            email,
            password_hash,
            first_name,
            last_name,
            phone,
            role,
            status,
            email_verified,
            last_login_at,
            created_at,
            updated_at
        `,
        [
            data.email,
            data.passwordHash,
            data.firstName,
            data.lastName,
            data.phone || null,
            data.role || "client",
            data.status || "active",
            data.emailVerified || false
        ]
    );

    return result.rows[0];
}

/* =========================================================
   UPDATE LAST LOGIN
========================================================= */

async function updateLastLogin(id) {
    const result = await query(
        `
        UPDATE users
        SET
            last_login_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
        `,
        [id]
    );

    return result.rows[0] || null;
}

/* =========================================================
   UPDATE USER
========================================================= */

async function update(id, data) {
    const fieldMap = {
        email: "email",
        firstName: "first_name",
        lastName: "last_name",
        phone: "phone",
        role: "role",
        status: "status",
        emailVerified: "email_verified",
        passwordHash: "password_hash"
    };

    const updates = [];
    const values = [];

    for (const [inputField, databaseField] of Object.entries(fieldMap)) {
        if (
            Object.prototype.hasOwnProperty.call(
                data,
                inputField
            )
        ) {
            values.push(data[inputField]);

            updates.push(
                `${databaseField} = $${values.length}`
            );
        }
    }

    if (updates.length === 0) {
        return findById(id);
    }

    values.push(id);

    const result = await query(
        `
        UPDATE users
        SET
            ${updates.join(", ")},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $${values.length}
        RETURNING
            id,
            email,
            password_hash,
            first_name,
            last_name,
            phone,
            role,
            status,
            email_verified,
            last_login_at,
            created_at,
            updated_at
        `,
        values
    );

    return result.rows[0] || null;
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    findById,
    findByEmail,
    create,
    updateLastLogin,
    update
};