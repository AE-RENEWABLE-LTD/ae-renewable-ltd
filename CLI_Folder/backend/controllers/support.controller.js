"use strict";

const SupportTicket = require("../models/SupportTicket");
const generateId = require("../utils/generateId");
const pool = require("../config/database");
const notificationService = require("../services/notification.service");
const activityService = require("../services/activity.service");

/**
 * =========================================================
 * AE RENEWABLE NETWORK
 * SUPPORT TICKET CONTROLLER
 * =========================================================
 *
 * Handles:
 * - Ticket creation
 * - User ticket retrieval
 * - Single ticket retrieval
 * - Ticket lookup by number
 * - Staff/admin ticket listing
 * - Ticket updates
 * - Ticket assignment
 * - Ticket status transitions
 * - Ticket deletion
 * - Ticket statistics
 *
 * =========================================================
 */


/**
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

const PRIVILEGED_ROLES = [
    "admin",
    "staff"
];

const VALID_STATUSES = [
    "open",
    "in_progress",
    "pending",
    "resolved",
    "closed",
    "cancelled"
];

const VALID_PRIORITIES = [
    "low",
    "normal",
    "high",
    "urgent"
];

const VALID_CATEGORIES = [
    "general",
    "technical",
    "billing",
    "installation",
    "maintenance",
    "quotation",
    "project",
    "account",
    "complaint",
    "other"
];


/**
 * =========================================================
 * HELPER: CHECK PRIVILEGED ROLE
 * =========================================================
 */

const isPrivilegedUser = (req) => {
    return PRIVILEGED_ROLES.includes(req.user.role);
};


/**
 * =========================================================
 * HELPER: VALIDATE TICKET ID
 * =========================================================
 */

const getTicketId = (req) => {
    const ticketId = Number(req.params.id);

    return Number.isInteger(ticketId) && ticketId > 0
        ? ticketId
        : null;
};


/**
 * =========================================================
 * HELPER: CHECK TICKET OWNERSHIP
 * =========================================================
 */

const canAccessTicket = (req, ticket) => {

    if (isPrivilegedUser(req)) {
        return true;
    }

    return (
        Number(ticket.user_id) ===
        Number(req.user.id)
    );
};


/**
 * =========================================================
 * CREATE SUPPORT TICKET
 * =========================================================
 *
 * POST /api/support
 */

