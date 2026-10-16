"use strict";

const { query } = require("../../../backend/config/database");

async function syncProfiles() {
    try {
        const users = (await query("SELECT * FROM users ORDER BY id ASC")).rows;
        console.log("Found users:", users.length);
        
        for (const u of users) {
            const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || "AE Administrator";
            const clientCode = "AEC-" + String(u.id).padStart(4, "0");
            
            // Upsert client
            await query(`
                INSERT INTO clients (user_id, client_code, company_name, contact_name, email, phone, status)
                VALUES ($1, $2, $3, $4, $5, $6, 'active')
                ON CONFLICT (user_id) DO UPDATE SET
                    email = EXCLUDED.email,
                    contact_name = EXCLUDED.contact_name
            `, [u.id, clientCode, "AE Renewable Ltd", fullName, u.email, u.phone || "+2348133615132"]);
            console.log("Client profile synced for user:", u.id, u.email, clientCode);

            // Determine unique installer code
            let insCode = "AEI-" + String(u.id).padStart(4, "0");
            if (u.id === 28 || u.id === 1) {
                const check = await query("SELECT user_id FROM installers WHERE installer_code = 'AEI-0001'");
                if (check.rows.length === 0 || check.rows[0].user_id == u.id) {
                    insCode = "AEI-0001";
                }
            } else if (u.id === 29) {
                const check = await query("SELECT user_id FROM installers WHERE installer_code = 'AEI-0002'");
                if (check.rows.length === 0 || check.rows[0].user_id == u.id) {
                    insCode = "AEI-0002";
                }
            }

            await query(`
                INSERT INTO installers (user_id, installer_code, company_name, contact_name, email, phone, state, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
                ON CONFLICT (user_id) DO UPDATE SET
                    email = EXCLUDED.email,
                    contact_name = EXCLUDED.contact_name
            `, [u.id, insCode, "AE Renewable Solutions", fullName, u.email, u.phone || "+2348133615132", "FCT Abuja"]);
            console.log("Installer profile synced for user:", u.id, u.email, insCode);
        }

        const clientsCount = await query("SELECT count(*) FROM clients");
        const installersCount = await query("SELECT count(*) FROM installers");
        console.log("Total clients in database:", clientsCount.rows[0].count);
        console.log("Total installers in database:", installersCount.rows[0].count);
        process.exit(0);
    } catch (e) {
        console.error("Sync error:", e);
        process.exit(1);
    }
}

syncProfiles();
