"use strict";

const { query } = require("../config/database");
const activityService = require("./activity.service");
const notificationService = require("./notification.service");

/**
 * AE RENEWABLE AUTOMATION & SCHEDULED JOBS ENGINE
 * Executes event-driven rules and background maintenance routines.
 */

/* =========================================================
   1. QUOTATION EXPIRY CHECK
========================================================= */
async function checkQuotationExpiries() {
    try {
        const expiredRes = await query(
            `
            UPDATE quotations
            SET status = 'expired', updated_at = CURRENT_TIMESTAMP
            WHERE valid_until < CURRENT_TIMESTAMP
              AND status IN ('draft', 'issued', 'sent')
            RETURNING id, quotation_code, title, client_id
            `
        );

        if (expiredRes.rowCount > 0) {
            console.log(`[Automation] Marked ${expiredRes.rowCount} quotations as expired.`);
            for (const q of expiredRes.rows) {
                await activityService.logActivity({
                    action: "quotation_expired",
                    entityType: "quotation",
                    entityId: q.id,
                    title: `Quotation Expired: ${q.quotation_code}`,
                    description: `Quotation "${q.title}" exceeded validity period and was automatically marked expired.`,
                    metadata: { quotationCode: q.quotation_code }
                });
            }
        }
        return expiredRes.rowCount;
    } catch (err) {
        console.error("[Automation] checkQuotationExpiries error:", err.message);
        return 0;
    }
}

/* =========================================================
   2. OVERDUE PROJECT CHECK
========================================================= */
async function checkOverdueProjects() {
    try {
        const overdueRes = await query(
            `
            SELECT id, project_code, project_name, expected_completion_date
            FROM projects
            WHERE expected_completion_date < CURRENT_TIMESTAMP
              AND status IN ('in_progress', 'scheduled', 'evidence_review')
              AND priority != 'urgent'
            `
        );

        for (const proj of overdueRes.rows) {
            await query(
                `UPDATE projects SET priority = 'urgent', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                [proj.id]
            );

            await activityService.logActivity({
                projectId: proj.id,
                action: "project_overdue_flagged",
                entityType: "project",
                entityId: proj.id,
                title: `Project Flagged Overdue: ${proj.project_code}`,
                description: `Project "${proj.project_name}" passed expected completion date without finalization. Priority elevated to URGENT.`,
                metadata: { expectedDate: proj.expected_completion_date }
            });
        }

        return overdueRes.rowCount;
    } catch (err) {
        console.error("[Automation] checkOverdueProjects error:", err.message);
        return 0;
    }
}

/* =========================================================
   3. "WHILE YOU SLEEP" OPERATIONAL SUMMARY
========================================================= */
async function getWhileYouSleepSummary(hoursBack = 24) {
    const sinceTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    const [newProjects, newQuotations, pendingApprovals, recentActivities, alerts] = await Promise.all([
        query(
            `SELECT id, project_code, project_name, contract_value, status, created_at FROM projects WHERE created_at >= $1 ORDER BY created_at DESC`,
            [sinceTime]
        ),
        query(
            `SELECT id, quotation_code, total_amount, status, created_at FROM quotations WHERE created_at >= $1 ORDER BY created_at DESC`,
            [sinceTime]
        ),
        query(
            `
            SELECT
                (SELECT COUNT(*) FROM projects WHERE status = 'admin_review') AS projects_awaiting_review,
                (SELECT COUNT(*) FROM project_evidence WHERE review_status = 'pending') AS evidence_awaiting_review,
                (SELECT COUNT(*) FROM payments WHERE payment_status = 'requested') AS payments_awaiting_approval
            `
        ),
        query(
            `SELECT * FROM activities WHERE created_at >= $1 ORDER BY created_at DESC LIMIT 20`,
            [sinceTime]
        ),
        query(
            `SELECT id, project_code, project_name FROM projects WHERE priority = 'urgent' AND status != 'completed'`
        )
    ]);

    return {
        periodHours: hoursBack,
        newProjects: newProjects.rows,
        newQuotations: newQuotations.rows,
        pendingApprovals: pendingApprovals.rows[0],
        recentActivities: recentActivities.rows,
        urgentAlerts: alerts.rows
    };
}

/* =========================================================
   4. SCHEDULER INITIALIZATION
========================================================= */
let schedulerInterval = null;

function initScheduler(intervalMs = 60000 * 30) { // Every 30 minutes
    if (schedulerInterval) return;

    console.log("[Automation] Background automation scheduler initialized.");

    // Run initial checks on start
    checkQuotationExpiries();
    checkOverdueProjects();

    schedulerInterval = setInterval(async () => {
        console.log("[Automation] Running scheduled background jobs...");
        await checkQuotationExpiries();
        await checkOverdueProjects();
    }, intervalMs);
}

function stopScheduler() {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
    }
}

module.exports = {
    checkQuotationExpiries,
    checkOverdueProjects,
    getWhileYouSleepSummary,
    initScheduler,
    stopScheduler
};
