"use strict";

require("dotenv").config();

const fs = require("fs");
const { query, pool } = require("./backend/config/database");

async function test() {
    try {
        const sql = fs.readFileSync(
            "./database/schema/email_verification_codes.sql",
            "utf8"
        );

        console.log("SQL length:", sql.length);
        console.log("SQL starts with:");
        console.log(sql.substring(0, 150));

        await query(sql);

        console.log("");
        console.log("OTP SQL EXECUTED SUCCESSFULLY");
        console.log("");
    } catch (error) {
        console.error("");
        console.error("OTP SQL TEST FAILED");
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        console.error("Position:", error.position || "N/A");
        console.error("Detail:", error.detail || "N/A");
        console.error("");
    } finally {
        await pool.end();
    }
}

test();
