"use strict";

const { query } = require("../config/database");

/**
 * AE RENEWABLE LTD - ROUND-THE-CLOCK & OPERATIONS PIPELINE TELEMETRY SERVICE
 * Purely live, responsive database telemetry across:
 * 1. Engine (ARDE Studio, Sizing, Profiling, Intake)
 * 2. Installer (Field Quotes, Assignments, Certifications)
 * 3. Client (Portal Logins, Consultations, Approvals, Payments)
 * 4. Admin (Command Center Approvals, System Operations)
 */

async function getRoundClockActivity() {
    try {
        const now = new Date();
        const currentHour = now.getHours();

        // 1. Query real DB events recorded in the activities table
        const actRes = await query(`
            SELECT 
                EXTRACT(HOUR FROM created_at)::int AS hour,
                CASE 
                    WHEN actor_role IN ('engineer', 'engine', 'intake', 'system') 
                         OR action LIKE 'arde_%' 
                         OR action LIKE 'sizing_%' 
                         OR title ILIKE '%arde%' 
                         OR title ILIKE '%profiling%' THEN 'engine'
                    WHEN actor_role = 'installer' 
                         OR action LIKE 'installer_%' 
                         OR installer_id IS NOT NULL THEN 'installer'
                    WHEN actor_role = 'client' 
                         OR action LIKE 'client_%' 
                         OR client_id IS NOT NULL THEN 'client'
                    WHEN actor_role IN ('admin', 'staff') 
                         OR action LIKE 'admin_%' THEN 'admin'
                    ELSE 'engine'
                END AS pillar,
                COUNT(*)::int AS count
            FROM activities
            WHERE created_at >= NOW() - INTERVAL '24 hours'
            GROUP BY EXTRACT(HOUR FROM created_at)::int, pillar
        `);

        // 2. Query quotations created in the last 24h
        const quoteRes = await query(`
            SELECT 
                EXTRACT(HOUR FROM created_at)::int AS hour,
                COUNT(*)::int AS count
            FROM quotations
            WHERE created_at >= NOW() - INTERVAL '24 hours'
            GROUP BY EXTRACT(HOUR FROM created_at)::int
        `);

        // 3. Query payments in the last 24h
        const payRes = await query(`
            SELECT 
                EXTRACT(HOUR FROM COALESCE(transaction_date, created_at))::int AS hour,
                COUNT(*)::int AS count
            FROM payments
            WHERE COALESCE(transaction_date, created_at) >= NOW() - INTERVAL '24 hours'
            GROUP BY EXTRACT(HOUR FROM COALESCE(transaction_date, created_at))::int
        `);

        // 4. Query projects created in the last 24h
        const projRes = await query(`
            SELECT 
                EXTRACT(HOUR FROM created_at)::int AS hour,
                COUNT(*)::int AS count
            FROM projects
            WHERE created_at >= NOW() - INTERVAL '24 hours'
            GROUP BY EXTRACT(HOUR FROM created_at)::int
        `);

        // Index real DB counts by [hour][pillar]
        const realMap = {};
        for (let h = 0; h < 24; h++) {
            realMap[h] = { engine: 0, installer: 0, client: 0, admin: 0 };
        }

        actRes.rows.forEach(r => {
            if (r.hour >= 0 && r.hour < 24 && realMap[r.hour]) {
                const p = r.pillar || "engine";
                realMap[r.hour][p] = (realMap[r.hour][p] || 0) + (Number(r.count) || 0);
            }
        });

        quoteRes.rows.forEach(r => {
            if (r.hour >= 0 && r.hour < 24 && realMap[r.hour]) {
                realMap[r.hour].installer += Math.ceil((Number(r.count) || 0) * 0.7);
                realMap[r.hour].client += Math.floor((Number(r.count) || 0) * 0.3);
            }
        });

        payRes.rows.forEach(r => {
            if (r.hour >= 0 && r.hour < 24 && realMap[r.hour]) {
                realMap[r.hour].client += Number(r.count) || 0;
                realMap[r.hour].admin += Number(r.count) || 0;
            }
        });

        projRes.rows.forEach(r => {
            if (r.hour >= 0 && r.hour < 24 && realMap[r.hour]) {
                realMap[r.hour].engine += Number(r.count) || 0;
                realMap[r.hour].installer += Number(r.count) || 0;
            }
        });

        let totalEngine = 0;
        let totalInstaller = 0;
        let totalClient = 0;
        let totalAdmin = 0;
        let peakHour = currentHour;
        let peakVolume = 0;

        const hourly = [];
        for (let h = 0; h < 24; h++) {
            const hourLabel = `${String(h).padStart(2, "0")}:00`;
            const eCount = realMap[h].engine;
            const iCount = realMap[h].installer;
            const cCount = realMap[h].client;
            const aCount = realMap[h].admin;
            const hTotal = eCount + iCount + cCount + aCount;

            totalEngine += eCount;
            totalInstaller += iCount;
            totalClient += cCount;
            totalAdmin += aCount;

            if (hTotal > peakVolume) {
                peakVolume = hTotal;
                peakHour = h;
            }

            hourly.push({
                hour: h,
                label: hourLabel,
                engine: eCount,
                installer: iCount,
                client: cCount,
                admin: aCount,
                total: hTotal
            });
        }

        const totalEvents = totalEngine + totalInstaller + totalClient + totalAdmin;
        const currentHourObj = hourly[currentHour] || hourly[0];

        const pillarTotals = [
            { name: "Engine (ARDE)", count: totalEngine, key: "engine" },
            { name: "Client Portal", count: totalClient, key: "client" },
            { name: "Installer Field", count: totalInstaller, key: "installer" },
            { name: "Admin Operations", count: totalAdmin, key: "admin" }
        ].sort((a, b) => b.count - a.count);

        const dominantPillar = totalEvents > 0
            ? `${pillarTotals[0].name} & ${pillarTotals[1].name}`
            : "Standby (Live Telemetry Active)";

        return {
            summary: {
                total_24h_events: totalEvents,
                engine: {
                    total: totalEngine,
                    percentage: totalEvents > 0 ? Math.round((totalEngine / totalEvents) * 100) : 0,
                    active_now: totalEngine > 0,
                    label: "Engine (ARDE & Sizing)",
                    color: "#8b5cf6"
                },
                installer: {
                    total: totalInstaller,
                    percentage: totalEvents > 0 ? Math.round((totalInstaller / totalEvents) * 100) : 0,
                    active_now: totalInstaller > 0,
                    label: "Installer Portal & Field",
                    color: "#f59e0b"
                },
                client: {
                    total: totalClient,
                    percentage: totalEvents > 0 ? Math.round((totalClient / totalEvents) * 100) : 0,
                    active_now: totalClient > 0,
                    label: "Client Portal & Inquiries",
                    color: "#10b981"
                },
                admin: {
                    total: totalAdmin,
                    percentage: totalEvents > 0 ? Math.round((totalAdmin / totalEvents) * 100) : 0,
                    active_now: totalAdmin > 0,
                    label: "Admin Operations Console",
                    color: "#004aad"
                },
                current_hour: currentHour,
                current_hour_events: currentHourObj.total,
                peak_hour: `${String(peakHour).padStart(2, "0")}:00`,
                peak_hour_volume: peakVolume,
                dominant_pillar: dominantPillar,
                generated_at: now.toISOString()
            },
            hourly
        };

    } catch (err) {
        console.error("[TrackingService] Failed to generate round-the-clock telemetry:", err.message);
        return generateFallbackActivity();
    }
}

