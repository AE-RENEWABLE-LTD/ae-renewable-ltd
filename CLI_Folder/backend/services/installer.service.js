"use strict";

const { query } = require("../config/database");

/* =========================================================
   AE RENEWABLE NETWORK
   INSTALLER SERVICE
========================================================= */

/* =========================================================
   SHARED INSTALLER SELECT
========================================================= */

const INSTALLER_SELECT = `
    SELECT
        i.*,
        u.email AS user_email,
        u.phone AS user_phone,
        u.status AS user_status
    FROM installers i
    INNER JOIN users u
        ON u.id = i.user_id
`;


/* =========================================================
   GET ALL INSTALLERS
========================================================= */

async function getAllInstallers() {
    const result = await query(`
        ${INSTALLER_SELECT}
        ORDER BY i.created_at DESC
    `);

    return result.rows;
}


/* =========================================================
   GET INSTALLER BY ID
========================================================= */

async function getInstallerById(id) {
    const isNumeric = /^\d+$/.test(String(id));
    const result = await query(
        `
        ${INSTALLER_SELECT}
        WHERE ${isNumeric ? 'i.id = $1' : 'i.installer_code = $1'}
        LIMIT 1
        `,
        [id]
    );

    return result.rows[0] || null;
}


/* =========================================================
   GET INSTALLER BY USER ID
========================================================= */

async function getInstallerByUserId(userId) {
    const result = await query(
        `
        ${INSTALLER_SELECT}
        WHERE i.user_id = $1
        LIMIT 1
        `,
        [userId]
    );

    return result.rows[0] || null;
}


/* =========================================================
   GET INSTALLER BY CODE
========================================================= */

async function getInstallerByCode(installerCode) {
    const result = await query(
        `
        ${INSTALLER_SELECT}
        WHERE i.installer_code = $1
        LIMIT 1
        `,
        [installerCode]
    );

    return result.rows[0] || null;
}


/* =========================================================
   CREATE INSTALLER
========================================================= */

async function createInstaller({
    userId,
    installerCode,
    companyName,
    contactName,
    email,
    phone,
    rcNumber,
    cacCertificateUrl,
    professionalCertificateUrl,
    address,
    city,
    state,
    localGovernment,
    country,
    bankName,
    accountName,
    accountNumber,
    specializations,
    verificationStatus,
    status,
    groupPosition,
    registrationDate,
    approvalDate,
    profileImage,
    notes
}) {
    const result = await query(
        `
        INSERT INTO installers (
            user_id,
            installer_code,
            company_name,
            contact_name,
            email,
            phone,
            rc_number,
            cac_certificate_url,
            professional_certificate_url,
            address,
            city,
            state,
            local_government,
            country,
            bank_name,
            account_name,
            account_number,
            account_bvn,
            specializations,
            verification_status,
            status,
            group_position,
            registration_date,
            approval_date,
            profile_image,
            notes
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13,
            $14,
            $15,
            $16,
            $17,
            $18,
            $19,
            $20,
            $21,
            COALESCE($22, CURRENT_DATE),
            $23,
            $24,
            $25
        )
        RETURNING *
        `,
        [
            userId,
            installerCode,
            companyName,
            contactName,
            email,
            phone,
            rcNumber,
            cacCertificateUrl,
            professionalCertificateUrl,
            address,
            city,
            state,
            localGovernment,
            country || "Nigeria",
            bankName,
            accountName,
            accountNumber,
            accountBvn,
            specializations || [],
            verificationStatus || "pending",
            status || "pending",
            groupPosition,
            registrationDate,
            approvalDate,
            profileImage,
            notes
        ]
    );

    return result.rows[0] || null;
}


/* =========================================================
   UPDATE INSTALLER
========================================================= */

