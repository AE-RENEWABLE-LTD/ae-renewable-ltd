"use strict";

const projectService = require("../services/project.service");
const activityService = require("../services/activity.service");
const installerService = require("../services/installer.service");
const clientService = require("../services/client.service");

/* =========================================================
   AE RENEWABLE NETWORK — PROJECT CONTROLLER
   Role Isolation: Only Admin can access all records.
   Installers only access their assigned projects.
   Clients only access their own projects.
========================================================= */

async function checkProjectAccess(user, project) {
    if (!user) return false;
    if (user.role === "admin" || user.role === "staff") return true;

    if (user.role === "installer") {
        const installer = await installerService.getInstallerByUserId(user.id);
        if (!installer) return false;
        const pInstId = project.installer_id || project.assigned_installer_id;
        return Number(pInstId) === Number(installer.id);
    }

    if (user.role === "client") {
        const client = await clientService.getClientByUserId(user.id);
        if (!client) return false;
        return Number(project.client_id) === Number(client.id);
    }

    return false;
}

async function getProjects(req, res, next) {
    try {
        const filters = {
            status: req.query.status,
            projectType: req.query.projectType
        };

        if (req.user && (req.user.role === "admin" || req.user.role === "staff")) {
            // Admin has master access across all projects, can filter by any client or installer
            if (req.query.clientId) filters.clientId = req.query.clientId;
            if (req.query.installerId) filters.installerId = req.query.installerId;
        } else if (req.user && req.user.role === "installer") {
            // Standalone Installer: strictly restricted to their assigned projects
            const installer = await installerService.getInstallerByUserId(req.user.id);
            if (!installer) {
                return res.status(200).json({ success: true, data: [] });
            }
            filters.installerId = installer.id;
        } else if (req.user && req.user.role === "client") {
            // Standalone Client: strictly restricted to their own projects
            const client = await clientService.getClientByUserId(req.user.id);
            if (!client) {
                return res.status(200).json({ success: true, data: [] });
            }
            filters.clientId = client.id;
        } else {
            return res.status(403).json({
                success: false,
                message: "Access denied. Unrecognized or unauthorized role."
            });
        }

        const projects = await projectService.getProjects(filters);

        return res.status(200).json({
            success: true,
            data: projects
        });
    } catch (error) {
        next(error);
    }
}

async function getProjectById(req, res, next) {
    try {
        const project = await projectService.getProjectById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found."
            });
        }

        const hasAccess = await checkProjectAccess(req.user, project);
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: "Access denied: you do not have permission to view this project record."
            });
        }

        return res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
}

async function getProjectFullDetails(req, res, next) {
    try {
        const project = await projectService.getProjectFullDetails(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found."
            });
        }

        const hasAccess = await checkProjectAccess(req.user, project);
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: "Access denied: you do not have permission to view this project record."
            });
        }

        return res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
}

async function createProject(req, res, next) {
    try {
        const project = await projectService.createProject(req.body);

        return res.status(201).json({
            success: true,
            message: "Project created successfully.",
            data: project
        });
    } catch (error) {
        next(error);
    }
}

async function updateProject(req, res, next) {
    try {
        const project = await projectService.updateProject(req.params.id, req.body);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Project updated successfully.",
            data: project
        });
    } catch (error) {
        next(error);
    }
}

async function updateProjectStatus(req, res, next) {
    try {
        const actorName = req.user ? `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim() || req.user.username : "Admin";
        const project = await projectService.updateProjectStatus(
            req.params.id,
            req.body.status,
            req.user?.id,
            actorName
        );

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Project status updated successfully.",
            data: project
        });
    } catch (error) {
        next(error);
    }
}

async function assignInstaller(req, res, next) {
    try {
        const { installerId } = req.body;
        if (!installerId) {
            return res.status(400).json({
                success: false,
                message: "installerId is required."
            });
        }

        const actorName = req.user ? `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim() || "Admin" : "Admin";
        const project = await projectService.assignInstaller(
            req.params.id,
            installerId,
            req.user?.id,
            actorName
        );

        return res.status(200).json({
            success: true,
            message: "Installer assigned successfully.",
            data: project
        });
    } catch (error) {
        next(error);
    }
}

