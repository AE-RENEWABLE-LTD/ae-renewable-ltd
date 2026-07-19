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

export function chooseBreaker(current){

    const maximum = current * 1.5;

    const breaker = breakers.find(size =>

        size >= current &&
        size <= maximum

    );

    return breaker ?? breakers[breakers.length - 1];

}