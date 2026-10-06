"use strict";

/* =========================================================
   AE RENEWABLE NETWORK
   PROJECT MODEL
========================================================= */

class Project {
    constructor(data = {}) {
        /* =====================================================
           IDENTITY
        ===================================================== */

        this.id = data.id || null;

        this.projectCode =
            data.projectCode ||
            data.project_code ||
            null;

        this.projectName =
            data.projectName ||
            data.project_name ||
            "";

        this.description =
            data.description ||
            null;

        /* =====================================================
           RELATIONSHIPS
        ===================================================== */

        this.clientId =
            data.clientId ||
            data.client_id ||
            null;

        this.installerId =
            data.installerId ||
            data.installer_id ||
            null;

        /* =====================================================
           LOCATION
        ===================================================== */

        this.siteAddress =
            data.siteAddress ||
            data.site_address ||
            null;

        this.city =
            data.city ||
            null;

        this.state =
            data.state ||
            null;

        this.localGovernment =
            data.localGovernment ||
            data.local_government ||
            null;

        this.country =
            data.country ||
            "Nigeria";

        /* =====================================================
           PROJECT TYPE
        ===================================================== */

        this.projectType =
            data.projectType ||
            data.project_type ||
            "solar";

        /* =====================================================
           STATUS / PRIORITY
        ===================================================== */

        this.status =
            data.status ||
            "consultation";

        this.priority =
            data.priority ||
            "normal";

        /* =====================================================
           PROJECT DATES
        ===================================================== */

        this.consultationDate =
            data.consultationDate ||
            data.consultation_date ||
            null;

        this.scheduledStartDate =
            data.scheduledStartDate ||
            data.scheduled_start_date ||
            null;

        this.actualStartDate =
            data.actualStartDate ||
            data.actual_start_date ||
            null;

        this.expectedCompletionDate =
            data.expectedCompletionDate ||
            data.expected_completion_date ||
            null;

        this.actualCompletionDate =
            data.actualCompletionDate ||
            data.actual_completion_date ||
            null;

        /* =====================================================
           SYSTEM INFORMATION
        ===================================================== */

        this.systemCapacityKw =
            data.systemCapacityKw ??
            data.system_capacity_kw ??
            null;

        this.batteryCapacityKwh =
            data.batteryCapacityKwh ??
            data.battery_capacity_kwh ??
            null;

        this.panelCount =
            data.panelCount ??
            data.panel_count ??
            null;

        this.inverterCapacityKva =
            data.inverterCapacityKva ??
            data.inverter_capacity_kva ??
            null;

        /* =====================================================
           FINANCIAL SUMMARY
        ===================================================== */

        this.estimatedValue =
            data.estimatedValue ??
            data.estimated_value ??
            0;

        this.contractValue =
            data.contractValue ??
            data.contract_value ??
            0;

        this.amountPaid =
            data.amountPaid ??
            data.amount_paid ??
            0;

        this.balanceDue =
            data.balanceDue ??
            data.balance_due ??
            0;

        /* =====================================================
           ADDITIONAL INFORMATION
        ===================================================== */

        this.notes =
            data.notes ||
            null;

        /* =====================================================
           TIMESTAMPS
        ===================================================== */

        this.createdAt =
            data.createdAt ||
            data.created_at ||
            null;

        this.updatedAt =
            data.updatedAt ||
            data.updated_at ||
            null;
    }

    /* =========================================================
       NORMALIZE
    ========================================================= */

    normalize() {
        this.projectCode =
            this.projectCode
                ? String(this.projectCode).trim().toUpperCase()
                : null;

        this.projectName =
            String(this.projectName || "").trim();

        this.description =
            this.description
                ? String(this.description).trim()
                : null;

        this.country =
            String(this.country || "Nigeria").trim();

        this.siteAddress =
            this.siteAddress
                ? String(this.siteAddress).trim()
                : null;

        this.city =
            this.city
                ? String(this.city).trim()
                : null;

        this.state =
            this.state
                ? String(this.state).trim()
                : null;

        this.localGovernment =
            this.localGovernment
                ? String(this.localGovernment).trim()
                : null;

        this.notes =
            this.notes
                ? String(this.notes).trim()
                : null;

        return this;
    }

    /* =========================================================
       VALIDATION
    ========================================================= */

    isValid() {
        return Boolean(
            this.projectCode &&
            this.projectName &&
            this.clientId
        );
    }

    /* =========================================================
       DATABASE FORMAT
    ========================================================= */

    toDatabase() {
        return {
            projectCode: this.projectCode,
            projectName: this.projectName,
            description: this.description,

            clientId: this.clientId,
            installerId: this.installerId,

            siteAddress: this.siteAddress,
            city: this.city,
            state: this.state,
            localGovernment: this.localGovernment,
            country: this.country,

            projectType: this.projectType,
            status: this.status,
            priority: this.priority,

            consultationDate: this.consultationDate,
            scheduledStartDate: this.scheduledStartDate,
            actualStartDate: this.actualStartDate,
            expectedCompletionDate:
                this.expectedCompletionDate,
            actualCompletionDate:
                this.actualCompletionDate,

            systemCapacityKw:
                this.systemCapacityKw,

            batteryCapacityKwh:
                this.batteryCapacityKwh,

            panelCount:
                this.panelCount,

            inverterCapacityKva:
                this.inverterCapacityKva,

            estimatedValue:
                this.estimatedValue,

            contractValue:
                this.contractValue,

            amountPaid:
                this.amountPaid,

            balanceDue:
                this.balanceDue,

            notes: this.notes
        };
    }

    /* =========================================================
       JSON FORMAT
    ========================================================= */

    toJSON() {
        return {
            id: this.id,

            projectCode:
                this.projectCode,

            projectName:
                this.projectName,

            description:
                this.description,

            clientId:
                this.clientId,

            installerId:
                this.installerId,

            siteAddress:
                this.siteAddress,

            city:
                this.city,

            state:
                this.state,

            localGovernment:
                this.localGovernment,

            country:
                this.country,

            projectType:
                this.projectType,

            status:
                this.status,

            priority:
                this.priority,

            consultationDate:
                this.consultationDate,

            scheduledStartDate:
                this.scheduledStartDate,

            actualStartDate:
                this.actualStartDate,

            expectedCompletionDate:
                this.expectedCompletionDate,

            actualCompletionDate:
                this.actualCompletionDate,

            systemCapacityKw:
                this.systemCapacityKw,

            batteryCapacityKwh:
                this.batteryCapacityKwh,

            panelCount:
                this.panelCount,

            inverterCapacityKva:
                this.inverterCapacityKva,

            estimatedValue:
                this.estimatedValue,

            contractValue:
                this.contractValue,

            amountPaid:
                this.amountPaid,

            balanceDue:
                this.balanceDue,

            notes:
                this.notes,

            createdAt:
                this.createdAt,

            updatedAt:
                this.updatedAt
        };
    }
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = Project;
