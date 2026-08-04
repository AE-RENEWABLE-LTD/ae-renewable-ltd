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


export function chooseBreaker(current) {

    const sortedBreakers =
        [...breakers].sort(
            (a, b) => a - b
        );


    const breaker =
        sortedBreakers.find(
            size => size >= current
        );


    return breaker ??
        sortedBreakers[
            sortedBreakers.length - 1
        ];

}