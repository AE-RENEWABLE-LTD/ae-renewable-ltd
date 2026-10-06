"use strict";

require("dotenv").config();

const bcrypt = require("bcryptjs");
const { query, pool } = require("../../../backend/config/database");

/* =========================================================
   AE RENEWABLE NETWORK
   DATABASE SEED
========================================================= */

async function seedDatabase() {
    console.log("");
    console.log("==============================================");
    console.log("       AE RENEWABLE DATABASE SEED");
    console.log("==============================================");

    try {
        /* =====================================================
           1. CHECK DATABASE CONNECTION
        ===================================================== */

        await query("SELECT NOW()");

        console.log("Database connection verified.");

        /* =====================================================
           2. CREATE ADMIN PASSWORD
        ===================================================== */

        const adminPassword =
            process.env.SEED_ADMIN_PASSWORD || "Admin@12345";

        const passwordHash = await bcrypt.hash(
            adminPassword,
            12
        );

        /* =====================================================
           3. CREATE ADMIN USER
        ===================================================== */

        const adminResult = await query(
            `
            INSERT INTO users (
                email,
                password_hash,
                first_name,
                last_name,
                phone,
                role,
                status
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7
            )
            ON CONFLICT (email)
            DO UPDATE SET
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                phone = EXCLUDED.phone,
                role = EXCLUDED.role,
                status = EXCLUDED.status,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id, email, role
            `,
            [
                "admin@aerenewablesolution.com",
                passwordHash,
                "AE",
                "Administrator",
                "08133615132",
                "admin",
                "active"
            ]
        );

        const admin = adminResult.rows[0];

        console.log("");
        console.log("ADMIN ACCOUNT");
        console.log("----------------------------------------------");
        console.log(`ID:       ${admin.id}`);
        console.log(`Email:    ${admin.email}`);
        console.log(`Role:     ${admin.role}`);
        console.log("----------------------------------------------");

        /* =====================================================
           4. SEED COMPLETED
        ===================================================== */

        console.log("");
        console.log("==============================================");
        console.log("       DATABASE SEED SUCCESSFUL");
        console.log("==============================================");
        console.log("");

    } catch (error) {

        console.error("");
        console.error("==============================================");
        console.error("       DATABASE SEED FAILED");
        console.error("==============================================");

        console.error("Message:", error.message);
        console.error("Code:", error.code || "N/A");
        console.error("Detail:", error.detail || "N/A");

        console.error("==============================================");
        console.error("");

        process.exitCode = 1;

    } finally {
        await pool.end();
    }
}

/* =========================================================
   RUN SEED
========================================================= */

seedDatabase();