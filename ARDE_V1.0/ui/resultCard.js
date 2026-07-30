// ======================================================
//
// AE RENEWABLE LTD
// ARDE V1.0
//
// FILE
// resultCard.js
//
// PURPOSE
// Update System Design Result UI
//
// ======================================================

export function updateResultCard(system) {

    console.log("Updating System Design Result:", system);

    // ==================================================
    // HELPER
    // ==================================================

    function setResult(id, value) {

        const element = document.getElementById(id);

        if (!element) {

            console.error(
                `Missing element: ${id}`
            );

            return;

        }

        element.textContent =
            value !== undefined &&
            value !== null
                ? value
                : "-";

    }


    // ==================================================
    // SYSTEM INPUT
    // ==================================================

    setResult(

        "resultLoadPower",

        `${system.load ?? "-"} W`

    );


    setResult(

        "resultBackupTime",

        `${system.backup ?? "-"} Hours`

    );


    // ==================================================
    // ENERGY
    // ==================================================

    setResult(

        "resultDailyEnergy",

        `${system.dailyEnergy ?? "-"} Wh`

    );


    // ==================================================
    // BATTERY REQUIREMENT
    // ==================================================

    setResult(

        "resultBatteryEnergy",

        `${system.batteryWh ?? "-"} Wh`

    );


    // ==================================================
    // SOLAR PV
    // ==================================================

    setResult(

        "resultSolarPV",

        `${system.solarPvRequired ?? "-"} W`

    );


    // ==================================================
    // PANEL
    // ==================================================

    setResult(

        "resultPanelModel",

        system.panel?.model ??
        system.panel?.name ??
        "-"

    );


    setResult(

        "resultPanelQuantity",

        system.panelQuantity ?? "-"

    );


    // ==================================================
    // INVERTER
    // ==================================================

    setResult(

        "resultInverterModel",

        system.inverter?.model ??
        system.inverter?.name ??
        "-"

    );


    setResult(

        "resultInverterQuantity",

        system.inverterQuantity ?? "-"

    );


    // ==================================================
    // BATTERY
    // ==================================================

    setResult(

        "resultBatteryModel",

        system.battery?.model ??
        system.battery?.name ??
        "-"

    );


    setResult(

        "resultBatteryQuantity",

        system.batteryQuantity ?? "-"

    );


    // ==================================================
    // INSTALLED BATTERY
    // ==================================================

    setResult(

        "resultInstalledBattery",

        system.installedBatteryWh !== undefined

            ? `${system.installedBatteryWh} Wh`

            : "-"

    );


    // ==================================================
    // COMPLETE
    // ==================================================

    console.log(

        "System Design Result UI updated successfully."

    );

}