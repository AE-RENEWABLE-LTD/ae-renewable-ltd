// ======================================================
//
// AE RENEWABLE LTD
// ARDE V1.0
//
// FILE
// batterySelector.js
//
// PURPOSE
// Automatic Battery Selection
//
// ======================================================

import { batteries } from "../data/batteries.js";

export function chooseBattery(

    batteryWh,

    inverter

){

    // =====================================
    // SAME BRAND FIRST
    // =====================================

    let available = batteries.filter(

        battery =>

        battery.brand === inverter.brand

    );

    // =====================================
    // FALLBACK
    // =====================================

    if(available.length === 0){

        available = batteries;

    }

    // =====================================
    // CHOOSE LARGEST CAPACITY
    // =====================================

    available.sort(

        (a,b)=>

        b.capacityWh -

        a.capacityWh

    );

    const battery = available[0];

    // =====================================
    // QUANTITY
    // =====================================

    const quantity =

        Math.ceil(

            batteryWh /

            battery.capacityWh

        );

    // =====================================
    // TOTAL INSTALLED
    // =====================================

    const installedWh =

        quantity *

        battery.capacityWh;

    return{

        battery,

        quantity,

        installedWh

    };

}