"use strict";

const { query } = require("./config/database");

async function inspect() {
    try {
        const result = await query(`
            SELECT
                i.id,
                i.user_id,
                i.installer_code,
                i.company_name,
                i.contact_name,
                i.email,
                i.phone,
                i.state,
                i.local_government,
                i.verification_status,
                i.status
            FROM installers i
            ORDER BY i.id;
        `);

        console.table(result.rows);
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

inspect();
