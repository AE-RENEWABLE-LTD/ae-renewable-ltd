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

import { calculateEnergy } from "./energy.js";
import { calculateBattery } from "./battery.js";
import { calculatePV } from "./solar.js";

import { choosePanel } from "../selection/panelSelector.js";
import { chooseInverter } from "../selection/inverterSelector.js";
import { chooseBattery } from "../selection/batterySelector.js";
import { choosePVString } from "../selection/pvStringSelector.js";
import { chooseProtection } from "../selection/protectionSelector.js";

export function designSystem(input){

    //====================================
    // USER INPUT
    //====================================

    const{

        load,
        backup,
        psh,
        panelFactor,
        dod,
        losses,
        batteryPercent

    } = input;

    //====================================
    // DAILY ENERGY
    //====================================

    const dailyEnergy = calculateEnergy(

        load,
        backup

    );

    //====================================
    // BATTERY REQUIREMENT
    //====================================

    const batteryWh = calculateBattery(

        dailyEnergy,
        dod,
        batteryPercent

    );

    //====================================
    // SOLAR PV REQUIRED
    //====================================

    const solarPvRequired = calculatePV(

        load,
        losses,
        psh,
        batteryWh

    );

    //====================================
    // PANEL SELECTION
    //====================================

    const panelSelection = choosePanel(

        solarPvRequired

    );

    const panel = panelSelection.panel;

    const panelQuantity = panelSelection.quantity;

    //====================================
    // INVERTER SELECTION
    //====================================

    const inverterSelection = chooseInverter(

        solarPvRequired

    );

    if(!inverterSelection){

        throw new Error(

            "No suitable inverter found."

        );

    }

    const inverter = inverterSelection.inverter;

    //====================================
    // BATTERY SELECTION
    //====================================

    const batterySelection = chooseBattery(

        batteryWh,
        inverter

    );

    //====================================
    // PROTECTION SELECTION
    //====================================

    const protection = chooseProtection({

        inverter,

        panel,

        inverterQuantity:
            inverterSelection.quantity,

        panelQuantity,

        pvPower:
            solarPvRequired,

        batteryVoltage:
            batterySelection.battery.voltage

    });

    //====================================
    // PV STRING CONFIGURATION
    //====================================

    const pvString = choosePVString({

        panel,

        panelQuantity,

        inverter

    });

    //====================================
    // RETURN COMPLETE SYSTEM
    //====================================

    

}