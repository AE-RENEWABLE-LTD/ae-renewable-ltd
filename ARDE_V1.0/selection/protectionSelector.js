// // ======================================================
// //
// // AE RENEWABLE LTD
// // ARDE V1.0
// //
// // FILE
// // protectionSelector.js
// //
// // PURPOSE
// // Complete Protection Engineering
// //
// // ======================================================

// import { chooseBreaker } from "./breakerSelector.js";

// export function chooseProtection(system){

//     const inverter = system.inverter;

//     // =====================================
//     // OUTPUT CURRENT
//     // =====================================

//     const acOutputCurrent =

//         inverter.phase === 1

//         ?

//         inverter.inverterSize /
//         inverter.inverterAcVoltage

//         :

//         inverter.inverterSize /
//         (1.732 * inverter.inverterAcVoltage);

//     const outputBreaker =

//         chooseBreaker(acOutputCurrent);

//     // =====================================
//     // INPUT CURRENT
//     // =====================================

//     const inputCurrent =

//         inverter.phase === 1

//         ?

//         inverter.inverterSizeAcInput /
//         inverter.inverterAcVoltage

//         :

//         inverter.inverterSizeAcInput /
//         (1.732 * inverter.inverterAcVoltage);

//     const inputBreaker =

//         chooseBreaker(inputCurrent);

//     // =====================================
//     // PV CURRENT
//     // =====================================

//     const pvCurrent =

//         system.solarPvRequired /
//         inverter.inverterPvVoltage;

//     const pvBreaker =

//         chooseBreaker(pvCurrent);

//     // =====================================
//     // BATTERY CURRENT
//     // =====================================

//     const batteryCurrent =

//         inverter.inverterSize /
//         inverter.batteryVoltage;

//     const batteryBreaker =

//         chooseBreaker(batteryCurrent);

//     // =====================================
//     // SPD
//     // =====================================

//     const acSPD = "Type II";

//     const dcSPD = "Type II";

//     return{

//         acOutputCurrent,
//         outputBreaker,

//         inputCurrent,
//         inputBreaker,

//         pvCurrent,
//         pvBreaker,

//         batteryCurrent,
//         batteryBreaker,

//         acSPD,
//         dcSPD

//     };

// }