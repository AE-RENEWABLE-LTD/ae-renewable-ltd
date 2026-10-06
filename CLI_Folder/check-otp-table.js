"use strict";

require("dotenv").config();

const { query, pool } = require("./backend/config/database");

async function check() {
    try {
        const result = await query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'email_verification_codes'
        `);

        console.log("");
        console.log("OTP TABLE CHECK");
        console.log("================");
        console.log(result.rows);
        console.log("");
    } catch (error) {
        console.error("ERROR:", error.message);
    } finally {
        await pool.end();
    }
}

check();
