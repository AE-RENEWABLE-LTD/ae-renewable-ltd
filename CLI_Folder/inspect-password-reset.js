"use strict";

const { query } = require("./backend/config/database");

(async () => {
    try {
        const result = await query(`
            SELECT
                id,
                user_id,
                created_at,
                expires_at,
                attempts,
                verified_at,
                used_at
            FROM password_reset_codes
            WHERE user_id = (
                SELECT id
                FROM users
                WHERE email = 'aerenewablesolution@gmail.com'
            )
            ORDER BY created_at DESC
            LIMIT 3
        `);

        console.table(result.rows);
    } catch (error) {
        console.error(error);
        process.exitCode = 1;
    }
})();