async function updateInstaller(id, fields) {
    const fieldMap = {
        installerCode: "installer_code",
        companyName: "company_name",
        contactName: "contact_name",
        email: "email",
        phone: "phone",
        rcNumber: "rc_number",
        cacCertificateUrl: "cac_certificate_url",
        professionalCertificateUrl: "professional_certificate_url",
        address: "address",
        city: "city",
        state: "state",
        localGovernment: "local_government",
        country: "country",
        bankName: "bank_name",
        accountName: "account_name",
        accountNumber: "account_number",
        accountBvn: "account_bvn",
        bankingVerificationStatus: "banking_verification_status",
        bankingChangeNote: "banking_change_note",
        specializations: "specializations",
        verificationStatus: "verification_status",
        status: "status",
        groupPosition: "group_position",
        registrationDate: "registration_date",
        approvalDate: "approval_date",
        profileImage: "profile_image",
        notes: "notes"
    };

    const updates = [];
    const values = [];

    for (const [inputField, databaseField] of Object.entries(fieldMap)) {
        if (
            Object.prototype.hasOwnProperty.call(
                fields,
                inputField
            )
        ) {
            values.push(fields[inputField]);

            updates.push(
                `${databaseField} = $${values.length}`
            );
        }
    }

    const snakeCaseFields = [
        "installer_code",
        "company_name",
        "contact_name",
        "email",
        "phone",
        "rc_number",
        "cac_certificate_url",
        "professional_certificate_url",
        "address",
        "city",
        "state",
        "local_government",
        "country",
        "bank_name",
        "account_name",
        "account_number",
        "account_bvn",
        "banking_verification_status",
        "banking_change_note",
        "specializations",
        "verification_status",
        "status",
        "group_position",
        "registration_date",
        "approval_date",
        "profile_image",
        "notes"
    ];

    for (const field of snakeCaseFields) {
        if (
            Object.prototype.hasOwnProperty.call(
                fields,
                field
            ) &&
            !updates.some(
                update => update.startsWith(`${field} =`)
            )
        ) {
            values.push(fields[field]);

            updates.push(
                `${field} = $${values.length}`
            );
        }
    }

    if (updates.length === 0) {
        return getInstallerById(id);
    }

    values.push(id);

    const isNumeric = /^\d+$/.test(String(id));
    const result = await query(
        `
        UPDATE installers
        SET
            ${updates.join(", ")},
            updated_at = CURRENT_TIMESTAMP
        WHERE ${isNumeric ? 'id' : 'installer_code'} = $${values.length}
        RETURNING *
        `,
        values
    );

    return result.rows[0] || null;
}


/* =========================================================
   UPDATE CURRENT INSTALLER BY USER ID
========================================================= */

async function updateInstallerByUserId(userId, fields) {
    const installer = await getInstallerByUserId(userId);

    if (!installer) {
        return null;
    }

    return updateInstaller(
        installer.id,
        fields
    );
}


/* =========================================================
   DELETE INSTALLER
========================================================= */

async function deleteInstaller(id) {
    const result = await query(
        `
        DELETE FROM installers
        WHERE id = $1
        RETURNING id
        `,
        [id]
    );

    return result.rows[0] || null;
}


/* =========================================================
   SEARCH INSTALLERS
========================================================= */

async function searchInstallers(search) {
    const normalizedSearch =
        String(search || "").trim();

    if (!normalizedSearch) {
        return [];
    }

    const searchTerm =
        `%${normalizedSearch}%`;

    const result = await query(
        `
        ${INSTALLER_SELECT}
        WHERE
            i.installer_code ILIKE $1
            OR i.company_name ILIKE $1
            OR i.rc_number ILIKE $1
            OR i.contact_name ILIKE $1
            OR i.email ILIKE $1
            OR i.phone ILIKE $1
            OR i.state ILIKE $1
            OR i.local_government ILIKE $1
            OR i.address ILIKE $1
            OR u.email ILIKE $1
            OR u.phone ILIKE $1
        ORDER BY i.created_at DESC
        `,
        [searchTerm]
    );

    return result.rows;
}


