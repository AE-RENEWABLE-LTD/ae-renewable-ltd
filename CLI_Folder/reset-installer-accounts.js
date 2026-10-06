require("dotenv").config();

const { Client } = require("pg");

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

async function resetInstallerAccounts() {
    try {
        await client.connect();

        console.log("\n========================================");
        console.log("AE RENEWABLE NETWORK");
        console.log("INSTALLER REGISTRATION RESET");
        console.log("========================================\n");

        await client.query("BEGIN");

        // ---------------------------------------------------------
        // Identify ONLY users whose role is installer
        // Admin users are NOT included.
        // ---------------------------------------------------------

        const installers = await client.query(`
            SELECT
                i.id AS installer_id,
                i.user_id,
                u.email
            FROM installers i
            INNER JOIN users u
                ON u.id = i.user_id
            WHERE u.role = 'installer'
            ORDER BY i.id;
        `);

        console.log(
            `Installer accounts found: ${installers.rows.length}`
        );

        if (installers.rows.length === 0) {
            console.log("\nNo installer accounts to delete.");
            await client.query("ROLLBACK");
            return;
        }

        const userIds = installers.rows.map(row => row.user_id);
        const installerIds = installers.rows.map(row => row.installer_id);

        console.log("\nInstaller user IDs:");
        console.log(userIds.join(", "));

        console.log("\nInstaller IDs:");
        console.log(installerIds.join(", "));

        // ---------------------------------------------------------
        // SAFETY CHECK
        // Do not proceed if installer projects exist.
        // ---------------------------------------------------------

        const projectCheck = await client.query(`
            SELECT COUNT(*)::int AS count
            FROM projects
            WHERE installer_id = ANY($1::bigint[]);
        `, [installerIds]);

        const projectCount = projectCheck.rows[0].count;

        if (projectCount > 0) {
            throw new Error(
                `ABORTED: ${projectCount} project record(s) still reference installer accounts.`
            );
        }

        console.log("\nProject records referencing installers: 0");

        // ---------------------------------------------------------
        // Delete temporary/authentication records
        // ---------------------------------------------------------

        const emailCodes = await client.query(`
            DELETE FROM email_verification_codes
            WHERE user_id = ANY($1::bigint[])
            RETURNING user_id;
        `, [userIds]);

        console.log(
            `Email verification codes deleted: ${emailCodes.rowCount}`
        );

        const passwordCodes = await client.query(`
            DELETE FROM password_reset_codes
            WHERE user_id = ANY($1::bigint[])
            RETURNING user_id;
        `, [userIds]);

        console.log(
            `Password reset codes deleted: ${passwordCodes.rowCount}`
        );

        // ---------------------------------------------------------
        // Defensive cleanup
        // These should currently be zero based on our inspection.
        // ---------------------------------------------------------

        const notifications = await client.query(`
            DELETE FROM notifications
            WHERE user_id = ANY($1::bigint[])
            RETURNING user_id;
        `, [userIds]);

        console.log(
            `Notifications deleted: ${notifications.rowCount}`
        );

        const supportTickets = await client.query(`
            DELETE FROM support_tickets
            WHERE user_id = ANY($1::bigint[])
            RETURNING id;
        `, [userIds]);

        console.log(
            `Support tickets deleted: ${supportTickets.rowCount}`
        );

        // ---------------------------------------------------------
        // Delete installer profiles
        // ---------------------------------------------------------

        const installerDelete = await client.query(`
            DELETE FROM installers
            WHERE id = ANY($1::bigint[])
            RETURNING id, user_id;
        `, [installerIds]);

        console.log(
            `Installer profiles deleted: ${installerDelete.rowCount}`
        );

        // ---------------------------------------------------------
        // Delete corresponding installer users ONLY
        // Admin user is untouched because role = installer.
        // ---------------------------------------------------------

        const userDelete = await client.query(`
            DELETE FROM users
            WHERE id = ANY($1::bigint[])
              AND role = 'installer'
            RETURNING id, email;
        `, [userIds]);

        console.log(
            `Installer user accounts deleted: ${userDelete.rowCount}`
        );

        // ---------------------------------------------------------
        // Final safety verification
        // ---------------------------------------------------------

        const remaining = await client.query(`
            SELECT COUNT(*)::int AS count
            FROM installers i
            INNER JOIN users u
                ON u.id = i.user_id
            WHERE u.role = 'installer';
        `);

        const remainingInstallers = remaining.rows[0].count;

        if (remainingInstallers !== 0) {
            throw new Error(
                `RESET FAILED: ${remainingInstallers} installer account(s) remain.`
            );
        }

        // ---------------------------------------------------------
        // Commit everything
        // ---------------------------------------------------------

        await client.query("COMMIT");

        console.log("\n========================================");
        console.log("RESET COMPLETED SUCCESSFULLY");
        console.log("========================================");
        console.log("\nInstaller accounts remaining: 0");
        console.log("Admin account: PRESERVED");
        console.log("Database schema: PRESERVED");
        console.log("Database: PRESERVED");
        console.log("\nInstallers can now register again from scratch.\n");

    } catch (error) {

        try {
            await client.query("ROLLBACK");
        } catch (_) {
            // Ignore rollback errors
        }

        console.error("\n========================================");
        console.error("RESET ABORTED");
        console.error("========================================");
        console.error(error.message);
        console.error("\nNO CHANGES WERE COMMITTED.\n");

        process.exitCode = 1;

    } finally {
        await client.end();
    }
}

resetInstallerAccounts();