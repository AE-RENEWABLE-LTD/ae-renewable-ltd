"use strict";

/* =========================================================
   AE RENEWABLE NETWORK
   PASSWORD UTILITY
========================================================= */

const bcrypt = require("bcryptjs");

/* =========================================================
   CONFIGURATION
========================================================= */

const SALT_ROUNDS = 12;

/* =========================================================
   VALIDATE PASSWORD
========================================================= */

function isValidPassword(password) {
    if (
        typeof password !== "string" ||
        password.length < 8
    ) {
        return false;
    }

    return true;
}

/* =========================================================
   HASH PASSWORD
========================================================= */

async function hashPassword(password) {
    if (!isValidPassword(password)) {
        throw new Error(
            "Password must contain at least 8 characters."
        );
    }

    return bcrypt.hash(
        password,
        SALT_ROUNDS
    );
}

/* =========================================================
   COMPARE PASSWORD
========================================================= */

async function comparePassword(
    password,
    passwordHash
) {
    if (
        typeof password !== "string" ||
        typeof passwordHash !== "string"
    ) {
        return false;
    }

    return bcrypt.compare(
        password,
        passwordHash
    );
}

/* =========================================================
   GENERATE PASSWORD HASH
========================================================= */

async function generatePasswordHash(password) {
    return hashPassword(password);
}

/* =========================================================
   VERIFY PASSWORD
========================================================= */

async function verifyPassword(
    password,
    passwordHash
) {
    return comparePassword(
        password,
        passwordHash
    );
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    SALT_ROUNDS,
    isValidPassword,
    hashPassword,
    comparePassword,
    generatePasswordHash,
    verifyPassword
};