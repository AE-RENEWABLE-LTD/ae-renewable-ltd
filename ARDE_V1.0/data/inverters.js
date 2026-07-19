// =========================================
// AE Renewable Solar Design Engine
// Inverter Database
// =========================================

export const inverters = [

{
    id:1,
    brand:"Firman",
    model:"FIR-1K-SG04LP1",

    inverterSize:3000,
    phase:1,

    maxPvWatt:4000,

    inverterPvVoltage:500,
    inverterAcVoltage:230,
    // inverterSizeAcInput:6000 , // Convert to current (A)
    maxACChargeCurrent:40,

    mppt:2,
    stringsPerMppt:1,

    batteryVoltage:48,

    price:950000
},

{
    id:1,
    brand:"Deye",
    model:"SUN-6K-SG04LP1",

    inverterSize:6000,
    phase:1,

    maxPvWatt:7800,

    inverterPvVoltage:500,
    inverterAcVoltage:230,
    // inverterSizeAcInput:6000,
    maxACChargeCurrent:60,

    mppt:2,
    stringsPerMppt:1,

    batteryVoltage:48,

    price:950000
},

{
    id:2,
    brand:"Deye",
    model:"SUN-8K-SG01LP1",

    inverterSize:8000,
    phase:1,

    maxPvWatt:10400,

    inverterPvVoltage:500,
    inverterAcVoltage:230,
    // inverterSizeAcInput:8000,
    maxACChargeCurrent:120,

    mppt:2,
    stringsPerMppt:1,

    batteryVoltage:48,

    price:1700000
},

{
    id:3,
    brand:"Deye",
    model:"SUN-10K-SG04LP3",

    inverterSize:10000,
    phase:3,

    maxPvWatt:13000,

    inverterPvVoltage:650,
    inverterAcVoltage:400,
    // inverterSizeAcInput:10000,
    maxACChargeCurrent:150,

    mppt:2,
    stringsPerMppt:2,

    batteryVoltage:48,

    price:2100000
},

{
    id:4,
    brand:"Deye",
    model:"SUN-12K-SG04LP3",

    inverterSize:12000,
    phase:3,

    maxPvWatt:15600,

    inverterPvVoltage:650,
    inverterAcVoltage:400,
    // inverterSizeAcInput:12000,
    maxACChargeCurrent:150,

    mppt:2,
    stringsPerMppt:2,

    batteryVoltage:48,

    price:2500000
},

{
    id:5,
    brand:"Deye",
    model:"SUN-16K-SG01HP3",

    inverterSize:16000,
    phase:3,

    maxPvWatt:20800,

    inverterPvVoltage:800,
    inverterAcVoltage:400,
    // inverterSizeAcInput:16000,
    maxACChargeCurrent:150,

    mppt:2,
    stringsPerMppt:2,

    batteryVoltage:160,

    price:3600000
}

];