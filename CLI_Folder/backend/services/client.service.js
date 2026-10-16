"use strict";

const { query, transaction } = require("../config/database");

/* =========================================================
   AE RENEWABLE NETWORK
   CLIENT SERVICE
========================================================= */

/* =========================================================
   ENSURE / AUTO-CREATE CLIENT FOR AUTHENTICATED USER
========================================================= */

async function ensureClientForUser(userId) {
    if (!userId) return null;
    const userRes = await query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [userId]);
    const user = userRes.rows[0];
    if (!user) return null;

    const existingRes = await query(`SELECT * FROM clients WHERE user_id = $1 LIMIT 1`, [userId]);
    if (existingRes.rows[0]) return existingRes.rows[0];

    if (user.email) {
        const emailRes = await query(`SELECT * FROM clients WHERE LOWER(TRIM(email)) = LOWER(TRIM($1)) LIMIT 1`, [user.email]);
        if (emailRes.rows[0]) {
            await query(`UPDATE clients SET user_id = $1 WHERE id = $2`, [userId, emailRes.rows[0].id]);
            return getClientById(emailRes.rows[0].id);
        }
    }

    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || "Valued Client";
    const clientCode = `AEC-${String(userId).padStart(4, "0")}`;
    try {
        const insRes = await query(
            `
            INSERT INTO clients (
                user_id,
                client_code,
                company_name,
                contact_name,
                email,
                phone,
                status
            )
            VALUES ($1, $2, $3, $4, $5, $6, 'active')
            ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email
            RETURNING *
            `,
            [
                userId,
                clientCode,
                fullName,
                fullName,
                user.email || `client_${userId}@aerenewable.com`,
                user.phone || "+2348133615132"
            ]
        );
        return insRes.rows[0] || null;
    } catch (e) {
        console.warn("[ensureClientForUser] Error:", e.message);
        return null;
    }
}

async function getClientByUserId(userId) {
    if (!userId) return null;

    const result = await query(
        `
        SELECT
            id,
            user_id,
            client_code,
            company_name,
            contact_name,
            email,
            phone,
            address,
            city,
            state,
            country,
            client_type,
            industry,
            registration_number,
            status,
            profile_image,
            notes,
            created_at,
            updated_at
        FROM clients
        WHERE user_id = $1 
           OR LOWER(TRIM(email)) = (SELECT LOWER(TRIM(email)) FROM users WHERE id = $1)
        ORDER BY id DESC
        LIMIT 1
        `,
        [userId]
    );

    if (result.rows[0]) {
        return result.rows[0];
    }

    return ensureClientForUser(userId);
}

/* =========================================================
   GET CLIENT BY ID
========================================================= */

async function getClientById(clientId) {
    const result = await query(
        `
        SELECT
            id,
            user_id,
            client_code,
            company_name,
            contact_name,
            email,
            phone,
            address,
            city,
            state,
            country,
            client_type,
            industry,
            registration_number,
            status,
            profile_image,
            notes,
            created_at,
            updated_at
        FROM clients
        WHERE id = $1
        LIMIT 1
        `,
        [clientId]
    );

    return result.rows[0] || null;
}

/* =========================================================
   GET CLIENT BY CLIENT CODE
========================================================= */

async function getClientByCode(clientCode) {
    const result = await query(
        `
        SELECT
            id,
            user_id,
            client_code,
            company_name,
            contact_name,
            email,
            phone,
            address,
            city,
            state,
            country,
            client_type,
            industry,
            registration_number,
            status,
            profile_image,
            notes,
            created_at,
            updated_at
        FROM clients
        WHERE client_code = $1
        LIMIT 1
        `,
        [clientCode]
    );

    return result.rows[0] || null;
}

/* =========================================================
   LIST CLIENTS
========================================================= */

