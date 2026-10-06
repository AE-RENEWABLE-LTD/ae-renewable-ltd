"use strict";

const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// Load from all possible .env locations
const envPaths = [
    path.join(__dirname, "..", ".env"),
    path.join(__dirname, "..", "..", ".env"),
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "CLI_Folder", ".env")
];

for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
    }
}

// Safe development fallbacks if not provided in .env
const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/ae_renewable";
const DEFAULT_JWT_SECRET = "ae_renewable_default_jwt_secret_change_in_production";

if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = DEFAULT_DATABASE_URL;
}

if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = DEFAULT_JWT_SECRET;
}

/* =========================================================
   ENVIRONMENT CONFIGURATION
========================================================= */

const config = {
    nodeEnv: process.env.NODE_ENV || "development",

    port: Number(process.env.PORT) || 5000,

    databaseUrl: process.env.DATABASE_URL || DEFAULT_DATABASE_URL,

    jwtSecret: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,

    clientUrl: process.env.CLIENT_URL || "http://localhost:5000"
};

module.exports = config;