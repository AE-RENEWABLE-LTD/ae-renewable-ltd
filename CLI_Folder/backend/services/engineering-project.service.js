"use strict";

const bcrypt = require("bcryptjs");
const { query, transaction } = require("../config/database");
const engineeringService = require("./engineering.service");
const activityService = require("./activity.service");
const notificationService = require("./notification.service");
const emailService = require("./email.service");

/**
 * ARDE -> ADMIN PROJECT HANDOFF SERVICE
 * Connects the engineering calculation output directly into the central project & quotation tables.
 * Maintains ONE PROJECT RECORD with referential integrity.
 */

async function submitEngineeringProject(payload, actorUserId = null, actorName = "ARDE Engineer") {
    const {
        customer = {},
        engineeringInput = {},
        calculationResult = null,
        notes = "Engineering design finalized via ARDE"
    } = payload;

    // 1. Calculate or use provided calculation
    const calc = calculationResult || await engineeringService.calculateSystem(engineeringInput);

    const {
        fullName = "Prospective Client",
        email = `client-${Date.now()}@aerenewable.com`,
        phone = "+234 800 000 0000",
        address = "Abuja, Nigeria",
        state = "FCT",
        city = "Abuja",
        companyName = null,
        projectCode: customerProjectCode = null
    } = customer;

    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0] || "Client";
    const lastName = nameParts.slice(1).join(" ") || "User";
    const defaultPassword = firstName; // First name used as default portal password

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const randomNum = Math.floor(1000 + Math.random() * 9000);

    const finalProjectCode = customerProjectCode || `PRJ-${year}${month}-${randomNum}`;
    const codeSuffix = finalProjectCode.replace(/^PRJ-|^AE-/, "");
    const quotationCode = `AE-${year}${month}${day}-${codeSuffix}`;
    const quotationNumber = `AE-Q-${codeSuffix}`;
    const clientCode = `AE_CL${codeSuffix}`;

    // Start database transaction
    const transactionResult = await transaction(async (client) => {
        // 2. Provision or find user account in users table
        let dbUser = null;
        if (email) {
            const userRes = await client.query(
                `SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR (username IS NOT NULL AND LOWER(username) = LOWER($2)) LIMIT 1`,
                [email, finalProjectCode]
            );
            dbUser = userRes.rows[0];
        }

        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        if (!dbUser) {
            const newUserRes = await client.query(
                `
                INSERT INTO users (
                    email,
                    username,
                    password_hash,
                    first_name,
                    last_name,
                    phone,
                    role,
                    status,
                    email_verified
                ) VALUES ($1, $2, $3, $4, $5, $6, 'client', 'active', TRUE)
                RETURNING *
                `,
                [
                    email,
                    finalProjectCode,
                    passwordHash,
                    firstName,
                    lastName,
                    phone
                ]
            );
            dbUser = newUserRes.rows[0];
        } else {
            // Update username / credentials / role to client
            await client.query(
                `
                UPDATE users
                SET username = $1,
                    password_hash = $2,
                    role = 'client',
                    status = 'active',
                    email_verified = TRUE
                WHERE id = $3
                `,
                [finalProjectCode, passwordHash, dbUser.id]
            );
        }

        // 3. Find or create client in clients table
        let dbClient = null;
        if (email) {
            const clientRes = await client.query(
                `SELECT * FROM clients WHERE email = $1 OR user_id = $2 LIMIT 1`,
                [email, dbUser.id]
            );
            dbClient = clientRes.rows[0];
        }

        if (!dbClient) {
            const newClientRes = await client.query(
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
                    status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
                RETURNING *
                `,
                [dbUser.id, clientCode, companyName, fullName, email, phone, address, city, state]
            );
            dbClient = newClientRes.rows[0];
        } else {
            await client.query(
                `UPDATE clients SET user_id = $1, contact_name = $2, phone = $3, address = $4, city = $5, state = $6 WHERE id = $7`,
                [dbUser.id, fullName, phone, address, city, state, dbClient.id]
            );
        }

        // 4. Create Quotation
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 30); // 30-day validity

        const comm = calc.commercial || {};
        const eng = calc.engineering || {};

        const subtotalVal = Number(comm.subtotalEquipment ?? comm.materialCost ?? comm.subTotal ?? 0);
        const labourVal = Number(comm.installationLabour ?? comm.labourCost ?? 0);
        const transportVal = Number(comm.transportCost ?? 0);
        const installVal = Number(comm.installationCost ?? comm.engineeringFee ?? 0);
        const installationFeeVal = labourVal + transportVal + installVal;
        const taxVal = Number(comm.vatAmount ?? comm.vatCost ?? 0);
        const finalAmountVal = Number(comm.finalQuotationAmount ?? comm.grandTotal ?? (subtotalVal + installationFeeVal + taxVal));

        const quotationRes = await client.query(
            `
            INSERT INTO quotations (
                quotation_code,
                quotation_number,
                client_id,
                title,
                description,
                subtotal,
                installation_fee,
                tax,
                total_amount,
                amount_paid,
                balance_due,
                currency,
                status,
                issue_date,
                valid_until,
                notes,
                assumptions,
                engineering_inputs
            ) VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, 0,
                $9, 'NGN', 'issued', CURRENT_TIMESTAMP, $10,
                $11, $12, $13
            )
            RETURNING *
            `,
            [
                quotationCode,
                quotationNumber,
                dbClient.id,
                `Solar Power Installation - ${eng.pvCapacityKw || 0}kW / ${eng.inverterCapacityKva || eng.requiredInverterKw || 0}kVA System`,
                `Complete turnkey solar PV installation for ${fullName} at ${address}`,
                subtotalVal,
                installationFeeVal,
                taxVal,
                finalAmountVal,
                validUntil,
                notes,
                JSON.stringify(calc.assumptions || {}),
                JSON.stringify(engineeringInput || {})
            ]
        );

        const quotation = quotationRes.rows[0];

        // 4. Insert Quotation Items (BOQ)
        if (Array.isArray(calc.boqItems)) {
            let sortOrder = 1;
            for (const item of calc.boqItems) {
                const itemName = item.item_name || item.name || item.description || "Equipment Item";
                const unitRate = Number(item.unit_price ?? item.unitPrice ?? 0);
                const totalItemAmount = Number(item.total_price ?? item.totalPrice ?? item.total_amount ?? (unitRate * (item.quantity || 1)));

                await client.query(
                    `
                    INSERT INTO quotation_items (
                        quotation_id,
                        item_type,
                        item_code,
                        name,
                        description,
                        quantity,
                        unit,
                        unit_price,
                        total_amount,
                        sort_order
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    `,
                    [
                        quotation.id,
                        item.category || "equipment",
                        item.equipment_code || null,
                        itemName,
                        item.description || (item.specifications ? JSON.stringify(item.specifications) : null),
                        item.quantity || 1,
                        item.unit || "unit",
                        unitRate,
                        totalItemAmount,
                        sortOrder++
                    ]
                );
            }
        }

        // 5. Central Project Record (Link existing or Create new)
        let project = null;
        const targetProjId = payload.projectId || payload.customer?.projectId || null;

        let existingProjRes = null;
        if (targetProjId) {
            existingProjRes = await client.query(`SELECT * FROM projects WHERE id = $1 LIMIT 1`, [targetProjId]);
        }
        if ((!existingProjRes || existingProjRes.rows.length === 0) && finalProjectCode) {
            existingProjRes = await client.query(`SELECT * FROM projects WHERE project_code = $1 LIMIT 1`, [finalProjectCode]);
        }

        if (existingProjRes && existingProjRes.rows.length > 0) {
            const existingProj = existingProjRes.rows[0];
            const updateRes = await client.query(
                `
                UPDATE projects SET
                    quotation_id = $1,
                    client_id = COALESCE(client_id, $2),
                    system_capacity_kw = $3,
                    battery_capacity_kwh = $4,
                    panel_count = $5,
                    inverter_capacity_kva = $6,
                    estimated_value = $7,
                    contract_value = $7,
                    balance_due = $7,
                    engineering_data = $8,
                    boq_data = $9,
                    status = 'admin_review',
                    notes = COALESCE(notes, '') || ' | ' || $10,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $11
                RETURNING *
                `,
                [
                    quotation.id,
                    dbClient.id,
                    eng.pvCapacityKw || 0,
                    eng.batteryCapacityKwh || 0,
                    eng.panelCount || 0,
                    eng.requiredInverterKva || eng.requiredInverterKw || eng.inverterCapacityKva || 0,
                    finalAmountVal,
                    JSON.stringify(eng),
                    JSON.stringify(calc.boqItems || []),
                    notes,
                    existingProj.id
                ]
            );
            project = updateRes.rows[0];
        }

        if (!project) {
            const projectCode = finalProjectCode;
            const projectName = `${fullName} - ${eng.pvCapacityKw || 5}kW Solar Installation`;

            const projectRes = await client.query(
                `
                INSERT INTO projects (
                    project_code,
                    project_name,
                    description,
                    client_id,
                    quotation_id,
                    site_address,
                    city,
                    state,
                    country,
                    project_type,
                    status,
                    priority,
                    consultation_date,
                    system_capacity_kw,
                    battery_capacity_kwh,
                    panel_count,
                    inverter_capacity_kva,
                    estimated_value,
                    contract_value,
                    amount_paid,
                    balance_due,
                    engineering_data,
                    boq_data,
                    notes
                ) VALUES (
                    $1, $2, $3, $4, $5,
                    $6, $7, $8, 'Nigeria', 'solar',
                    'admin_review', 'high', CURRENT_TIMESTAMP,
                    $9, $10, $11, $12,
                    $13, $13, 0, $13,
                    $14, $15, $16
                )
                RETURNING *
                `,
                [
                    projectCode,
                    projectName,
                    `Turnkey solar installation based on ARDE engineering specifications.`,
                    dbClient.id,
                    quotation.id,
                    address,
                    city,
                    state,
                    eng.pvCapacityKw || 0,
                    eng.batteryCapacityKwh || 0,
                    eng.panelCount || 0,
                    eng.requiredInverterKva || eng.requiredInverterKw || eng.inverterCapacityKva || 0,
                    finalAmountVal,
                    JSON.stringify(eng),
                    JSON.stringify(calc.boqItems || []),
                    notes
                ]
            );
            project = projectRes.rows[0];
        }

        // 6. Link Project ID back to Quotation
        await client.query(
            `UPDATE quotations SET project_id = $1 WHERE id = $2`,
            [project.id, quotation.id]
        );

        return {
            success: true,
            project,
            quotation,
            client: dbClient,
            engineering: eng,
            commercial: comm
        };
    });

    // 7. Audit Logging (executed after transaction commit)
    try {
        await activityService.logActivity({
            projectId: transactionResult.project.id,
            actorUserId,
            actorName,
            actorRole: "engineer",
            action: "arde_project_submitted",
            entityType: "project",
            entityId: transactionResult.project.id,
            title: `ARDE System Sized: ${transactionResult.project.project_code}`,
            description: `Engineering design completed and submitted to Admin. System: ${transactionResult.engineering.pvCapacityKw}kW PV, ${transactionResult.engineering.batteryCapacityKwh}kWh Storage. Quotation: ${transactionResult.quotation.quotation_code}`,
            metadata: {
                projectCode: transactionResult.project.project_code,
                quotationCode: transactionResult.quotation.quotation_code,
                contractValue: Number(transactionResult.commercial?.finalQuotationAmount || transactionResult.project?.contract_value || 0)
            }
        });
    } catch (e) {
        console.warn("[EngineeringProject] Activity log error:", e.message);
    }

    // 8. Admin Notification (executed after transaction commit)
    try {
        const adminUsers = await query(
            `SELECT id FROM users WHERE role IN ('admin', 'super_admin') AND status = 'active'`
        );
        const finalVal = Number(transactionResult.commercial?.finalQuotationAmount || transactionResult.project?.contract_value || 0);
        for (const admin of adminUsers.rows) {
            await notificationService.createNotification({
                user_id: admin.id,
                type: "project",
                title: `New ARDE Project Submitted: ${transactionResult.project.project_code}`,
                message: `New solar project "${transactionResult.project.project_name}" submitted from ARDE engineering. Value: ₦${finalVal.toLocaleString()}. Awaiting admin validation and installer matching.`,
                project_id: transactionResult.project.id,
                quotation_id: transactionResult.quotation.id,
                action_url: `/admin`,
                priority: "high"
            });
        }
    } catch (e) {
        console.warn("[EngineeringProject] Notification error:", e.message);
    }

    // 9. Client Email Dispatch (Credentials & Quotation Notification)
    try {
        const clientEmail = (transactionResult.client?.email || customer.email || "").trim();
        const clientName = (transactionResult.client?.contact_name || customer.fullName || "Valued Client").trim();
        const firstName = clientName.split(" ")[0] || "Client";
        const projectCode = transactionResult.project?.project_code || "PRJ-2026";
        const finalAmount = Number(
            transactionResult.commercial?.finalQuotationAmount ||
            transactionResult.project?.contract_value ||
            transactionResult.quotation?.total_amount ||
            0
        );
        const pvCapacityKw = transactionResult.engineering?.pvCapacityKw || transactionResult.project?.system_capacity_kw || 5.0;
        const batteryCapacityKwh = transactionResult.engineering?.batteryCapacityKwh || transactionResult.project?.battery_capacity_kwh || 10.0;
        const address = transactionResult.client?.address || customer.address || "Abuja, Nigeria";
        const loginUrl = `${process.env.CLIENT_URL || process.env.APP_URL || "http://localhost:5000"}/client/login`;
        const boqItems = (Array.isArray(calc.boqItems) && calc.boqItems.length > 0)
            ? calc.boqItems
            : (Array.isArray(payload.calculationResult?.boqItems) ? payload.calculationResult.boqItems : []);

        if (clientEmail && emailService && emailService.sendClientQuotationEmail) {
            await emailService.sendClientQuotationEmail({
                email: clientEmail,
                fullName: clientName,
                projectCode,
                username: projectCode,
                password: firstName,
                finalAmount,
                pvCapacityKw,
                batteryCapacityKwh,
                address,
                loginUrl,
                boqItems,
                commercial: transactionResult.commercial || {},
                engineering: transactionResult.engineering || {}
            });
            console.log(`[EngineeringProject] Quotation and Account Email successfully dispatched to ${clientEmail}`);
        } else {
            console.warn(`[EngineeringProject] Client email skipped: clientEmail=${clientEmail}`);
        }
    } catch (e) {
        console.error("[EngineeringProject] Client email dispatch error:", e.message);
    }

    return transactionResult;
}

/**
 * CLIENT INTAKE & PRE-ENGINEERING ASSESSMENT SERVICE
 * Handles the client intake form filled before entering ARDE Studio.
 * Saves client, creates consultation project in DB, creates notifications and activity.
 */
async function createClientIntake(payload, actorUserId = null, actorName = "Intake Specialist") {
    const {
        client = {},
        site = {},
        loadProfile = {},
        targetAction = "launch_studio"
    } = payload;

    const {
        id: existingClientId = null,
        fullName = "New Prospective Client",
        companyName = null,
        email = `client-${Date.now()}@aerenewablesolution.com`,
        phone = "+234 800 000 0000",
        address = "Site Location",
        city = "Abuja",
        state = "FCT",
        propertyType = "Residential",
        industry = null
    } = client;

    const {
        roofType = "Pitched Concrete Tile",
        usableRoofSpace = null,
        shading = "None (Full Sun)",
        gridReliability = "Band B (16-20h/day)",
        generatorKva = null,
        existingInverter = "None",
        siteNotes = null
    } = site;

    const {
        loadWatts = 5000,
        backupHours = 8,
        psh = 5.0,
        batteryType = "lithium",
        systemObjective = "24/7 Clean Power",
        timeline = "Immediate (< 2 weeks)",
        budgetTier = "Outright Purchase",
        appliances = [],
        generalNotes = null
    } = loadProfile;

    const transactionResult = await transaction(async (tx) => {
        const nameParts = fullName.trim().split(" ");
        const firstName = nameParts[0] || "Client";
        const lastName = nameParts.slice(1).join(" ") || "User";
        const defaultPassword = firstName;

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const projectCode = `PRJ-${year}${month}-${randomNum}`;
        const codeSuffix = projectCode.replace(/^PRJ-|^AE-/, "");
        const clientCode = `AE_CL${codeSuffix}`;

        // 1. Find or Provision User Account in users table
        let dbUser = null;
        if (email) {
            const userRes = await tx.query(
                `SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR (username IS NOT NULL AND LOWER(username) = LOWER($2)) LIMIT 1`,
                [email, projectCode]
            );
            dbUser = userRes.rows[0];
        }

        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        if (!dbUser) {
            const newUserRes = await tx.query(
                `
                INSERT INTO users (
                    email,
                    username,
                    password_hash,
                    first_name,
                    last_name,
                    phone,
                    role,
                    status,
                    email_verified
                ) VALUES ($1, $2, $3, $4, $5, $6, 'client', 'active', TRUE)
                RETURNING *
                `,
                [
                    email,
                    projectCode,
                    passwordHash,
                    firstName,
                    lastName,
                    phone
                ]
            );
            dbUser = newUserRes.rows[0];
        } else {
            await tx.query(
                `
                UPDATE users
                SET username = COALESCE(username, $1),
                    password_hash = $2,
                    role = 'client',
                    status = 'active',
                    email_verified = TRUE
                WHERE id = $3
                `,
                [projectCode, passwordHash, dbUser.id]
            );
        }

        // 2. Find or Provision Client in clients table
        let dbClient = null;

        if (existingClientId) {
            const cRes = await tx.query(`SELECT * FROM clients WHERE id = $1 LIMIT 1`, [existingClientId]);
            dbClient = cRes.rows[0];
        }

        if (!dbClient && email) {
            const cRes = await tx.query(`SELECT * FROM clients WHERE email = $1 OR user_id = $2 LIMIT 1`, [email, dbUser.id]);
            dbClient = cRes.rows[0];
        }

        if (!dbClient) {
            const clientType = (propertyType.toLowerCase().includes("commercial") || propertyType.toLowerCase().includes("industrial")) ? "corporate" : "individual";
            const newClientRes = await tx.query(
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
                    client_type,
                    industry,
                    status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
                RETURNING *
                `,
                [
                    dbUser.id,
                    clientCode,
                    companyName || null,
                    fullName,
                    email,
                    phone,
                    address,
                    city,
                    state,
                    clientType,
                    industry || propertyType
                ]
            );
            dbClient = newClientRes.rows[0];
        } else {
            // Update address/phone/user_id
            await tx.query(
                `UPDATE clients SET user_id = COALESCE(user_id, $1), contact_name = $2, phone = $3, address = $4, city = $5, state = $6 WHERE id = $7`,
                [dbUser.id, fullName, phone, address, city, state, dbClient.id]
            );
        }

        const projectName = `${fullName} - ${propertyType} Solar Project`;

        const preliminaryKw = +(Number(loadWatts) / 1000 * 1.25).toFixed(2);
        const preliminaryKwh = +(Number(loadWatts) * Number(backupHours) / 1000 * 1.2).toFixed(2);

        const intakeScenario = payload.intakeScenario || "full";

        const engineeringData = {
            intakeSource: "ARDE Pre-Studio Assessment",
            intakeScenario,
            propertyType,
            roofType,
            usableRoofSpace,
            shading,
            gridReliability,
            generatorKva,
            existingInverter,
            siteNotes,
            loadWatts: Number(loadWatts),
            backupHours: Number(backupHours),
            psh: Number(psh),
            batteryType,
            systemObjective,
            timeline,
            budgetTier,
            appliances,
            generalNotes,
            submittedAt: now.toISOString()
        };

        const notesFormatted = `[ARDE Intake: ${intakeScenario.toUpperCase()}] Grid: ${gridReliability}. Gen: ${generatorKva || 'None'}. Inverter: ${existingInverter}. Notes: ${siteNotes || generalNotes || 'None'}`.trim();

        const projRes = await tx.query(
            `
            INSERT INTO projects (
                project_code,
                project_name,
                description,
                client_id,
                site_address,
                city,
                state,
                country,
                project_type,
                status,
                priority,
                consultation_date,
                system_capacity_kw,
                battery_capacity_kwh,
                notes,
                engineering_data
            ) VALUES (
                $1, $2, $3, $4,
                $5, $6, $7, 'Nigeria', 'solar',
                'consultation', 'high', CURRENT_DATE,
                $8, $9,
                $10, $11
            )
            RETURNING *
            `,
            [
                projectCode,
                projectName,
                `Assessment intake for ${fullName} (${propertyType}) at ${address}. Planned load: ${loadWatts}W.`,
                dbClient.id,
                address,
                city,
                state,
                preliminaryKw,
                preliminaryKwh,
                notesFormatted,
                JSON.stringify(engineeringData)
            ]
        );

        const project = projRes.rows[0];

        const studioUrl = `/arde/studio?clientId=${dbClient.id}&projectId=${project.id}&load=${loadWatts}&backup=${backupHours}&psh=${psh}&batteryType=${batteryType}&clientName=${encodeURIComponent(fullName)}&clientEmail=${encodeURIComponent(email)}&clientPhone=${encodeURIComponent(phone)}&clientAddress=${encodeURIComponent(address)}&clientCode=${encodeURIComponent(dbClient.client_code)}&projectCode=${encodeURIComponent(projectCode)}&propertyType=${encodeURIComponent(propertyType)}`;

        return {
            client: dbClient,
            project,
            studioUrl,
            intakeScenario
        };
    });

    // Admin Notification based on intake scenario
    try {
        const adminUsers = await query(
            `SELECT id FROM users WHERE role IN ('admin', 'super_admin') AND status = 'active'`
        );

        const scenario = payload.intakeScenario || "full";
        let notifTitle = `⚡ ARDE Client Intake: ${fullName}`;
        let notifMessage = `Pre-studio assessment submitted for ${propertyType} at ${address}, ${state}. Load: ${(loadWatts / 1000).toFixed(1)}kW. Project Code: ${transactionResult.project.project_code}.`;

        const appliancesSummary = appliances && appliances.length ? appliances.join(", ") : `${loadWatts} W`;

        if (scenario === "site_only") {
            notifTitle = `🏗️ Site Survey: "I need someone to attend to me"`;
            notifMessage = `Site Survey Consultation inquiry. Grid: ${gridReliability}. Existing Generator: ${generatorKva ? generatorKva + ' kVA' : 'None'}. Inverter: ${existingInverter}. Notes: ${siteNotes || 'None'}. Client requested immediate attention via WhatsApp/Call.`;
        } else if (scenario === "energy_only") {
            notifTitle = `⚡ Energy Profiling: "I need you to call me"`;
            notifMessage = `Load sizing profile submitted: ${(loadWatts / 1000).toFixed(2)} kW. Appliances: ${appliancesSummary}. Battery: ${batteryType}. Notes: ${generalNotes || 'None'}. Reminder dispatched: "I need you to call me".`;
        } else if (scenario === "client_only") {
            notifTitle = `👤 New Client Profile: ${fullName} (${transactionResult.client.client_code})`;
            notifMessage = `Client profile registered. Contact: ${fullName}, ${phone}, ${email}. Property: ${propertyType} at ${address}, ${city}, ${state}. Client ID: ${transactionResult.client.client_code}. Studio opened.`;
        } else {
            // Full 3 cards filled
            notifTitle = `👤⚡ ARDE Intake: ${fullName} (${transactionResult.client.client_code})`;
            notifMessage = `Identity: ${fullName}, ${companyName ? companyName + ', ' : ''}${phone}, ${email}, ${propertyType}, ${address}, ${city}, ${state}. Site: Grid ${gridReliability}, Gen: ${generatorKva ? generatorKva + ' kVA' : 'None'}, Inv: ${existingInverter}, Notes: ${siteNotes || 'None'}. Consumption: ${appliancesSummary} (${(loadWatts / 1000).toFixed(2)} kW). Battery Chemistry: ${batteryType}. Client ID: ${transactionResult.client.client_code}.`;
        }

        for (const admin of adminUsers.rows) {
            await notificationService.createNotification({
                user_id: admin.id,
                type: "project",
                title: notifTitle,
                message: notifMessage,
                project_id: transactionResult.project.id,
                action_url: `/admin`,
                priority: "high"
            });
        }
    } catch (e) {
        console.warn("[EngineeringProject] Intake notification error:", e.message);
    }

    // Activity Log
    try {
        await activityService.logActivity({
            projectId: transactionResult.project.id,
            clientId: transactionResult.client.id,
            actorUserId,
            actorName,
            actorRole: "intake",
            action: "arde_intake_submitted",
            entityType: "project",
            entityId: transactionResult.project.id,
            title: `ARDE Intake Created: ${transactionResult.project.project_code}`,
            description: `Client assessment submitted for ${fullName} (${transactionResult.project.project_code}) at ${address}`,
            metadata: {
                projectCode: transactionResult.project.project_code,
                clientCode: transactionResult.client.client_code,
                propertyType,
                loadWatts,
                scenario: payload.intakeScenario || "full"
            }
        });
    } catch (e) {
        console.warn("[EngineeringProject] Intake activity error:", e.message);
    }

    return transactionResult;
}

/**
 * CLIENTS LOOKUP FOR PRE-STUDIO INTAKE AUTOCOMPLETE
 */
async function getClientsLookup(searchQuery = "") {
    const q = (searchQuery || "").trim();
    if (q) {
        const res = await query(
            `
            SELECT id, client_code, contact_name, company_name, email, phone, address, city, state, client_type
            FROM clients
            WHERE contact_name ILIKE $1 OR company_name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 OR client_code ILIKE $1
            ORDER BY created_at DESC
            LIMIT 15
            `,
            [`%${q}%`]
        );
        return res.rows;
    } else {
        const res = await query(
            `
            SELECT id, client_code, contact_name, company_name, email, phone, address, city, state, client_type
            FROM clients
            ORDER BY created_at DESC
            LIMIT 15
            `
        );
        return res.rows;
    }
}

module.exports = {
    submitEngineeringProject,
    createClientIntake,
    getClientsLookup
};