/* =========================================================
   INSTALLER PORTAL
   GET INSTALLER JOBS
========================================================= */

/* =========================================================
   INSTALLER PORTAL
   GET INSTALLER JOBS
========================================================= */

async function getInstallerJobs(userId) {

    const installer =
        await getInstallerByUserId(userId);


    if (!installer) {
        return [];
    }


    const result = await query(
        `
        SELECT
            p.id,
            p.project_code,
            p.project_name,
            p.description,
            p.client_id,
            p.installer_id,

            p.site_address,
            p.city,
            p.state,
            p.local_government,
            p.country,

            p.project_type,
            p.status,
            p.priority,

            p.consultation_date,
            p.scheduled_start_date,
            p.actual_start_date,
            p.expected_completion_date,
            p.actual_completion_date,

            p.system_capacity_kw,
            p.battery_capacity_kwh,
            p.panel_count,
            p.inverter_capacity_kva,

            p.estimated_value,
            p.contract_value,
            p.installer_payout,
            COALESCE(
                p.installer_payout,
                (SELECT pay.amount FROM payments pay WHERE pay.project_id = p.id AND pay.installer_id IS NOT NULL ORDER BY pay.id DESC LIMIT 1),
                ROUND(GREATEST(100000, COALESCE(p.system_capacity_kw, 5) * 25000))
            ) AS installation_price,
            p.amount_paid,
            p.balance_due,

            p.notes,
            p.created_at,
            p.updated_at,

            COALESCE(c.company_name, c.contact_name, NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), 'Valued Client') AS client_name,
            c.client_code,
            c.phone AS client_phone

        FROM projects p
        LEFT JOIN clients c ON c.id = p.client_id
        LEFT JOIN users u ON u.id = c.user_id

        WHERE
            p.installer_id = $1

            OR (

                p.installer_id IS NULL

                AND p.status IN (
                    'approved',
                    'scheduled'
                )

            )

        ORDER BY
            CASE
                WHEN p.installer_id IS NULL THEN 1
                ELSE 2
            END,

            CASE p.priority
                WHEN 'urgent' THEN 1
                WHEN 'high' THEN 2
                WHEN 'normal' THEN 3
                WHEN 'low' THEN 4
                ELSE 5
            END,

            p.created_at DESC
        `,
        [
            installer.id
        ]
    );


    return result.rows;
}


/* =========================================================
   ACCEPT INSTALLER JOB
========================================================= */

async function acceptInstallerJob(
    userId,
    jobId
) {

    const installer =
        await getInstallerByUserId(userId);


    if (!installer) {
        return null;
    }


    const result = await query(
        `
        UPDATE projects

        SET
            installer_id = $1,

            status = 'installation',

            updated_at = CURRENT_TIMESTAMP

        WHERE
            id = $2

            AND installer_id IS NULL

            AND status IN (
                'approved',
                'scheduled'
            )

        RETURNING
            id,
            project_code,
            project_name,
            description,
            client_id,
            installer_id,
            site_address,
            city,
            state,
            local_government,
            country,
            project_type,
            status,
            priority,
            consultation_date,
            scheduled_start_date,
            actual_start_date,
            expected_completion_date,
            actual_completion_date,
            system_capacity_kw,
            battery_capacity_kwh,
            panel_count,
            inverter_capacity_kva,
            estimated_value,
            contract_value,
            amount_paid,
            balance_due,
            notes,
            created_at,
            updated_at
        `,
        [
            installer.id,
            jobId
        ]
    );

    return result.rows[0] || null;
}


