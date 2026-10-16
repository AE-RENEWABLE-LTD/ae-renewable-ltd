"use strict";

const paymentService =
    require("../services/payment.service");
const clientService =
    require("../services/client.service");
const projectService =
    require("../services/project.service");
const installerService =
    require("../services/installer.service");
const notificationService =
    require("../services/notification.service");
const activityService =
    require("../services/activity.service");
const { query } =
    require("../config/database");

/* =========================================================
   AE RENEWABLE NETWORK
   PAYMENT CONTROLLER
========================================================= */

async function checkPaymentAccess(user, payment) {
    if (!user) return false;
    if (user.role === "admin" || user.role === "super_admin" || user.role === "staff") return true;

    if (user.role === "client") {
        const client = await clientService.getClientByUserId(user.id);
        if (!client) return false;
        return Number(payment.client_id) === Number(client.id);
    }

    if (user.role === "installer") {
        const installer = await installerService.getInstallerByUserId(user.id);
        if (!installer || !payment.project_id) return false;
        const project = await projectService.getProjectById(payment.project_id);
        if (!project) return false;
        const pInstId = project.installer_id || project.assigned_installer_id;
        return Number(pInstId) === Number(installer.id);
    }

    return false;
}

/* =========================================================
   GET ALL PAYMENTS
========================================================= */

