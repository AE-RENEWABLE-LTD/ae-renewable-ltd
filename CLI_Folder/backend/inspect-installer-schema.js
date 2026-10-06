"use strict";

const { query, closeDatabase } = require("./config/database");

async function inspect() {
    try {
        const result = await query(`
            SELECT
                ordinal_position,
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
        console.error(error);

    } finally {
        await closeDatabase();
    }
}

inspect();
