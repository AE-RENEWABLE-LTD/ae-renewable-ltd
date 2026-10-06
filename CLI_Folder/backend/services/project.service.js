"use strict";

const { query } = require("../config/database");
const bcrypt = require("bcryptjs");
const activityService = require("./activity.service");
const notificationService = require("./notification.service");
const installerService = require("./installer.service");

/* =========================================================
   AE RENEWABLE NETWORK — CENTRAL PROJECT ENGINE
   ONE PROJECT RECORD: Source of truth for Admin, Installer, Client, ARDE
========================================================= */

/* =========================================================
   GET PROJECTS (with filters)
========================================================= */
async function getProjects(filters = {}) {
    const conditions = [];
    const params = [];

    if (filters.clientId) {
        params.push(filters.clientId);
        conditions.push(`p.client_id = $${params.length}`);
    }

    if (filters.installerId) {
        params.push(filters.installerId);
        conditions.push(`p.installer_id = $${params.length}`);
    }

    if (filters.status) {
        params.push(filters.status);
        conditions.push(`p.status = $${params.length}`);
    }

    if (filters.projectType) {
        params.push(filters.projectType);
        conditions.push(`p.project_type = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await query(
        `
        SELECT
            p.id,
            p.project_code,
            p.project_name,
            p.description,
            p.client_id,
            COALESCE(c.company_name, c.contact_name) AS client_name,
            c.email AS client_email,
            c.phone AS client_phone,
            p.installer_id,
            COALESCE(i.company_name, i.contact_name) AS installer_name,
            i.contact_name AS installer_contact_name,
            i.company_name AS installer_company_name,
            i.phone AS installer_phone,
            i.email AS installer_email,
            i.profile_image AS installer_photo,
            i.city AS installer_city,
            i.state AS installer_state,
            i.local_government AS installer_lga,
            '4.96' AS installer_rating,
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
            p.amount_paid,
            p.balance_due,
            p.quotation_id,
            q.quotation_code,
            p.engineering_data,
            p.boq_data,
            p.original_contract_value,
            p.proposed_bargain_amount,
            p.bargain_discount_percentage,
            p.bargain_note,
            p.bargain_status,
            p.bargain_submitted_at,
            p.bargain_reviewed_at,
            p.bargain_reviewed_by,
            p.assigned_at,
            p.accepted_at,
            p.evidence_complete,
            p.payment_requested,
            p.payment_approved,
            p.notes,
            p.created_at,
            p.updated_at
        FROM projects p
        LEFT JOIN clients c ON c.id = p.client_id
        LEFT JOIN installers i ON i.id = p.installer_id
        LEFT JOIN quotations q ON q.id = p.quotation_id
        ${whereClause}
        ORDER BY p.created_at DESC
        `,
        params
    );

    return result.rows;
}

/* =========================================================
   GET PROJECT BY ID
========================================================= */
async function getProjectById(id) {
    const result = await query(
        `
        SELECT
            p.id,
            p.project_code,
            p.project_name,
            p.description,
            p.client_id,
            COALESCE(c.company_name, c.contact_name) AS client_name,
            c.email AS client_email,
            c.phone AS client_phone,
            c.user_id AS client_user_id,
            p.installer_id,
            COALESCE(i.company_name, i.contact_name) AS installer_name,
            i.contact_name AS installer_contact_name,
            i.company_name AS installer_company_name,
            i.phone AS installer_phone,
            i.email AS installer_email,
            i.profile_image AS installer_photo,
            i.city AS installer_city,
            i.state AS installer_state,
            i.local_government AS installer_lga,
            '4.96' AS installer_rating,
            i.user_id AS installer_user_id,
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
            p.amount_paid,
            p.balance_due,
            p.quotation_id,
            q.quotation_code,
            p.engineering_data,
            p.boq_data,
            p.original_contract_value,
            p.proposed_bargain_amount,
            p.bargain_discount_percentage,
            p.bargain_note,
            p.bargain_status,
            p.bargain_submitted_at,
            p.bargain_reviewed_at,
            p.bargain_reviewed_by,
            p.assigned_at,
            p.accepted_at,
            p.evidence_complete,
            p.payment_requested,
            p.payment_approved,
            p.notes,
            p.created_at,
            p.updated_at
        FROM projects p
        LEFT JOIN clients c ON c.id = p.client_id
        LEFT JOIN installers i ON i.id = p.installer_id
        LEFT JOIN quotations q ON q.id = p.quotation_id
        WHERE p.id = $1
        LIMIT 1
        `,
        [id]
    );

    return result.rows[0] || null;
}

/* =========================================================
   GET FULL PROJECT DETAILS (Unified View)
========================================================= */
async function getProjectFullDetails(id) {
    const project = await getProjectById(id);
    if (!project) return null;

    // Fetch evidence
    const evidenceRes = await query(
        `SELECT *, stage AS stage_type, file_url AS image_url, review_status AS verification_status FROM project_evidence WHERE project_id = $1 ORDER BY created_at ASC`,
        [id]
    );

    // Fetch payments
    const paymentsRes = await query(
        `SELECT * FROM payments WHERE project_id = $1 ORDER BY created_at DESC`,
        [id]
    );

    // Fetch quotation items if quotation exists
    let quotationItems = [];
    if (project.quotation_id) {
        const itemsRes = await query(
            `SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY sort_order ASC, id ASC`,
            [project.quotation_id]
        );
        quotationItems = itemsRes.rows;
    }

    // Fetch activities
    const activities = await activityService.getProjectActivities(id, 30);

    return {
        ...project,
        evidence: evidenceRes.rows,
        payments: paymentsRes.rows,
        quotation_items: quotationItems,
        activities
    };
}

/* =========================================================
   CREATE PROJECT
========================================================= */
async function createProject(data) {
    const {
        project_code,
        project_name,
        description,
        client_id,
        installer_id,
        site_address,
        city,
        state,
        local_government,
        country = "Nigeria",
        project_type = "solar",
        status = "consultation",
        priority = "normal",
        consultation_date,
        scheduled_start_date,
        actual_start_date,
        expected_completion_date,
        actual_completion_date,
        system_capacity_kw,
        battery_capacity_kwh,
        panel_count,
        inverter_capacity_kva,
        estimated_value = 0,
        contract_value = 0,
        amount_paid = 0,
        balance_due,
        quotation_id,
        engineering_data,
        boq_data,
        notes
    } = data;

    const calculatedBalance = balance_due !== undefined
        ? balance_due
        : Number(contract_value || 0) - Number(amount_paid || 0);

    const generatedCode = project_code || `PRJ-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    // AUTOMATED DISTANCE-BASED & BEFITTED INSTALLER ASSIGNMENT
    let resolvedInstallerId = installer_id;
    let resolvedStatus = status;

    if (!resolvedInstallerId) {
        try {
            const befitted = await installerService.getBefittedInstaller({
                city,
                state,
                localGovernment: local_government,
                projectType: project_type,
                capacityKw: system_capacity_kw
            });

            if (befitted && befitted.id) {
                resolvedInstallerId = befitted.id;
                resolvedStatus = (status === "consultation" || status === "draft") ? "installer_assigned" : status;
            }
        } catch (err) {
            console.warn("Auto distance installer matching fallback:", err.message);
        }
    }

    const result = await query(
        `
        INSERT INTO projects (
            project_code,
            project_name,
            description,
            client_id,
            installer_id,
            assigned_at,
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
            quotation_id,
            engineering_data,
            boq_data,
            notes
        )
        VALUES (
            $1, $2, $3, $4, $5,
            CASE WHEN $5 IS NOT NULL THEN CURRENT_TIMESTAMP ELSE NULL END,
            $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15,
            $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25,
            $26, $27, $28, $29, $30,
            $31
        )
        RETURNING *
        `,
        [
            generatedCode,
            project_name,
            description,
            client_id,
            resolvedInstallerId,
            site_address,
            city,
            state,
            local_government,
            country,
            project_type,
            resolvedStatus,
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
            calculatedBalance,
            quotation_id,
            engineering_data ? JSON.stringify(engineering_data) : null,
            boq_data ? JSON.stringify(boq_data) : null,
            notes
        ]
    );

    const project = result.rows[0];

    // Audit log
    await activityService.logActivity({
        projectId: project.id,
        action: resolvedInstallerId ? "distance_auto_assigned" : "project_created",
        title: resolvedInstallerId 
            ? `Project ${project.project_code} Created & Distance-Assigned to Lead Installer` 
            : `Project ${project.project_code} Created`,
        description: `Project "${project.project_name}" auto-dispatched to nearest certified installer (Location: ${project.city || "Abuja"}, ${project.state || "FCT"}).`,
        metadata: { projectCode: project.project_code, capacityKw: project.system_capacity_kw, installerId: resolvedInstallerId }
    });

    return project;
}

/* =========================================================
   UPDATE PROJECT
========================================================= */
async function updateProject(id, data) {
    const allowedFields = [
        "project_code",
        "project_name",
        "description",
        "client_id",
        "installer_id",
        "site_address",
        "city",
        "state",
        "local_government",
        "country",
        "project_type",
        "status",
        "priority",
        "consultation_date",
        "scheduled_start_date",
        "actual_start_date",
        "expected_completion_date",
        "actual_completion_date",
        "system_capacity_kw",
        "battery_capacity_kwh",
        "panel_count",
        "inverter_capacity_kva",
        "estimated_value",
        "contract_value",
        "amount_paid",
        "balance_due",
        "quotation_id",
        "engineering_data",
        "boq_data",
        "evidence_complete",
        "payment_requested",
        "payment_approved",
        "notes"
    ];

    const fields = [];
    const params = [];

    for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
            let val = data[field];
            if ((field === "engineering_data" || field === "boq_data") && val && typeof val === "object") {
                val = JSON.stringify(val);
            }
            params.push(val);
            fields.push(`${field} = $${params.length}`);
        }
    }

    if (fields.length === 0) {
        return getProjectById(id);
    }

    params.push(id);

    const sql = `
        UPDATE projects
        SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${params.length}
        RETURNING *
    `;

    const result = await query(sql, params);
    return result.rows[0] || null;
}

