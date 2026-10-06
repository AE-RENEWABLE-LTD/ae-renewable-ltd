"use strict";

require("dotenv").config();

const fs = require("fs");
const path = require("path");

const {
    query,
    pool
} = require("../../backend/config/database");

/* =========================================================
   AE RENEWABLE NETWORK
   DATABASE MIGRATION RUNNER
========================================================= */

const schemaDirectory = path.join(
    __dirname,
    "../schema"
);

/*
    IMPORTANT:
    The order matters because our tables have
    foreign-key relationships.
*/

const schemaFiles = [
    "users.sql",
    "email_verification_codes.sql",
    "password_reset_codes.sql",
    "clients.sql",
    "installers.sql",
    "projects.sql",
    "quotations.sql",
    "payments.sql",
    "documents.sql",
    "notifications.sql",
    /* ===================================================
       NEW TABLES — must come after base tables
    =================================================== */
    "project_evidence.sql",
    "activities.sql",
    "equipment.sql",
    /* ===================================================
       ALTERATIONS — must come last
    =================================================== */
    "schema_alterations.sql"
];

/* =========================================================
   RUN MIGRATIONS
========================================================= */

async function runMigrations() {
    console.log("");
    console.log("==============================================");
    console.log("       AE RENEWABLE DATABASE MIGRATIONS");
    console.log("==============================================");
    console.log("");

    try {
        /* =====================================================
           DATABASE CONNECTION TEST
        ===================================================== */

        await query("SELECT NOW()");

        console.log("PostgreSQL connection verified.");
        console.log("");

        /* =====================================================
           EXECUTE SCHEMA FILES
        ===================================================== */

        for (const file of schemaFiles) {
            const filePath = path.join(
                schemaDirectory,
                file
            );

            console.log("----------------------------------------------");
            console.log(`Running: ${file}`);

            if (!fs.existsSync(filePath)) {
                throw new Error(
                    `Schema file not found: ${filePath}`
                );
            }

            const sql = fs.readFileSync(
                filePath,
                "utf8"
            );

            if (!sql.trim()) {
                throw new Error(
                    `Schema file is empty: ${file}`
                );
            }

            await query(sql);

            console.log(`Completed: ${file}`);
        }

        console.log("");
        console.log("==============================================");
        console.log("       DATABASE MIGRATIONS SUCCESSFUL");
        console.log("==============================================");
        console.log("");

    } catch (error) {

        console.error("");
        console.error("==============================================");
        console.error("       DATABASE MIGRATIONS FAILED");
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
   START
========================================================= */

runMigrations();
