"use strict";

const fs = require("fs");
const path = require("path");

const serverPath = path.join(__dirname, "backend", "server.js");
let content = fs.readFileSync(serverPath, "utf8");

// 1. Add ardeFrontendPath if missing
if (!content.includes("ardeFrontendPath")) {
    const adminPathTarget = 'const adminFrontendPath =\r\npath.resolve(\r\n    __dirname,\r\n    "..",\r\n    "admin"\r\n);';
    const adminPathLF = 'const adminFrontendPath =\npath.resolve(\n    __dirname,\n    "..",\n    "admin"\n);';
    if (content.includes(adminPathTarget)) {
        content = content.replace(adminPathTarget, adminPathTarget + '\r\n\r\nconst ardeFrontendPath =\r\npath.resolve(\r\n    __dirname,\r\n    "..",\r\n    "arde"\r\n);');
    } else if (content.includes(adminPathLF)) {
        content = content.replace(adminPathLF, adminPathLF + '\n\nconst ardeFrontendPath =\npath.resolve(\n    __dirname,\n    "..",\n    "arde"\n);');
    }
}

// 2. Mount /arde static & page
if (!content.includes('"/arde"')) {
    const adminGet = 'app.get(\r\n    "/admin",';
    const adminGetLF = 'app.get(\n    "/admin",';
    const ardeBlock = `\r\n/* =========================================================\r\nARDE STATIC & PAGE\r\n========================================================= */\r\n\r\napp.use(\r\n    "/arde",\r\n    express.static(ardeFrontendPath)\r\n);\r\n\r\napp.get(\r\n    "/arde",\r\n    (req, res) => {\r\n        return res.sendFile(path.join(ardeFrontendPath, "index.html"));\r\n    }\r\n);\r\n\r\n`;

    if (content.includes(adminGet)) {
        content = content.replace(adminGet, ardeBlock + adminGet);
    } else if (content.includes(adminGetLF)) {
        content = content.replace(adminGetLF, ardeBlock.replace(/\r\n/g, "\n") + adminGetLF);
    }
}

// 3. Automation scheduler
if (!content.includes("initScheduler")) {
    const listenTarget = "app.listen(";
    const listenIdx = content.indexOf(listenTarget);
    if (listenIdx !== -1) {
        const callbackIdx = content.indexOf("() => {", listenIdx);
        if (callbackIdx !== -1) {
            const insertion = "\r\n                require(\"./services/automation.service\").initScheduler();";
            content = content.slice(0, callbackIdx + 7) + insertion + content.slice(callbackIdx + 7);
        }
    }
}

fs.writeFileSync(serverPath, content, "utf8");
console.log("SERVER PATCH DONE!");
console.log("arde in server:", content.includes('"/arde"'));
console.log("initScheduler in server:", content.includes("initScheduler"));