/* =========================================================
   UPDATE PROJECT STATUS
========================================================= */
async function updateProjectStatus(id, status, actorUserId = null, actorName = "Admin") {
    const result = await query(
        `
        UPDATE projects
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
        `,
        [status, id]
    );

    const project = result.rows[0];
    if (project) {
        await activityService.logActivity({
            projectId: id,
            actorUserId,
            actorName,
            action: "status_changed",
            title: `Project Status: ${status}`,
            description: `Project ${project.project_code} status transitioned to ${status}`,
            metadata: { newStatus: status }
        });
    }

    return project || null;
}

/* =========================================================
   ASSIGN INSTALLER (Workflow Step)
========================================================= */
async function assignInstaller(projectId, installerId, actorUserId = null, actorName = "Admin") {
    const project = await getProjectById(projectId);
    if (!project) throw new Error("Project not found");

    // Fetch installer details
    const installerRes = await query(`SELECT * FROM installers WHERE id = $1`, [installerId]);
    const installer = installerRes.rows[0];
    if (!installer) throw new Error("Installer not found");

    const installerName = installer.company_name || installer.contact_name;

    const result = await query(
        `
        UPDATE projects
        SET
            installer_id = $1,
            assigned_at = CURRENT_TIMESTAMP,
            status = 'installer_assigned',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
        `,
        [installerId, projectId]
    );

    const updatedProject = result.rows[0];

    // Log Activity
    await activityService.logActivity({
        projectId,
        actorUserId,
        actorName,
        actorRole: "admin",
        action: "installer_assigned",
        entityType: "installer",
        entityId: installerId,
        title: `Installer Assigned: ${installerName}`,
        description: `${installerName} was assigned to execute project ${project.project_code}`,
        metadata: { installerId, installerName, projectCode: project.project_code }
    });

    // Notify Installer
    if (installer.user_id) {
        await notificationService.createNotification({
            user_id: installer.user_id,
            type: "project",
            title: `New Project Assignment: ${project.project_name}`,
            message: `You have been assigned to project ${project.project_code} (${project.system_capacity_kw || ""}kW) at ${project.site_address || project.city || "Abuja"}. Please review and accept.`,
            project_id: projectId,
            action_url: `/installer/portal.html?project=${projectId}`,
            action_label: "View Project",
            priority: "high"
        });
    }

    // Notify Client
    if (project.client_user_id) {
        await notificationService.createNotification({
            user_id: project.client_user_id,
            type: "project",
            title: "Installer Assigned to Your Project",
            message: `Certified installer ${installerName} has been assigned to your solar installation (${project.project_code}).`,
            project_id: projectId,
            action_url: `/client/client.html`,
            action_label: "Track Project",
            priority: "normal"
        });
    }

    return updatedProject;
}

