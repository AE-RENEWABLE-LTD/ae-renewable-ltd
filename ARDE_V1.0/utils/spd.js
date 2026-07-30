// ======================================================
// AE RENEWABLE LTD | ARDE V1.0
// FILE: utils/spd.js
// PURPOSE: SPD calculation logic for AC/DC surge protection sizing
// ======================================================

/**
 * Selects recommended DC SPD rating based on maximum array string Voc.
 * 
 * @param {number} maxStringVoc - Maximum open-circuit voltage of string
 * @returns {Object} Recommended DC SPD spec
 */
export function calculateDcSpd(maxStringVoc) {
    let targetVoltage = 600;
    if (maxStringVoc > 500) {
        targetVoltage = 1000;
    } else if (maxStringVoc > 800) {
        targetVoltage = 1500;
    }

    return {
        type: "DC SPD",
        voltageRating: `${targetVoltage}V DC`,
        class: "Type 2",
        poles: 2,
        label: `DC SPD ${targetVoltage}V 2P (Class II)`
    };
}

/**
 * Selects recommended AC SPD rating based on system phases.
 * 
 * @param {number} phases - 1 for single-phase, 3 for three-phase
 * @returns {Object} Recommended AC SPD spec
 */
export function calculateAcSpd(phases = 1) {
    if (phases === 3) {
        return {
            type: "AC SPD",
            voltageRating: "400V AC",
            class: "Type 2",
            poles: 4,
            label: "AC SPD 400V 4P (3-Phase Class II)"
        };
    }

    return {
        type: "AC SPD",
        voltageRating: "275V AC",
        class: "Type 2",
        poles: 2,
        label: "AC SPD 275V 2P (Single-Phase Class II)"
    };
}