async function acceptProject(req, res, next) {
    try {
        const actorName = req.user ? `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim() || "Installer" : "Installer";
        const project = await projectService.acceptProject(
            req.params.id,
            req.user?.id,
            actorName
        );

        return res.status(200).json({
            success: true,
            message: "Project accepted and work commenced.",
            data: project
        });
    } catch (error) {
        next(error);
    }
}

async function submitEvidence(req, res, next) {
    try {
        let evidenceData = { ...req.body };
        if (req.file) {
            evidenceData.image_url = `/uploads/${req.file.filename}`;
            evidenceData.file_size_bytes = req.file.size;
            evidenceData.mime_type = req.file.mimetype;
            if (!evidenceData.caption) evidenceData.caption = req.file.originalname;
        }
        const result = await projectService.submitEvidence(
            req.params.id,
            req.user?.id,
            evidenceData
        );

        return res.status(201).json({
            success: true,
            message: "Evidence image submitted successfully.",
            data: result
        });
    } catch (error) {
        next(error);
    }
}

async function reviewEvidence(req, res, next) {
    try {
        const actorName = req.user ? `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim() || "Admin" : "Admin";
        const result = await projectService.reviewEvidence(
            req.params.id,
            req.params.evidenceId,
            req.user?.id,
            actorName,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: `Evidence marked as ${req.body.status}.`,
            data: result
        });
    } catch (error) {
        next(error);
    }
}

async function requestPayment(req, res, next) {
    try {
        const payment = await projectService.requestPayment(
            req.params.id,
            req.user?.id,
            req.body
        );

        return res.status(201).json({
            success: true,
            message: "Milestone payment requested successfully.",
            data: payment
        });
    } catch (error) {
        next(error);
    }
}

async function approvePayment(req, res, next) {
    try {
        const actorName = req.user ? `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim() || "Admin" : "Admin";
        const payment = await projectService.approvePayment(
            req.params.id,
            req.params.paymentId,
            req.user?.id,
            actorName,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Payment approved successfully. Project completed.",
            data: payment
        });
    } catch (error) {
        next(error);
    }
}

async function createClientAccount(req, res, next) {
    try {
        const actorName = req.user ? `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim() || "Admin" : "Admin";
        const result = await projectService.createClientAccount(
            req.params.id,
            req.user?.id,
            actorName
        );

        return res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}

async function getProjectActivities(req, res, next) {
    try {
        const project = await projectService.getProjectById(req.params.id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found."
            });
        }

        const hasAccess = await checkProjectAccess(req.user, project);
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: "Access denied: you do not have permission to view activity for this project."
            });
        }

        const activities = await activityService.getProjectActivities(req.params.id);
        return res.status(200).json({
            success: true,
            data: activities
        });
    } catch (error) {
        next(error);
    }
}

/* =========================================================
   BARGAIN NEGOTIATION HANDLERS
========================================================= */

async function submitBargain(req, res, next) {
    try {
        const project = await projectService.getProjectById(req.params.id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found."
            });
        }

        const hasAccess = await checkProjectAccess(req.user, project);
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: "Access denied: you cannot bargain on this project record."
            });
        }

        const actorName = req.user
            ? `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim() || req.user.username || "Client"
            : "Client";

        const updatedProject = await projectService.submitBargain(req.params.id, {
            proposedAmount: req.body.proposedAmount ?? req.body.proposed_amount,
            clientNote: req.body.clientNote ?? req.body.note ?? req.body.client_note,
            userId: req.user?.id,
            userRole: req.user?.role || "client",
            actorName
        });

        return res.status(200).json({
            success: true,
            message: "Bargain proposal submitted successfully for Admin review.",
            data: updatedProject
        });
    } catch (error) {
        next(error);
    }
}

async function acceptBargain(req, res, next) {
    try {
        const actorName = req.user
            ? `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim() || "Admin"
            : "Admin";

        const updatedProject = await projectService.acceptBargain(req.params.id, {
            adminId: req.user?.id,
            adminName: actorName,
            adminNote: req.body.note || req.body.adminNote
        });

        return res.status(200).json({
            success: true,
            message: "Client bargain offer accepted. Contract value updated successfully.",
            data: updatedProject
        });
    } catch (error) {
        next(error);
    }
}

async function rejectBargain(req, res, next) {
    try {
        const actorName = req.user
            ? `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim() || "Admin"
            : "Admin";

        const updatedProject = await projectService.rejectBargain(req.params.id, {
            adminId: req.user?.id,
            adminName: actorName,
            reason: req.body.reason || req.body.note
        });

        return res.status(200).json({
            success: true,
            message: "Client bargain offer rejected.",
            data: updatedProject
        });
    } catch (error) {
        next(error);
    }
}

async function clientAcceptOriginalQuotation(req, res, next) {
    try {
        const actorName = req.user
            ? `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim() || "Client"
            : "Client";

        const updatedProject = await projectService.clientAcceptOriginalQuotation(req.params.id, {
            userId: req.user?.id,
            clientName: actorName
        });

        return res.status(200).json({
            success: true,
            message: "Original quotation total accepted. Project is now active and installer assigned.",
            data: updatedProject
        });
    } catch (error) {
        next(error);
    }
}

async function deleteProject(req, res, next) {
    try {
        const project = await projectService.deleteProject(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Project deleted successfully."
        });
    } catch (error) {
        next(error);
    }
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
    getProjectActivities,
    submitBargain,
    acceptBargain,
    rejectBargain,
    clientAcceptOriginalQuotation,
    deleteProject
};
