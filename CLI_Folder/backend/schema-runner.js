"use strict";

const fs = require("fs");
const path = require("path");

const {
    query,
    closeDatabase
} = require("./config/database");

/* =========================================================
   AE RENEWABLE NETWORK
   DATABASE SCHEMA RUNNER
========================================================= */

const schemaDirectory = path.join(
    __dirname,
    "..",
    "database",
    "schema"
);

/* =========================================================
   SCHEMA FILE ORDER
========================================================= */

const schemaFiles = [
    "quotations.sql",
    "quotation_items.sql"
];

/* =========================================================
   RUN SCHEMA
========================================================= */

async function runSchema() {
    console.log("");
    console.log("==============================================");
    console.log("       AE RENEWABLE DATABASE SCHEMA");
    console.log("==============================================");

    try {

        for (const fileName of schemaFiles) {

            const filePath = path.join(
                schemaDirectory,
                fileName
            );

            if (!fs.existsSync(filePath)) {
                throw new Error(
                    `Schema file not found: ${fileName}`
                );
            }

            console.log("");
            console.log(`Running: ${fileName}`);

            const sql = fs.readFileSync(
                filePath,
                "utf8"
            );

            if (!sql.trim()) {
                throw new Error(
                    `Schema file is empty: ${fileName}`
                );
            }

            /*
             * PostgreSQL can execute multiple SQL statements
             * when they are sent as one simple query.
             *
             * The schema files contain no parameter placeholders.
             */

            await query(sql);

            console.log(
                `SUCCESS: ${fileName}`
            );
        }

        console.log("");
        console.log("==============================================");
        console.log("       DATABASE SCHEMA COMPLETE");
        console.log("==============================================");
        console.log("");

    } catch (error) {

        console.error("");
        console.error("==============================================");
        console.error("       DATABASE SCHEMA FAILED");
        console.error("==============================================");
        console.error("Message:", error.message);
        console.error("Code:", error.code || "N/A");
        console.error("Detail:", error.detail || "N/A");
        console.error("==============================================");
        console.error("");

        process.exitCode = 1;

    } finally {

        await closeDatabase();
    }
}

/* =========================================================
   START
========================================================= */

runSchema();
