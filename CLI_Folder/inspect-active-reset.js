"use strict";

const { query } = require("./backend/config/database");

(async () => {
    try {
        const result = await query(`
            SELECT
                id,
                user_id,
                code_hash,
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
            LIMIT 1
        `);

        if (result.rows.length === 0) {
            console.log("NO RESET RECORD FOUND.");
            return;
        }

        const reset = result.rows[0];

        console.log("ACTIVE RESET RECORD:");
        console.log({
            id: reset.id,
            user_id: reset.user_id,
            created_at: reset.created_at,
            expires_at: reset.expires_at,
            attempts: reset.attempts,
            verified_at: reset.verified_at,
            used_at: reset.used_at,
            code_hash_present: Boolean(reset.code_hash),
            code_hash_prefix: reset.code_hash
                ? reset.code_hash.substring(0, 20) + "..."
                : null
        });
    } catch (error) {
        console.error(error);
        process.exitCode = 1;
    }
})();