async function getPayments(req, res, next) {
    try {
        const filters = { ...req.query };

        if (req.user && (req.user.role === "admin" || req.user.role === "staff")) {
            if (req.query.clientId) filters.clientId = req.query.clientId;
            if (req.query.projectId) filters.projectId = req.query.projectId;
        } else if (req.user && req.user.role === "client") {
            const client = await clientService.getClientByUserId(req.user.id);
            if (!client) {
                return res.status(200).json({
                    success: true,
                    message: "Payments retrieved successfully.",
                    data: {
                        payments: [],
                        count: 0
                    }
                });
            }
            filters.clientId = client.id;
        } else if (req.user && req.user.role === "installer") {
            if (req.query.projectId) filters.projectId = req.query.projectId;
        }

        const payments =
            await paymentService.getPayments(
                filters
            );

        return res.status(200).json({
            success: true,
            message: "Payments retrieved successfully.",
            data: {
                payments,
                count: payments.length
            }
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   GET PAYMENT BY ID
========================================================= */

async function getPaymentById(req, res, next) {
    try {
        const payment =
            await paymentService.getPaymentById(
                req.params.id
            );

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found."
            });
        }

        const hasAccess = await checkPaymentAccess(req.user, payment);
        if (!hasAccess) {
            console.warn(`[SECURITY AUDIT] Unauthorized payment access attempt: user_id=${req.user?.id}, role=${req.user?.role}, payment_id=${payment.id}`);
            return res.status(403).json({
                success: false,
                message: "Access denied: you do not have permission to view this payment record."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Payment retrieved successfully.",
            data: payment
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   GET PAYMENT BY REFERENCE
========================================================= */

async function getPaymentByReference(
    req,
    res,
    next
) {
    try {
        const payment =
            await paymentService.getPaymentByReference(
                req.params.paymentReference
            );

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found."
            });
        }

        const hasAccess = await checkPaymentAccess(req.user, payment);
        if (!hasAccess) {
            console.warn(`[SECURITY AUDIT] Unauthorized payment reference access attempt: user_id=${req.user?.id}, role=${req.user?.role}, ref=${req.params.paymentReference}`);
            return res.status(403).json({
                success: false,
                message: "Access denied: you do not have permission to view this payment record."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Payment retrieved successfully.",
            data: payment
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   CREATE PAYMENT
========================================================= */

async function createPayment(req, res, next) {
    try {
        let {
            paymentReference,
            clientId,
            projectId,
            quotationId,
            amount,
            currency = "NGN",
            paymentMethod = "bank_transfer",
            paymentStatus = "pending",
            transactionReference,
            transactionDate,
            description,
            notes,
            receiptUrl
        } = req.body;

        amount = Number(amount || 0);
        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "A positive payment amount is required."
            });
        }

        let client = null;
        if (req.user && req.user.role === "client") {
            client = await clientService.getClientByUserId(req.user.id);
            if (client) {
                clientId = client.id;
            }
        } else if (clientId) {
            client = await clientService.getClientById(clientId);
        }

        // Fallback: If clientId not resolved yet, extract from project or auto-ensure
        if (!clientId && projectId) {
            const project = await projectService.getProjectById(projectId);
            if (project && project.client_id) {
                clientId = project.client_id;
                client = await clientService.getClientById(clientId);
            }
            if (project && project.quotation_id && !quotationId) {
                quotationId = project.quotation_id;
            }
        }

        if (!clientId && req.user) {
            client = await clientService.getClientByUserId(req.user.id);
            if (client) clientId = client.id;
        }

        if (!clientId) {
            const anyClient = await query(`SELECT id FROM clients ORDER BY id ASC LIMIT 1`);
            if (anyClient.rows[0]) clientId = anyClient.rows[0].id;
        }

        // Validate 80% minimum initial payment policy if linked to a project
        if (projectId) {
            const project = await projectService.getProjectById(projectId);
            if (project) {
                const contractVal = Number(project.contract_value || project.original_contract_value || project.estimated_value || 0);
                const currentPaid = Number(project.amount_paid || 0);

                // If this is the initial payment (currentPaid == 0) and project has a contract value:
                if (currentPaid <= 0 && contractVal > 0) {
                    const min80 = Math.round(contractVal * 0.80);
                    if (amount < min80) {
                        return res.status(400).json({
                            success: false,
                            message: `AE Renewable Policy: Initial deposit requires at least 80% (₦${min80.toLocaleString("en-NG", { minimumFractionDigits: 2 })}) of the total contract value (₦${contractVal.toLocaleString("en-NG", { minimumFractionDigits: 2 })}).`
                        });
                    }
                }
            }
        }

        if (!paymentReference) {
            paymentReference = `PAY-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        const payment = await paymentService.createPayment({
            paymentReference,
            clientId,
            projectId,
            quotationId,
            amount,
            currency,
            paymentMethod,
            paymentStatus,
            transactionReference,
            transactionDate: transactionDate || new Date(),
            description,
            notes,
            receiptUrl
        });

        // 1. If linked to a project, activate project tracking and open for installer proving
        let project = null;
        if (projectId) {
            const pRes = await query(`
                SELECT p.*, i.user_id AS installer_user_id, i.contact_name AS installer_name
                FROM projects p
                LEFT JOIN installers i ON i.id = p.installer_id
                WHERE p.id = $1
            `, [projectId]);
            project = pRes.rows[0];

            if (project) {
                // Ensure project status is active for tracking / proving
                const newStatus = ["consultation", "quotation", "pending"].includes(project.status) ? "in_progress" : project.status;
                await query(`
                    UPDATE projects 
                    SET status = $1, 
                        updated_at = CURRENT_TIMESTAMP 
                    WHERE id = $2
                `, [newStatus, projectId]);
                // Note: Installer is NOT notified here; notification is sent ONLY when Admin verifies payment
            }
        }

        // 2. Notify Admin & Staff of payment submission and tracking commencement
        const clientDisplayName = client ? (client.contact_name || client.company_name || client.email) : (req.user?.full_name || "Client");
        const adminUsers = await query(`SELECT id FROM users WHERE role IN ('admin', 'staff') AND status = 'active'`);
        
        for (const admin of adminUsers.rows) {
            await notificationService.createNotification({
                user_id: admin.id,
                type: "payment",
                title: `💳 Payment Received: ₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
                message: `${clientDisplayName} submitted payment proof for ₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })} via ${paymentMethod.replace(/_/g, ' ')}. Project tracking started & opened for installer proving.`,
                client_id: clientId || null,
                project_id: projectId || null,
                payment_id: payment.id,
                action_url: `/admin/dashboard#payments`,
                action_label: "Verify Payment",
                priority: "high"
            });
        }

        // 3. Notify Client confirming payment submission & live tracking launch
        const clientUserId = client?.user_id || (req.user?.role === "client" ? req.user.id : null);
        if (clientUserId) {
            await notificationService.createNotification({
                user_id: clientUserId,
                type: "payment",
                title: `💳 Payment Received: ₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
                message: `Your payment record has been received! Site tracking has started and your assigned installer is authorized to begin milestone photo proving.`,
                client_id: clientId || null,
                project_id: projectId || null,
                payment_id: payment.id,
                action_url: `/client/dashboard#monitoring`,
                action_label: "Track Live Progress",
                priority: "high"
            });
        }

        // 4. Log Activity
        await activityService.logActivity({
            projectId: projectId || null,
            actorUserId: req.user ? req.user.id : null,
            actorName: clientDisplayName,
            actorRole: req.user ? req.user.role : "client",
            action: "payment_submitted",
            entityType: "payment",
            entityId: payment.id,
            title: `Payment Submitted: ₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
            description: `Payment recorded via ${paymentMethod} with ref "${transactionReference || paymentReference}". Tracking started & installer project opened for proving.`,
            metadata: { paymentId: payment.id, amount, method: paymentMethod, reference: transactionReference }
        });

        return res.status(201).json({
            success: true,
            message: "Payment submitted successfully. Live tracking has started and project is open for proving.",
            data: payment
        });
    } catch (error) {
        next(error);
    }
}

/* =========================================================
   UPDATE PAYMENT
========================================================= */

async function updatePayment(req, res, next) {
    try {
        const payment =
            await paymentService.updatePayment(
                req.params.id,
                req.body
            );

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Payment updated successfully.",
            data: payment
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   UPDATE PAYMENT STATUS
========================================================= */

async function updatePaymentStatus(
    req,
    res,
    next
) {
    try {
        const {
            paymentStatus
        } = req.body;

        if (!paymentStatus) {
            return res.status(400).json({
                success: false,
                message: "Payment status is required."
            });
        }

        const payment =
            await paymentService.updatePaymentStatus(
                req.params.id,
                paymentStatus
            );

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Payment status updated successfully.",
            data: payment
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   VERIFY PAYMENT
========================================================= */

async function verifyPayment(req, res, next) {
    try {
        const payment =
            await paymentService.verifyPayment(
                req.params.id,
                req.user.id
            );

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found."
            });
        }

        // Update project financial ledger if payment is linked to a project
        let newBalanceDue = 0;
        let newAmountPaid = 0;

        if (payment.project_id) {
            const sumRes = await query(
                `SELECT COALESCE(SUM(amount), 0) AS total_paid FROM payments WHERE project_id = $1 AND (verified = true OR payment_status IN ('completed', 'paid', 'successful'))`,
                [payment.project_id]
            );
            newAmountPaid = Number(sumRes.rows[0]?.total_paid || 0);

            const projRes = await query(`SELECT * FROM projects WHERE id = $1`, [payment.project_id]);
            if (projRes.rows[0]) {
                const contractVal = Number(projRes.rows[0].contract_value || projRes.rows[0].original_contract_value || projRes.rows[0].estimated_value || 0);
                newBalanceDue = Math.max(0, contractVal - newAmountPaid);

                await query(
                    `UPDATE projects SET amount_paid = $1, balance_due = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
                    [newAmountPaid, newBalanceDue, payment.project_id]
                );
            }
        }

        // Notify Client
        if (payment.client_id) {
            const client = await clientService.getClientById(payment.client_id);
            if (client && client.user_id) {
                const balNotice = newBalanceDue > 0 ? ` Outstanding balance: ₦${newBalanceDue.toLocaleString("en-NG", { minimumFractionDigits: 2 })}.` : " Project is fully paid!";
                await notificationService.createNotification({
                    user_id: client.user_id,
                    type: "payment",
                    title: `✅ Payment Verified: ₦${Number(payment.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
                    message: `Your payment of ₦${Number(payment.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })} has been confirmed by AE Renewable Finance.${balNotice}`,
                    client_id: client.id,
                    project_id: payment.project_id || null,
                    payment_id: payment.id,
                    action_url: `/client/dashboard#payments`,
                    action_label: "View Statement",
                    priority: "high"
                });
            }
        }

        // Assign nearest certified installer & notify upon Admin payment verification
        if (payment.project_id) {
            const pRes = await query(`
                SELECT p.*, i.user_id AS installer_user_id, i.contact_name AS installer_name, i.phone AS installer_phone,
                       c.contact_name AS client_name, c.company_name AS client_company, c.user_id AS client_user_id,
                       c.phone AS client_phone, c.email AS client_email
                FROM projects p
                LEFT JOIN installers i ON i.id = p.installer_id
                LEFT JOIN clients c ON c.id = p.client_id
                WHERE p.id = $1
            `, [payment.project_id]);
            const proj = pRes.rows[0];

            if (proj) {
                let installer = null;
                let installerId = proj.installer_id;
                let laborPayment = Number(proj.installer_payout || 0);

                // If installer not assigned yet, match nearest certified installer now that payment is verified!
                if (!installerId) {
                    const matchedInstaller = await projectService.findNearestInstallerForProject({
                        localGovernment: proj.local_government || proj.city,
                        city: proj.city,
                        state: proj.state,
                        country: proj.country || "Nigeria"
                    });

                    if (matchedInstaller) {
                        installerId = matchedInstaller.id;
                        installer = matchedInstaller;
                        const capacityKw = Number(proj.system_capacity_kw || 5);
                        laborPayment = Math.round(Number(proj.contract_value || 0) * 0.15) || Math.max(120000, Math.round(capacityKw * 30000));

                        await query(`
                            UPDATE projects SET
                                installer_id = $1,
                                installer_payout = $2,
                                status = 'installer_assigned',
                                assigned_at = CURRENT_TIMESTAMP,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE id = $3
                        `, [installerId, laborPayment, proj.id]);
                    }
                } else {
                    const instRes = await query(`SELECT * FROM installers WHERE id = $1`, [installerId]);
                    installer = instRes.rows[0];
                }

                const installerName = installer?.company_name || installer?.contact_name || "Lead Installer";
                const installerUserId = installer?.user_id;

                // Notify Assigned Installer: Available Job & Site Tracking open
                if (installerUserId) {
                    const capacityKw = Number(proj.system_capacity_kw || 5);
                    await notificationService.createNotification({
                        user_id: installerUserId,
                        type: "job",
                        title: `⚡ Available Job: ${capacityKw}kW Solar Installation (${proj.project_code || 'PRJ-' + proj.id})`,
                        message: `Payment verified & Job confirmed for ${proj.project_code || 'PRJ-' + proj.id}:\n• System Capacity: ${capacityKw}kW System\n• Labor Payout: ₦${laborPayment.toLocaleString("en-NG", { minimumFractionDigits: 2 })}\n• Installation Site: ${proj.site_address || proj.city || 'Abuja'}\n• Client: ${proj.client_name || proj.client_company || 'Client'} | Phone: ${proj.client_phone || '08133615131'} | Email: ${proj.client_email || 'client@aerenewable.com'}. Site tracking is live!`,
                        project_id: payment.project_id,
                        action_url: `/installer/portal.html?project=${payment.project_id}#site-tracking`,
                        action_label: "Open Project Tracking",
                        priority: "urgent"
                    });
                }

                // Notify Client: Certified installer assigned!
                const clientUserId = proj.client_user_id || payment.client_id;
                if (clientUserId && installer) {
                    await notificationService.createNotification({
                        user_id: clientUserId,
                        type: "project",
                        title: `👷 Certified Installer Assigned: ${installerName}`,
                        message: `Payment verified! Certified installer ${installerName} (Phone: ${installer.phone || '08133615131'}) has been assigned to your solar installation (${proj.project_code}). Live tracking is active!`,
                        project_id: payment.project_id,
                        action_url: `/client/dashboard#installation`,
                        action_label: "View Assigned Installer",
                        priority: "high"
                    });
                }
            }
        }

        // Log activity
        await activityService.logActivity({
            projectId: payment.project_id || null,
            actorUserId: req.user.id,
            actorName: req.user.full_name || "Admin",
            actorRole: req.user.role || "admin",
            action: "payment_verified",
            entityType: "payment",
            entityId: payment.id,
            title: `Payment Verified: ₦${Number(payment.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
            description: `Payment reference "${payment.payment_reference}" verified by finance. Updated balance due: ₦${newBalanceDue.toLocaleString("en-NG", { minimumFractionDigits: 2 })}.`,
            metadata: { paymentId: payment.id, amount: payment.amount, balanceDue: newBalanceDue, amountPaid: newAmountPaid }
        });

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully. Financial balances updated.",
            data: {
                payment,
                amountPaid: newAmountPaid,
                balanceDue: newBalanceDue
            }
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   UNVERIFY PAYMENT
========================================================= */

async function unverifyPayment(
    req,
    res,
    next
) {
    try {
        const payment =
            await paymentService.unverifyPayment(
                req.params.id
            );

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Payment verification removed successfully.",
            data: payment
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   DELETE PAYMENT
========================================================= */

async function deletePayment(req, res, next) {
    try {
        const payment =
            await paymentService.deletePayment(
                req.params.id
            );

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Payment deleted successfully.",
            data: payment
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    getPayments,
    getPaymentById,
    getPaymentByReference,
    createPayment,
    updatePayment,
    updatePaymentStatus,
    verifyPayment,
    unverifyPayment,
    deletePayment
};