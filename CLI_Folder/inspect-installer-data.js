require("dotenv").config();

const { Client } = require("pg");

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

async function inspectInstallerData() {
    try {
        await client.connect();

        console.log("\n========================================");
        console.log("INSTALLER DATA USAGE CHECK");
        console.log("========================================\n");

        const result = await client.query(`
            WITH installer_users AS (
                SELECT
                    i.id AS installer_id,
                    i.user_id,
                    u.email,
                    u.phone
                FROM installers i
                JOIN users u
                    ON u.id = i.user_id
                WHERE u.role = 'installer'
            )

            SELECT
                iu.installer_id,
                iu.user_id,
                iu.email,
                iu.phone,

                (
                    SELECT COUNT(*)
                    FROM projects p
                    WHERE p.installer_id = iu.installer_id
                ) AS projects,

                (
                    SELECT COUNT(*)
                    FROM email_verification_codes e
                    WHERE e.user_id = iu.user_id
                ) AS email_codes,

                (
                    SELECT COUNT(*)
                    FROM password_reset_codes pr
                    WHERE pr.user_id = iu.user_id
                ) AS password_reset_codes,

                (
                    SELECT COUNT(*)
                    FROM notifications n
                    WHERE n.user_id = iu.user_id
                ) AS notifications,

                (
                    SELECT COUNT(*)
                    FROM support_tickets st
                    WHERE st.user_id = iu.user_id
                ) AS support_tickets

            FROM installer_users iu
            ORDER BY iu.installer_id;
        `);

        console.table(result.rows);

        console.log(
            `\nInstaller accounts checked: ${result.rows.length}`
        );

    } catch (error) {
        console.error("\nDATABASE ERROR:");
        console.error(error.message);
    } finally {
        await client.end();
    }
}

inspectInstallerData();