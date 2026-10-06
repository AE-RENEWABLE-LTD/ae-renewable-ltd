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

        if (allowedOrigins.includes(origin)) {
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