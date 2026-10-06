"use strict";

const paymentService =
    require("../services/payment.service");
const clientService =
    require("../services/client.service");
const projectService =
    require("../services/project.service");
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

        // 1. Notify Admin & Staff of payment submission
        const clientDisplayName = client ? (client.contact_name || client.company_name || client.email) : (req.user?.full_name || "Client");
        const adminUsers = await query(`SELECT id FROM users WHERE role IN ('admin', 'staff') AND status = 'active'`);
        
        for (const admin of adminUsers.rows) {
            await notificationService.createNotification({
                user_id: admin.id,
                type: "payment",
                title: `💳 New Payment: ₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
                message: `${clientDisplayName} submitted a payment proof for ₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })} via ${paymentMethod.replace(/_/g, ' ')}. Please review and verify.`,
                client_id: clientId || null,
                project_id: projectId || null,
                payment_id: payment.id,
                action_url: `/admin/dashboard#payments`,
                action_label: "Verify Payment",
                priority: "high"
            });
        }

        // 2. Log Activity
        await activityService.logActivity({
            projectId: projectId || null,
            actorUserId: req.user ? req.user.id : null,
            actorName: clientDisplayName,
            actorRole: req.user ? req.user.role : "client",
            action: "payment_submitted",
            entityType: "payment",
            entityId: payment.id,
            title: `Payment Submitted: ₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
            description: `Payment recorded via ${paymentMethod} with ref "${transactionReference || paymentReference}". Awaiting finance confirmation.`,
            metadata: { paymentId: payment.id, amount, method: paymentMethod, reference: transactionReference }
        });

        return res.status(201).json({
            success: true,
            message: "Payment submitted successfully. Awaiting admin verification.",
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