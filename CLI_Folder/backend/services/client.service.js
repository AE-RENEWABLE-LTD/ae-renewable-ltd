"use strict";

const { query } = require("../config/database");

/* =========================================================
   AE RENEWABLE NETWORK
   CLIENT SERVICE
========================================================= */

/* =========================================================
   GET CLIENT BY USER ID
========================================================= */

async function getClientByUserId(userId) {
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

    return result.rows[0] || null;
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
        ORDER BY created_at DESC
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
    const result = await query(
        `
        DELETE FROM clients
        WHERE id = $1
        RETURNING id
        `,
        [clientId]
    );

    return result.rows[0] || null;
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    getClientByUserId,
    getClientById,
    getClientByCode,
    getAllClients,
    createClient,
    updateClient,
    updateClientByUserId,
    deleteClient
};