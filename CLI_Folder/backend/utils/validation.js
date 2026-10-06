"use strict";

/* =========================================================
   AE RENEWABLE NETWORK
   VALIDATION UTILITY
========================================================= */

/* =========================================================
   BASIC HELPERS
========================================================= */

function isObject(value) {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}

function isNonEmptyString(value) {
    return (
        typeof value === "string" &&
        value.trim().length > 0
    );
}

function isValidEmail(email) {
    if (!isNonEmptyString(email)) {
        return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email.trim()
    );
}

function isValidPhone(phone) {
    if (!isNonEmptyString(phone)) {
        return false;
    }

    const normalized = phone
        .trim()
        .replace(/[\s\-()]/g, "");

    return /^\+?[0-9]{7,15}$/.test(
        normalized
    );
}

function isValidDate(value) {
    if (!value) {
        return false;
    }

    const date = new Date(value);

    return !Number.isNaN(date.getTime());
}

function isPositiveNumber(value) {
    return (
        typeof value === "number" &&
        Number.isFinite(value) &&
        value >= 0
    );
}

function isPositiveInteger(value) {
    return (
        Number.isInteger(value) &&
        value >= 0
    );
}

/* =========================================================
   REQUIRED FIELDS
========================================================= */

function validateRequired(
    data,
    fields = []
) {
    const errors = {};

    if (!isObject(data)) {
        return {
            valid: false,
            errors: {
                body: "Request data must be an object."
            }
        };
    }

    for (const field of fields) {
        const value = data[field];

        if (
            value === undefined ||
            value === null ||
            (
                typeof value === "string" &&
                value.trim() === ""
            )
        ) {
            errors[field] =
                `${field} is required.`;
        }
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
}

/* =========================================================
   EMAIL VALIDATION
========================================================= */

function validateEmail(
    email,
    field = "email"
) {
    if (!isValidEmail(email)) {
        return {
            valid: false,
            errors: {
                [field]: "Invalid email address."
            }
        };
    }

    return {
        valid: true,
        errors: {}
    };
}

/* =========================================================
   PHONE VALIDATION
========================================================= */

function validatePhone(
    phone,
    field = "phone"
) {
    if (!isValidPhone(phone)) {
        return {
            valid: false,
            errors: {
                [field]: "Invalid phone number."
            }
        };
    }

    return {
        valid: true,
        errors: {}
    };
}

/* =========================================================
   PASSWORD VALIDATION
========================================================= */

function validatePassword(
    password,
    field = "password"
) {
    const errors = {};

    if (typeof password !== "string") {
        errors[field] =
            "Password must be a string.";

        return {
            valid: false,
            errors
        };
    }

    if (password.length < 8) {
        errors[field] =
            "Password must contain at least 8 characters.";
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
}

/* =========================================================
   PROJECT VALIDATION
========================================================= */

function validateProject(data) {
    const errors = {};

    const required = validateRequired(
        data,
        [
            "projectName",
            "clientId"
        ]
    );

    Object.assign(
        errors,
        required.errors
    );

    if (
        data.projectCode !== undefined &&
        !isNonEmptyString(data.projectCode)
    ) {
        errors.projectCode =
            "Project code must be a valid string.";
    }

    if (
        data.projectType !== undefined &&
        ![
            "solar",
            "cctv",
            "electric_fence",
            "electrical",
            "hybrid",
            "solar_mini_grid",
            "other"
        ].includes(data.projectType)
    ) {
        errors.projectType =
            "Invalid project type.";
    }

    if (
        data.status !== undefined &&
        ![
            "consultation",
            "survey",
            "design",
            "quotation",
            "approved",
            "scheduled",
            "installation",
            "testing",
            "commissioned",
            "completed",
            "on_hold",
            "cancelled"
        ].includes(data.status)
    ) {
        errors.status =
            "Invalid project status.";
    }

    if (
        data.priority !== undefined &&
        ![
            "low",
            "normal",
            "high",
            "urgent"
        ].includes(data.priority)
    ) {
        errors.priority =
            "Invalid project priority.";
    }

    if (
        data.systemCapacityKw !== undefined &&
        data.systemCapacityKw !== null &&
        !isPositiveNumber(
            Number(data.systemCapacityKw)
        )
    ) {
        errors.systemCapacityKw =
            "System capacity must be a non-negative number.";
    }

    if (
        data.batteryCapacityKwh !== undefined &&
        data.batteryCapacityKwh !== null &&
        !isPositiveNumber(
            Number(data.batteryCapacityKwh)
        )
    ) {
        errors.batteryCapacityKwh =
            "Battery capacity must be a non-negative number.";
    }

    if (
        data.panelCount !== undefined &&
        data.panelCount !== null &&
        !isPositiveInteger(
            Number(data.panelCount)
        )
    ) {
        errors.panelCount =
            "Panel count must be a non-negative integer.";
    }

    if (
        data.inverterCapacityKva !== undefined &&
        data.inverterCapacityKva !== null &&
        !isPositiveNumber(
            Number(data.inverterCapacityKva)
        )
    ) {
        errors.inverterCapacityKva =
            "Inverter capacity must be a non-negative number.";
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
}

/* =========================================================
   INSTALLER VALIDATION
========================================================= */

function validateInstaller(data) {
    const errors = {};

    const required = validateRequired(
        data,
        [
            "installerCode",
            "companyName",
            "contactName"
        ]
    );

    Object.assign(
        errors,
        required.errors
    );

    if (
        data.email !== undefined &&
        !isValidEmail(data.email)
    ) {
        errors.email =
            "Invalid installer email address.";
    }

    if (
        data.phone !== undefined &&
        !isValidPhone(data.phone)
    ) {
        errors.phone =
            "Invalid installer phone number.";
    }

    if (
        data.verificationStatus !== undefined &&
        ![
            "pending",
            "verified",
            "rejected"
        ].includes(data.verificationStatus)
    ) {
        errors.verificationStatus =
            "Invalid verification status.";
    }

    if (
        data.status !== undefined &&
        ![
            "pending",
            "active",
            "on_project",
            "inactive",
            "suspended"
        ].includes(data.status)
    ) {
        errors.status =
            "Invalid installer status.";
    }

    if (
        data.specializations !== undefined &&
        !Array.isArray(data.specializations)
    ) {
        errors.specializations =
            "Specializations must be an array.";
    }

    if (
        data.registrationDate !== undefined &&
        data.registrationDate !== null &&
        !isValidDate(data.registrationDate)
    ) {
        errors.registrationDate =
            "Invalid registration date.";
    }

    if (
        data.approvalDate !== undefined &&
        data.approvalDate !== null &&
        !isValidDate(data.approvalDate)
    ) {
        errors.approvalDate =
            "Invalid approval date.";
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
}

/* =========================================================
   CLIENT VALIDATION
========================================================= */

function validateClient(data) {
    const errors = {};

    const required = validateRequired(
        data,
        [
            "contactName"
        ]
    );

    Object.assign(
        errors,
        required.errors
    );

    if (
        data.email !== undefined &&
        !isValidEmail(data.email)
    ) {
        errors.email =
            "Invalid client email address.";
    }

    if (
        data.phone !== undefined &&
        !isValidPhone(data.phone)
    ) {
        errors.phone =
            "Invalid client phone number.";
    }

    if (
        data.clientType !== undefined &&
        ![
            "individual",
            "corporate"
        ].includes(data.clientType)
    ) {
        errors.clientType =
            "Invalid client type.";
    }

    if (
        data.status !== undefined &&
        ![
            "active",
            "inactive",
            "suspended"
        ].includes(data.status)
    ) {
        errors.status =
            "Invalid client status.";
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
}

/* =========================================================
   FORMAT VALIDATION RESULT
========================================================= */

function validationResult(
    valid,
    errors = {}
) {
    return {
        valid: Boolean(valid),
        errors
    };
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    isObject,
    isNonEmptyString,
    isValidEmail,
    isValidPhone,
    isValidDate,
    isPositiveNumber,
    isPositiveInteger,

    validateRequired,
    validateEmail,
    validatePhone,
    validatePassword,

    validateProject,
    validateInstaller,
    validateClient,

    validationResult
};