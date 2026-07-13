// ==========================================
// Update System Result Card
// ==========================================

function setText(id, value){

    const element = document.getElementById(id);

    if(element){

        element.textContent = value;

    }else{

        console.warn(`Missing element: ${id}`);

    }

}

export function updateResultCard(result){

    // =========================
    // SYSTEM SUMMARY
    // =========================

    setText(
        "resultLoadPower",
        `${result.load.toLocaleString()} W`
    );

    setText(
        "resultBackupTime",
        `${result.backup} Hours`
    );

    setText(
        "resultDailyEnergy",
        `${result.dailyEnergy.toLocaleString()} Wh`
    );

    setText(
        "resultBatteryEnergy",
        `${result.batteryWh.toLocaleString()} Wh`
    );

    setText(
        "resultSolarPV",
        `${result.solarPvRequired.toLocaleString()} W`
    );

    setText(
        "resultPanelModel",
        `${result.panel.brand} ${result.panel.model}`
    );

    setText(
        "resultPanelQuantity",
        `${result.panelQuantity} Panels`
    );

    setText(
        "resultInverterModel",
        `${result.inverter.brand} ${result.inverter.model}`
    );

    setText(
        "resultInverterQuantity",
        `${result.inverterQuantity} Unit`
    );

    setText(
        "resultBatteryModel",
        `${result.battery.brand} ${result.battery.model}`
    );

    setText(
        "resultBatteryQuantity",
        `${result.batteryQuantity} Unit`
    );

    setText(
        "resultInstalledBattery",
        `${result.installedBatteryWh.toLocaleString()} Wh`
    );

}