/* =========================================================
   INSTALLER PORTAL
   GET INSTALLER DOCUMENTS
========================================================= */
async function getInstallerDocuments(userId) {

    const installer =
        await getInstallerByUserId(userId);

    if (!installer) {
        return [];
    }

    const result = await query(
        `
        SELECT
            d.id,
            d.document_code,
            d.document_name,
            d.document_type,
            d.description,

            d.client_id,
            d.project_id,
            d.uploaded_by,

            d.file_name,
            d.original_file_name,
            d.file_url,
            d.file_path,
            d.mime_type,
            d.file_size,

            d.status,
            d.visibility,

            d.version,
            d.verified,
            d.verified_by,
            d.verified_at,

            d.created_at,
            d.updated_at,

            p.project_code,
            p.project_name

        FROM documents d

        INNER JOIN projects p
            ON p.id = d.project_id

        WHERE
            p.installer_id = $1
            AND d.status <> 'deleted'
            AND d.visibility IN (
                'installer',
                'public'
            )

        ORDER BY d.created_at DESC
        `,
        [installer.id]
    );

    return result.rows;
}


/* =========================================================
   INSTALLER PORTAL
   GET COMMISSIONING
========================================================= */

async function getInstallerCommissioning(userId) {
    const installer =
        await getInstallerByUserId(userId);

    if (!installer) {
        return [];
    }

    const result = await query(
        `
        SELECT
            p.id,
            p.project_code,
            p.project_name,
            p.description,

            p.site_address,
            p.city,
            p.state,
            p.local_government,
            p.country,

            p.project_type,
            p.status,
            p.priority,

            p.scheduled_start_date,
            p.actual_start_date,
            p.expected_completion_date,
            p.actual_completion_date,

            p.system_capacity_kw,
            p.battery_capacity_kwh,
            p.panel_count,
            p.inverter_capacity_kva,

            p.notes,
            p.created_at,
            p.updated_at,

            CASE
                WHEN p.status = 'testing'
                    THEN 'ready'
                WHEN p.status = 'commissioned'
                    THEN 'commissioned'
                WHEN p.status = 'completed'
                    THEN 'completed'
                ELSE p.status
            END AS commissioning_status,

            COALESCE((
                SELECT json_agg(json_build_object(
                    'id', pe.id,
                    'stage', pe.stage,
                    'file_url', pe.file_url,
                    'review_status', pe.review_status,
                    'created_at', pe.created_at
                ))
                FROM project_evidence pe
                WHERE pe.project_id = p.id
            ), '[]'::json) AS evidence_stages

        FROM projects p

        WHERE
            p.installer_id = $1
            AND p.status IN (
                'installation',
                'testing',
                'commissioned',
                'completed'
            )

        ORDER BY
            CASE p.status
                WHEN 'testing' THEN 1
                WHEN 'installation' THEN 2
                WHEN 'commissioned' THEN 3
                WHEN 'completed' THEN 4
                ELSE 5
            END,
            p.updated_at DESC
        `,
        [installer.id]
    );

    return result.rows;
}

/* =========================================================
   INSTALLER PORTAL
   SAVE / SIGN OFF COMMISSIONING
========================================================= */

