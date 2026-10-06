
"use strict";

const express = require("express");
const path = require("path");
const fs = require("fs");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const config =
require("./config/environment");

const {
    testDatabaseConnection
} =
require("./config/database");

const corsMiddleware =
require("./config/cors");


/* =========================================================
ROUTES
========================================================= */

const authRoutes =
require("./routes/auth.routes");

const clientRoutes =
require("./routes/client.routes");

const installerRoutes =
require("./routes/installer.routes");

const documentRoutes =
require("./routes/document.routes");

const projectRoutes =
require("./routes/project.routes");

const paymentRoutes =
require("./routes/payment.routes");

const adminRoutes =
require("./routes/admin.routes");

const quotationRoutes =
require("./routes/quotation.routes");

const quotationItemRoutes =
require("./routes/quotation-item.routes");

const notificationRoutes =
require("./routes/notification.routes");

const supportRoutes =
require("./routes/support.routes");

const engineeringRoutes =
require("./routes/engineering.routes");

const equipmentRoutes =
require("./routes/equipment.routes");

const automationService = require("./services/automation.service");

const activityRoutes =
require("./routes/activity.routes");


const jwt = require("jsonwebtoken");

/* =========================================================
PAGE AUTH GUARD
Serves a thin HTML interceptor that reads localStorage and
redirects to login if role does not match. On second reload
with __auth_pass=1 query param, serves the real page.
========================================================= */

