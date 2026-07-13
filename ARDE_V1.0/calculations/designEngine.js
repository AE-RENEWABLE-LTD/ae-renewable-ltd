// ======================================================
//
// AE RENEWABLE LTD
// ARDE V1.0
//
// FILE
// designEngine.js
//
// PURPOSE
// Main Engineering Design Engine
//
// ======================================================
import { choosePanel } from "../selection/panelSelector.js";
import { calculateEnergy } from "./energy.js";
import { calculateBattery } from "./battery.js";
import { calculatePV } from "./solar.js";
import { chooseBattery } from "../selection/batterySelector.js";
import { choosePVString } from "../selection/pvStringSelector.js";

// import { panels } from "../data/panels.js";

import { chooseInverter } from "../selection/inverterSelector.js";
import { chooseProtection } from "../selection/protectionSelector.js";


export function designSystem(input){

    // =====================================
    // USER INPUT
    // =====================================

    const{

        load,
        backup,
        psh,
        panelFactor,
        dod,
        losses,
        batteryPercent

    } = input;


    // =====================================
    // DAILY ENERGY
    // =====================================

    const dailyEnergy =
        calculateEnergy(
            load,
            backup
        );


    // =====================================
    // BATTERY REQUIREMENT
    // =====================================

    const batteryWh =
        calculateBattery(

            dailyEnergy,

            dod,

            batteryPercent

        );


    // =====================================
    // SOLAR PV REQUIRED
    // =====================================

    const solarPvRequired =
        calculatePV(

            load,

            losses,

            psh,

            batteryWh

        );


    // =====================================
    // PANEL SELECTION
    // =====================================

   const panelSelection =

    choosePanel(

        solarPvRequired

    );

const panel =

    panelSelection.panel;

const panelQuantity =

    panelSelection.quantity;


    // =====================================
    // INVERTER SELECTION
    // =====================================

    const inverterSelection =
        chooseInverter(
            solarPvRequired
        );

    if(!inverterSelection){

        throw new Error(
            "No suitable inverter found."
        );

    }
    const inverter = inverterSelection.inverter;

// =====================================
// BATTERY SELECTION
// =====================================

const batterySelection = chooseBattery(

    batteryWh,

    inverter

);
const protection = chooseProtection({

    inverter,

    panel,

    panelQuantity,

    solarPvRequired,

    batteryWh,

    battery: batterySelection.battery,

    inverterQuantity:
        inverterSelection.quantity

});



const pvString = choosePVString({

    panel,

    panelQuantity,

    inverter

});

    // =====================================
    // RETURN COMPLETE SYSTEM
    // =====================================

    return{

    // INPUT

    load,

    backup,

    psh,

    losses,

    dod,

    batteryPercent,


    // CALCULATIONS

    dailyEnergy,

    batteryWh,

    solarPvRequired,


    // PANEL

    panel,

panelQuantity,

installedPvPower:

panelSelection.installedPower,

protection,
    pvString,


    // INVERTER

    inverter,

    inverterQuantity:
        inverterSelection.quantity,


    // BATTERY

    battery:
        batterySelection.battery,

    batteryQuantity:
        batterySelection.quantity,

    installedBatteryWh:
        batterySelection.installedWh,


    // CURRENTS

   outputCurrent:
    protection.outputCurrent,

inputCurrent:
    protection.inputCurrent,

pvCurrent:
    protection.pvCurrent,

batteryCurrent:
    protection.batteryCurrent,

outputBreaker:
    protection.outputBreaker,

inputBreaker:
    protection.inputBreaker,

pvBreaker:
    protection.pvBreaker,

batteryBreaker:
    protection.batteryBreaker,

acSPD:
    protection.acSPD,

dcSPD:
    protection.dcSPD,

   

};

}