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
import { chooseBreaker } from "../selection/breakerSelector.js";
// import { choosePhase } from "../data/inverters.js";






export function chooseProtection(system){
  const {

    inverter,
    panel,

    inverterQuantity = 1,
    panelQuantity = 0,

    pvPower = 0,

    batteryVoltage = 48

} = system;

const {

    inverterSize,
    inverterAcVoltage,
    inverterPvVoltage,

    maxPvWatt,
    maxACChargeCurrent = 0,

    phase,

    mppt,
    stringsPerMppt

} = inverter;


const {

    isc,
    power

} = panel;

//==================================================
// PV STRING CONFIGURATION
//==================================================

const totalStrings =
    mppt * stringsPerMppt;

const panelsPerString =
    Math.ceil(panelQuantity / totalStrings);

const parallelStrings =
    stringsPerMppt;


//==================================================
// AC OUTPUT CURRENT
//==================================================

const acOutputCurrent =
    phase === 1
        ? inverterSize / inverterAcVoltage
        : inverterSize /
          (Math.sqrt(3) * inverterAcVoltage);


//==================================================
// AC INPUT CURRENT
//==================================================

const acInputCurrent =
    maxACChargeCurrent;


//==================================================
// BATTERY CURRENT
//==================================================

const batteryCurrent =
    inverterSize /
    batteryVoltage ;


//==================================================
// PV CURRENT
//==================================================

const pvCurrent =
    isc *
    parallelStrings;

    //==================================================
// SAFETY FACTOR (125%)
//==================================================

const acOutputCurrentWM =
    acOutputCurrent * 1.25;

const acInputCurrentWM =
    acInputCurrent * 1.25;

const batteryCurrentWM =
    batteryCurrent * 1.25;

const pvCurrentWM =
    pvCurrent ;

    //==================================================
// BREAKERS
//==================================================

const acOutputBreaker =
    chooseBreaker(acOutputCurrentWM);

const acInputBreaker =
    chooseBreaker(acInputCurrentWM);

const batteryBreaker =
    chooseBreaker(batteryCurrentWM);

const pvBreaker =
    chooseBreaker(pvCurrentWM);

    //==================================================
// AC SPD
//==================================================

const acSPD =
    phase === 1
        ? {
            poles: "2P",
            type: "Type II",
            voltage: "275VAC"
        }
        : {
            poles: "4P",
            type: "Type II",
            voltage: "385VAC"
        };

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
// AC ISOLATOR
//==================================================

const acIsolator = {

    quantity: inverterQuantity,

    rating: acOutputBreaker,

    phase: phase === 1
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
// COMBINER BOX
//==================================================

const combinerBox = {

    required: totalStrings > 4,

    quantity: totalStrings > 4
        ? Math.ceil(totalStrings / 8)
        : 0,

    ways: totalStrings

};


//==================================================
// CHANGEOVER SWITCH
//==================================================

const changeOver = chooseBreaker(

    acOutputBreaker * 1.25

);


//==================================================
// CHANGEOVER SWITCH
//==================================================

// const changeOver = chooseBreaker(

//     acOutputBreaker * 1.25

// );


//==================================================
// MC4 CONNECTORS
//==================================================

const mc4Pair = totalStrings * 2;

//==================================================
// CABLE LUG
//==================================================

let cableLug;

if (inverterSize <= 8000)

    cableLug = "35mm²";

else if (inverterSize <= 20000)

    cableLug = "50mm²";

else if (inverterSize <= 50000)

    cableLug = "70mm²";

else if (inverterSize <= 120000)

    cableLug = "90mm²";

// else if (inverterSize <= 50000)

//     cableLug = "70mm²";

else

    cableLug = "120mm²";



//==================================================
// SOLAR CABLE
//==================================================

let solarCableSize;

if (maxPvWatt <= 6000)

    solarCableSize = "4mm²";

else if (maxPvWatt <= 20000)

    solarCableSize = "6mm²";

else

    solarCableSize = "10mm²";

const solarCable = {

    specification: `${solarCableSize} PV Solar Cable`,

    strings: totalStrings,

    length: totalStrings * 20

};


//==================================================
// AC CABLE
//==================================================

let acOutputCableSize;

if (acOutputCurrentWM <= 25)

    acOutputCableSize = "4mm²";

else if (acOutputCurrentWM <= 40)

    acOutputCableSize = "6mm²";

else if (acOutputCurrentWM <= 63)

    acOutputCableSize = "10mm²";

else if (acOutputCurrentWM <= 100)

    acOutputCableSize = "16mm²";
else if (acOutputCurrentWM <= 150)
    acOutputCableSize = "25mm²";

else if (acOutputCurrentWM <= 200)
    acOutputCableSize = "35mm²";

else if (acOutputCurrentWM <= 300)
    acOutputCableSize = "50mm²";
else if (acOutputCurrentWM <= 400)
    acOutputCableSize = "70mm²";
else if (acOutputCurrentWM <= 600)
    acOutputCableSize = "90mm²";
// else if (acOutputCurrentWM <= 300)
//     acOutputCableSize = "50mm²";

// else if (acOutputCurrentWM <= 100)

//     acOutputCableSize = "16mm²";
// else if (acOutputCurrentWM <= 100)

//     acOutputCableSize = "16mm²";
// else if (acOutputCurrentWM <= 100)

    // acOutputCableSize = "16mm²";

// else if (acOutputCurrentWM <= 100)

//     acOutputCableSize = "16mm²";
// else if (acOutputCurrentWM <= 100)

//     acOutputCableSize = "16mm²";
// else if (acOutputCurrentWM <= 100)

//     acOutputCableSize = "16mm²";
// else if (acOutputCurrentWM <= 100)

//     acOutputCableSize = "16mm²";

else

    acOutputCableSize = "120mm²";

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

    earthRod = 1;

}

else if (inverterSize <= 60000) {

    earthProject = "Medium";

    earthCable = "10mm²";

    earthRod = 2;

}

else {

    earthProject = "Large";

    earthCable = "16mm²";

    earthRod = 3;

}


// /////////////////////////////

// const phase = phase;


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
     phase,
    acOutputBreaker,
     phase,
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