async function saveCommissioning(userId, data) {
    const installer = await getInstallerByUserId(userId);
    if (!installer) {
        throw new Error("Installer profile not found.");
    }

    const projectId = data.projectId || data.id;
    if (!projectId) {
        throw new Error("Project ID is required.");
    }

    // Verify project belongs to installer
    const projRes = await query(
        `SELECT * FROM projects WHERE id = $1 AND installer_id = $2`,
        [projectId, installer.id]
    );

    if (projRes.rows.length === 0) {
        throw new Error("Project not found or not assigned to this installer.");
    }

    const project = projRes.rows[0];

    // Fetch verified evidence stages
    const evidenceRes = await query(
        `SELECT DISTINCT stage FROM project_evidence WHERE project_id = $1`,
        [projectId]
    );
    const confirmedStages = evidenceRes.rows.map(r => r.stage);

    // Update project status to commissioned
    const updatedRes = await query(
        `UPDATE projects
         SET status = 'commissioned',
             actual_completion_date = COALESCE(actual_completion_date, CURRENT_TIMESTAMP),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [projectId]
    );

    const updatedProject = updatedRes.rows[0];

    return {
        project: updatedProject,
        confirmedStages,
        isCommissioned: true
    };
}


/* =========================================================
   INSTALLER PORTAL
   GET PROJECT PAYMENTS
========================================================= */

async function getInstallerPayments(userId) {
    const installer =
        await getInstallerByUserId(userId);

    if (!installer) {
        return [];
    }

    const result = await query(
        `
        SELECT
            pay.id,
            pay.payment_reference,

            pay.client_id,
            pay.project_id,
            pay.quotation_id,

            pay.amount,
            pay.currency,
            pay.payment_method,
            pay.payment_status,

            pay.transaction_reference,
            pay.transaction_date,

            pay.description,
            pay.notes,

            pay.verified,
            pay.verified_by,
            pay.verified_at,

            pay.receipt_url,

            pay.created_at,
            pay.updated_at,

            p.project_code,
            p.project_name

        FROM payments pay

        INNER JOIN projects p
            ON p.id = pay.project_id

        WHERE
            p.installer_id = $1

        ORDER BY
            COALESCE(
                pay.transaction_date,
                pay.created_at
            ) DESC
        `,
        [installer.id]
    );

    return result.rows;
}


/* =========================================================
   INSTALLER PORTAL
   GET INSTALLER NOTIFICATIONS
========================================================= */

async function getInstallerNotifications(userId) {
    const result = await query(
        `
        SELECT
            n.id,
            n.user_id,
            n.type,
            n.title,
            n.message,

            n.client_id,
            n.project_id,
            n.quotation_id,
            n.payment_id,

            n.action_url,
            n.action_label,

            n.is_read,
            n.read_at,

            n.priority,

            n.created_at,
            n.updated_at,

            p.project_code,
            p.project_name

        FROM notifications n

        LEFT JOIN projects p
            ON p.id = n.project_id

        WHERE n.user_id = $1

        ORDER BY n.created_at DESC

        LIMIT 100
        `,
        [userId]
    );

    return result.rows;
}


/* =========================================================
   INSTALLER PORTAL
   GET INSTALLER ACTIVITY
========================================================= */

async function getInstallerActivity(userId) {
    const installer =
        await getInstallerByUserId(userId);

    if (!installer) {
        return [];
    }

    const result = await query(
        `
        WITH activity AS (

            /* PROJECT ACTIVITY */
            SELECT
                'project' AS type,

                p.id::text || ':project' AS id,

                p.id AS project_id,
                p.project_code,
                p.project_name,

                CASE
                    WHEN p.status = 'completed'
                        THEN 'Project completed'
                    WHEN p.status = 'commissioned'
                        THEN 'Project commissioned'
                    WHEN p.status = 'testing'
                        THEN 'Project entered testing'
                    WHEN p.status = 'installation'
                        THEN 'Installation started'
                    WHEN p.status = 'scheduled'
                        THEN 'Project scheduled'
                    WHEN p.status = 'approved'
                        THEN 'Project approved'
                    ELSE 'Project updated'
                END AS title,

                CONCAT(
                    'Project ',
                    p.project_code,
                    ' is currently ',
                    REPLACE(p.status, '_', ' ')
                ) AS message,

                p.updated_at AS created_at

            FROM projects p

            WHERE p.installer_id = $1


            UNION ALL


            /* DOCUMENT ACTIVITY */
            SELECT
                'document' AS type,

                d.id::text || ':document' AS id,

                d.project_id,

                p.project_code,
                p.project_name,

                'Document updated' AS title,

                d.document_name AS message,

                d.updated_at AS created_at

            FROM documents d

            INNER JOIN projects p
                ON p.id = d.project_id

            WHERE
                p.installer_id = $1
                AND d.status <> 'deleted'
                AND d.visibility IN (
                    'installer',
                    'public'
                )


            UNION ALL


            /* PAYMENT ACTIVITY */
            SELECT
                'payment' AS type,

                pay.id::text || ':payment' AS id,

                pay.project_id,

                p.project_code,
                p.project_name,

                'Payment activity' AS title,

                CONCAT(
                    pay.currency,
                    ' ',
                    pay.amount,
                    ' — ',
                    REPLACE(
                        pay.payment_status,
                        '_',
                        ' '
                    )
                ) AS message,

                COALESCE(
                    pay.transaction_date,
                    pay.updated_at,
                    pay.created_at
                ) AS created_at

            FROM payments pay

            INNER JOIN projects p
                ON p.id = pay.project_id

            WHERE p.installer_id = $1


            UNION ALL


            /* NOTIFICATION ACTIVITY */
            SELECT
                'notification' AS type,

                n.id::text || ':notification' AS id,

                n.project_id,

                p.project_code,
                p.project_name,

                n.title,

                n.message,

                n.created_at

            FROM notifications n

            LEFT JOIN projects p
                ON p.id = n.project_id

            WHERE n.user_id = $2
        )

        SELECT
            id,
            type,
            title,
            message,
            project_id,
            project_code,
            project_name,
            created_at

        FROM activity

        ORDER BY created_at DESC

        LIMIT 100
        `,
        [
            installer.id,
            userId
        ]
    );

    return result.rows;
}


/* =========================================================
   FIND BEFITTED INSTALLER FROM BACKEND STORE
========================================================= */

async function getBefittedInstaller({
    city = "Abuja",
    state = "Abuja",
    localGovernment = "Amac",
    projectType = "solar",
    capacityKw = 16
} = {}) {
    try {
        const result = await query(`
            ${INSTALLER_SELECT}
            WHERE i.verification_status = 'verified'
              AND i.status = 'active'
            ORDER BY i.id ASC
        `);

        const verifiedInstallers = result.rows;
        if (!verifiedInstallers || verifiedInstallers.length === 0) {
            const fallbackRes = await query(`${INSTALLER_SELECT} ORDER BY i.id ASC LIMIT 1`);
            return fallbackRes.rows[0] || null;
        }

        const norm = (s) => (s || "").trim().toLowerCase();
        const targetLga = norm(localGovernment);
        const targetCity = norm(city);
        const targetState = norm(state);

        const scored = verifiedInstallers.map((inst) => {
            let score = 0;
            const instLga = norm(inst.local_government);
            const instCity = norm(inst.city);
            const instState = norm(inst.state);

            // LGA Proximity Match (e.g. AMAC, Maitama, Guzape)
            if (targetLga && instLga && (instLga.includes(targetLga) || targetLga.includes(instLga))) {
                score += 50;
            }

            // City Proximity Match
            if (targetCity && (instCity.includes(targetCity) || instLga.includes(targetCity) || targetCity.includes("abuja"))) {
                score += 35;
            }

            // State Proximity Match
            if (targetState && (instState.includes(targetState) || targetState.includes("fct") || targetState.includes("abuja"))) {
                score += 25;
            }

            // Priority for AE Renewable Registered Engineers
            const contact = norm(inst.contact_name);
            const company = norm(inst.company_name);
            if (company.includes("ae renewable") || contact.includes("eniola")) {
                score += 40;
            }

            if (inst.profile_image && !inst.profile_image.includes("default")) {
                score += 20;
            }

            return { installer: inst, score };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored[0]?.installer || verifiedInstallers[0];
    } catch (err) {
        console.error("Error fetching befitted installer from backend store:", err.message);
        return null;
    }
}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    getAllInstallers,
    getInstallerById,
    getInstallerByUserId,
    getInstallerByCode,
    createInstaller,
    updateInstaller,
    updateInstallerByUserId,
    deleteInstaller,
    searchInstallers,
    getBefittedInstaller,

    getInstallerJobs,
    acceptInstallerJob,
    getInstallerDocuments,
    getInstallerCommissioning,
    saveCommissioning,
    getInstallerPayments,
    getInstallerNotifications,
    getInstallerActivity
};


