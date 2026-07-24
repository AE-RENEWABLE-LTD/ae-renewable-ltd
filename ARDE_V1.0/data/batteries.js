// ======================================================
//
// AE RENEWABLE LTD
// ARDE V1.0
//
// FILE
// batteries.js
//
// PURPOSE
// Battery Database
//
// ======================================================

export const batteries = [

// -----------------------------------------
  // FIRMAN BATTERIES
  // -----------------------------------------
  {
    id: 1,
    brand: "Firman",
    model: "FIR-G5.1 Pro",
    voltage: 51.2,
    capacityWh: 5120,
    chemistry: "Lithium",
    stackLimit: 3,
    price: 650000
  },

  // -----------------------------------------
  // DEYE BATTERIES
  // -----------------------------------------
  {
    id: 2,
    brand: "Deye",
    model: "SE-G5.1 Pro",
    voltage: 51.2,
    capacityWh: 5120,
    chemistry: "Lithium",
    stackLimit: 12,
    price: 650000
  },
//   {
//     id: 3,
//     brand: "Deye",
//     model: "GB-L",
//     voltage: 52.2,
//     capacityWh: 20480,
//     chemistry: "HV Lithium",
//     stackLimit: 3,
//     price: 2200000
//   },

  // -----------------------------------------
  // FELICITY SOLAR BATTERIES
  // -----------------------------------------
  {
    id: 4,
    brand: "Felicity",
    model: "FLA4850 5kwh",
    voltage: 51.2,
    capacityWh: 5120,
    chemistry: "Lithium",
    stackLimit: 1,
    price: 500000
  },
  {
    id: 5,
    brand: "Felicity",
    model: "LPBF48200-H 10240kwh",
    voltage: 51.2,
    capacityWh: 10240,
    chemistry: "Lithium",
    stackLimit: 12,
    price: 1150000
  },
  {
    id: 6,
    brand: "Felicity",
    model: "LUX-E-48200LG04 15kwh",
    voltage: 51.2,
    capacityWh: 15000,
    chemistry: "Lithium",
    stackLimit: 4,
    price: 1650000
  }

];