
/* ==========================================
   AE RENEWABLE INVENTORY DATABASE
========================================== */

/*
|--------------------------------------------------------------------------
| SOLAR PANELS
|--------------------------------------------------------------------------
*/

const panelInventory = [

    {
        id: "JINKO650",
        brand: "Jinko",
        model: "Tiger Neo",
        watt: 650,
        efficiency: 22.3,
        type: "Mono",
        warranty: 25
    },

    {
        id: "LONGI650",
        brand: "Longi",
        model: "Hi-MO X6",
        watt: 650,
        efficiency: 22.5,
        type: "Mono",
        warranty: 25
    },

    {
        id: "CANADIAN650",
        brand: "Canadian Solar",
        model: "TOPHiKu6",
        watt: 650,
        efficiency: 22.6,
        type: "Mono",
        warranty: 25
    }

];

/*
|--------------------------------------------------------------------------
| DEYE HYBRID INVERTERS
|--------------------------------------------------------------------------
*/

const deyeInverters = [

    {
        id: "DEYE3.6",
        brand: "Deye",
        model: "SUN-3.6K-SG04LP1",
        kva: 3.6,
        kw: 3.6,
        phase: "Single",
        batteryVoltage: 48,
        type: "Hybrid",
        CombineSolarCapacity: 5.4,
        CCMaxVoltage: 450,
        CCMaxCurrent: 12.5
    },

    {
        id: "DEYE5",
        brand: "Deye",
        model: "SUN-5K-SG04LP1",
        kva: 5,
        kw: 5,
        phase: "Single",
        batteryVoltage: 48,
        type: "Hybrid"
    },

    {
        id: "DEYE6",
        brand: "Deye",
        model: "SUN-6K-SG04LP1",
        kva: 6,
        kw: 6,
        phase: "Single",
        batteryVoltage: 48,
        type: "Hybrid"
    },

    {
        id: "DEYE8",
        brand: "Deye",
        model: "SUN-8K-SG01LP1",
        kva: 8,
        kw: 8,
        phase: "Single",
        batteryVoltage: 48,
        type: "Hybrid"
    },

    {
        id: "DEYE10",
        brand: "Deye",
        model: "SUN-10K-SG04LP3",
        kva: 10,
        kw: 10,
        phase: "Three",
        batteryVoltage: 48,
        type: "Hybrid"
    },

    {
        id: "DEYE12",
        brand: "Deye",
        model: "SUN-12K-SG04LP3",
        kva: 12,
        kw: 12,
        phase: "Three",
        batteryVoltage: 48,
        type: "Hybrid"
    },

    {
        id: "DEYE16",
        brand: "Deye",
        model: "SUN-16K-SG01LP1",
        kva: 16,
        kw: 16,
        phase: "Single",
        batteryVoltage: 48,
        type: "Hybrid"
    }

];

/*
|--------------------------------------------------------------------------
| FELICITY HYBRID INVERTERS
|--------------------------------------------------------------------------
*/

const felicityInverters = [

    {
        id: "FEL5",
        brand: "Felicity",
        model: "IVEM5048",
        kva: 5,
        kw: 5,
        phase: "Single",
        batteryVoltage: 48,
        type: "Hybrid"
    },

    {
        id: "FEL8",
        brand: "Felicity",
        model: "IVEM8048",
        kva: 8,
        kw: 8,
        phase: "Single",
        batteryVoltage: 48,
        type: "Hybrid"
    },

    {
        id: "FEL10",
        brand: "Felicity",
        model: "IVEM10048",
        kva: 10,
        kw: 10,
        phase: "Single",
        batteryVoltage: 48,
        type: "Hybrid"
    }

];

/*
|--------------------------------------------------------------------------
| FIRMAN INVERTERS
|--------------------------------------------------------------------------
*/

const firmanInverters = [

    {
        id: "FIR3.5",
        brand: "Firman",
        model: "3.5kVA",
        kva: 3.5,
        kw: 2.8,
        type: "Inverter"
    },

    {
        id: "FIR5",
        brand: "Firman",
        model: "5kVA",
        kva: 5,
        kw: 4,
        type: "Inverter"
    },

    {
        id: "FIR10",
        brand: "Firman",
        model: "10kVA",
        kva: 10,
        kw: 8,
        type: "Inverter"
    }

];

/*
|--------------------------------------------------------------------------
| LITHIUM BATTERIES
|--------------------------------------------------------------------------
*/

const batteryInventory = [

    {
        id: "BAT5",
        brand: "Deye",
        model: "RW-M5.3",
        kwh: 5.32,
        voltage: 51.2,
        chemistry: "LiFePO4"
    },

    {
        id: "BAT10",
        brand: "Deye",
        model: "RW-F10.2",
        kwh: 10.24,
        voltage: 51.2,
        chemistry: "LiFePO4"
    },

    {
        id: "BAT16",
        brand: "Deye",
        model: "SE-G5.1 x3",
        kwh: 15.36,
        voltage: 51.2,
        chemistry: "LiFePO4"
    },

    {
        id: "BAT20",
        brand: "Deye",
        model: "SE-G5.1 x4",
        kwh: 20.48,
        voltage: 51.2,
        chemistry: "LiFePO4"
    },

    {
        id: "BAT30",
        brand: "Deye",
        model: "SE-G5.1 x6",
        kwh: 30.72,
        voltage: 51.2,
        chemistry: "LiFePO4"
    },

    {
        id: "BAT40",
        brand: "Deye",
        model: "SE-G5.1 x8",
        kwh: 40.96,
        voltage: 51.2,
        chemistry: "LiFePO4"
    }

];

/*
|--------------------------------------------------------------------------
| COMBINED INVENTORY
|--------------------------------------------------------------------------
*/

const inverterInventory = [

    ...deyeInverters,
    ...felicityInverters,
    ...firmanInverters

];

/*
|--------------------------------------------------------------------------
| ACCESSORIES
|--------------------------------------------------------------------------
*/

const accessories = [

    {
        item: "PV Combiner Box"
    },

    {
        item: "DC Isolator"
    },

    {
        item: "AC Breaker"
    },

    {
        item: "SPD"
    },

    {
        item: "MC4 Connectors"
    },

    {
        item: "PV Cable"
    },

    {
        item: "Battery Cable"
    },

    {
        item: "Earthing Kit"
    },

    {
        item: "Mounting Structure"
    }

];

/*
|--------------------------------------------------------------------------
| HELPER FUNCTIONS
|--------------------------------------------------------------------------
*/

function getPanelByWatt(watt) {

    return panelInventory.find(
        panel => panel.watt === watt
    );

}

function getInverterById(id) {

    return inverterInventory.find(
        inverter => inverter.id === id
    );

}

function getBatteryById(id) {

    return batteryInventory.find(
        battery => battery.id === id
    );

}

