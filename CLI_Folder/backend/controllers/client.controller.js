"use strict";

const clientService = require("../services/client.service");
const { query } = require("../config/database");

/* =========================================================
   AE RENEWABLE NETWORK
   CLIENT CONTROLLER
========================================================= */

/* =========================================================
   GET CURRENT CLIENT
   GET /api/clients/me
========================================================= */

async function getMyClient(req, res, next) {
    try {
        const client = await clientService.getClientByUserId(
            req.user.id
        );

        if (!client) {
            return res.status(404).json({
                success: false,
                message: "Client profile not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Client profile retrieved successfully.",
            data: {
                client
            }
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   GET CLIENT BY ID
   GET /api/clients/:id
========================================================= */

async function getClientById(req, res, next) {
    try {
        const clientId = Number(req.params.id);

        if (!Number.isInteger(clientId) || clientId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid client ID."
            });
        }

        const client = await clientService.getClientById(
            clientId
        );

        if (!client) {
            return res.status(404).json({
                success: false,
                message: "Client not found."
            });
        }

        // Standalone authorization check
        if (req.user && req.user.role !== "admin" && req.user.role !== "staff") {
            if (req.user.role === "client") {
                if (Number(client.user_id) !== Number(req.user.id)) {
                    return res.status(403).json({
                        success: false,
                        message: "Access denied: you can only view your own client profile."
                    });
                }
            } else {
                return res.status(403).json({
                    success: false,
                    message: "Access denied: installers and other roles cannot access client records."
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Client retrieved successfully.",
            data: {
                client
            }
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   GET CLIENT BY CODE
   GET /api/clients/code/:clientCode
========================================================= */

async function getClientByCode(req, res, next) {
    try {
        const clientCode = req.params.clientCode;

        if (!clientCode || !clientCode.trim()) {
            return res.status(400).json({
                success: false,
                message: "Client code is required."
            });
        }

        const client = await clientService.getClientByCode(
            clientCode.trim()
        );

        if (!client) {
            return res.status(404).json({
                success: false,
                message: "Client not found."
            });
        }

        // Standalone authorization check
        if (req.user && req.user.role !== "admin" && req.user.role !== "staff") {
            if (req.user.role === "client") {
                if (Number(client.user_id) !== Number(req.user.id)) {
                    return res.status(403).json({
                        success: false,
                        message: "Access denied: you can only view your own client profile."
                    });
                }
            } else {
                return res.status(403).json({
                    success: false,
                    message: "Access denied: installers and other roles cannot access client records."
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Client retrieved successfully.",
            data: {
                client
            }
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   GET ALL CLIENTS
   GET /api/clients
========================================================= */

async function getAllClients(req, res, next) {
    try {
        const clients = await clientService.getAllClients();

        return res.status(200).json({
            success: true,
            message: "Clients retrieved successfully.",
            data: {
                clients,
                count: clients.length
            }
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   CREATE CLIENT
   POST /api/clients
========================================================= */

async function createClient(req, res, next) {
    try {
        const {
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
        } = req.body;

        if (!clientCode) {
            return res.status(400).json({
                success: false,
                message: "Client code is required."
            });
        }

        if (!contactName && !companyName) {
            return res.status(400).json({
                success: false,
                message:
                    "Company name or contact name is required."
            });
        }

        const existingClient =
            await clientService.getClientByCode(
                clientCode.trim()
            );

        if (existingClient) {
            return res.status(409).json({
                success: false,
                message: "Client code already exists."
            });
        }

        const client = await clientService.createClient({
            userId: req.user.id,
            clientCode: clientCode.trim(),
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
            status: status || "active",
            profileImage,
            notes
        });

        return res.status(201).json({
            success: true,
            message: "Client created successfully.",
            data: {
                client
            }
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   UPDATE CURRENT CLIENT
   PATCH /api/clients/me
========================================================= */

async function updateMyClient(req, res, next) {
    try {
        const existingClient =
            await clientService.getClientByUserId(
                req.user.id
            );

        if (!existingClient) {
            return res.status(404).json({
                success: false,
                message: "Client profile not found."
            });
        }

        const client =
            await clientService.updateClientByUserId(
                req.user.id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message: "Client profile updated successfully.",
            data: {
                client
            }
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   UPDATE CLIENT BY ID
   PATCH /api/clients/:id
========================================================= */

async function updateClient(req, res, next) {
    try {
        const clientId = Number(req.params.id);

        if (!Number.isInteger(clientId) || clientId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid client ID."
            });
        }

        const existingClient =
            await clientService.getClientById(clientId);

        if (!existingClient) {
            return res.status(404).json({
                success: false,
                message: "Client not found."
            });
        }

        const client =
            await clientService.updateClient(
                clientId,
                req.body
            );

        return res.status(200).json({
            success: true,
            message: "Client updated successfully.",
            data: {
                client
            }
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   DELETE CLIENT
   DELETE /api/clients/:id
========================================================= */

async function deleteClient(req, res, next) {
    try {
        const clientId = Number(req.params.id);

        if (!Number.isInteger(clientId) || clientId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid client ID."
            });
        }

        const existingClient =
            await clientService.getClientById(clientId);

        if (!existingClient) {
            return res.status(404).json({
                success: false,
                message: "Client not found."
            });
        }

        await clientService.deleteClient(clientId);

        return res.status(200).json({
            success: true,
            message: "Client deleted successfully."
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   EXPORT
========================================================= */


/* =========================================================
   WEEKLY MAINTENANCE CHECK-UP (CLIENT PORTAL)
========================================================= */

async function getActiveWeeklyMaintenance(req, res, next) {
    try {
        const userId = req.user.id;
        const clRes = await query("SELECT id FROM clients WHERE user_id = $1 LIMIT 1", [userId]);
        if (!clRes.rows.length) {
            return res.status(200).json({ success: true, data: null });
        }
        const clientId = clRes.rows[0].id;

        const checkupRes = await query(`
            SELECT * FROM weekly_maintenance_checkups
            WHERE client_id = $1
            ORDER BY created_at DESC
            LIMIT 1
        `, [clientId]);

        return res.status(200).json({
            success: true,
            data: checkupRes.rows[0] || null
        });
    } catch (error) {
        next(error);
    }
}

async function submitWeeklyMaintenanceReply(req, res, next) {
    try {
        const userId = req.user.id;
        const { checkupId, systemCondition, clientReply } = req.body || {};

        const clRes = await query("SELECT id, contact_name FROM clients WHERE user_id = $1 LIMIT 1", [userId]);
        const client = clRes.rows[0];

        if (checkupId) {
            await query(`
                UPDATE weekly_maintenance_checkups
                SET system_condition = $1,
                    client_reply = $2,
                    reply_status = 'replied',
                    replied_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
            `, [systemCondition || "Normal", clientReply, checkupId]);
        } else if (client) {
            await query(`
                INSERT INTO weekly_maintenance_checkups (
                    client_id,
                    subject,
                    message,
                    system_condition,
                    client_reply,
                    reply_status,
                    replied_at
                ) VALUES ($1, 'Client Weekly System Report', 'Direct weekly write-up from client portal', $2, $3, 'replied', CURRENT_TIMESTAMP)
            `, [client.id, systemCondition || "Normal", clientReply]);
        }

        // Notify admins
        const adminUsers = await query("SELECT id FROM users WHERE role IN ('admin', 'super_admin') AND status = 'active'");
        for (const admin of adminUsers.rows) {
            await query(`
                INSERT INTO notifications (
                    user_id,
                    type,
                    title,
                    message,
                    action_url,
                    priority
                ) VALUES ($1, 'support', $2, $3, '/admin', 'high')
            `, [
                admin.id,
                `⚡ Client Maintenance Report: ${client ? client.contact_name : 'Client'}`,
                `Weekly report submitted: "${clientReply ? clientReply.substring(0, 100) : 'System OK'}..."`
            ]);
        }

        return res.status(200).json({
            success: true,
            message: "Weekly write-up report submitted successfully. Thank you for keeping your solar profile updated!"
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getMyClient,
    getClientById,
    getClientByCode,
    getAllClients,
    createClient,
    updateMyClient,
    updateClient,
    deleteClient,
    getActiveWeeklyMaintenance,
    submitWeeklyMaintenanceReply
};