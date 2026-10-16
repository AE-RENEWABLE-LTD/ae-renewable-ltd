"use strict";

const cors = require("cors");
const config = require("./environment");

/* =========================================================
   ALLOWED CLIENT ORIGINS
========================================================= */

const allowedOrigins = [
    config.clientUrl
];

/* =========================================================
   CORS CONFIGURATION
========================================================= */

const corsOptions = {
    origin: (origin, callback) => {

        // Allow requests without an Origin header
        // such as Postman, server-to-server requests, etc.
        if (!origin) {
            return callback(null, true);
        }

        const isLocalNetwork = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin);

        if (allowedOrigins.includes(origin) || isLocalNetwork || config.nodeEnv !== "production") {
            return callback(null, true);
        }

        return callback(
            new Error("CORS: Origin not allowed.")
        );
    },

    credentials: true,

    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],

    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With"
    ],

    exposedHeaders: [
        "Content-Length",
        "Content-Disposition"
    ],

    optionsSuccessStatus: 204
};

/* =========================================================
   EXPORT
========================================================= */

module.exports = cors(corsOptions);