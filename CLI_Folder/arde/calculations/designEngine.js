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
// ENGINE FLOW
//
// 1. Calculate Daily Energy
// 2. Calculate Battery Requirement
// 3. Calculate Solar PV Requirement
// 4. Select Solar Panel
// 5. Select Inverter
// 6. Select Battery
// 7. Configure PV Strings
// 8. Calculate Protection Design
// 9. Return Complete Engineering System
//
// ======================================================


import { calculateEnergy } from "./energy.js";

import { calculateBattery } from "./battery.js";

import { calculatePV } from "./solar.js";


import { choosePanel } from "../selection/panelSelector.js";

import { chooseInverter } from "../selection/inverterSelector.js";

import { chooseBattery } from "../selection/batterySelector.js";

import { choosePVString } from "../selection/pvStringSelector.js";

import { chooseProtection } from "./protection.js";


// ======================================================
// MAIN DESIGN ENGINE
// ======================================================

export function designSystem(input) {


    // ==================================================
    // USER INPUT
    // ==================================================

    const {

        load,

        backup,

        psh,

        panelFactor,

        dod,

        losses,

        batteryPercent

    } = input;


    // ==================================================
    // VALIDATE USER INPUT
    // ==================================================

    if (
        load === undefined ||
        load === null ||
        load <= 0
    ) {

        throw new Error(
            "Load must be greater than zero."
        );

    }


    if (
        backup === undefined ||
        backup === null ||
        backup <= 0
    ) {

        throw new Error(
            "Backup duration must be greater than zero."
        );

    }


    if (
        psh === undefined ||
        psh === null ||
        psh <= 0
    ) {

        throw new Error(
            "Peak Sun Hours must be greater than zero."
        );

    }


    // ==================================================
    // DAILY ENERGY CALCULATION
    // ==================================================

    const dailyEnergy =

        calculateEnergy(

            load,

            backup

        );


    // ==================================================
    // BATTERY REQUIREMENT
    // ==================================================

    const batteryWh =

        calculateBattery(

            dailyEnergy,

            dod,

            batteryPercent

        );


    // ==================================================
    // SOLAR PV REQUIREMENT
    // ==================================================

    const solarPvRequired =

        calculatePV(

            load,

            losses,

            psh,

            batteryWh

        );


    // ==================================================
    // PANEL SELECTION
    // ==================================================

    const panelSelection =

        choosePanel(

            solarPvRequired

        );


    // ==================================================
    // VALIDATE PANEL SELECTION
    // ==================================================

    if (!panelSelection) {

        throw new Error(

            "No suitable solar panel found."

        );

    }


    // ==================================================
    // SELECT PANEL
    // ==================================================

    const panel =

        panelSelection.panel;


    // ==================================================
    // SELECT PANEL QUANTITY
    // ==================================================

    const panelQuantity =

        panelSelection.quantity;


    // ==================================================
    // INSTALLED PV POWER
    // ==================================================

    const installedPvPower =

        panelSelection.installedPower;


    // ==================================================
    // INVERTER SELECTION
    // ==================================================

    const inverterSelection =

        chooseInverter(

            solarPvRequired

        );


    // ==================================================
    // VALIDATE INVERTER SELECTION
    // ==================================================

    if (!inverterSelection) {

        throw new Error(

            "No suitable inverter found."

        );

    }


    // ==================================================
    // SELECT INVERTER
    // ==================================================

    const inverter =

        inverterSelection.inverter;


    // ==================================================
    // INVERTER QUANTITY
    // ==================================================

    const inverterQuantity =

        inverterSelection.quantity;


    // ==================================================
    // BATTERY SELECTION
    // ==================================================

    const batterySelection =

        chooseBattery(

            batteryWh,

            inverter

        );


    // ==================================================
    // VALIDATE BATTERY SELECTION
    // ==================================================

    if (!batterySelection) {

        throw new Error(

            "No suitable battery found."

        );

    }


    // ==================================================
    // SELECT BATTERY
    // ==================================================

    const battery =

        batterySelection.battery;


    // ==================================================
    // BATTERY QUANTITY
    // ==================================================

    const batteryQuantity =

        batterySelection.quantity;


    // ==================================================
    // INSTALLED BATTERY CAPACITY
    // ==================================================

    const installedBatteryWh =

        batterySelection.installedWh;


    // ==================================================
    // PV STRING CONFIGURATION
    //
    // IMPORTANT
    //
    // The PV String Engine is calculated BEFORE
    // Protection Design.
    //
    // This allows the Protection Engine to use the
    // exact same PV string configuration for:
    //
    // - Total PV Strings
    // - Panels per String
    // - MPPT Distribution
    // - MC4 Quantity
    // - PV Combiner
    //
    // ==================================================

    const pvString =

        choosePVString({

            panel,

            panelQuantity,

            inverter

        });


    // ==================================================
    // PROTECTION DESIGN
    //
    // The PV String result is passed directly into
    // Protection Design.
    //
    // This prevents protection.js from calculating
    // a different PV string configuration.
    //
    // ==================================================

    const protection =

        chooseProtection({

            inverter,

            panel,

            inverterQuantity,

            panelQuantity,

            pvPower:
                solarPvRequired,

            batteryVoltage:

                battery.voltage,

            pvString

        });


    // ==================================================
    // COMPLETE ENGINEERING SYSTEM
    // ==================================================

    const result = {


        // ==============================================
        // USER INPUT
        // ==============================================

        load,

        backup,

        psh,

        panelFactor,

        dod,

        losses,

        batteryPercent,


        // ==============================================
        // ENERGY CALCULATIONS
        // ==============================================

        dailyEnergy,

        batteryWh,

        solarPvRequired,


        // ==============================================
        // SOLAR PANEL
        // ==============================================

        panel,

        panelQuantity,

        installedPvPower,


        // ==============================================
        // INVERTER
        // ==============================================

        inverter,

        inverterQuantity,


        // ==============================================
        // BATTERY
        // ==============================================

        battery,

        batteryQuantity,

        installedBatteryWh,


        // ==============================================
        // PV STRING CONFIGURATION
        // ==============================================

        pvString,


        // ==============================================
        // PROTECTION DESIGN
        // ==============================================

        protection

    };


    // ==================================================
    // ENGINEERING CONSOLE OUTPUT
    // ==================================================

    console.log(

        "=============================================="

    );


    console.log(

        "AE RENEWABLE LTD - ARDE V1.0"

    );


    console.log(

        "COMPLETE ENGINEERING DESIGN RESULT"

    );


    console.log(

        "=============================================="

    );


    console.log(

        "DAILY ENERGY:",

        dailyEnergy

    );


    console.log(

        "BATTERY REQUIREMENT:",

        batteryWh

    );


    console.log(

        "SOLAR PV REQUIRED:",

        solarPvRequired

    );


    console.log(

        "SELECTED PANEL:",

        panel

    );


    console.log(

        "PANEL QUANTITY:",

        panelQuantity

    );


    console.log(

        "INSTALLED PV POWER:",

        installedPvPower

    );


    console.log(

        "SELECTED INVERTER:",

        inverter

    );


    console.log(

        "INVERTER QUANTITY:",

        inverterQuantity

    );


    console.log(

        "SELECTED BATTERY:",

        battery

    );


    console.log(

        "BATTERY QUANTITY:",

        batteryQuantity

    );


    console.log(

        "INSTALLED BATTERY CAPACITY:",

        installedBatteryWh

    );


    console.log(

        "PV STRING CONFIGURATION:",

        pvString

    );


    console.log(

        "PROTECTION DESIGN:",

        protection

    );


    console.log(

        "=============================================="

    );


    // ==================================================
    // RETURN COMPLETE RESULT
    // ==================================================

    return result;

}