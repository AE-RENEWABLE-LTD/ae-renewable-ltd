// ======================================================
//
// AE RENEWABLE LTD
// ARDE V1.0
//
// FILE
// inverterSelector.js
//
// PURPOSE
// Automatic Inverter Selection
//
// ======================================================

import { inverters } from "../data/inverters.js";


export function chooseInverter(solarPvRequired) {

    // ==============================================
    // MINIMUM PV REQUIREMENT
    // ==============================================

    const minimum =
        solarPvRequired;


    // ==============================================
    // MAXIMUM PV ALLOWED
    // 150% OF REQUIRED PV
    // ==============================================

    const maximum =
        solarPvRequired * 1.5;


    // ==============================================
    // FIND ONE SUITABLE INVERTER
    // ==============================================

    const singleInverter =
        inverters
            .filter(inverter =>

                inverter.maxPvWatt >= minimum &&

                inverter.maxPvWatt <= maximum

            )
            .sort(
                (a, b) =>
                    a.maxPvWatt -
                    b.maxPvWatt
            )[0];


    if (singleInverter) {

        return {

            inverter:
                singleInverter,

            quantity: 1

        };

    }


    // ==============================================
    // FIND TWO IDENTICAL INVERTERS
    // ==============================================

    for (const inverter of inverters) {

        const totalPv =
            inverter.maxPvWatt * 2;


        if (

            totalPv >= minimum &&

            totalPv <= maximum

        ) {

            return {

                inverter,

                quantity: 2

            };

        }

    }


    // ==============================================
    // FIND THREE IDENTICAL INVERTERS
    // ==============================================

    for (const inverter of inverters) {

        const totalPv =
            inverter.maxPvWatt * 3;


        if (

            totalPv >= minimum &&

            totalPv <= maximum

        ) {

            return {

                inverter,

                quantity: 3

            };

        }

    }


    // ==============================================
    // NO SUITABLE INVERTER
    // ==============================================

    return null;

}