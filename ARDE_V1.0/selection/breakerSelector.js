// ======================================================
//
// AE RENEWABLE LTD
// ARDE V1.0
//
// FILE
// breakerSelector.js
//
// PURPOSE
// Automatic Breaker Selection
//
// ======================================================

import { breakers } from "../data/breakers.js";


// ======================================================
// CHOOSE BREAKER
// ======================================================

export function chooseBreaker(current) {

    // ----------------------------------------------
    // Validate current
    // ----------------------------------------------

    if (
        typeof current !== "number" ||
        !Number.isFinite(current) ||
        current <= 0
    ) {

        console.warn(
            "Invalid breaker current:",
            current
        );

        return null;

    }


    // ----------------------------------------------
    // Sort breaker ratings
    // ----------------------------------------------

    const sortedBreakers =

        [...breakers]

            .filter(
                value =>
                    typeof value === "number" &&
                    Number.isFinite(value)
            )

            .sort(
                (a, b) => a - b
            );


    // ----------------------------------------------
    // Find first suitable breaker
    // ----------------------------------------------

    const breaker =

        sortedBreakers.find(

            size => size >= current

        );


    // ----------------------------------------------
    // Return largest breaker if current
    // exceeds list
    // ----------------------------------------------

    return (

        breaker ??

        sortedBreakers[
            sortedBreakers.length - 1
        ]

    );

}