/* =========================================================
   INSTALLER ACCEPTS PROJECT
========================================================= */
async function acceptProject(projectId, installerUserId, actorName = "Installer") {
    // Verify installer identity
    const installerRes = await query(`SELECT * FROM installers WHERE user_id = $1 LIMIT 1`, [installerUserId]);
    const installer = installerRes.rows[0];
    if (!installer) throw new Error("Installer profile not found for authenticated user");

    const project = await getProjectById(projectId);
    if (!project) throw new Error("Project not found");

    if (String(project.installer_id) !== String(installer.id)) {
        throw new Error("You are not authorized to accept this project");
    }

    const result = await query(
        `
        UPDATE projects
        SET
            status = 'in_progress',
            accepted_at = CURRENT_TIMESTAMP,
            actual_start_date = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
        `,
        [projectId]
    );

    const updated = result.rows[0];

    // Log Activity
    await activityService.logActivity({
        projectId,
        actorUserId: installerUserId,
        actorName,
        actorRole: "installer",
        action: "project_accepted",
        title: "Installer Accepted Project",
        description: `${actorName} accepted project ${project.project_code} and commenced installation`,
        metadata: { projectCode: project.project_code }
    });

    // Notify Client
    if (project.client_user_id) {
        await notificationService.createNotification({
            user_id: project.client_user_id,
            type: "project",
            title: "Installation Work Started",
            message: `Work on your solar system has begun for project ${project.project_code}.`,
            project_id: projectId,
            priority: "high"
        });
    }

    return updated;
}

/* =========================================================
   SUBMIT SITE EXECUTION EVIDENCE
========================================================= */
async function submitEvidence(projectId, installerUserId, evidenceData) {
    const {
        stage_type,
        stage: stageParam,
        image_url,
        file_url,
        caption,
        file_name,
        notes = "",
        file_size_bytes,
        file_size,
        mime_type = "image/jpeg"
    } = evidenceData;

    const rawStage = stage_type || stageParam;
    const STAGE_NORMALIZE = {
        starting: "starting",
        starting_site: "starting",
        working: "working",
        work_in_progress: "working",
        panels: "panels",
        panel_installation: "panels",
        inverter: "inverter",
        inverter_installation: "inverter",
        battery: "battery",
        battery_installation: "battery",
        finishing: "finishing"
    };

    const resolvedStage = STAGE_NORMALIZE[rawStage] || rawStage;
    const validStages = ["starting", "working", "panels", "inverter", "battery", "finishing"];

    if (!validStages.includes(resolvedStage)) {
        throw new Error(`Invalid stage: ${rawStage}. Must be one of: ${validStages.join(", ")}`);
    }

    const project = await getProjectById(projectId);
    if (!project) throw new Error("Project not found");

    // Fetch installer
    const installerRes = await query(`SELECT * FROM installers WHERE user_id = $1 LIMIT 1`, [installerUserId]);
    const installer = installerRes.rows[0];
    const installerId = installer ? installer.id : project.installer_id;

    const evidenceCode = `EVD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    const resolvedUrl = image_url || file_url || "/uploads/evidence-default.jpg";
    const resolvedFileName = caption || file_name || `evidence-${resolvedStage}.jpg`;
    const resolvedFileSize = file_size_bytes || file_size || 1024;

    // Insert into project_evidence
    const evidenceRes = await query(
        `
        INSERT INTO project_evidence (
            evidence_code,
            project_id,
            installer_id,
            stage,
            file_name,
            original_file_name,
            file_url,
            file_path,
            mime_type,
            file_size,
            notes,
            review_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
        RETURNING *, stage AS stage_type, file_url AS image_url, review_status AS verification_status
        `,
        [
            evidenceCode,
            projectId,
            installerId,
            resolvedStage,
            resolvedFileName,
            resolvedFileName,
            resolvedUrl,
            resolvedUrl,
            mime_type,
            resolvedFileSize,
            notes
        ]
    );

    const evidence = evidenceRes.rows[0];

    // Check how many of the 6 mandatory stages are submitted
    const stagesRes = await query(
        `SELECT DISTINCT stage FROM project_evidence WHERE project_id = $1`,
        [projectId]
    );
    const submittedStages = stagesRes.rows.map(r => r.stage);
    const requiredStages = ["starting", "working", "panels", "inverter", "battery", "finishing"];
    const isComplete = requiredStages.every(stage => submittedStages.includes(stage));

    if (isComplete) {
        await query(
            `UPDATE projects SET evidence_complete = TRUE, status = 'evidence_review', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [projectId]
        );
    }

    // Check if project tracking reached Stage 3 (>= 3 stages submitted) and has remaining balance due
    if (submittedStages.length >= 3) {
        const projRes = await query(`
            SELECT p.id, p.project_code, p.project_name, p.contract_value, p.amount_paid, p.balance_due,
                   c.id AS client_id, c.user_id AS client_user_id, c.email AS client_email, c.contact_name AS client_name
            FROM projects p
            LEFT JOIN clients c ON c.id = p.client_id
            WHERE p.id = $1
        `, [projectId]);

        const proj = projRes.rows[0];
        if (proj) {
            const balanceDue = Number(proj.balance_due ?? (Number(proj.contract_value || 0) - Number(proj.amount_paid || 0)));
            if (balanceDue > 0 && proj.client_user_id) {
                // Check if Stage 3 payment notification was already dispatched
                const existingNotif = await query(`
                    SELECT id FROM notifications 
                    WHERE user_id = $1 
                      AND type = 'payment'
                      AND title LIKE '%Stage 3%'
                `, [proj.client_user_id]);

                if (existingNotif.rows.length === 0) {
                    await notificationService.createNotification({
                        user_id: proj.client_user_id,
                        type: "payment",
                        title: "⚠️ Milestone Notice: Stage 3 Reached (Complete Payment)",
                        message: `Your project ${proj.project_code} has reached Installation Stage 3 (PV Array & Inverter Mounting). Please complete your remaining outstanding balance of ₦${balanceDue.toLocaleString("en-NG", { minimumFractionDigits: 2 })} (UBA Account: 1029827207 / AE RENEWABLE LTD) for the project to continue.`,
                        client_id: proj.client_id,
                        project_id: proj.id,
                        action_url: "/client/dashboard#payments",
                        action_label: "Pay Remaining Balance",
                        priority: "urgent"
                    });

                    // Log milestone activity
                    await activityService.logActivity({
                        projectId,
                        actorUserId: installerUserId,
                        actorName: "AE System Automation",
                        actorRole: "system",
                        action: "stage_3_payment_notice",
                        entityType: "payment",
                        title: "Stage 3 Reached: Payment Completion Required",
                        description: `Client notification and milestone email dispatch sent to ${proj.client_email || 'client'} to complete outstanding balance of ₦${balanceDue.toLocaleString("en-NG", { minimumFractionDigits: 2 })}.`,
                        metadata: { balanceDue, stage: 3 }
                    });
                }
            }
        }
    }

    // Log Activity
    await activityService.logActivity({
        projectId,
        actorUserId: installerUserId,
        actorName: installer ? (installer.company_name || installer.contact_name) : "Installer",
        actorRole: "installer",
        action: "evidence_uploaded",
        entityType: "evidence",
        entityId: evidence.id,
        title: `Site Evidence: ${resolvedStage.toUpperCase()}`,
        description: `Evidence image uploaded for stage "${resolvedStage}". Total stages: ${submittedStages.length}/6`,
        metadata: { stageType: resolvedStage, imageUrl: resolvedUrl, isComplete }
    });

    return { evidence, submittedStages, isComplete };
}