const createTicket = async (req, res) => {

    try {

        const userId = req.user.id;

        const {
            subject,
            description,
            category = "general",
            priority = "normal",
            client_id = null,
            project_id = null,
            request_type = null,
            phone = null,
            email = null,
            full_name = null,
            contact_method = null
        } = req.body;


        /**
         * -----------------------------------------------------
         * SUBJECT VALIDATION
         * -----------------------------------------------------
         */

        if (
            typeof subject !== "string" ||
            !subject.trim()
        ) {

            return res.status(400).json({
                success: false,
                message: "Ticket subject is required."
            });
        }


        /**
         * -----------------------------------------------------
         * DESCRIPTION VALIDATION
         * -----------------------------------------------------
         */

        if (
            typeof description !== "string" ||
            !description.trim()
        ) {

            return res.status(400).json({
                success: false,
                message: "Ticket description is required."
            });
        }


        /**
         * -----------------------------------------------------
         * CATEGORY & PRIORITY VALIDATION
         * -----------------------------------------------------
         */

        const safeCategory = (typeof category === "string" && VALID_CATEGORIES.includes(category))
            ? category
            : "general";

        const safePriority = (typeof priority === "string" && VALID_PRIORITIES.includes(priority))
            ? priority
            : "normal";


        /**
         * -----------------------------------------------------
         * RESOLVE CLIENT & CONTACT DETAILS
         * -----------------------------------------------------
         */

        let clientRecord = null;
        if (userId) {
            try {
                const clientQuery = await pool.query(
                    `SELECT id, contact_name, company_name, email, phone FROM clients WHERE user_id = $1 LIMIT 1`,
                    [userId]
                );
                if (clientQuery.rows.length > 0) {
                    clientRecord = clientQuery.rows[0];
                }
            } catch (_) {}
        }

        const resolvedClientId = client_id || clientRecord?.id || null;
        const clientName = full_name?.trim() || clientRecord?.company_name || clientRecord?.contact_name || req.user.name || req.user.email?.split("@")[0] || "Client";
        const clientPhone = phone?.trim() || clientRecord?.phone || "Phone Not Provided";
        const clientEmail = email?.trim() || clientRecord?.email || req.user.email || "Email Not Provided";
        const reqType = request_type?.trim() || (safeCategory === "maintenance" ? "Maintenance" : (safeCategory === "installation" ? "Site Survey" : (safeCategory === "technical" ? "System Upgrade" : "Solar Consultation")));
        const preferredContact = contact_method?.trim() || "Urgent Phone Call & Consultation";


        /**
         * -----------------------------------------------------
         * GENERATE TICKET NUMBER
         * -----------------------------------------------------
         */

        const ticketNumber = generateId("TKT");


        /**
         * -----------------------------------------------------
         * CREATE TICKET IN DATABASE
         * -----------------------------------------------------
         */

        const formattedDescription = `[Request Type: ${reqType}]\n${description.trim()}\n\nContact Information:\nClient Name: ${clientName}\nPhone: ${clientPhone}\nEmail: ${clientEmail}\nPreferred Action: ${preferredContact}`;

        const ticket = await SupportTicket.create({

            ticket_number: ticketNumber,

            subject: subject.trim(),

            description: formattedDescription,

            category: safeCategory,

            priority: safePriority,

            user_id: userId,

            client_id: resolvedClientId,

            project_id: project_id ? Number(project_id) : null,

            assigned_to: null

        });


        /**
         * -----------------------------------------------------
         * TRIGGER ADMIN NOTIFICATION FOR CALL & ACTION
         * -----------------------------------------------------
         */

        try {
            const adminUsers = await pool.query(
                `SELECT id FROM users WHERE role IN ('admin', 'super_admin') AND status = 'active'`
            );

            const adminNoticeTitle = `📞 Client Call Request: ${reqType} — ${clientName}`;
            const adminNoticeMessage = `Request Type: ${reqType}\nSubject: ${subject.trim()}\nDetails: ${description.trim()}\n\nContact:\nPhone: ${clientPhone}\nEmail: ${clientEmail}\nAction: ${preferredContact}`;

            for (const admin of adminUsers.rows) {
                await notificationService.createNotification({
                    user_id: admin.id,
                    type: "support",
                    title: adminNoticeTitle,
                    message: adminNoticeMessage,
                    client_id: resolvedClientId,
                    project_id: project_id ? Number(project_id) : null,
                    action_url: `/admin`,
                    action_label: `Call ${clientPhone}`,
                    priority: (safePriority === "urgent" || reqType === "System Upgrade" || reqType === "Maintenance") ? "high" : "normal"
                });
            }
        } catch (adminErr) {
            console.warn("[SupportController] Admin notification notice:", adminErr.message);
        }


        /**
         * -----------------------------------------------------
         * NOTIFY CLIENT
         * -----------------------------------------------------
         */

        try {
            await notificationService.createNotification({
                user_id: userId,
                type: "support",
                title: `Request Dispatched: ${ticketNumber}`,
                message: `Your ${reqType} request "${subject.trim()}" has been received. Our engineering and admin desk will call you directly at ${clientPhone}.`,
                client_id: resolvedClientId,
                project_id: project_id ? Number(project_id) : null,
                action_url: `/client/portal`,
                priority: "normal"
            });
        } catch (clientErr) {
            console.warn("[SupportController] Client notification notice:", clientErr.message);
        }


        /**
         * -----------------------------------------------------
         * LOG OPERATIONAL ACTIVITY (Cross-Portal Stream)
         * -----------------------------------------------------
         */

        try {
            await activityService.logActivity({
                projectId: project_id ? Number(project_id) : null,
                actorUserId: userId,
                actorName: clientName,
                actorRole: "client",
                action: "SERVICE_REQUEST_SUBMITTED",
                entityType: "support_ticket",
                entityId: ticket.id,
                title: `📞 Service Request: ${reqType}`,
                description: `${subject.trim()} — ${description.trim()} (Phone: ${clientPhone}, Email: ${clientEmail})`,
                metadata: {
                    ticketNumber,
                    requestType: reqType,
                    subject: subject.trim(),
                    details: description.trim(),
                    phone: clientPhone,
                    email: clientEmail,
                    contactMethod: preferredContact
                }
            });
        } catch (actErr) {
            console.warn("[SupportController] Activity log notice:", actErr.message);
        }


        return res.status(201).json({

            success: true,

            message:
                "Service request submitted successfully. AE Admin and Engineering team have been alerted for a direct call.",

            data: {
                ...ticket,
                request_type: reqType,
                phone: clientPhone,
                email: clientEmail,
                full_name: clientName,
                contact_method: preferredContact
            }

        });

    } catch (error) {

        console.error(
            "Create support ticket error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to create support ticket."

        });
    }
};