function requirePageRole(allowedRoles, loginRedirect, sessionKey) {
    return (req, res, next) => {
        if (req.query.__auth_pass === "1") {
            return next();
        }

        const rolesJson = JSON.stringify(allowedRoles);
        const sKey = sessionKey ? String(sessionKey) : "";
        const interceptorHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Redirecting to Login...</title>
<style>
* { box-sizing: border-box; }
body { margin:0; background:#010a1d; display:flex; align-items:center; justify-content:center; height:100vh; flex-direction:column; gap:16px; font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color:#fff; }
.spinner { width:44px; height:44px; border:3px solid rgba(244,166,0,0.2); border-top-color:#f4a600; border-radius:50%; animation:spin 0.7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
p { color:#94a3b8; font-size:0.9rem; margin:0; }
</style></head><body>
<div class="spinner"></div>
<p>Verifying access credentials&hellip;</p>
<script>
(function(){
  try {
    var sessionKey = '${sKey}';
    var token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('aeAdminToken') || localStorage.getItem('aeInstallerToken') || localStorage.getItem('aeRenewableToken') || localStorage.getItem('aeClientToken') || '';
    var rawUser = localStorage.getItem('user') || localStorage.getItem('aeAdminUser') || localStorage.getItem('aeInstallerUser') || localStorage.getItem('aeRenewableUser') || localStorage.getItem('aeClientUser') || '{}';
    var user = {};
    try { user = JSON.parse(rawUser) || {}; } catch(e) { user = {}; }
    var role = user && user.role ? String(user.role).toLowerCase() : '';
    if (sessionKey && sessionStorage.getItem(sessionKey) !== 'true') {
      window.location.replace('${loginRedirect}');
      return;
    }
    var allowed = ${rolesJson}.map(function(r){ return String(r).toLowerCase(); });
    if (!token || !role || !allowed.includes(role)) {
      window.location.replace('${loginRedirect}');
    } else {
      var url = new URL(window.location.href);
      url.searchParams.set('__auth_pass', '1');
      window.location.replace(url.toString());
    }
  } catch(e) {
    window.location.replace('${loginRedirect}');
  }
})();
<\/script></body></html>`;

        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.status(200).send(interceptorHtml);
    };
}


/* =========================================================
APPLICATION
========================================================= */

const app =
express();



/* =========================================================
FRONTEND PATHS
========================================================= */

const installerFrontendPath =
path.resolve(
    __dirname,
    "..",
    "installer"
);

const clientFrontendPath =
path.resolve(
    __dirname,
    "..",
    "client"
);

const adminFrontendPath =
path.resolve(
    __dirname,
    "..",
    "admin"
);

const ardeFrontendPath =
path.resolve(
    __dirname,
    "..",
    "arde"
);


/* =========================================================
SECURITY
========================================================= */

app.use(
    helmet({
        crossOriginResourcePolicy: {
            policy: "cross-origin"
        },
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
                scriptSrcAttr: ["'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com", "data:", "https://cdnjs.cloudflare.com"],
                imgSrc: ["'self'", "data:", "blob:", "https:"],
                connectSrc: ["'self'", "https://unpkg.com", "https://*.unpkg.com"]
            }
        }
    })
);

app.use(
    corsMiddleware
);


/* =========================================================
API RATE LIMITING
========================================================= */

const apiLimiter =
rateLimit({

    windowMs:
        15 * 60 * 1000,

    max:
        200,

    standardHeaders:
        true,

    legacyHeaders:
        false,

    message: {

        success:
            false,

        message:
            "Too many requests. Please try again later."

    }

});


app.use(
    "/api",
    apiLimiter
);


/* =========================================================
REQUEST BODY PARSING
========================================================= */

app.use(
    express.json({
        limit: "10mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb"
    })
);


/* =========================================================
REQUEST LOGGER
========================================================= */

app.use(
    (req, res, next) => {

        const timestamp =
            new Date().toISOString();

        console.log(
            `[${timestamp}] ${req.method} ${req.originalUrl}`
        );

        next();

    }
);


/* =========================================================
API HEALTH
========================================================= */

app.get(
    "/api/health",
    (req, res) => {

        return res.status(200).json({

            success:
                true,

            message:
                "AE Renewable API is running.",

            service:
                "AE Renewable Network",

            version:
                "1.0.0",

            environment:
                config.nodeEnv,

            timestamp:
                new Date().toISOString()

        });

    }
);


/* =========================================================
DATABASE HEALTH
========================================================= */

app.get(
    "/api/health/database",
    async (req, res, next) => {

        try {

            await testDatabaseConnection();

            return res.status(200).json({

                success:
                    true,

                message:
                    "AE Renewable database is connected.",

                database:
                    "PostgreSQL",

                environment:
                    config.nodeEnv,

                timestamp:
                    new Date().toISOString()

            });

        } catch (error) {

            next(error);

        }

    }
);


/* =========================================================
API ROOT
========================================================= */

app.get(
    "/api",
    (req, res) => {

        return res.status(200).json({

            success:
                true,

            message:
                "Welcome to the AE Renewable API.",

            service:
                "AE Renewable Network",

            version:
                "1.0.0"

        });

    }
);


/* =========================================================
API ROUTES
========================================================= */


/* ---------------- AUTH ---------------- */

app.use(
    "/api/auth",
    authRoutes
);


/* ---------------- CLIENTS ---------------- */

app.use(
    "/api/clients",
    clientRoutes
);


/* ---------------- INSTALLERS ---------------- */

app.use(
    "/api/installers",
    installerRoutes
);


/* ---------------- DOCUMENTS ---------------- */

app.use(
    "/api/documents",
    documentRoutes
);


/* ---------------- PROJECTS ---------------- */

app.use(
    "/api/projects",
    projectRoutes
);


/* ---------------- PAYMENTS ---------------- */

app.use(
    "/api/payments",
    paymentRoutes
);


/* ---------------- QUOTATIONS ---------------- */

app.use(
    "/api/quotations",
    quotationRoutes
);


/* ---------------- QUOTATION ITEMS ---------------- */

app.use(
    "/api/quotation-items",
    quotationItemRoutes
);


/* ---------------- NOTIFICATIONS ---------------- */

app.use(
    "/api/notifications",
    notificationRoutes
);


/* ---------------- SUPPORT ---------------- */

app.use(
    "/api/support",
    supportRoutes
);


/* ---------------- ADMIN ---------------- */

const fieldPostRoutes = require("./routes/field-post.routes");

app.use(
    "/api/admin",
    adminRoutes
);

app.use("/api/engineering", engineeringRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/field-posts", fieldPostRoutes);
app.use("/api/field", fieldPostRoutes);

// Comprehensive Static Directories & Image Fallbacks
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/images", express.static(path.join(__dirname, "..", "client", "images")));
app.use("/images", express.static(path.join(__dirname, "..", "client", "assets")));
app.use("/images", express.static(path.join(__dirname, "..", "uploads")));
app.use("/images", express.static(path.join(__dirname, "..", "..", "public", "images")));
app.use("/images", express.static(path.join(process.cwd(), "public", "images")));

app.use("/public", express.static(path.join(__dirname, "..", "public")));
app.use("/public", express.static(path.join(process.cwd(), "public")));

app.use("/site-images", express.static(path.join(__dirname, "..", "..", "LETS_GO", "images")));
app.use("/site-images", express.static(path.join(process.cwd(), "LETS_GO", "images")));
app.use("/site-images", express.static(path.join(__dirname, "..", "client", "images")));

// Specific direct routes for installer default images
const defaultInstallerImg = path.join(__dirname, "..", "uploads", "installer-default.jpg");
const fallbackSendImage = (req, res) => {
    if (fs.existsSync(defaultInstallerImg)) {
        return res.sendFile(defaultInstallerImg);
    }
    const letsGoImg = path.join(__dirname, "..", "..", "LETS_GO", "images", "installerface1.jpeg");
    if (fs.existsSync(letsGoImg)) {
        return res.sendFile(letsGoImg);
    }
    return res.status(200).end();
};

app.get("/site-images/instalerface1.jpeg", (req, res) => {
    const letsGoImg = path.join(__dirname, "..", "..", "LETS_GO", "images", "installerface1.jpeg");
    if (fs.existsSync(letsGoImg)) return res.sendFile(letsGoImg);
    fallbackSendImage(req, res);
});
app.get("/site-images/installerface1.jpeg", (req, res) => {
    const letsGoImg = path.join(__dirname, "..", "..", "LETS_GO", "images", "installerface1.jpeg");
    if (fs.existsSync(letsGoImg)) return res.sendFile(letsGoImg);
    fallbackSendImage(req, res);
});


/* =========================================================
INSTALLER ROUTES & ACCESS CONTROL
========================================================= */

// Public landing & auth pages
app.get(["/installer", "/installer/installer.html"], (req, res) => {
    return res.sendFile(path.join(installerFrontendPath, "installer.html"));
});

app.get(["/installer/login", "/installer/login.html"], (req, res) => {
    return res.sendFile(path.join(installerFrontendPath, "login.html"));
});

app.get(["/installer/register", "/installer/register.html"], (req, res) => {
    return res.sendFile(path.join(installerFrontendPath, "register.html"));
});

app.get("/installer/dashboard", (req, res) => {
    return res.redirect("/installer/portal");
});

// Protected Installer Portal (Installer, Admin, Staff ONLY)
app.get(
    ["/installer/portal", "/installer/portal.html"],
    requirePageRole(["installer", "admin", "staff"], "/installer/login", "ae_installer_logged_in"),
    (req, res) => {
        return res.sendFile(path.join(installerFrontendPath, "portal.html"));
    }
);

// Installer static assets (CSS, JS, images, icons) - index disabled
app.use(
    "/installer",
    express.static(installerFrontendPath, { index: false })
);


/* =========================================================
CLIENT ROUTES & ACCESS CONTROL
========================================================= */

// Public landing & auth pages
app.get(["/client", "/client/landing", "/client/landing.html"], (req, res) => {
    return res.sendFile(path.join(clientFrontendPath, "landing.html"));
});

app.get(["/client/login", "/client/login.html"], (req, res) => {
    return res.sendFile(path.join(clientFrontendPath, "login.html"));
});

app.get(["/client/register", "/client/register.html"], (req, res) => {
    return res.redirect("/client/login");
});

// Protected Client Portal (Client, Admin, Staff, Installer ONLY)
app.get(
    ["/client/dashboard", "/client/portal", "/client/portal.html", "/client/client.html"],
    requirePageRole(["client", "admin", "staff", "installer"], "/client/login", "ae_client_logged_in"),
    (req, res) => {
        return res.sendFile(path.join(clientFrontendPath, "client.html"));
    }
);

// Client static assets (CSS, JS, images) - index disabled
app.use(
    "/client",
    express.static(clientFrontendPath, { index: false })
);


/* =========================================================
ADMIN ROUTES & ACCESS CONTROL
========================================================= */

// Public login page
app.get(["/admin/login", "/admin/login.html"], (req, res) => {
    return res.sendFile(path.join(adminFrontendPath, "login.html"));
});

// Protected Admin Portal (Admin, Staff ONLY)
app.get(
    ["/admin", "/admin/", "/admin/admin.html", "/admin/dashboard", "/admin/portal"],
    requirePageRole(["admin", "staff"], "/admin/login", "ae_admin_logged_in"),
    (req, res) => {
        return res.sendFile(path.join(adminFrontendPath, "admin.html"));
    }
);

// Admin static assets (CSS, JS, images) - index disabled
app.use(
    "/admin",
    express.static(adminFrontendPath, { index: false })
);


/* =========================================================
ARDE STATIC & PAGES (STANDALONE — No login required)
ARDE is a public-facing engineering tool; only Studio submits.
========================================================= */

app.get(
    ["/arde", "/arde/", "/arde.html", "/arde/landing", "/arde/landing.html", "/arde/arde.html"],
    (req, res) => {
        return res.sendFile(path.join(ardeFrontendPath, "arde.html"));
    }
);

app.get(
    ["/arde/studio", "/arde/app", "/arde/engine"],
    (req, res) => {
        return res.sendFile(path.join(ardeFrontendPath, "index.html"));
    }
);

app.use(
    "/arde",
    express.static(ardeFrontendPath, { index: false })
);


/* =========================================================
ROOT
========================================================= */

app.get(
    "/",
    (req, res) => {
        return res.redirect("/client");
    }
);


/* =========================================================
404 HANDLER
========================================================= */

app.use(
    (req, res) => {

        const isApiRequest =
            req.originalUrl.startsWith(
                "/api/"
            );

        return res.status(404).json({

            success:
                false,

            message:
                isApiRequest
                    ? "API route not found."
                    : "Page not found.",

            path:
                req.originalUrl

        });

    }
);


/* =========================================================
GLOBAL ERROR HANDLER
========================================================= */

app.use(
    (err, req, res, next) => {

        console.error("");

        console.error(
            "=============================================="
        );

        console.error(
            "             SERVER ERROR"
        );

        console.error(
            "=============================================="
        );

        console.error(
            "Message:",
            err.message
        );

        if (err.code) {

            console.error(
                "Code:",
                err.code
            );

        }

        if (err.stack) {

            console.error(
                "Stack:",
                err.stack
            );

        }

        console.error(
            "=============================================="
        );

        console.error("");


        return res.status(
            err.status || err.statusCode || 500
        ).json({

            success:
                false,

            message:
                config.nodeEnv === "production"
                    ? "Internal server error."
                    : err.message

        });

    }
);


/* =========================================================
START SERVER
========================================================= */

async function startServer() {

    try {

        await testDatabaseConnection();


        app.listen(
            config.port,
            () => {
                require("./services/automation.service").initScheduler();

                console.log("");

                console.log(
                    "=============================================="
                );

                console.log(
                    "       AE RENEWABLE NETWORK API"
                );

                console.log(
                    "=============================================="
                );


                console.log(
                    `Server:        http://localhost:${config.port}`
                );

                console.log(
                    `Website:       http://localhost:${config.port}/`
                );


                /* =================================================
                   INSTALLER FRONTEND
                ================================================== */

                console.log("");

                console.log(
                    "INSTALLER FRONTEND"
                );

                console.log(
                    "----------------------------------------------"
                );

                console.log(
                    `Installer:     http://localhost:${config.port}/installer`
                );

                console.log(
                    `Login:         http://localhost:${config.port}/installer/login`
                );

                console.log(
                    `Register:      http://localhost:${config.port}/installer/register`
                );

                console.log(
                    `Portal:        http://localhost:${config.port}/installer/portal`
                );

                console.log(
                    `Dashboard:     http://localhost:${config.port}/installer/dashboard`
                );


                /* =================================================
                   CLIENT FRONTEND
                ================================================== */

                console.log("");

                console.log(
                    "CLIENT FRONTEND"
                );

                console.log(
                    "----------------------------------------------"
                );

                console.log(
                    `Client:        http://localhost:${config.port}/client`
                );

                console.log(
                    `Login:         http://localhost:${config.port}/client/login`
                );

                console.log(
                    `Register:      http://localhost:${config.port}/client/register`
                );

                console.log(
                    `Dashboard:     http://localhost:${config.port}/client/dashboard`
                );


                /* =================================================
                   ADMIN FRONTEND
                ================================================== */

                console.log("");

                console.log(
                    "ADMIN FRONTEND"
                );

                console.log(
                    "----------------------------------------------"
                );

                console.log(
                    `Admin:         http://localhost:${config.port}/admin`
                );


                /* =================================================
                   ARDE FRONTEND
                ================================================== */

                console.log("");

                console.log(
                    "ARDE FRONTEND"
                );

                console.log(
                    "----------------------------------------------"
                );

                console.log(
                    `ARDE:          http://localhost:${config.port}/arde`
                );

                console.log(
                    `Studio:        http://localhost:${config.port}/arde/studio`
                );


                /* =================================================
                   API SERVICES
                ================================================== */

                console.log("");

                console.log(
                    "API SERVICES"
                );

                console.log(
                    "----------------------------------------------"
                );

                console.log(
                    `Health:        http://localhost:${config.port}/api/health`
                );

                console.log(
                    `Database:      http://localhost:${config.port}/api/health/database`
                );

                console.log(
                    `Auth:          http://localhost:${config.port}/api/auth`
                );

                console.log(
                    `Clients:       http://localhost:${config.port}/api/clients`
                );

                console.log(
                    `Installers:    http://localhost:${config.port}/api/installers`
                );

                console.log(
                    `Documents:     http://localhost:${config.port}/api/documents`
                );

                console.log(
                    `Projects:      http://localhost:${config.port}/api/projects`
                );

                console.log(
                    `Payments:      http://localhost:${config.port}/api/payments`
                );

                console.log(
                    `Quotations:    http://localhost:${config.port}/api/quotations`
                );

                console.log(
                    `QuotationItems:http://localhost:${config.port}/api/quotation-items`
                );

                console.log(
                    `Notifications: http://localhost:${config.port}/api/notifications`
                );

                console.log(
                    `Support:       http://localhost:${config.port}/api/support`
                );

                console.log(
                    `Admin:         http://localhost:${config.port}/api/admin`
                );


                /* =================================================
                   ENVIRONMENT
                ================================================== */

                console.log("");

                console.log(
                    `Environment:   ${config.nodeEnv}`
                );

                console.log(
                    "=============================================="
                );

                console.log("");

                try { automationService.initScheduler(); } catch (err) { console.error("[Automation] Scheduler init error:", err.message); }
            }
        );

    } catch (error) {

        console.error("");

        console.error(
            "=============================================="
        );

        console.error(
            "       SERVER STARTUP FAILED"
        );

        console.error(
            "=============================================="
        );

        console.error(
            "Message:",
            error.message
        );

        if (error.code) {

            console.error(
                "Code:",
                error.code
            );

        }

        if (error.stack) {

            console.error(
                "Stack:",
                error.stack
            );

        }

        console.error(
            "=============================================="
        );

        console.error("");

        process.exit(1);

    }

}


/* =========================================================
START APPLICATION
========================================================= */

if (
    require.main === module
) {

    startServer();

}


/* =========================================================
EXPORT
========================================================= */

module.exports =
app;