/* =========================================================
   REVIEW EVIDENCE (Admin Approval / Rejection)
========================================================= */
async function reviewEvidence(projectId, evidenceId, adminUserId, adminName, { status, adminNotes = null }) {
    const statusMap = {
        verified: "approved",
        approved: "approved",
        rejected: "rejected"
    };
    const resolvedStatus = statusMap[status];
    if (!resolvedStatus) {
        throw new Error("Status must be either 'verified', 'approved', or 'rejected'");
    }

    const evidenceRes = await query(
        `
        UPDATE project_evidence
        SET
            review_status = $1,
            reviewed_by = $2,
            reviewed_at = CURRENT_TIMESTAMP,
            review_notes = $3
        WHERE id = $4 AND project_id = $5
        RETURNING *, stage AS stage_type, file_url AS image_url, review_status AS verification_status
        `,
        [resolvedStatus, adminUserId, adminNotes, evidenceId, projectId]
    );

    const evidence = evidenceRes.rows[0];
    if (!evidence) throw new Error("Evidence record not found");

    // Log Activity
    await activityService.logActivity({
        projectId,
        actorUserId: adminUserId,
        actorName: adminName || "Admin",
        actorRole: "admin",
        action: `evidence_${resolvedStatus}`,
        entityType: "evidence",
        entityId: evidenceId,
        title: `Evidence ${resolvedStatus.toUpperCase()}: ${evidence.stage}`,
        description: `Admin ${adminName} marked ${evidence.stage} evidence as ${resolvedStatus}. ${adminNotes || ""}`,
        metadata: { evidenceId, status: resolvedStatus, stage: evidence.stage }
    });

    // Notify installer if rejected
    if (resolvedStatus === "rejected" && evidence.installer_id) {
        const insRes = await query(`SELECT user_id FROM installers WHERE id = $1`, [evidence.installer_id]);
        if (insRes.rows[0]?.user_id) {
            await notificationService.createNotification({
                user_id: insRes.rows[0].user_id,
                type: "project",
                title: `Evidence Rejected: ${evidence.stage}`,
                message: `Your evidence upload for "${evidence.stage}" was rejected. Note: ${adminNotes || "Please re-upload a clearer image."}`,
                project_id: projectId,
                priority: "high"
            });
        }
    }

    return evidence;
}

