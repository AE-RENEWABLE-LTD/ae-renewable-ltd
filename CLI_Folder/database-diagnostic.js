"use strict";

const { query, closeDatabase } = require("./backend/config/database");

async function main() {
    try {
        const result = await query(`
            SELECT
                u.id AS user_id,
                u.email,
                u.role,
                u.status AS user_status,
                u.email_verified,
                i.id AS installer_id,
                i.installer_code,
                i.status AS installer_status,
                i.verification_status,
                i.user_id AS installer_user_id
            FROM users u
            LEFT JOIN installers i
                ON i.user_id = u.id
            ORDER BY u.id DESC
        `);

        console.table(result.rows);

    } catch (error) {
        console.error("DATABASE DIAGNOSTIC FAILED");
        console.error(error);
        process.exitCode = 1;

    } finally {
        await closeDatabase();
    }
}

main();