function generateFallbackActivity() {
    const now = new Date();
    const currentHour = now.getHours();
    const hourly = [];

    for (let h = 0; h < 24; h++) {
        hourly.push({
            hour: h,
            label: `${String(h).padStart(2, "0")}:00`,
            engine: 0,
            installer: 0,
            client: 0,
            admin: 0,
            total: 0
        });
    }

    return {
        summary: {
            total_24h_events: 0,
            engine: { total: 0, percentage: 0, active_now: false, label: "Engine (ARDE & Sizing)", color: "#8b5cf6" },
            installer: { total: 0, percentage: 0, active_now: false, label: "Installer Portal & Field", color: "#f59e0b" },
            client: { total: 0, percentage: 0, active_now: false, label: "Client Portal & Inquiries", color: "#10b981" },
            admin: { total: 0, percentage: 0, active_now: false, label: "Admin Operations Console", color: "#004aad" },
            current_hour: currentHour,
            current_hour_events: 0,
            peak_hour: `${String(currentHour).padStart(2, "0")}:00`,
            peak_hour_volume: 0,
            dominant_pillar: "Standby (Live Telemetry Active)",
            generated_at: now.toISOString()
        },
        hourly
    };
}

/**
 * Operations tracking: Quotation, Project, and Installer velocity & lifecycle pipeline
 * 100% Real Live Database Data - Zero Hardcoding
 */
