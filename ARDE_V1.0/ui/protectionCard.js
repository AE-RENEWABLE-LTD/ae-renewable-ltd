// ======================================================
//
// AE RENEWABLE LTD
// ARDE V1.0
//
// FILE
// protectionCard.js
//
// PURPOSE
// Update Protection Design Section
//
// ======================================================

function setText(id, value){

    const element = document.getElementById(id);

    if(!element){

        console.warn(`Missing element: ${id}`);

        return;

    }

    element.textContent = value;

}

export function updateProtectionCard(system){

    const protection = system.protection;

    setText(
        "resultOutputCurrent",
        `${protection.outputCurrent.toFixed(2)} A`
    );

    setText(
        "resultOutputBreaker",
        `${protection.outputBreaker} A`
    );

    setText(
        "resultInputCurrent",
        `${protection.inputCurrent.toFixed(2)} A`
    );

    setText(
        "resultInputBreaker",
        `${protection.inputBreaker} A`
    );

    setText(
        "resultPVCurrent",
        `${protection.pvCurrent.toFixed(2)} A`
    );

    setText(
        "resultPVBreaker",
        `${protection.pvBreaker} A`
    );

    setText(
        "resultBatteryCurrent",
        `${protection.batteryCurrent.toFixed(2)} A`
    );

    setText(
        "resultBatteryBreaker",
        `${protection.batteryBreaker} A`
    );

    setText(
        "resultACSPD",
        protection.acSPD
    );

    setText(
        "resultDCSPD",
        protection.dcSPD
    );

    // updateProtectionCard(system);
    

}

