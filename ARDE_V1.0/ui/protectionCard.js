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

// export function updateProtectionCard(system){

//     const protection = system.protection;

//     console.log("SYSTEM", system);

//     console.log("PROTECTION", protection);

//     console.log("acOutputCurrent =", protection.acOutputCurrent);

//     console.log("acInputCurrent =", protection.acInputCurrent);

//     console.log("pvCurrent =", protection.pvCurrent);

//     console.log("batteryCurrent =", protection.batteryCurrent);

// }

export function updateProtectionCard(system){

    const protection = system.protection;

    console.log(protection);

    setText(
        "resultOutputCurrent",
        `${protection.acOutputCurrent.toFixed(2)} A`
    );

    setText(
        "resultOutputBreaker",
        `${protection.acOutputBreaker} A`
    );

    setText(
        "phase",
        `${protection.phase} Phase`
    );

    setText(
        "resultInputCurrent",
        `${protection.acInputCurrent.toFixed(2)} A`
    );      

    setText(
        "resultInputBreaker",
        `${protection.acInputBreaker} A`
    );

     setText(
        "Inputphase",
        `${protection.phase} Phase`
    );

     setText(
        "resultOutputBreakerQuantity",
        `${protection.inverterQuantity} Phase`
    );

    //     setText(
    //     "phase",
    //     `${protection.phase} Phase`
    // );

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
        `${protection.acSPD.poles} ${protection.acSPD.type} ${protection.acSPD.voltage}`
    );

    setText(
        "resultDCSPD",
        `${protection.dcSPD.poles} ${protection.dcSPD.type} ${protection.dcSPD.voltage}`
    );

}