async function requestPayment(projectId, installerUserId, { amount, notes = "" }) {
    const project = await getProjectById(projectId);
    if (!project) throw new Error("Project not found");

    // Check evidence completion constraint
    if (!project.evidence_complete) {
        throw new Error("Cannot request payment: All 6 site evidence stages must be completed first.");
    }

    const installerRes = await query(`SELECT * FROM installers WHERE user_id = $1 LIMIT 1`, [installerUserId]);
    const installer = installerRes.rows[0];
    const installerId = installer ? installer.id : project.installer_id;

    const paymentAmount = Number(
        amount ||
        project.installer_payout ||
        (project.system_capacity_kw ? Math.round(Math.max(100000, project.system_capacity_kw * 25000)) : 250000)
    );
    const paymentRef = `PAY-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    // Create payment record
    const paymentRes = await query(
        `
        INSERT INTO payments (
            payment_reference,
            client_id,
            project_id,
            quotation_id,
            installer_id,
            amount,
            currency,
            payment_method,
            payment_status,
            description,
            notes
        ) VALUES ($1, $2, $3, $4, $5, $6, 'NGN', 'bank_transfer', 'requested', $7, $8)
        RETURNING *
        `,
        [
            paymentRef,
            project.client_id,
            projectId,
            project.quotation_id,
            installerId,
            paymentAmount,
            `Installer completion payout for project ${project.project_code}`,
            notes
        ]
    );

    const payment = paymentRes.rows[0];

    // Update project state
    await query(
        `UPDATE projects SET payment_requested = TRUE, status = 'payment_requested', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [projectId]
    );

    // Log Activity
    await activityService.logActivity({
        projectId,
        actorUserId: installerUserId,
        actorName: installer ? (installer.company_name || installer.contact_name) : "Installer",
        actorRole: "installer",
        action: "payment_requested",
        entityType: "payment",
        entityId: payment.id,
        title: `Payment Requested: ₦${paymentAmount.toLocaleString()}`,
        description: `Installer submitted final milestone payment request of ₦${paymentAmount.toLocaleString()} for project ${project.project_code}`,
        metadata: { paymentReference: paymentRef, amount: paymentAmount }
    });

    return payment;
}

