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

import { breakers } from "../data/breakers.js";
import { chooseBreaker } from "./breakerSelector.js";

export function chooseProtection(system){

    //==================================================
    // INPUT
    //==================================================

    const{

        inverter,
        panel,

        inverterQuantity = 1,
        panelQuantity = 0,

        pvPower = 0,

        batteryVoltage = 48

    } = system;

    console.log("Protection Input:", system);

    //==================================================
    // INVERTER DATA
    //==================================================

    const{

        inverterSize,
        inverterAcVoltage,
        inverterPvVoltage,

        maxPvWatt,

        maxACChargeCurrent = 0,
        maxPVInputCurrent = 0,

        phase,

        mppt,
        stringsPerMppt

    } = inverter;

    //==================================================
    // PANEL DATA
    //==================================================

    const{

        power,
        voc,
        vmp,
        isc,
        imp

    } = panel;

    //==================================================
    // PV STRING CONFIGURATION
    //==================================================

    const totalStrings =
        mppt * stringsPerMppt;

    const panelsPerString =
        Math.ceil(
            panelQuantity /
            totalStrings
        );

    const parallelStrings =
        stringsPerMppt;

    //==================================================
    // AC INPUT CURRENT
    //==================================================

    const acInputCurrent =
        maxACChargeCurrent ||
        (inverterSize / inverterAcVoltage);

    const acInputCurrentWM =

        acInputCurrent * 1.25;

    //==================================================
    // AC INPUT BREAKER
    //==================================================

    const acInputBreaker =

        chooseBreaker(

            acInputCurrentWM

        ) ??

        breakers[

            breakers.length - 1

        ];

    //==================================================
    // AC OUTPUT CURRENT
    //==================================================

    let acOutputCurrent;

    if(phase === 1){

        acOutputCurrent =

            inverterSize /

            inverterAcVoltage;

    }

    else{

        acOutputCurrent =

            inverterSize /

            (

                Math.sqrt(3)

                *

                inverterAcVoltage

            );

    }

    const acOutputCurrentWM =

        acOutputCurrent * 1.25;

    //==================================================
    // AC OUTPUT BREAKER
    //==================================================

    const acOutputBreaker =

        chooseBreaker(

            acOutputCurrentWM

        ) ??

        breakers[

            breakers.length - 1

        ];

    //==================================================
    // BATTERY CURRENT
    //==================================================

    const batteryCurrent =

        inverterSize /

        batteryVoltage;

    const batteryCurrentWM =

        batteryCurrent * 1.25;

    //==================================================
    // BATTERY BREAKER
    //==================================================

    const batteryBreaker =

        chooseBreaker(

            batteryCurrentWM

        ) ??

        breakers[

            breakers.length - 1

        ];

    //==================================================
    // PV CURRENT
    //==================================================

    const pvCurrent =

        isc *

        parallelStrings;

    const pvCurrentWM =

        pvCurrent * 1.25;

    //==================================================
    // PV BREAKER
    //==================================================

    const pvBreaker =

        chooseBreaker(

            pvCurrentWM

        ) ??

        breakers[

            breakers.length - 1

        ];


            //==================================================
    // BATTERY CURRENT
    //==================================================

    const batteryCurrent =
        inverterSize / batteryVoltage;

    const batteryCurrentWM =
        batteryCurrent * 1.25;

    //==================================================
    // BATTERY BREAKER
    //==================================================

    const batteryBreaker =
        chooseBreaker(batteryCurrentWM)
        ??
        breakers[breakers.length - 1];

    //==================================================
    // PV CURRENT
    //==================================================

    const pvCurrent =
        isc * stringsPerMppt;

    const pvCurrentWM =
        pvCurrent * 1.25;

    //==================================================
    // PV BREAKER
    //==================================================

    const pvBreaker =
        chooseBreaker(pvCurrentWM)
        ??
        breakers[breakers.length - 1];

    //==================================================
    // AC SPD
    //==================================================

    let acSPD;

    if (phase === 1) {

        acSPD = {

            poles: "2P",

            type: "Type II",

            voltage: "275VAC"

        };

    }

    else {

        acSPD = {

            poles: "4P",

            type: "Type II",

            voltage: "385VAC"

        };

    }

    //==================================================
    // DC SPD
    //==================================================

    let dcSPD;

    if (inverterPvVoltage <= 600) {

        dcSPD = {

            poles: "2P",

            type: "Type II",

            voltage: "600VDC"

        };

    }

    else if (inverterPvVoltage <= 1000) {

        dcSPD = {

            poles: "2P",

            type: "Type II",

            voltage: "1000VDC"

        };

    }

    else {

        dcSPD = {

            poles: "2P",

            type: "Type II",

            voltage: "1500VDC"

        };

    }

    //==================================================
    // COMBINER BOX
    //==================================================

    let combinerBox = {

        required: false,

        quantity: 0,

        ways: 0

    };

    const totalInputs =
        mppt * stringsPerMppt;

    if (

        inverter.maxPvWatt >= 80000 ||

        totalInputs >= 8

    ) {

        combinerBox.required = true;

        combinerBox.quantity =
            Math.ceil(totalInputs / 8);

        combinerBox.ways =
            totalInputs;

    }

    //==================================================
    // CHANGEOVER SWITCH
    //==================================================

    const changeOver =
        chooseBreaker(acOutputBreaker * 1.25)
        ??
        breakers[breakers.length - 1];

    //==================================================
    // AC ISOLATOR
    //==================================================

    const acIsolator = {

        quantity: inverterQuantity,

        rating: acOutputBreaker,

        phase:
            phase === 1
            ? "Single Phase"
            : "Three Phase"

    };

    //==================================================
    // DC ISOLATOR
    //==================================================

    const dcIsolator = {

        quantity: totalStrings,

        current: pvBreaker,

        voltage: inverterPvVoltage

    };

    //==================================================
    // CABLE LUG
    //==================================================

    let cableLug;

    if (inverterSize <= 3000)

        cableLug = "16mm²";

    else if (inverterSize <= 6000)

        cableLug = "25mm²";

    else if (inverterSize <= 12000)

        cableLug = "35mm²";

    else if (inverterSize <= 20000)

        cableLug = "50mm²";

    else if (inverterSize <= 50000)

        cableLug = "70mm²";

    else

        cableLug = "95mm²";

    //==================================================
    // MC4 CONNECTORS
    //==================================================

    const mc4Pair =
        totalStrings * 2;


            //==================================================
    // CABLE LUG
    //==================================================

    let cableLug;

    if (inverterSize <= 3000) {

        cableLug = "16mm²";

    } else if (inverterSize <= 6000) {

        cableLug = "25mm²";

    } else if (inverterSize <= 12000) {

        cableLug = "35mm²";

    } else if (inverterSize <= 20000) {

        cableLug = "50mm²";

    } else if (inverterSize <= 50000) {

        cableLug = "70mm²";

    } else {

        cableLug = "95mm²";

    }

    //==================================================
    // MC4 CONNECTORS
    //==================================================

    const mc4Pair = totalStrings * 2;

    //==================================================
    // SOLAR CABLE
    //==================================================

    let solarCableSize;

    if (inverter.maxPvWatt <= 6000) {

        solarCableSize = "4mm²";

    } else if (inverter.maxPvWatt <= 20000) {

        solarCableSize = "6mm²";

    } else {

        solarCableSize = "10mm²";

    }

    const solarCable = {

        specification: `${solarCableSize} PV Solar Cable`,

        strings: totalStrings,

        length: totalStrings * 20

    };

    //==================================================
    // AC OUTPUT CABLE SIZE
    //==================================================

    let acOutputCableSize;

    if (phase === 1) {

        if (acOutputCurrentWM <= 20)

            acOutputCableSize = "2.5mm²";

        else if (acOutputCurrentWM <= 28)

            acOutputCableSize = "4mm²";

        else if (acOutputCurrentWM <= 36)

            acOutputCableSize = "6mm²";

        else if (acOutputCurrentWM <= 50)

            acOutputCableSize = "10mm²";

        else if (acOutputCurrentWM <= 68)

            acOutputCableSize = "16mm²";

        else

            acOutputCableSize = "25mm²";

    } else {

        if (acOutputCurrentWM <= 22)

            acOutputCableSize = "2.5mm²";

        else if (acOutputCurrentWM <= 30)

            acOutputCableSize = "4mm²";

        else if (acOutputCurrentWM <= 40)

            acOutputCableSize = "6mm²";

        else if (acOutputCurrentWM <= 55)

            acOutputCableSize = "10mm²";

        else if (acOutputCurrentWM <= 70)

            acOutputCableSize = "16mm²";

        else if (acOutputCurrentWM <= 95)

            acOutputCableSize = "25mm²";

        else

            acOutputCableSize = "35mm²";

    }

    //==================================================
    // AC CABLE
    //==================================================

    const acCable = {

        input: {

            specification: "4mm² PV Cable",

            length: totalStrings * 20

        },

        output: {

            specification:
                `${acOutputCableSize} ${phase === 1 ? "3 Core Copper" : "4 Core Copper Armoured"}`,

            length: inverterQuantity * 10

        }

    };

    //==================================================
    // EARTHING
    //==================================================

    let earthProject;

    let earthCable;

    let earthRod;

    if (inverterSize <= 16000) {

        earthProject = "Small";

        earthCable = "4mm²";

        earthRod = 2;

    } else if (inverterSize <= 60000) {

        earthProject = "Medium";

        earthCable = "10mm²";

        earthRod = 4;

    } else {

        earthProject = "Large";

        earthCable = "16mm²";

        earthRod = 6;

    }

    //==================================================
    // RETURN
    //==================================================

    return {

        // Currents

        acInputCurrent,

        acOutputCurrent,

        batteryCurrent,

        pvCurrent,

        // Breakers

        acInputBreaker,

        acOutputBreaker,

        batteryBreaker,

        pvBreaker,

        // Protection

        acSPD,

        dcSPD,

        acIsolator,

        dcIsolator,

        // Switching

        changeOver,

        combinerBox,

        // Accessories

        cableLug,

        mc4Pair,

        // Cables

        solarCable,

        acCable,

        // Earthing

        earthProject,

        earthCable,

        earthRod

    };

}