/**
 * =========================================================
 * GET MY TICKETS
 * =========================================================
 *
 * GET /api/support/my
 */

const getMyTickets = async (req, res) => {

    try {

        const userId = req.user.id;


        let limit =
            Number.parseInt(
                req.query.limit,
                10
            );

        let offset =
            Number.parseInt(
                req.query.offset,
                10
            );


        if (
            !Number.isInteger(limit) ||
            limit <= 0
        ) {

            limit = 50;
        }


        if (
            !Number.isInteger(offset) ||
            offset < 0
        ) {

            offset = 0;
        }


        /**
         * Prevent excessively large requests.
         */

        limit = Math.min(limit, 100);


        const tickets =
            await SupportTicket.findByUserId(
                userId,
                {
                    limit,
                    offset
                }
            );


        return res.status(200).json({

            success: true,

            count: tickets.length,

            limit,

            offset,

            data: tickets

        });

    } catch (error) {

        console.error(
            "Get my support tickets error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to retrieve support tickets."

        });
    }
};


/**
 * =========================================================
 * GET ONE TICKET
 * =========================================================
 *
 * GET /api/support/:id
 */

const getTicket = async (req, res) => {

    try {

        const userId = req.user.id;

        const ticketId = getTicketId(req);


        if (!ticketId) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid ticket ID."

            });
        }


        const ticket =
            await SupportTicket.findById(
                ticketId
            );


        if (!ticket) {

            return res.status(404).json({

                success: false,

                message:
                    "Support ticket not found."

            });
        }


        if (
            !isPrivilegedUser(req) &&
            Number(ticket.user_id) !==
                Number(userId)
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not authorized to view this ticket."

            });
        }


        return res.status(200).json({

            success: true,

            data: ticket

        });

    } catch (error) {

        console.error(
            "Get support ticket error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to retrieve support ticket."

        });
    }
};


/**
 * =========================================================
 * GET TICKET BY TICKET NUMBER
 * =========================================================
 *
 * GET /api/support/ticket/:ticketNumber
 *
 * Must remain BEFORE /:id
 */

const getTicketByNumber = async (req, res) => {

    try {

        const {
            ticketNumber
        } = req.params;


        if (
            typeof ticketNumber !== "string" ||
            !ticketNumber.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Ticket number is required."

            });
        }


        const ticket =
            await SupportTicket.findByTicketNumber(
                ticketNumber.trim()
            );


        if (!ticket) {

            return res.status(404).json({

                success: false,

                message:
                    "Support ticket not found."

            });
        }


        if (!canAccessTicket(req, ticket)) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not authorized to view this ticket."

            });
        }


        return res.status(200).json({

            success: true,

            data: ticket

        });

    } catch (error) {

        console.error(
            "Get support ticket by number error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to retrieve support ticket."

        });
    }
};


/**
 * =========================================================
 * GET ALL TICKETS
 * =========================================================
 *
 * GET /api/support
 *
 * ADMIN / STAFF ONLY
 */