/* =========================================================
   APPROVE PAYMENT (Admin Payout Approval)
========================================================= */
async function approvePayment(projectId, paymentId, adminUserId, adminName, { notes = "", transactionReference = null }) {
    const project = await getProjectById(projectId);
    if (!project) throw new Error("Project not found");

    const paymentRes = await query(
        `
        UPDATE payments
        SET
            payment_status = 'approved',
            verified = TRUE,
            verified_by = $1,
            verified_at = CURRENT_TIMESTAMP,
            transaction_reference = COALESCE($2, transaction_reference),
            notes = COALESCE($3, notes),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4 AND project_id = $5
        RETURNING *
        `,
        [adminUserId, transactionReference, notes, paymentId, projectId]
    );

    const payment = paymentRes.rows[0];
    if (!payment) throw new Error("Payment record not found");

    // Update project to completed!
    await query(
        `
        UPDATE projects
        SET
            payment_approved = TRUE,
            status = 'completed',
            actual_completion_date = CURRENT_TIMESTAMP,
            amount_paid = amount_paid + $1,
            balance_due = GREATEST(0, contract_value - (amount_paid + $1)),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [payment.amount, projectId]
    );

    // Log Activity
    await activityService.logActivity({
        projectId,
        actorUserId: adminUserId,
        actorName: adminName || "Admin",
        actorRole: "admin",
        action: "payment_approved",
        entityType: "payment",
        entityId: paymentId,
        title: `Payment Approved: ₦${Number(payment.amount).toLocaleString()}`,
        description: `Admin approved payout for project ${project.project_code}. Project marked COMPLETED.`,
        metadata: { paymentId, amount: payment.amount }
    });

    // Notify installer
    if (payment.installer_id) {
        const insRes = await query(`SELECT user_id FROM installers WHERE id = $1`, [payment.installer_id]);
        if (insRes.rows[0]?.user_id) {
            await notificationService.createNotification({
                user_id: insRes.rows[0].user_id,
                type: "payment",
                title: "Payment Approved! ₦" + Number(payment.amount).toLocaleString(),
                message: `Your payment request for project ${project.project_code} has been approved and processed.`,
                project_id: projectId,
                priority: "high"
            });
        }
    }

    // Notify client of project completion
    if (project.client_user_id) {
        await notificationService.createNotification({
            user_id: project.client_user_id,
            type: "project",
            title: "Project Completed Successfully!",
            message: `Your solar power system for project ${project.project_code} is officially certified and commissioned.`,
            project_id: projectId,
            priority: "high"
        });
    }

    return payment;
}

/* =========================================================
   CREATE CLIENT ACCOUNT (Admin Onboarding)
   Business rule:
   USERNAME = quotation_code (or quotation_id)
   INITIAL PASSWORD = client middle_name (securely hashed with bcrypt)
========================================================= */
async function createClientAccount(projectId, adminUserId, adminName) {
    const project = await getProjectById(projectId);
    if (!project) throw new Error("Project not found");

    // Fetch client
    const clientRes = await query(`SELECT * FROM clients WHERE id = $1`, [project.client_id]);
    const client = clientRes.rows[0];
    if (!client) throw new Error("Client record not associated with this project");

    // Fetch linked quotation code
    let quotationCode = project.quotation_code;
    if (!quotationCode && project.quotation_id) {
        const qRes = await query(`SELECT quotation_code FROM quotations WHERE id = $1`, [project.quotation_id]);
        quotationCode = qRes.rows[0]?.quotation_code;
    }
    if (!quotationCode) {
        quotationCode = `QUO-${project.project_code.replace("PRJ-", "")}`;
    }

    const username = quotationCode.toLowerCase().trim();

    // Determine initial password based on client's middle name
    const rawMiddleName = client.contact_name
        ? client.contact_name.split(" ")[1] || client.contact_name.split(" ")[0]
        : "solar";
    const initialPassword = rawMiddleName.toLowerCase().trim();

    // Check if user already exists
    let user = null;
    const existingUserRes = await query(
        `SELECT * FROM users WHERE (username IS NOT NULL AND LOWER(username) = LOWER($1)) OR LOWER(email) = LOWER($2) LIMIT 1`,
        [username, client.email]
    );

    if (existingUserRes.rows[0]) {
        user = existingUserRes.rows[0];
        // Ensure user_id is linked to client
        await query(`UPDATE clients SET user_id = $1 WHERE id = $2`, [user.id, client.id]);
    } else {
        // Hash password
        const passwordHash = await bcrypt.hash(initialPassword, 10);

        const newUserRes = await query(
            `
            INSERT INTO users (
                username,
                email,
                password_hash,
                middle_name,
                first_name,
                last_name,
                role,
                status,
                email_verified
            ) VALUES ($1, $2, $3, $4, $5, $6, 'client', 'active', TRUE)
            RETURNING id, username, email, role, status
            `,
            [
                username,
                client.email,
                passwordHash,
                rawMiddleName,
                client.contact_name ? client.contact_name.split(" ")[0] : "Client",
                client.contact_name ? (client.contact_name.split(" ")[2] || client.contact_name.split(" ")[1] || "") : "",
            ]
        );

        user = newUserRes.rows[0];

        // Link client to user
        await query(`UPDATE clients SET user_id = $1 WHERE id = $2`, [user.id, client.id]);
    }

    // Log Activity
    await activityService.logActivity({
        projectId,
        actorUserId: adminUserId,
        actorName: adminName || "Admin",
        actorRole: "admin",
        action: "client_account_created",
        entityType: "client",
        entityId: client.id,
        title: `Client Account Created: ${username}`,
        description: `Client portal access created for ${client.contact_name}. Login username: ${username}`,
        metadata: { username, email: client.email }
    });

    return {
        success: true,
        message: "Client account successfully provisioned.",
        client_id: client.id,
        user_id: user.id,
        username,
        initial_password: initialPassword,
        email: client.email
    };
}

/* =========================================================
   SUBMIT BARGAIN OFFER (MAX 5% DISCOUNT STRICT LIMIT)
========================================================= */
async function submitBargain(projectId, { proposedAmount, clientNote, userId, userRole, actorName }) {
    const project = await getProjectById(projectId);
    if (!project) {
        const error = new Error("Project not found.");
        error.status = 404;
        throw error;
    }

    const baseline = Number(project.original_contract_value || project.contract_value || project.estimated_value || 0);
    if (baseline <= 0) {
        const error = new Error("This project does not currently have an active quotation amount to bargain.");
        error.status = 400;
        throw error;
    }

    const proposed = Number(proposedAmount);
    if (isNaN(proposed) || proposed <= 0) {
        const error = new Error("Please enter a valid positive proposed bargain amount.");
        error.status = 400;
        throw error;
    }

    if (proposed > baseline) {
        const error = new Error(`Proposed bargain amount (₦${proposed.toLocaleString()}) cannot exceed the current total quotation amount of ₦${baseline.toLocaleString()}.`);
        error.status = 400;
        throw error;
    }

    // STRICT 5% MAXIMUM BARGAIN CHECK
    const maxDiscountAmount = baseline * 0.05;
    const minAcceptableOffer = baseline * 0.95;
    const proposedDiscount = baseline - proposed;
    const discountPercent = baseline > 0 ? (proposedDiscount / baseline) * 100 : 0;

    if (proposed < (minAcceptableOffer - 0.5)) { // allowing 50 kobo rounding tolerance
        const error = new Error(
            `Bargain discount exceeds the allowable 5% limit. AE Renewable allows a maximum bargain discount of 5.0% (Max discount: ₦${maxDiscountAmount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, Minimum acceptable offer: ₦${minAcceptableOffer.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).`
        );
        error.status = 400;
        throw error;
    }

    // Update projects table with proposed bargain
    const updatedRes = await query(
        `
        UPDATE projects
        SET
            original_contract_value = COALESCE(original_contract_value, contract_value, estimated_value),
            proposed_bargain_amount = $1,
            bargain_discount_percentage = $2,
            bargain_note = $3,
            bargain_status = 'pending_admin_review',
            bargain_submitted_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
        `,
        [
            proposed,
            discountPercent.toFixed(2),
            clientNote || null,
            projectId
        ]
    );

    // Also update linked quotation if existing
    if (project.quotation_id) {
        await query(
            `
            UPDATE quotations
            SET
                original_amount = COALESCE(original_amount, total_amount),
                proposed_bargain_amount = $1,
                bargain_discount_percentage = $2,
                bargain_note = $3,
                bargain_status = 'pending_admin_review',
                bargain_submitted_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            `,
            [
                proposed,
                discountPercent.toFixed(2),
                clientNote || null,
                project.quotation_id
            ]
        );
    }

    // Log Activity
    const actorDisplayName = actorName || (userRole === "client" ? (project.client_name || "Client") : "User");
    await activityService.logActivity({
        projectId,
        actorUserId: userId,
        actorName: actorDisplayName,
        actorRole: userRole || "client",
        action: "bargain_proposed",
        entityType: "project",
        entityId: projectId,
        title: `Bargain Proposed (${discountPercent.toFixed(1)}% Discount): ${project.project_code}`,
        description: `${actorDisplayName} proposed a bargain total of ₦${proposed.toLocaleString("en-NG", { minimumFractionDigits: 2 })} (Original: ₦${baseline.toLocaleString("en-NG", { minimumFractionDigits: 2 })}, Discount: ${discountPercent.toFixed(1)}%). Sent to Admin for review.`,
        metadata: {
            originalAmount: baseline,
            proposedAmount: proposed,
            discountPercent: Number(discountPercent.toFixed(2)),
            note: clientNote
        }
    });

    // Notify Admins
    try {
        const adminUsers = await query(
            `SELECT id FROM users WHERE role IN ('admin', 'super_admin') AND status = 'active'`
        );
        for (const admin of adminUsers.rows) {
            await notificationService.createNotification({
                user_id: admin.id,
                type: "project",
                title: `Client Bargain Offer: ${project.project_code}`,
                message: `${actorDisplayName} proposed a ₦${proposed.toLocaleString()} bargain offer (${discountPercent.toFixed(1)}% off ₦${baseline.toLocaleString()}) for "${project.project_name}". Awaiting your review and acceptance.`,
                project_id: projectId,
                action_url: `/admin`,
                priority: "high"
            });
        }
    } catch (e) {
        console.warn("[ProjectService] Admin notification notice:", e.message);
    }

    return getProjectById(projectId);
}

/* =========================================================
   ACCEPT BARGAIN OFFER (ADMIN ONLY)
========================================================= */
async function acceptBargain(projectId, { adminId, adminName, adminNote }) {
    const project = await getProjectById(projectId);
    if (!project) {
        const error = new Error("Project not found.");
        error.status = 404;
        throw error;
    }

    if (!project.proposed_bargain_amount || Number(project.proposed_bargain_amount) <= 0) {
        const error = new Error("No pending proposed bargain amount found for this project.");
        error.status = 400;
        throw error;
    }

    const newAmount = Number(project.proposed_bargain_amount);
    const prevAmount = Number(project.contract_value || project.estimated_value || 0);

    // Ensure project is active and installer is assigned upon bargain acceptance
    let assignedInstallerId = project.installer_id;
    if (!assignedInstallerId) {
        try {
            const befitted = await installerService.getBefittedInstaller({
                city: project.city,
                state: project.state,
                localGovernment: project.local_government
            });
            if (befitted && befitted.id) {
                assignedInstallerId = befitted.id;
            }
        } catch (e) {
            console.warn("[ProjectService] Auto-assign installer notice:", e.message);
        }
    }

    // Update project contract value, mark accepted, activate project and assign installer
    await query(
        `
        UPDATE projects
        SET
            contract_value = $1,
            estimated_value = $1,
            balance_due = GREATEST(0, $1 - amount_paid),
            bargain_status = 'accepted',
            bargain_reviewed_at = CURRENT_TIMESTAMP,
            bargain_reviewed_by = $2,
            status = CASE WHEN status = 'pending' OR status = 'draft' THEN 'in_installation' ELSE status END,
            installer_id = COALESCE(installer_id, $3),
            assigned_at = CASE WHEN installer_id IS NULL AND $3 IS NOT NULL THEN CURRENT_TIMESTAMP ELSE assigned_at END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        `,
        [newAmount, adminId || null, assignedInstallerId || null, projectId]
    );

    // Update linked quotation
    if (project.quotation_id) {
        await query(
            `
            UPDATE quotations
            SET
                total_amount = $1,
                balance_due = GREATEST(0, $1 - amount_paid),
                bargain_status = 'accepted',
                status = 'accepted',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            `,
            [newAmount, project.quotation_id]
        );
    }

    // Log Activity
    const adminDisplayName = adminName || "Admin";
    await activityService.logActivity({
        projectId,
        actorUserId: adminId,
        actorName: adminDisplayName,
        actorRole: "admin",
        action: "bargain_accepted",
        entityType: "project",
        entityId: projectId,
        title: `Bargain Accepted & Project Activated: ${project.project_code}`,
        description: `AE Renewable Admin accepted the proposed bargain amount of ₦${newAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })} (Previous: ₦${prevAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}). Project tracking is live.`,
        metadata: {
            previousAmount: prevAmount,
            newContractValue: newAmount,
            adminNote,
            installerId: assignedInstallerId
        }
    });

    // Notify Assigned Installer
    if (assignedInstallerId) {
        try {
            const instRes = await query(`SELECT user_id, contact_name FROM installers WHERE id = $1`, [assignedInstallerId]);
            const instRow = instRes.rows[0];
            if (instRow && instRow.user_id) {
                await notificationService.createNotification({
                    user_id: instRow.user_id,
                    type: "project",
                    title: `New Project Assignment: ${project.project_code}`,
                    message: `You have been assigned as Lead Installer for "${project.project_name}" in ${project.city || "Abuja"}. Site tracking and evidence submission are now active.`,
                    project_id: projectId,
                    action_url: `/installer`,
                    priority: "high"
                });
            }
        } catch (e) {
            console.warn("[ProjectService] Installer notification notice:", e.message);
        }
    }

    // Notify Client
    try {
        if (project.client_id) {
            const clientRes = await query(`SELECT user_id, email, contact_name FROM clients WHERE id = $1`, [project.client_id]);
            const clientRow = clientRes.rows[0];
            if (clientRow && clientRow.user_id) {
                await notificationService.createNotification({
                    user_id: clientRow.user_id,
                    type: "project",
                    title: `Bargain Accepted & Project Live: ${project.project_code}!`,
                    message: `Great news! AE Renewable accepted your bargain offer of ₦${newAmount.toLocaleString()}. Your project is now active and Lead Installer has been assigned.`,
                    project_id: projectId,
                    action_url: `/client/dashboard`,
                    priority: "high"
                });
            }
        }
    } catch (e) {
        console.warn("[ProjectService] Client notification notice:", e.message);
    }

    return getProjectById(projectId);
}

/* =========================================================
   REJECT BARGAIN OFFER (ADMIN ONLY)
========================================================= */
async function rejectBargain(projectId, { adminId, adminName, reason }) {
    const project = await getProjectById(projectId);
    if (!project) {
        const error = new Error("Project not found.");
        error.status = 404;
        throw error;
    }

    const baseline = Number(project.original_contract_value || project.contract_value || project.estimated_value || 0);

    await query(
        `
        UPDATE projects
        SET
            bargain_status = 'rejected',
            bargain_reviewed_at = CURRENT_TIMESTAMP,
            bargain_reviewed_by = $1,
            contract_value = $2,
            estimated_value = $2,
            balance_due = GREATEST(0, $2 - amount_paid),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        `,
        [adminId || null, baseline, projectId]
    );

    if (project.quotation_id) {
        await query(
            `
            UPDATE quotations
            SET
                bargain_status = 'rejected',
                total_amount = $1,
                balance_due = GREATEST(0, $1 - amount_paid),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            `,
            [baseline, project.quotation_id]
        );
    }

    // Log Activity
    const adminDisplayName = adminName || "Admin";
    await activityService.logActivity({
        projectId,
        actorUserId: adminId,
        actorName: adminDisplayName,
        actorRole: "admin",
        action: "bargain_rejected",
        entityType: "project",
        entityId: projectId,
        title: `Bargain Declined: ${project.project_code}`,
        description: `AE Renewable Admin declined the proposed bargain offer. Reason: ${reason || "Maintained standard engineering rate."} Quotation total remains ₦${baseline.toLocaleString("en-NG", { minimumFractionDigits: 2 })}.`,
        metadata: { reason, baseline }
    });

    // Notify Client with interactive option to accept original quotation or submit adjusted offer
    try {
        if (project.client_id) {
            const clientRes = await query(`SELECT user_id FROM clients WHERE id = $1`, [project.client_id]);
            const clientRow = clientRes.rows[0];
            if (clientRow && clientRow.user_id) {
                await notificationService.createNotification({
                    user_id: clientRow.user_id,
                    type: "project",
                    title: `Quotation Review Notice: ${project.project_code}`,
                    message: `AE Renewable management reviewed your proposal and maintained the standard engineering rate at ₦${baseline.toLocaleString()}. Please open your portal to accept or submit a revised offer.`,
                    project_id: projectId,
                    action_url: `/client/dashboard`,
                    priority: "high"
                });
            }
        }
    } catch (e) {
        console.warn("[ProjectService] Client rejection notice:", e.message);
    }

    return getProjectById(projectId);
}

/* =========================================================
   CLIENT ACCEPTS ORIGINAL QUOTATION TOTAL
========================================================= */
async function clientAcceptOriginalQuotation(projectId, { userId, clientName }) {
    const project = await getProjectById(projectId);
    if (!project) {
        const error = new Error("Project not found.");
        error.status = 404;
        throw error;
    }

    const baseline = Number(project.original_contract_value || project.contract_value || project.estimated_value || 0);

    let assignedInstallerId = project.installer_id;
    if (!assignedInstallerId) {
        try {
            const befitted = await installerService.getBefittedInstaller({
                city: project.city,
                state: project.state,
                localGovernment: project.local_government
            });
            if (befitted && befitted.id) {
                assignedInstallerId = befitted.id;
            }
        } catch (e) {
            console.warn("[ProjectService] Installer auto-assignment notice:", e.message);
        }
    }

    // Update project
    await query(
        `
        UPDATE projects
        SET
            contract_value = $1,
            estimated_value = $1,
            balance_due = GREATEST(0, $1 - amount_paid),
            bargain_status = 'client_accepted_original',
            status = CASE WHEN status = 'pending' OR status = 'draft' THEN 'in_installation' ELSE status END,
            installer_id = COALESCE(installer_id, $2),
            assigned_at = CASE WHEN installer_id IS NULL AND $2 IS NOT NULL THEN CURRENT_TIMESTAMP ELSE assigned_at END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        `,
        [baseline, assignedInstallerId || null, projectId]
    );

    if (project.quotation_id) {
        await query(
            `
            UPDATE quotations
            SET
                total_amount = $1,
                balance_due = GREATEST(0, $1 - amount_paid),
                bargain_status = 'accepted',
                status = 'accepted',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            `,
            [baseline, project.quotation_id]
        );
    }

    // Log Activity
    const displayName = clientName || project.client_name || "Client";
    await activityService.logActivity({
        projectId,
        actorUserId: userId,
        actorName: displayName,
        actorRole: "client",
        action: "quotation_accepted",
        entityType: "project",
        entityId: projectId,
        title: `Quotation Accepted: ${project.project_code}`,
        description: `${displayName} accepted the original quotation total of ₦${baseline.toLocaleString("en-NG", { minimumFractionDigits: 2 })}. Project is now active and installer assigned.`,
        metadata: { contractValue: baseline, installerId: assignedInstallerId }
    });

    // Notify Admins
    try {
        const adminUsers = await query(`SELECT id FROM users WHERE role IN ('admin', 'super_admin') AND status = 'active'`);
        for (const admin of adminUsers.rows) {
            await notificationService.createNotification({
                user_id: admin.id,
                type: "project",
                title: `Quotation Accepted: ${project.project_code}`,
                message: `${displayName} accepted quotation total of ₦${baseline.toLocaleString()}. Project started with installer assigned.`,
                project_id: projectId,
                action_url: `/admin`,
                priority: "high"
            });
        }
    } catch (e) {
        console.warn("[ProjectService] Admin notification notice:", e.message);
    }

    // Notify Assigned Installer
    if (assignedInstallerId) {
        try {
            const instRes = await query(`SELECT user_id FROM installers WHERE id = $1`, [assignedInstallerId]);
            const instRow = instRes.rows[0];
            if (instRow && instRow.user_id) {
                await notificationService.createNotification({
                    user_id: instRow.user_id,
                    type: "project",
                    title: `New Project Live: ${project.project_code}`,
                    message: `Quotation confirmed for "${project.project_name}". Site tracking is live in your installer portal.`,
                    project_id: projectId,
                    action_url: `/installer`,
                    priority: "high"
                });
            }
        } catch (e) {}
    }

    return getProjectById(projectId);
}

/* =========================================================
   DELETE PROJECT
========================================================= */
async function deleteProject(id) {
    const result = await query(
        `DELETE FROM projects WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0] || null;
}

module.exports = {
    getProjects,
    getProjectById,
    getProjectFullDetails,
    createProject,
    updateProject,
    updateProjectStatus,
    assignInstaller,
    acceptProject,
    submitEvidence,
    reviewEvidence,
    requestPayment,
    approvePayment,
    createClientAccount,
    submitBargain,
    acceptBargain,
    rejectBargain,
    clientAcceptOriginalQuotation,
    deleteProject
};