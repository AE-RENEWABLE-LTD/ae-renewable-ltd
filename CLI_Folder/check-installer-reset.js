require("dotenv").config();

const { Client } = require("pg");

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

(async () => {
    try {
        await client.connect();

        const result = await client.query(`
            SELECT
                (SELECT COUNT(*) FROM users WHERE role = 'installer') AS installer_users,
                (
                    SELECT COUNT(*)
                    FROM installers i
                    JOIN users u ON u.id = i.user_id
                    WHERE u.role = 'installer'
                ) AS installer_profiles,
                (SELECT COUNT(*) FROM users WHERE role = 'admin') AS admins,
                (SELECT COUNT(*) FROM users WHERE role = 'client') AS clients
        `);

        console.table(result.rows);

    } catch (error) {
        console.error("DATABASE CHECK FAILED:");
        console.error(error.message);
        process.exitCode = 1;

    } finally {
        await client.end();
    }
})();