async function getAllClients() {
    const result = await query(
        `
        SELECT
            c.id,
            c.user_id,
            c.client_code,
            c.company_name,
            c.contact_name,
            c.email,
            c.phone,
            c.address,
            c.city,
            c.state,
            c.country,
            c.client_type,
            c.industry,
            c.registration_number,
            c.status,
            c.profile_image,
            c.notes,
            c.created_at,
            c.updated_at,
            COALESCE(SUM(p.contract_value), 0) AS total_contract_value,
            COALESCE(SUM(p.amount_paid), 0) AS total_amount_paid,
            COUNT(p.id) AS project_count,
            MAX(p.id) AS latest_project_id,
            MAX(p.project_code) AS latest_project_code,
            MAX(p.project_type) AS latest_system_type
        FROM clients c
        LEFT JOIN projects p ON p.client_id = c.id
        GROUP BY c.id
        ORDER BY c.created_at DESC
        `
    );

    return result.rows;
}

/* =========================================================
   CREATE CLIENT
========================================================= */

async function createClient(data) {
    const {
        userId,
        clientCode,
        companyName,
        contactName,
        email,
        phone,
        address,
        city,
        state,
        country,
        clientType,
        industry,
        registrationNumber,
        status,
        profileImage,
        notes
    } = data;

    const result = await query(
        `
        INSERT INTO clients (
            user_id,
            client_code,
            company_name,
            contact_name,
            email,
            phone,
            address,
            city,
            state,
            country,
            client_type,
            industry,
            registration_number,
            status,
            profile_image,
            notes
        )
        VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11, $12,
            $13, $14, $15, $16
        )
        RETURNING
            id,
            user_id,
            client_code,
            company_name,
            contact_name,
            email,
            phone,
            address,
            city,
            state,
            country,
            client_type,
            industry,
            registration_number,
            status,
            profile_image,
            notes,
            created_at,
            updated_at
        `,
        [
            userId,
            clientCode,
            companyName,
            contactName,
            email,
            phone,
            address,
            city,
            state,
            country,
            clientType,
            industry,
            registrationNumber,
            status,
            profileImage,
            notes
        ]
    );

    return result.rows[0];
}

/* =========================================================
   UPDATE CLIENT
========================================================= */

async function updateClient(clientId, data) {
    const {
        companyName,
        contactName,
        email,
        phone,
        address,
        city,
        state,
        country,
        clientType,
        industry,
        registrationNumber,
        status,
        profileImage,
        notes
    } = data;

    const result = await query(
        `
        UPDATE clients
        SET
            company_name = $1,
            contact_name = $2,
            email = $3,
            phone = $4,
            address = $5,
            city = $6,
            state = $7,
            country = $8,
            client_type = $9,
            industry = $10,
            registration_number = $11,
            status = $12,
            profile_image = $13,
            notes = $14,
            updated_at = NOW()
        WHERE id = $15
        RETURNING
            id,
            user_id,
            client_code,
            company_name,
            contact_name,
            email,
            phone,
            address,
            city,
            state,
            country,
            client_type,
            industry,
            registration_number,
            status,
            profile_image,
            notes,
            created_at,
            updated_at
        `,
        [
            companyName,
            contactName,
            email,
            phone,
            address,
            city,
            state,
            country,
            clientType,
            industry,
            registrationNumber,
            status,
            profileImage,
            notes,
            clientId
        ]
    );

    return result.rows[0] || null;
}

/* =========================================================
   UPDATE CLIENT BY USER ID
========================================================= */

async function updateClientByUserId(userId, data) {
    const {
        companyName,
        contactName,
        email,
        phone,
        address,
        city,
        state,
        country,
        clientType,
        industry,
        registrationNumber,
        status,
        profileImage,
        notes
    } = data;

    const result = await query(
        `
        UPDATE clients
        SET
            company_name = $1,
            contact_name = $2,
            email = $3,
            phone = $4,
            address = $5,
            city = $6,
            state = $7,
            country = $8,
            client_type = $9,
            industry = $10,
            registration_number = $11,
            status = $12,
            profile_image = $13,
            notes = $14,
            updated_at = NOW()
        WHERE user_id = $15
        RETURNING
            id,
            user_id,
            client_code,
            company_name,
            contact_name,
            email,
            phone,
            address,
            city,
            state,
            country,
            client_type,
            industry,
            registration_number,
            status,
            profile_image,
            notes,
            created_at,
            updated_at
        `,
        [
            companyName,
            contactName,
            email,
            phone,
            address,
            city,
            state,
            country,
            clientType,
            industry,
            registrationNumber,
            status,
            profileImage,
            notes,
            userId
        ]
    );

    return result.rows[0] || null;
}

