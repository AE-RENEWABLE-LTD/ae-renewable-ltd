"use strict";

const { query } = require("./config/database");

async function inspect() {
    try {
        const result = await query(`
            SELECT
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'installers'
            ORDER BY ordinal_position;
        `);

        console.table(result.rows);

    } catch (error) {
        console.error("DATABASE ERROR:", error.message);

    } finally {
        process.exit();
    }
}

inspect();