const getAllTickets = async (req, res) => {

    try {

        if (!isPrivilegedUser(req)) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not authorized to view all support tickets."

            });
        }


        let limit =
            Number.parseInt(
                req.query.limit,
                10
            );

        let offset =
            Number.parseInt(
                req.query.offset,
                10
            );


        if (
            !Number.isInteger(limit) ||
            limit <= 0
        ) {

            limit = 50;
        }


        if (
            !Number.isInteger(offset) ||
            offset < 0
        ) {

            offset = 0;
        }


        limit = Math.min(limit, 100);


        const {
            status = null,
            priority = null,
            category = null,
            assigned_to = null
        } = req.query;


        if (
            status &&
            !VALID_STATUSES.includes(status)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid support ticket status."

            });
        }


        if (
            priority &&
            !VALID_PRIORITIES.includes(priority)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid support ticket priority."

            });
        }


        if (
            category &&
            !VALID_CATEGORIES.includes(category)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid support ticket category."

            });
        }


        let assignedTo = null;


        if (assigned_to !== undefined) {

            if (
                assigned_to !== null &&
                assigned_to !== ""
            ) {

                assignedTo =
                    Number(assigned_to);


                if (
                    !Number.isInteger(assignedTo) ||
                    assignedTo <= 0
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Invalid assigned user ID."

                    });
                }
            }
        }


        const tickets =
            await SupportTicket.findAll({

                status,

                priority,

                category,

                assignedTo,

                limit,

                offset

            });


        return res.status(200).json({

            success: true,

            count: tickets.length,

            limit,

            offset,

            data: tickets

        });

    } catch (error) {

        console.error(
            "Get all support tickets error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to retrieve support tickets."

        });
    }
};


/**
 * =========================================================
 * UPDATE TICKET
 * =========================================================
 *
 * PUT /api/support/:id
 *
 * Users may update their own ticket.
 * Staff/admin may update any ticket.
 *
 * Status and assignment are intentionally excluded.
 * Use the dedicated endpoints for those operations.
 */

const updateTicket = async (req, res) => {

    try {

        const ticketId = getTicketId(req);


        if (!ticketId) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid ticket ID."

            });
        }


        const existingTicket =
            await SupportTicket.findById(
                ticketId
            );


        if (!existingTicket) {

            return res.status(404).json({

                success: false,

                message:
                    "Support ticket not found."

            });
        }


        if (!canAccessTicket(
            req,
            existingTicket
        )) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not authorized to update this ticket."

            });
        }


        const allowedFields = [
            "subject",
            "description",
            "category",
            "priority",
            "client_id",
            "project_id"
        ];


        const updateData = {};


        for (const field of allowedFields) {

            if (
                Object.prototype.hasOwnProperty.call(
                    req.body,
                    field
                )
            ) {

                updateData[field] =
                    req.body[field];
            }
        }


        /**
         * -----------------------------------------------------
         * VALIDATE UPDATED SUBJECT
         * -----------------------------------------------------
         */

        if (
            Object.prototype.hasOwnProperty.call(
                updateData,
                "subject"
            )
        ) {

            if (
                typeof updateData.subject !== "string" ||
                !updateData.subject.trim()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Ticket subject cannot be empty."

                });
            }

            updateData.subject =
                updateData.subject.trim();
        }


        /**
         * -----------------------------------------------------
         * VALIDATE UPDATED DESCRIPTION
         * -----------------------------------------------------
         */

        if (
            Object.prototype.hasOwnProperty.call(
                updateData,
                "description"
            )
        ) {

            if (
                typeof updateData.description !== "string" ||
                !updateData.description.trim()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Ticket description cannot be empty."

                });
            }

            updateData.description =
                updateData.description.trim();
        }


        /**
         * -----------------------------------------------------
         * VALIDATE CATEGORY
         * -----------------------------------------------------
         */

        if (
            updateData.category &&
            !VALID_CATEGORIES.includes(
                updateData.category
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid support ticket category."

            });
        }


        /**
         * -----------------------------------------------------
         * VALIDATE PRIORITY
         * -----------------------------------------------------
         */

        if (
            updateData.priority &&
            !VALID_PRIORITIES.includes(
                updateData.priority
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid support ticket priority."

            });
        }


        if (
            Object.keys(updateData).length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "No valid ticket fields were provided for update."

            });
        }


        const ticket =
            await SupportTicket.update(
                ticketId,
                updateData
            );


        return res.status(200).json({

            success: true,

            message:
                "Support ticket updated successfully.",

            data: ticket

        });

    } catch (error) {

        console.error(
            "Update support ticket error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to update support ticket."

        });
    }
};


/**
 * =========================================================
 * ASSIGN TICKET
 * =========================================================
 *
 * PATCH /api/support/:id/assign
 *
 * ADMIN / STAFF ONLY
 */

