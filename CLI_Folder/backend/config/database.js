"use strict";

const { Pool } = require("pg");
const config = require("./environment");

/* =========================================================
   POSTGRESQL CONNECTION POOL
========================================================= */

const connectionString = (config.databaseUrl || "")
    .replace("@localhost:", "@127.0.0.1:");

const pool = new Pool({
    connectionString,

    max: 10,

    idleTimeoutMillis: 30000,

    connectionTimeoutMillis: 10000
});

/* =========================================================
   DATABASE POOL ERROR
========================================================= */

pool.on("error", (error) => {
    console.error("");
    console.error("==============================================");
    console.error("       POSTGRESQL POOL ERROR");
    console.error("==============================================");
    console.error("Message:", error.message);
    console.error("Code:", error.code || "N/A");
    console.error("==============================================");
    console.error("");
});

/* =========================================================
   SCHEMA ALTERATIONS INITIALIZER
========================================================= */

async function initSchemaAlterations() {
    try {
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);`);
        await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS quotation_id BIGINT;`);
        await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS original_contract_value NUMERIC(15, 2);`);
        await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS proposed_bargain_amount NUMERIC(15, 2);`);
        await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS bargain_discount_percentage NUMERIC(5, 2);`);
        await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS bargain_note TEXT;`);
        await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS bargain_status VARCHAR(40) NOT NULL DEFAULT 'none';`);
        await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS bargain_submitted_at TIMESTAMPTZ;`);
        await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS bargain_reviewed_at TIMESTAMPTZ;`);
        await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS bargain_reviewed_by BIGINT;`);

        await pool.query(`ALTER TABLE quotations ADD COLUMN IF NOT EXISTS original_amount NUMERIC(15, 2);`);
        await pool.query(`ALTER TABLE quotations ADD COLUMN IF NOT EXISTS proposed_bargain_amount NUMERIC(15, 2);`);
        await pool.query(`ALTER TABLE quotations ADD COLUMN IF NOT EXISTS bargain_discount_percentage NUMERIC(5, 2);`);
        await pool.query(`ALTER TABLE quotations ADD COLUMN IF NOT EXISTS bargain_note TEXT;`);
        await pool.query(`ALTER TABLE quotations ADD COLUMN IF NOT EXISTS bargain_status VARCHAR(40) NOT NULL DEFAULT 'none';`);
        await pool.query(`ALTER TABLE quotations ADD COLUMN IF NOT EXISTS bargain_submitted_at TIMESTAMPTZ;`);
        console.log("[Database] Schema alterations verified successfully.");
    } catch (err) {
        console.warn("[Database] Schema alteration notice:", err.message);
    }
}

/* =========================================================
   TEST DATABASE CONNECTION
========================================================= */

async function testDatabaseConnection() {
    let client;

    try {
        client = await pool.connect();

        const result = await client.query(
            "SELECT NOW() AS current_time"
        );

        console.log("");
        console.log("==============================================");
        console.log("       POSTGRESQL CONNECTION SUCCESS");
        console.log("==============================================");
        console.log(
            `Database time: ${result.rows[0].current_time}`
        );
        console.log("==============================================");
        console.log("");

        await initSchemaAlterations();

        return true;

    } catch (error) {

        console.error("");
        console.error("==============================================");
        console.error("       POSTGRESQL CONNECTION FAILED");
        console.error("==============================================");
        console.error("Message:", error.message);
        console.error("Code:", error.code || "N/A");
        console.error("Detail:", error.detail || "N/A");
        console.error("Host:", error.host || "N/A");
        console.error("Port:", error.port || "N/A");
        console.error("==============================================");
        console.error("");

        throw error;

    } finally {

        if (client) {
            client.release();
        }
    }
}

/* =========================================================
   DATABASE QUERY HELPER
========================================================= */

async function query(text, params = []) {
    return pool.query(text, params);
}

/* =========================================================
   DATABASE TRANSACTION HELPER
========================================================= */

async function transaction(callback) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const result = await callback(client);

        await client.query("COMMIT");

        return result;

    } catch (error) {

        await client.query("ROLLBACK");

        throw error;

    } finally {

        client.release();
    }
}

/* =========================================================
   CLOSE DATABASE
========================================================= */

async function closeDatabase() {
    await pool.end();
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    pool,
    query,
    transaction,
    testDatabaseConnection,
    closeDatabase
};