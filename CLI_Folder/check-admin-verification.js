require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    try {
        const result = await pool.query(
            "SELECT id, email, role, status, email_verified FROM users WHERE email = 'admin@aerenewablesolution.com'"
        );

        console.table(result.rows);
    } catch (error) {
        console.error(error.message);
    } finally {
        await pool.end();
    }
}

main();