async function getOperationsTracking() {
    try {
        const [quoteRes, projRes, instRes, quoteTimeRes, projTimeRes, instTimeRes] = await Promise.all([
            query(`
                SELECT 
                    COUNT(*)::int AS total,
                    COALESCE(SUM(total_amount), 0)::numeric AS total_value,
                    COUNT(*) FILTER (WHERE status = 'accepted')::int AS accepted,
                    COUNT(*) FILTER (WHERE status IN ('pending', 'draft', 'negotiation', 'sent'))::int AS pending,
                    COUNT(*) FILTER (WHERE status IN ('rejected', 'cancelled', 'expired'))::int AS rejected
                FROM quotations
            `),
            query(`
                SELECT 
                    COUNT(*)::int AS total,
                    COUNT(*) FILTER (WHERE status IN ('completed', 'commissioned'))::int AS completed,
                    COUNT(*) FILTER (WHERE status NOT IN ('completed', 'commissioned', 'cancelled'))::int AS active,
                    COALESCE(SUM(system_capacity_kw), 0)::numeric AS total_capacity_kw
                FROM projects
            `),
            query(`
                SELECT 
                    COUNT(*)::int AS total,
                    COUNT(*) FILTER (WHERE verification_status = 'verified')::int AS verified,
                    COUNT(*) FILTER (WHERE verification_status = 'pending')::int AS pending,
                    COUNT(*) FILTER (WHERE status = 'active')::int AS active
                FROM installers
            `),
            query(`
                SELECT 
                    TO_CHAR(d, 'Dy') AS day_name,
                    d::date AS date_val,
                    COUNT(q.id)::int AS count,
                    COALESCE(SUM(q.total_amount), 0)::numeric AS amount
                FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval) d
                LEFT JOIN quotations q ON q.created_at::date = d::date
                GROUP BY d
                ORDER BY d ASC
            `),
            query(`
                SELECT 
                    TO_CHAR(d, 'Dy') AS day_name,
                    d::date AS date_val,
                    COUNT(p.id)::int AS count
                FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval) d
                LEFT JOIN projects p ON p.created_at::date = d::date
                GROUP BY d
                ORDER BY d ASC
            `),
            query(`
                SELECT 
                    TO_CHAR(d, 'Dy') AS day_name,
                    d::date AS date_val,
                    COUNT(i.id)::int AS count
                FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval) d
                LEFT JOIN installers i ON i.created_at::date = d::date
                GROUP BY d
                ORDER BY d ASC
            `)
        ]);

        const qData = quoteRes.rows[0] || {};
        const pData = projRes.rows[0] || {};
        const iData = instRes.rows[0] || {};

        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const timeline = [];

        for (let idx = 0; idx < 7; idx++) {
            const qRow = quoteTimeRes.rows[idx] || {};
            const pRow = projTimeRes.rows[idx] || {};
            const iRow = instTimeRes.rows[idx] || {};

            let fallbackDay = "";
            const d = new Date();
            d.setDate(d.getDate() - (6 - idx));
            fallbackDay = dayNames[d.getDay()];

            const rawDayName = qRow.day_name ? qRow.day_name.trim() : null;
            const dayLabel = rawDayName || fallbackDay;
            timeline.push({
                label: dayLabel,
                date: qRow.date_val || d.toISOString().split("T")[0],
                is_today: idx === 6,
                quotations: Number(qRow.count) || 0,
                projects: Number(pRow.count) || 0,
                installers: Number(iRow.count) || 0,
                value: Number(qRow.amount) || 0
            });
        }

        const totalQ = Number(qData.total) || 0;
        const acceptedQ = Number(qData.accepted) || 0;
        const pendingQ = Number(qData.pending) || 0;
        const rejectedQ = Number(qData.rejected) || 0;
        const totalValQ = Number(qData.total_value) || 0;
        const qAcceptRate = totalQ > 0 ? `${Math.round((acceptedQ / totalQ) * 100)}%` : "0%";

        const totalP = Number(pData.total) || 0;
        const activeP = Number(pData.active) || 0;
        const completedP = Number(pData.completed) || 0;
        const totalCapKw = Number(parseFloat(pData.total_capacity_kw || 0).toFixed(1));
        const pCompRate = totalP > 0 ? `${Math.round((completedP / totalP) * 100)}%` : "0%";
        const pActiveRate = totalP > 0 ? `${Math.round((activeP / totalP) * 100)}%` : "0%";

        const totalI = Number(iData.total) || 0;
        const verifiedI = Number(iData.verified) || 0;
        const pendingI = Number(iData.pending) || 0;
        const activeI = Number(iData.active) || 0;
        const iVerifyRate = totalI > 0 ? `${Math.round((verifiedI / totalI) * 100)}%` : "0%";

        return {
            summary: {
                quotations: {
                    total: totalQ,
                    total_value: totalValQ,
                    accepted: acceptedQ,
                    pending: pendingQ,
                    rejected: rejectedQ,
                    acceptance_rate: qAcceptRate
                },
                projects: {
                    total: totalP,
                    active: activeP,
                    completed: completedP,
                    total_capacity_kw: totalCapKw,
                    completion_rate: pCompRate,
                    active_rate: pActiveRate
                },
                installers: {
                    total: totalI,
                    verified: verifiedI,
                    pending: pendingI,
                    active: activeI,
                    verification_rate: iVerifyRate
                }
            },
            timeline
        };
    } catch (err) {
        console.error("[TrackingService] Failed to generate operations pipeline tracking:", err.message);
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const fallbackTimeline = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            fallbackTimeline.push({
                label: dayNames[d.getDay()],
                date: d.toISOString().split("T")[0],
                is_today: i === 0,
                quotations: 0,
                projects: 0,
                installers: 0,
                value: 0
            });
        }
        return {
            summary: {
                quotations: { total: 0, total_value: 0, accepted: 0, pending: 0, rejected: 0, acceptance_rate: "0%" },
                projects: { total: 0, active: 0, completed: 0, total_capacity_kw: 0.0, completion_rate: "0%", active_rate: "0%" },
                installers: { total: 0, verified: 0, pending: 0, active: 0, verification_rate: "0%" }
            },
            timeline: fallbackTimeline
        };
    }
}

module.exports = {
    getRoundClockActivity,
    getOperationsTracking
};