const assignTicket = async (req, res) => {

    try {

        if (!isPrivilegedUser(req)) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not authorized to assign support tickets."

            });
        }


        const ticketId = getTicketId(req);

        const assignedTo =
            Number(req.body.assigned_to);


        if (!ticketId) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid ticket ID."

            });
        }


        if (
            !Number.isInteger(assignedTo) ||
            assignedTo <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Valid assigned user ID is required."

            });
        }


        const ticket =
            await SupportTicket.assign(
                ticketId,
                assignedTo
            );


        if (!ticket) {

            return res.status(404).json({

                success: false,

                message:
                    "Support ticket not found."

            });
        }


        return res.status(200).json({

            success: true,

            message:
                "Support ticket assigned successfully.",

            data: ticket

        });

    } catch (error) {

        console.error(
            "Assign support ticket error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to assign support ticket."

        });
    }
};


/**
 * =========================================================
 * UPDATE TICKET STATUS
 * =========================================================
 *
 * PATCH /api/support/:id/status
 */

const updateTicketStatus = async (req, res) => {

    try {

        const ticketId = getTicketId(req);

        const {
            status
        } = req.body;


        if (!ticketId) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid ticket ID."

            });
        }


        if (
            typeof status !== "string" ||
            !VALID_STATUSES.includes(status)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid support ticket status."

            });
        }


        const existingTicket =
            await SupportTicket.findById(
                ticketId
            );


        if (!existingTicket) {

            return res.status(404).json({

                success: false,

                message:
                    "Support ticket not found."

            });
        }


        /**
         * -----------------------------------------------------
         * ONLY OWNER OR PRIVILEGED USER
         * -----------------------------------------------------
         */

        if (!canAccessTicket(
            req,
            existingTicket
        )) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not authorized to update this ticket status."

            });
        }


        const ticket =
            await SupportTicket.updateStatus(
                ticketId,
                status
            );


        if (!ticket) {

            return res.status(404).json({

                success: false,

                message:
                    "Support ticket not found."

            });
        }


        return res.status(200).json({

            success: true,

            message:
                "Support ticket status updated successfully.",

            data: ticket

        });

    } catch (error) {

        console.error(
            "Update support ticket status error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to update support ticket status.",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined

        });
    }
};


/**
 * =========================================================
 * DELETE TICKET
 * =========================================================
 *
 * DELETE /api/support/:id
 */

const deleteTicket = async (req, res) => {

    try {

        const ticketId = getTicketId(req);


        if (!ticketId) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid ticket ID."

            });
        }


        const existingTicket =
            await SupportTicket.findById(
                ticketId
            );


        if (!existingTicket) {

            return res.status(404).json({

                success: false,

                message:
                    "Support ticket not found."

            });
        }


        if (!canAccessTicket(
            req,
            existingTicket
        )) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not authorized to delete this ticket."

            });
        }


        const deletedTicket =
            await SupportTicket.delete(
                ticketId
            );


        if (!deletedTicket) {

            return res.status(404).json({

                success: false,

                message:
                    "Support ticket not found."

            });
        }


        return res.status(200).json({

            success: true,

            message:
                "Support ticket deleted successfully.",

            data: deletedTicket

        });

    } catch (error) {

        console.error(
            "Delete support ticket error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to delete support ticket."

        });
    }
};


/**
 * =========================================================
 * GET TICKET STATISTICS
 * =========================================================
 *
 * GET /api/support/statistics
 *
 * ADMIN / STAFF ONLY
 */

const getStatistics = async (req, res) => {

    try {

        if (!isPrivilegedUser(req)) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not authorized to view support ticket statistics."

            });
        }


        const statistics =
            await SupportTicket.getStatistics();


        return res.status(200).json({

            success: true,

            data: statistics

        });

    } catch (error) {

        console.error(
            "Get support ticket statistics error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to retrieve support ticket statistics."

        });
    }
};


/**
 * =========================================================
 * EXPORT
 * =========================================================
 */

module.exports = {

    createTicket,

    getMyTickets,

    getTicket,

    getTicketByNumber,

    getAllTickets,

    updateTicket,

    assignTicket,

    updateTicketStatus,

    deleteTicket,

    getStatistics

};