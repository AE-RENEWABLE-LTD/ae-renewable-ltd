  
/* ==========================================
   AE RENEWABLE PROFESSIONAL SIZING ENGINE
========================================== */

/*
|--------------------------------------------------------------------------
| SYSTEM CONSTANTS
|--------------------------------------------------------------------------
*/

// const BATTERY_DOD = 0.90;
// const SYSTEM_EFFICIENCY = 0.95;

const BREAKER_LIST = [
    10,
    16,
    20,
    25,
    32,
    40,
    50,
    63,
    80,
    100,
    125,
    160,
    200,
    250,
    315,
    400,
    500,
    630
];

/*
|--------------------------------------------------------------------------
| MAIN DESIGN ENGINE
|--------------------------------------------------------------------------
*/

function designSystem(
    loadKW,
    backupHours,
    solarTargetW,
    panelWatt = 750
) {

    const requiredInverterKW =
        calculateRequiredInverterKW(
            loadKW * 1.25
        );

    const inverterSelection =
        selectBestInverter(
            requiredInverterKW
        );

    const batteryRequiredKWH =
        calculateBatteryRequirement(
            (loadKW * 1.25 ) *
            backupHours,
        );

    const batteryBank =
        selectBatteryBank(
            batteryRequiredKWH
        );

    const solar =
        calculatePanels(
            solarTargetW,
            panelWatt
        );

    const dcCurrent =
        calculateDCCurrent(
            solar.totalWatt
        );

    const dcBreaker =
        recommendBreaker(
            dcCurrent
        );

    const pvValidation =
        validatePVSizing(
            inverterSelection,
            solar.totalWatt
        );

    return {

        loadKW,

        backupHours,

        requiredInverterKW,

        inverter:
        inverterSelection,

        battery:
        batteryBank,

        solar,

        dcCurrent,

        dcBreaker,

        pvValidation

    };

}

/*
|--------------------------------------------------------------------------
| INVERTER CALCULATIONS
|--------------------------------------------------------------------------
*/

function calculateRequiredInverterKW(
    loadKW
) {

    return Number(
        (
            loadKW / 0.80
        ).toFixed(2)
    );

}

function selectBestInverter(
    requiredKW
) {

    const sorted =
        [...inverterInventory]
        .sort(
            (a, b) =>
            a.kw - b.kw
        );

    // Single inverter

    for (
        const inverter
        of sorted
    ) {

        if (
            inverter.kw >= requiredKW
        ) {

            return {

                quantity: 1,

                inverter,

                totalKW:
                inverter.kw

            };

        }

    }

    // Two identical inverters

    for (
        const inverter
        of sorted
    ) {

        const totalKW =
            inverter.kw * 2;

        if (
            totalKW >= requiredKW
        ) {

            return {

                quantity: 2,

                inverter,

                totalKW

            };

        }

    }

    // Three identical inverters

    for (
        const inverter
        of sorted
    ) {

        const totalKW =
            inverter.kw * 3;

        if (
            totalKW >= requiredKW
        ) {

            return {

                quantity: 3,

                inverter,

                totalKW

            };

        }

    }

    return null;

}

/*
|--------------------------------------------------------------------------
| BATTERY CALCULATIONS
|--------------------------------------------------------------------------
*/

function calculateBatteryRequirement(
    loadKW,
    backupHours
) {

    return Number(
        (
            (
                loadKW *
                backupHours
            )
        ).toFixed(2)
    );

}

function selectBatteryBank(
    requiredKWH
) {

    const module =
        batteryInventory[0];

    const quantity =
        Math.ceil(
            requiredKWH /
            module.kwh
        );

    const totalCapacity =
        Number(
            (
                quantity *
                module.kwh
            ).toFixed(2)
        );

    return {

        module,

        quantity,

        totalCapacity,

        requiredKWH

    };

}

/*
|--------------------------------------------------------------------------
| SOLAR CALCULATIONS
|--------------------------------------------------------------------------
*/

function calculatePanels(
    targetWatt,
    panelWatt
) {

    const quantity =
        Math.ceil(
            targetWatt /
            panelWatt
        );

    const totalWatt =
        quantity *
        panelWatt;

    const totalKW =
        Number(
            (
                totalWatt / 1000
            ).toFixed(2)
        );

    return {

        quantity,

        panelWatt,

        totalWatt,

        totalKW

    };

}

/*
|--------------------------------------------------------------------------
| DEYE PV VALIDATION
|--------------------------------------------------------------------------
*/

function getMaxPVAllowed(
    inverterKW
) {

    return Number(
        (
            inverterKW * 1.5
        ).toFixed(2)
    );

}

function validatePVSizing(
    inverterSelection,
    solarWatt
) {

    const inverterKW =
        inverterSelection.totalKW;

    const solarKW =
        solarWatt / 1000;

    const maxPV =
        getMaxPVAllowed(
            inverterKW
        );

    return {

        solarKW,

        maxPV,

        valid:
        solarKW <= maxPV

    };

}

/*
|--------------------------------------------------------------------------
| DC CURRENT
|--------------------------------------------------------------------------
*/

function calculateDCCurrent(
    solarWatt,
    voltage = 48
) {

    return Number(
        (
            solarWatt /
            voltage
        ).toFixed(2)
    );

}

/*
|--------------------------------------------------------------------------
| BREAKER CALCULATIONS
|--------------------------------------------------------------------------
*/

function recommendBreaker(
    current
) {

    const designCurrent =
        current * 1.25;

    const breaker =
        BREAKER_LIST.find(
            value =>
            value >= designCurrent
        );

    return breaker ||
    BREAKER_LIST[
        BREAKER_LIST.length - 1
    ];

}

/*
|--------------------------------------------------------------------------
| ACCESSORIES
|--------------------------------------------------------------------------
*/

function calculateAccessories(
    panelQuantity
) {

    return {

        dcBreaker: 1,

        acBreaker: 1,

        spd: 2,

        earthingKit: 1,

        mc4Pairs:
        panelQuantity,

        combinerBox:
        panelQuantity > 8
            ? 1
            : 0

    };

}

/*
|--------------------------------------------------------------------------
| FORMATTERS
|--------------------------------------------------------------------------
*/

function formatKW(
    value
) {

    return `${value} kW`;

}

function formatKWH(
    value
) {

    return `${value} kWh`;

}

function formatMoney(
    value
) {

    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 0
        }
    ).format(value);

}

