"use strict";

/* =========================================================
   AE RENEWABLE NETWORK
   LOGGER
========================================================= */

const config = require("../config/environment");

/* =========================================================
   LOG LEVELS
========================================================= */

const LEVELS = {
    DEBUG: "DEBUG",
    INFO: "INFO",
    WARN: "WARN",
    ERROR: "ERROR"
};

/* =========================================================
   TIMESTAMP
========================================================= */

function timestamp() {
    return new Date().toISOString();
}

/* =========================================================
   NORMALIZE MESSAGE
========================================================= */

function normalizeMessage(message) {
    if (message instanceof Error) {
        return message.message;
    }

    if (typeof message === "string") {
        return message;
    }

    try {
        return JSON.stringify(message);
    } catch (error) {
        return String(message);
    }
}

/* =========================================================
   WRITE LOG
========================================================= */

function write(level, message, meta = null) {
    const time = timestamp();
    const normalizedMessage = normalizeMessage(message);

    let output =
        `[${time}] [${level}] ${normalizedMessage}`;

    if (meta !== null && meta !== undefined) {
        try {
            output += ` ${JSON.stringify(meta)}`;
        } catch (error) {
            output += " [metadata unavailable]";
        }
    }

    switch (level) {
        case LEVELS.ERROR:
            console.error(output);
            break;

        case LEVELS.WARN:
            console.warn(output);
            break;

        default:
            console.log(output);
            break;
    }
}

/* =========================================================
   DEBUG
========================================================= */

function debug(message, meta = null) {
    if (config.nodeEnv === "production") {
        return;
    }

    write(
        LEVELS.DEBUG,
        message,
        meta
    );
}

/* =========================================================
   INFO
========================================================= */

function info(message, meta = null) {
    write(
        LEVELS.INFO,
        message,
        meta
    );
}

/* =========================================================
   WARNING
========================================================= */

function warn(message, meta = null) {
    write(
        LEVELS.WARN,
        message,
        meta
    );
}

/* =========================================================
   ERROR
========================================================= */

function error(message, meta = null) {
    write(
        LEVELS.ERROR,
        message,
        meta
    );
}

/* =========================================================
   REQUEST LOGGER
========================================================= */

function request(req) {
    if (!req) {
        return;
    }

    info(
        `${req.method} ${req.originalUrl || req.url}`,
        {
            ip: req.ip || null
        }
    );
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    LEVELS,
    timestamp,
    normalizeMessage,
    write,
    debug,
    info,
    warn,
    error,
    request
};