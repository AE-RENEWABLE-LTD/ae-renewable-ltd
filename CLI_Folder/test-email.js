"use strict";

require("dotenv").config();

const {
    verifyEmailConfiguration
} = require("./backend/services/email.service");

verifyEmailConfiguration()
    .then(() => {
        console.log("");
        console.log("EMAIL CONFIGURATION OK");
        console.log("========================");
        console.log("SMTP connection verified.");
    })
    .catch(error => {
        console.error("");
        console.error("EMAIL CONFIGURATION FAILED");
        console.error("============================");
        console.error("Message:", error.message);
        process.exitCode = 1;
    });
