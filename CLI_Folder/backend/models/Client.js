"use strict";

const db = require("../config/database");

/* =========================================================
   AE RENEWABLE NETWORK
   CLIENT MODEL
========================================================= */

async function findAll(filters = {}) {
    const conditions = [];
    const values = [];

    if (filters.status) {
        values.push(filters.status);
        conditions.push(`c.status = $${values.length}`);
    }

    if (filters.email) {
        values.push(filters.email);
        conditions.push(`LOWER(c.email) = LOWER($${values.length})`);
    }

    const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const result = await db.query(
        `
        SELECT c.*
        FROM clients c
        ${whereClause}
        ORDER BY c.created_at DESC
        `,
        values
    );

    return result.rows;
}

async function findById(id) {
    const result = await db.query(
        `
        SELECT c.*
        FROM clients c
        WHERE c.id = $1
        LIMIT 1
        `,
        [id]
    );

    return result.rows[0] || null;
}

async function findByEmail(email) {
    const result = await db.query(
        `
        SELECT c.*
        FROM clients c
        WHERE LOWER(c.email) = LOWER($1)
        LIMIT 1
        `,
        [email]
    );

    return result.rows[0] || null;
}

async function create(data) {
    const result = await db.query(
        `
        INSERT INTO clients (
            name,
            email,
            phone,
            company_name,
            address,
            city,
            state,
            country,
            status
        )
        VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9
        )
        RETURNING *
        `,
        [
            data.name,
            data.email,
            data.phone || null,
            data.companyName || null,
            data.address || null,
            data.city || null,
            data.state || null,
            data.country || "Nigeria",
            data.status || "active"
        ]
    );

    return result.rows[0];
}

async function update(id, data) {
    const result = await db.query(
        `
        UPDATE clients
        SET
            name = COALESCE($1, name),
            email = COALESCE($2, email),
            phone = COALESCE($3, phone),
            company_name = COALESCE($4, company_name),
            address = COALESCE($5, address),
            city = COALESCE($6, city),
            state = COALESCE($7, state),
            country = COALESCE($8, country),
            status = COALESCE($9, status),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $10
        RETURNING *
        `,
        [
            data.name ?? null,
            data.email ?? null,
            data.phone ?? null,
            data.companyName ?? null,
            data.address ?? null,
            data.city ?? null,
            data.state ?? null,
            data.country ?? null,
            data.status ?? null,
            id
        ]
    );

    return result.rows[0] || null;
}

async function remove(id) {
    const result = await db.query(
        `
        DELETE FROM clients
        WHERE id = $1
        RETURNING *
        `,
        [id]
    );

    return result.rows[0] || null;
}

module.exports = {
    findAll,
    findById,
    findByEmail,
    create,
    update,
    remove
};
