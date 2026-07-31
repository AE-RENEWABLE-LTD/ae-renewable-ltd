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


// ======================================================
// SET TEXT HELPER
// ======================================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (!element) {

        console.warn(
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


// ======================================================
// UPDATE PROTECTION CARD
// ======================================================

export function updateProtectionCard(system) {


    // ==================================================
    // GET PROTECTION DATA
    // ==================================================

    const protection =
        system?.protection;


    // ==================================================
    // SAFETY CHECK
    // ==================================================

    if (!protection) {

        console.warn(
            "Protection data not found."
        );

        return;

    }


    console.log(
        "PROTECTION OUTPUT:",
        protection
    );


    // ==================================================
    // PHASE
    // ==================================================

    setText(
        "phase",
        protection.phase != null
            ? `${protection.phase} Phase`
            : "-"
    );


    // ==================================================
    // AC OUTPUT CURRENT
    // ==================================================

    setText(
        "resultOutputCurrent",
        protection.acOutputCurrent != null
            ? `${Number(protection.acOutputCurrent).toFixed(2)} A`
            : "-"
    );


    // ==================================================
    // AC OUTPUT BREAKER
    // ==================================================

    setText(
        "resultOutputBreaker",
        protection.acOutputBreaker?.rating != null
            ? `${protection.acOutputBreaker.rating} A`
            : "-"
    );


    // ==================================================
    // AC OUTPUT BREAKER QUANTITY
    // ==================================================

    setText(
        "resultOutputBreakerQuantity",
        protection.acOutputBreaker?.quantity != null
            ? `${protection.acOutputBreaker.quantity} Nos`
            : "-"
    );


    // ==================================================
    // AC INPUT CURRENT
    // ==================================================

    setText(
        "resultInputCurrent",
        protection.acInputCurrent != null
            ? `${Number(protection.acInputCurrent).toFixed(2)} A`
            : "-"
    );


    // ==================================================
    // AC INPUT BREAKER
    // ==================================================

    setText(
        "resultInputBreaker",
        protection.acInputBreaker?.rating != null
            ? `${protection.acInputBreaker.rating} A`
            : "-"
    );


    // ==================================================
    // AC INPUT BREAKER QUANTITY
    // ==================================================

    setText(
        "resultInputBreakerQuantity",
        protection.acInputBreaker?.quantity != null
            ? `${protection.acInputBreaker.quantity} Nos`
            : "-"
    );


    // ==================================================
    // CHANGEOVER SWITCH
    // ==================================================

    setText(
        "resultChangeover",
        protection.changeover?.rating != null
            ? `${protection.changeover.rating} A`
            : "-"
    );


    // ==================================================
    // CHANGEOVER SWITCH QUANTITY
    // ==================================================

    setText(
        "resultChangeoverQuantity",
        protection.changeover?.quantity != null
            ? `${protection.changeover.quantity} Nos`
            : "-"
    );


    // ==================================================
    // PV CURRENT
    // ==================================================

    setText(
        "resultPVCurrent",
        protection.pvCurrent != null
            ? `${Number(protection.pvCurrent).toFixed(2)} A`
            : "-"
    );


    // ==================================================
    // PV BREAKER
    // ==================================================

    setText(
        "resultPVBreaker",
        protection.pvBreaker?.rating != null
            ? `${protection.pvBreaker.rating} A`
            : "-"
    );


    // ==================================================
    // PV BREAKER QUANTITY
    // ==================================================

    setText(
        "resultPVBreakerQuantity",
        protection.pvBreaker?.quantity != null
            ? `${protection.pvBreaker.quantity} Nos`
            : "-"
    );


    // ==================================================
    // BATTERY CURRENT
    // ==================================================

    setText(
        "resultBatteryCurrent",
        protection.batteryCurrent != null
            ? `${Number(protection.batteryCurrent).toFixed(2)} A`
            : "-"
    );


    // ==================================================
    // BATTERY BREAKER
    // ==================================================

    setText(
        "resultBatteryBreaker",
        protection.batteryBreaker?.rating != null
            ? `${protection.batteryBreaker.rating} A`
            : "-"
    );


    // ==================================================
// BATTERY BREAKER QUANTITY
// ==================================================

setText(
    "resultBatteryBreakerQuantity",
    protection.batteryBreaker?.quantity != null
        ? `${protection.batteryBreaker.quantity} Nos`
        : "-"
);


    // ==================================================
    // BATTERY BREAKER QUANTITY
    // ==================================================

    setText(
        "resultBatteryBreakerQuantity",
        protection.batteryBreaker?.quantity != null
            ? `${protection.batteryBreaker.quantity} Nos`
            : "-"
    );


    // ==================================================
    // AC SURGE PROTECTION
    // ==================================================

    setText(
        "resultACSPD",
        protection.acSPD
            ? `${protection.acSPD.poles} ${protection.acSPD.type} ${protection.acSPD.voltage}`
            : "-"
    );


    // ==================================================
    // AC SURGE PROTECTION QUANTITY
    // ==================================================

    setText(
        "resultACSPDQuantity",
        protection.acSPD?.quantity != null
            ? `${protection.acSPD.quantity} Nos`
            : "-"
    );


    // ==================================================
    // DC SURGE PROTECTION
    // ==================================================

    setText(
        "resultDCSPD",
        protection.dcSPD
            ? `${protection.dcSPD.poles} ${protection.dcSPD.type} ${protection.dcSPD.voltage}`
            : "-"
    );


    // ==================================================
    // DC SURGE PROTECTION QUANTITY
    // ==================================================

    setText(
        "resultDCSPDQuantity",
        protection.dcSPD?.quantity != null
            ? `${protection.dcSPD.quantity} Nos`
            : "-"
    );


    // ==================================================
    // EARTH CABLE
    // ==================================================

    setText(
        "ear",
        protection.earthCable ?? "-"
    );


    // ==================================================
    // COMPLETE
    // ==================================================

    console.log(
        "Protection card updated successfully."
    );

}