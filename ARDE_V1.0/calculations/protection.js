// ======================================================
//
// AE RENEWABLE LTD
// ARDE V1.0
//
// FILE
// protection.js
//
// PURPOSE
// Complete Protection Design Engine
//
// ======================================================

import {
    chooseBreaker
} from "../selection/breakerSelector.js";

import {inverters} from "../data/inverters.js";


// ======================================================
// PROTECTION DESIGN ENGINE
// ======================================================

export function chooseProtection(system) {

    const {

        inverter,

        panel,

        pvString,

        inverterQuantity = 1,

        panelQuantity = 0,

        pvPower = 0,

        batteryVoltage = 48

    } = system;


    // ==================================================
    // VALIDATION
    // ==================================================

    if (!inverter) {

        throw new Error(
            "Inverter data is missing for protection design."
        );

    }


    if (!panel) {

        throw new Error(
            "PV panel data is missing for protection design."
        );

    }


    // ==================================================
    // INVERTER DATA
    // ==================================================

    const inverterSize =
        Number(
            inverter.inverterSize
        ) || 0;


    const inverterAcVoltage =
        Number(
            inverter.inverterAcVoltage
        ) || 230;


    const inverterPvVoltage =
        Number(
            inverter.inverterPvVoltage
        ) || 0;


    const maxPvWatt =
        Number(
            inverter.maxPvWatt
        ) || 0;


    const maxACChargeCurrent =
        Number(
            inverter.maxACChargeCurrent
        ) || 0;


    const phase =
        Number(
            inverter.phase
        ) || 1;


    const mppt =
        Number(
            inverter.mppt
        ) || 1;


    const stringsPerMppt =
        Number(
            inverter.stringsPerMppt
        ) || 1;


    // ==================================================
    // PANEL DATA
    // ==================================================

    const panelIsc =
        Number(
            panel.isc
        ) || 0;


    const panelPower =
        Number(
            panel.power
        ) || 0;


    // ==================================================
    // PV STRING CONFIGURATION
    //
    // PV STRING DATA COMES FROM
    // pvStringSelector.js
    //
    // protection.js does not recalculate
    // panels per string or total strings.
    //
    // ==================================================

    const totalStrings =
        Number(
            pvString?.totalStrings
        ) || 0;


    const panelsPerString =
        Number(
            pvString?.panelsPerString
        ) || 0;


    const remainingPanels =
        Number(
            pvString?.remainingPanels
        ) || 0;


    const partialString =
        Boolean(
            pvString?.partialString
        );


    const stringVoc =
        Number(
            pvString?.stringVoc
        ) || 0;


    const stringVmp =
        Number(
            pvString?.stringVmp
        ) || 0;


    const stringPower =
        Number(
            pvString?.stringPower
        ) || 0;


    // ==================================================
    // PV CURRENT
    //
    // PV STRING CURRENT IS BASED ON PANEL Isc
    //
    // ==================================================

    const pvCurrent =
        panelIsc;


    // ==================================================
    // PV CURRENT WITH 125% SAFETY FACTOR
    // ==================================================

    const pvCurrentWM =
        pvCurrent *
        1.25;


    // ==================================================
    // AC OUTPUT CURRENT
    //
    // SINGLE PHASE:
    //
    // I = P / V
    //
    // THREE PHASE:
    //
    // I = P / (√3 × V)
    //
    // ==================================================

    const acOutputCurrent =

        phase === 1

            ? (

                inverterAcVoltage > 0

                    ? inverterSize /
                      inverterAcVoltage

                    : 0

            )

            : (

                inverterAcVoltage > 0

                    ? inverterSize /
                      (
                          Math.sqrt(3) *
                          inverterAcVoltage
                      )

                    : 0

            );


    // ==================================================
    // AC INPUT CURRENT
    // ==================================================

    const acInputCurrent =
        maxACChargeCurrent;


    // ==================================================
    // BATTERY CURRENT
    // ==================================================

    const batteryCurrent =

        batteryVoltage > 0

            ? inverterSize /
              batteryVoltage

            : 0;


    // ==================================================
    // 125% SAFETY FACTOR
    // ==================================================

    const acOutputCurrentWM =
        acOutputCurrent *
        1.25;


    const acInputCurrentWM =
        acInputCurrent *
        1.25;


    const batteryCurrentWM =
        batteryCurrent *
        1.25;


    // ==================================================
    // BREAKER SELECTION
    // ==================================================

    const acOutputBreaker =

        chooseBreaker(
            acOutputCurrentWM
        );


    const acInputBreaker =

        chooseBreaker(
            acInputCurrentWM
        );


    const batteryBreaker =

        chooseBreaker(
            batteryCurrentWM
        );


    const pvBreaker =

        chooseBreaker(
            pvCurrentWM
        );


    // ==================================================
    // AC SPD
    // ==================================================

    const acSPD =

        phase === 1

            ? {

                poles:
                    "2P",

                type:
                    "Type II",

                voltage:
                    "275VAC",

                quantity:
                    inverterQuantity

            }

            : {

                poles:
                    "4P",

                type:
                    "Type II",

                voltage:
                    "385VAC",

                quantity:
                    inverterQuantity

            };


    // ==================================================
    // DC SPD
    // ==================================================

    let dcSPD;


    if (
        inverterPvVoltage <= 500
    ) {

        dcSPD = {

            poles:
                "2P",

            type:
                "Type II",

            voltage:
                "600VDC",

            quantity:
                totalStrings

        };

    }

    else if (
        inverterPvVoltage <= 1000
    ) {

        dcSPD = {

            poles:
                "2P",

            type:
                "Type III",

            voltage:
                "1000VDC",

            quantity:
                totalStrings

        };

    }

    else {

        dcSPD = {

            poles:
                "2P",

            type:
                "Type II",

            voltage:
                "1500VDC",

            quantity:
                totalStrings

        };

    }


    // ==================================================
    // AC ISOLATOR
    // ==================================================

    const acIsolator = {

        rating:
            acOutputBreaker,

        quantity:
            inverterQuantity,

        phase:

            phase === 1

                ? "Single Phase"

                : "Three Phase"

    };


    // ==================================================
    // DC ISOLATOR
    //
    // ONE DC ISOLATOR PER PV STRING
    //
    // ==================================================

    const dcIsolator = {

        current:
            pvBreaker,

        quantity:
            totalStrings,

        voltage:
            inverterPvVoltage

    };


    // ==================================================
    // PV COMBINER RULE
    //
    // 1 - 9 STRINGS:
    // NO COMBINER
    //
    // 10+ STRINGS:
    // COMBINER REQUIRED
    //
    // ==================================================

    const combinerRequired =
        totalStrings >= 8;


    // ==================================================
    // COMBINER CAPACITY
    // ==================================================

    const combinerWays =
        8;


    // ==================================================
    // COMBINER QUANTITY
    // ==================================================

    const combinerQuantity =

        combinerRequired

            ? Math.ceil(
                totalStrings /
                combinerWays
            )

            : 0;


    // ==================================================
    // COMBINER BOX
    // ==================================================

    const combinerBox = {

        required:
            combinerRequired,

        quantity:
            combinerQuantity,

        ways:

            combinerRequired

                ? combinerWays

                : 0,

        inputStrings:
            totalStrings

    };


    // ==================================================
    // CHANGEOVER SWITCH
    // ==================================================

    const changeOverMinimum =
        acInputBreaker;


    const changeOverMaximum =
        acInputBreaker *
        1.5;


    const changeOverRating =

        chooseBreaker(
            changeOverMinimum
        );


    // ==================================================
    // VALIDATE CHANGEOVER
    // ==================================================

    if (
        changeOverRating >
        changeOverMaximum
    ) {

        throw new Error(

            `No suitable Changeover Switch found. ` +

            `AC Input Breaker: ` +

            `${acInputBreaker}A. ` +

            `Maximum allowed Changeover: ` +

            `${changeOverMaximum}A.`

        );

    }


    // ==================================================
    // CHANGEOVER OBJECT
    // ==================================================

    const changeOver = {

        rating:
            changeOverRating,

        quantity:
            inverterQuantity,

        phase:

            phase === 1

                ? "Single Phase"

                : "Three Phase",

        type:
            "Manual Changeover Switch"

    };


    // ==================================================
    // MC4 CONNECTORS
    //
    // 1 STRING =
    // 1 MC4 PAIR
    //
    // 1 PAIR =
    // 2 MC4 CONNECTORS
    //
    // ==================================================

    const mc4PairsRequired =
        totalStrings;


    const mc4ConnectorsRequired =
        totalStrings *
        2;


    // ==================================================
    // MC4 PROCUREMENT MARGIN
    // ==================================================

    const mc4Margin =
        1.5;


    const mc4PairsWithMargin =

        Math.ceil(

            mc4PairsRequired *
            mc4Margin

        );


    const mc4ConnectorsWithMargin =

        Math.ceil(

            mc4ConnectorsRequired *
            mc4Margin

        );


    // ==================================================
    // CABLE LUG
    // ==================================================

    let cableLug;


    if (
        inverterSize <= 8000
    ) {

        cableLug =
            "35mm²";

    }

    else if (
        inverterSize <= 20000
    ) {

        cableLug =
            "50mm²";

    }

    else if (
        inverterSize <= 50000
    ) {

        cableLug =
            "70mm²";

    }

    else if (
        inverterSize <= 120000
    ) {

        cableLug =
            "90mm²";

    }

    else {

        cableLug =
            "120mm²";

    }


    // ==================================================
    // SOLAR CABLE
    // ==================================================

    let solarCableSize;


    if (
        maxPvWatt <= 6000
    ) {

        solarCableSize =
            "4mm²";

    }

    else if (
        maxPvWatt <= 40000
    ) {

        solarCableSize =
            "6mm²";

    }

    else {

        solarCableSize =
            "10mm²";

    }


    const solarCable = {

        specification:
            `${solarCableSize} PV Solar Cable`,

        strings:
            totalStrings,

        length:
            totalStrings *
            20

    };


    // ==================================================
    // AC CABLE
    // ==================================================

    let acOutputCableSize;


    if (
        acOutputCurrentWM <= 25
    ) {

        acOutputCableSize =
            "6mm²";

    }

    else if (
        acOutputCurrentWM <= 63
    ) {

        acOutputCableSize =
            "10mm²";

    }

    // else if (
    //     acOutputCurrentWM <= 63
    // ) {

    //     acOutputCableSize =
    //         "10mm²";

    // }

    else if (
        acOutputCurrentWM <= 100
    ) {

        acOutputCableSize =
            "16mm²";

    }

    // else if (
    //     acOutputCurrentWM <= 150
    // ) {

    //     acOutputCableSize =
    //         "25mm²";

    // }

    else if (
        acOutputCurrentWM <= 200
    ) {

        acOutputCableSize =
            "25mm²";

    }

    else if (
        acOutputCurrentWM <= 300
    ) {

        acOutputCableSize =
            "35mm²";

    }

    else if (
        acOutputCurrentWM <= 400
    ) {

        acOutputCableSize =
            "50mm²";

    }

    else if (
        acOutputCurrentWM <= 600
    ) {

        acOutputCableSize =
            "95mm²";

    }

    else {

        acOutputCableSize =
            "120mm²";

    }


    // ==================================================
    // AC CABLE OUTPUT
    // ==================================================

    const acCable = {

        input: {

            specification:
                "4mm² PV Cable",

            length:
                totalStrings *
                20

        },

        output: {

            specification:

                `${acOutputCableSize} ${
                    phase === 1

                        ? "3 Core Copper"

                        : "4 Core Copper Armoured"
                }`,

            length:
                inverterQuantity *
                15

        }

    };


    // ==================================================
    // EARTHING
    // ==================================================

    let earthProject;

    let earthCable;

    let earthRod;


    if (
        inverterSize <= 24000
    ) {

        earthProject =
            "Small";

        earthCable =
            "4mm²";

        earthRod =
            1;

    }

    else if (
        inverterSize <= 80000
    ) {

        earthProject =
            "Medium";

        earthCable =
            "6mm²";

        earthRod =
            1;

    }

    else {

        earthProject =
            "Large";

        earthCable =
            "10mm²";

        earthRod =
            3;

    }


    // ==================================================
    // INPUT PHASE
    // ==================================================

    const inputPhase =
        phase;


    // ==================================================
    // ENGINEERING OUTPUT
    // ==================================================

    const result = {

        // ==============================================
        // CURRENTS
        // ==============================================

        acInputCurrent,

        acInputCurrentWM,

        acOutputCurrent,

        acOutputCurrentWM,

        batteryCurrent,

        batteryCurrentWM,

        pvCurrent,

        pvCurrentWM,


        // ==============================================
        // BREAKERS
        // ==============================================

        acInputBreaker: {

            rating:
                acInputBreaker,

            quantity:
                inverterQuantity

        },


        acOutputBreaker: {

            rating:
                acOutputBreaker,

            quantity:
                inverterQuantity

        },


        batteryBreaker: {

            rating:
                batteryBreaker,

            quantity:
                inverterQuantity

        },


        pvBreaker: {

            rating:
                pvBreaker,

            quantity:
                totalStrings

        },


        // ==============================================
        // CHANGEOVER
        // ==============================================

        changeover: {

            rating:
                changeOver.rating,

            quantity:
                changeOver.quantity,

            phase:
                changeOver.phase,

            type:
                changeOver.type

        },


        // ==============================================
        // SYSTEM INFORMATION
        // ==============================================

        phase,

        inputPhase,

        inverterQuantity,

        batteryVoltage,


        // ==============================================
        // PV STRING INFORMATION
        // ==============================================

        totalStrings,

        panelsPerString,

        remainingPanels,

        partialString,

        stringVoc,

        stringVmp,

        stringPower,

        stringsPerMppt,


        // ==============================================
        // PROTECTION
        // ==============================================

        acSPD,

        dcSPD,


        // ==============================================
        // ISOLATORS
        // ==============================================

        acIsolator,

        dcIsolator,


        // ==============================================
        // PV COMBINER
        // ==============================================

        combinerBox,


        // ==============================================
        // MC4
        // ==============================================

        mc4PairsRequired,

        mc4ConnectorsRequired,

        mc4Margin,

        mc4PairsWithMargin,

        mc4ConnectorsWithMargin,


        // ==============================================
        // ACCESSORIES
        // ==============================================

        cableLug,


        // ==============================================
        // CABLES
        // ==============================================

        solarCable,

        acCable,


        // ==============================================
        // EARTHING
        // ==============================================

        earthProject,

        earthCable,

        earthRod

    };


    // ==================================================
    // CONSOLE
    // ==================================================

    console.log(
        "PROTECTION DESIGN RESULT:",
        result
    );


    // ==================================================
    // RETURN
    // ==================================================

    return result;

}