/* =========================================================
   DELETE CLIENT
========================================================= */

async function deleteClient(clientId) {
    return await transaction(async (client) => {
        const clientRes = await client.query(
            "SELECT id, user_id FROM clients WHERE id = $1",
            [clientId]
        );
        if (!clientRes.rows.length) return null;
        const userId = clientRes.rows[0].user_id;

        // Clean dependent projects & evidence
        const projRes = await client.query(
            "SELECT id FROM projects WHERE client_id = $1",
            [clientId]
        );
        for (const p of projRes.rows) {
            await client.query("DELETE FROM project_evidence WHERE project_id = $1", [p.id]);
            await client.query("DELETE FROM weekly_maintenance_checkups WHERE project_id = $1", [p.id]);
            await client.query("UPDATE payments SET project_id = NULL WHERE project_id = $1", [p.id]);
            await client.query("UPDATE quotations SET project_id = NULL WHERE project_id = $1", [p.id]);
            await client.query("UPDATE documents SET project_id = NULL WHERE project_id = $1", [p.id]);
            await client.query("UPDATE activities SET project_id = NULL WHERE project_id = $1", [p.id]);
            await client.query("UPDATE notifications SET project_id = NULL WHERE project_id = $1", [p.id]);
            await client.query("UPDATE support_tickets SET project_id = NULL WHERE project_id = $1", [p.id]);
        }
        await client.query("DELETE FROM projects WHERE client_id = $1", [clientId]);

        // Clean dependent quotations & quotation items
        const quoRes = await client.query(
            "SELECT id FROM quotations WHERE client_id = $1",
            [clientId]
        );
        for (const q of quoRes.rows) {
            await client.query("DELETE FROM quotation_items WHERE quotation_id = $1", [q.id]);
            await client.query("UPDATE payments SET quotation_id = NULL WHERE quotation_id = $1", [q.id]);
            await client.query("UPDATE activities SET quotation_id = NULL WHERE quotation_id = $1", [q.id]);
            await client.query("UPDATE notifications SET quotation_id = NULL WHERE quotation_id = $1", [q.id]);
        }
        await client.query("DELETE FROM quotations WHERE client_id = $1", [clientId]);

        // Clean dependent payments, documents, activities, tickets, weekly maintenance
        await client.query("DELETE FROM weekly_maintenance_checkups WHERE client_id = $1", [clientId]);
        await client.query("DELETE FROM payments WHERE client_id = $1", [clientId]);
        await client.query("DELETE FROM documents WHERE client_id = $1", [clientId]);
        await client.query("DELETE FROM activities WHERE client_id = $1", [clientId]);
        await client.query("DELETE FROM support_tickets WHERE client_id = $1", [clientId]);
        await client.query("DELETE FROM notifications WHERE client_id = $1", [clientId]);

        // Delete client record
        const delClient = await client.query(
            "DELETE FROM clients WHERE id = $1 RETURNING id",
            [clientId]
        );

        // Delete user account if linked (safeguarding admin/staff accounts)
        if (userId) {
            await client.query(
                "DELETE FROM users WHERE id = $1 AND role NOT IN ('admin', 'super_admin', 'staff')",
                [userId]
            );
        }

        return delClient.rows[0] || null;
    });
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    getClientByUserId,
    ensureClientForUser,
    getClientById,
    getClientByCode,
    getAllClients,
    createClient,
    updateClient,
    updateClientByUserId,
    deleteClient
};