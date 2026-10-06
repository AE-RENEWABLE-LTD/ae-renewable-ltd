"use strict";

const engineeringService = require("../services/engineering.service");
const engineeringProjectService = require("../services/engineering-project.service");

async function calculateSystem(req, res, next) {
    try {
        const result = await engineeringService.calculateSystem(req.body);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

async function submitEngineeringProject(req, res, next) {
    try {
        const actorName = req.user ? `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim() || req.user.username : "ARDE User";
        const result = await engineeringProjectService.submitEngineeringProject(
            req.body,
            req.user?.id,
            actorName
        );

        return res.status(201).json({
            success: true,
            message: "Project and Quotation successfully created and submitted to Admin Control Centre.",
            data: result
        });
    } catch (error) {
        next(error);
    }
}

async function createClientIntake(req, res, next) {
    try {
        const actorName = req.user ? `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim() || req.user.username : "Intake Specialist";
        const result = await engineeringProjectService.createClientIntake(
            req.body,
            req.user?.id,
            actorName
        );

        return res.status(201).json({
            success: true,
            message: "Client intake assessment successfully logged and project created in database.",
            data: result
        });
    } catch (error) {
        next(error);
    }
}

async function getClientsLookup(req, res, next) {
    try {
        const query = req.query.q || "";
        const clients = await engineeringProjectService.getClientsLookup(query);
        return res.status(200).json({
            success: true,
            data: {
                clients
            }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    calculateSystem,
    submitEngineeringProject,
    createClientIntake,
    getClientsLookup
};
