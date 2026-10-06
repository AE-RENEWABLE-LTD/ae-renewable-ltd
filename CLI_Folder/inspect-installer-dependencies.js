require("dotenv").config();

const { Client } = require("pg");

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

async function inspect() {
    try {
        await client.connect();

        console.log("\n========================================");
        console.log("INSTALLER DATABASE DEPENDENCIES");
        console.log("========================================\n");

        const result = await client.query(`
            SELECT
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS referenced_table,
                ccu.column_name AS referenced_column,
                tc.constraint_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND (
                  ccu.table_name = 'users'
                  OR ccu.table_name = 'installers'
              )
            ORDER BY tc.table_name, kcu.column_name;
        `);

        console.table(result.rows);

    } catch (error) {
        console.error("\nDATABASE ERROR:");
        console.error(error.message);
    } finally {
        await client.end();
    }
}

inspect();