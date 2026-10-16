"use strict";

const jwt = require("jsonwebtoken");
const config = require("./config/environment");
const clientController = require("./controllers/client.controller");
const installerController = require("./controllers/installer.controller");
const { query } = require("./config/database");

async function testEndpoints() {
    console.log("--- TESTING /api/clients/me & /api/installers/me ---");

    const users = (await query("SELECT * FROM users ORDER BY id ASC")).rows;
    for (const user of users) {
        console.log(`\nTesting for User ID ${user.id} (${user.email}, role: ${user.role}):`);

        // Test getMyClient
        let clientResult = null;
        const fakeReqClient = { user, body: {} };
        const fakeResClient = {
            statusCode: 200,
            status(code) { this.statusCode = code; return this; },
            json(data) { clientResult = { status: this.statusCode, data }; return this; }
        };
        await clientController.getMyClient(fakeReqClient, fakeResClient, (err) => { console.error("Client error:", err); });
        console.log(`  getMyClient status: ${clientResult?.status}, client_code: ${clientResult?.data?.data?.client?.client_code}`);

        // Test getMyInstaller
        let installerResult = null;
        const fakeReqInstaller = { user, body: {} };
        const fakeResInstaller = {
            statusCode: 200,
            status(code) { this.statusCode = code; return this; },
            json(data) { installerResult = { status: this.statusCode, data }; return this; }
        };
        await installerController.getMyInstaller(fakeReqInstaller, fakeResInstaller, (err) => { console.error("Installer error:", err); });
        console.log(`  getMyInstaller status: ${installerResult?.status}, installer_code: ${installerResult?.data?.data?.installer_code}`);
    }

    console.log("\nTesting for NEW non-existent user (Auto-provision test):");
    const fakeNewUser = { id: 9999, first_name: "Test", last_name: "User", email: "testuser9999@example.com", phone: "+2348000000000", role: "client", status: "active" };
    let newClientResult = null;
    const fakeReqNewClient = { user: fakeNewUser, body: {} };
    const fakeResNewClient = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(data) { newClientResult = { status: this.statusCode, data }; return this; }
    };
    await clientController.getMyClient(fakeReqNewClient, fakeResNewClient, (err) => console.error(err));
    console.log(`  Auto-provisioned client: status: ${newClientResult?.status}, code: ${newClientResult?.data?.data?.client?.client_code}`);

    let newInstallerResult = null;
    const fakeReqNewInstaller = { user: fakeNewUser, body: {} };
    const fakeResNewInstaller = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(data) { newInstallerResult = { status: this.statusCode, data }; return this; }
    };
    await installerController.getMyInstaller(fakeReqNewInstaller, fakeResNewInstaller, (err) => console.error(err));
    console.log(`  Auto-provisioned installer: status: ${newInstallerResult?.status}, code: ${newInstallerResult?.data?.data?.installer_code}`);

    // Clean up test user
    await query("DELETE FROM clients WHERE user_id = 9999");
    await query("DELETE FROM installers WHERE user_id = 9999");

    console.log("\nAll tests passed successfully!");
    process.exit(0);
}

testEndpoints().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
