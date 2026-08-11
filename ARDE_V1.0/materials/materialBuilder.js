// ======================================================
//
// AE RENEWABLE LTD
// ARDE V1.0
//
// FILE
// materialBuilder.js
//
// PURPOSE
// Build Complete Bill of Quantities (BOQ) Schedule
//
// ======================================================


// ======================================================
// FORMAT PROTECTION RATING
// ======================================================

function getProtectionRating(value) {

    if (
        typeof value === "number" &&
        Number.isFinite(value)
    ) {

        return value;

    }


    if (
        value &&
        typeof value === "object"
    ) {

        if (
            typeof value.rating === "number"
        ) {

            return value.rating;

        }


        if (
            typeof value.current === "number"
        ) {

            return value.current;

        }


        if (
            typeof value.size === "number"
        ) {

            return value.size;

        }


        if (
            typeof value.value === "number"
        ) {

            return value.value;

        }

    }


    return null;

}


// ======================================================
// FORMAT AC BREAKER
// ======================================================
//
// ONLY AC BREAKERS GET PHASE INFORMATION.
//
// Examples:
//
// 63A Single Phase AC Output Breaker
// 100A Three Phase AC Input Breaker
//
// ======================================================

function formatACBreaker(
    value,
    phase = 1
) {

    const rating =
        getProtectionRating(value);


    if (
        rating === null
    ) {

        return "Not Selected";

    }


    const phaseText =

        Number(phase) === 3

            ? "Three Phase"

            : "Single Phase";


    return `${rating}A ${phaseText}`;

}


// ======================================================
// FORMAT DC BREAKER
// ======================================================
//
// DC BREAKERS DO NOT HAVE SINGLE/THREE PHASE.
//
// Examples:
//
// 630A Battery Breaker
// 25A PV DC Breaker
//
// ======================================================

function formatDCBreaker(value) {

    const rating =
        getProtectionRating(value);


    if (
        rating === null
    ) {

        return "Not Selected";

    }


    return `${rating}A`;

}


// ======================================================
// FORMAT BUSBAR
// ======================================================
//
// BUSBAR IS NOT PHASE-LABELLED.
//
// Examples:
//
// 630A Copper Busbar
// 400A Copper Busbar
//
// ======================================================

function formatBusbarRating(value) {

    const rating =
        getProtectionRating(value);


    if (
        rating === null
    ) {

        return "Not Selected";

    }


    return `${rating}A`;

}


// ======================================================
// FORMAT SPD
// ======================================================

function formatSPD(spd) {

    if (!spd) {

        return "Not Selected";

    }


    if (
        typeof spd === "object"
    ) {

        const poles =
            spd.poles ?? "";


        const type =
            spd.type ?? "";


        const voltage =
            spd.voltage ?? "";


        return `${poles} ${type} ${voltage}`.trim();

    }


    return String(spd);

}


// ======================================================
// GET NEXT VALID BUSBAR RATING
// ======================================================
//
// RULE:
//
// Minimum = Battery Breaker
//
// Maximum = Battery Breaker × 1.5
//
// Preferred:
// Exact battery breaker rating.
//
// Otherwise:
// Smallest available rating above battery breaker.
//
// Never exceed 1.5 × battery breaker.
//
// ======================================================

function selectBusbarRating(
    batteryBreakerRating,
    breakerRatings
) {

    const minimum =
        Number(batteryBreakerRating) || 0;


    if (
        minimum <= 0
    ) {

        return null;

    }


    const maximum =
        minimum * 1.5;


    // ==================================================
    // FIND EXACT MATCH FIRST
    // ==================================================

    const exactMatch =

        breakerRatings.find(

            rating =>
                Number(rating) === minimum

        );


    if (
        exactMatch !== undefined
    ) {

        return exactMatch;

    }


    // ==================================================
    // FIND NEXT VALID RATING
    // ==================================================

    const candidates =

        breakerRatings

            .filter(

                rating =>

                    Number(rating) >= minimum &&

                    Number(rating) <= maximum

            )

            .sort(

                (a, b) =>

                    Number(a) - Number(b)

            );


    if (
        candidates.length === 0
    ) {

        return null;

    }


    return candidates[0];

}


// ======================================================
// MAIN MATERIAL BUILDER
// ======================================================

export function buildMaterialList(system) {

    // ==================================================
    // VALIDATION
    // ==================================================

    if (!system) {

        throw new Error(
            "Material Builder: system is required."
        );

    }


    const {

        protection,

        panelQuantity = 0,

        inverterQuantity = 1,

        batteryQuantity = 1

    } = system;


    if (!protection) {

        throw new Error(
            "Material Builder: protection data is missing."
        );

    }


    // ==================================================
    // PROJECT SIZE
    // ==================================================

    const projectSize =
        protection.earthProject;


    // ==================================================
    // PHASE
    // ==================================================

    const phase =

        Number(
            protection.phase
        ) || 1;


    const phaseText =

        phase === 3

            ? "Three Phase"

            : "Single Phase";


    // ==================================================
    // BREAKER RATING DATABASE
    // ==================================================

    const breakerRatings = [

        0.5,
        1,
        2,
        3,
        4,
        6,
        10,
        16,
        20,
        25,
        32,
        40,
        63,
        80,
        100,
        125,
        160,
        200,
        250,
        400,
        630,
        800,
        1000,
        1200,
        1600,
        2000,
        2500,
        3200,
        4000,
        5000,
        6300

    ];


    // ==================================================
    // PROJECT SIZE MATERIAL RULES
    // ==================================================

    let pipeSize;

    let pipeLength;

    let clipPacket;

    let tapeQty;

    let screwPacket;

    let pegSpec;

    let extQty;

    let cableTieQty;

    let sealantQty;

    let acOutputCableLength;


    // ==================================================
    // SMALL PROJECT
    // ==================================================

    if (
        projectSize === "Small"
    ) {

        pipeSize =
            "32mm Flexible Pipe";

        pipeLength =
            20;

        clipPacket =
            1;

        tapeQty =
            2;

        screwPacket =
            1;

        pegSpec =
            "10mm Pegs (1 Packet)";

        extQty =
            1;

        cableTieQty =
            1;

        sealantQty =
            1;

        acOutputCableLength =
            20;

    }


    // ==================================================
    // MEDIUM PROJECT
    // ==================================================

    else if (
        projectSize === "Medium"
    ) {

        pipeSize =
            "50mm Flexible Pipe";

        pipeLength =
            40;

        clipPacket =
            2;

        tapeQty =
            6;

        screwPacket =
            2;

        pegSpec =
            "12mm Pegs (2 Packets)";

        extQty =
            1;

        cableTieQty =
            2;

        sealantQty =
            2;

        acOutputCableLength =
            40;

    }


    // ==================================================
    // LARGE PROJECT
    // ==================================================

    else {

        pipeSize =
            "75mm Flexible Pipe";

        pipeLength =
            50;

        clipPacket =
            3;

        tapeQty =
            10;

        screwPacket =
            3;

        pegSpec =
            "12mm Pegs (3 Packets)";

        extQty =
            2;

        cableTieQty =
            3;

        sealantQty =
            3;

        acOutputCableLength =
            60;

    }


    // ==================================================
    // MOUNTING HARDWARE
    // ==================================================

    const boltAndNutQty =

        Math.ceil(
            panelQuantity * 2.5
        );


    const panelRailQty =

        Math.ceil(
            panelQuantity / 4
        );


    // ==================================================
    // BATTERY CABLE
    // ==================================================
    //
    // Battery cable starts when battery quantity
    // reaches 2.
    //
    // 4 meters per battery.
    //
    // ==================================================

    const batteryCableRequired =

        batteryQuantity >= 2;


    const batteryCableQty =

        batteryCableRequired

            ? batteryQuantity * 4

            : 0;


    // ==================================================
    // BATTERY CABLE LUG
    // ==================================================

    const batteryCableLugQty =

        batteryQuantity >= 2

            ? batteryQuantity * 4

            : 0;


    // ==================================================
    // TRUNKING
    // ==================================================

    let trunkSize;

    let trunkQty;


    if (
        inverterQuantity <= 2
    ) {

        trunkSize =
            "75x75 mm PVC Trunking";

        trunkQty =
            2;

    }

    else if (
        inverterQuantity <= 4
    ) {

        trunkSize =
            "100x100 mm PVC Trunking";

        trunkQty =
            4;

    }

    else {

        trunkSize =
            "150x100 mm PVC Trunking";

        trunkQty =
            6;

    }


    // ==================================================
    // AC BREAKERS
    // ==================================================
    //
    // AC BREAKERS SHOW PHASE.
    //
    // ==================================================

    const outputBreaker =

        formatACBreaker(
            protection.acOutputBreaker,
            phase
        );


    const inputBreaker =

        formatACBreaker(
            protection.acInputBreaker,
            phase
        );


    // ==================================================
    // BATTERY BREAKER
    // ==================================================
    //
    // BATTERY BREAKER DOES NOT SHOW PHASE.
    //
    // ==================================================

    const batteryBreaker =

        formatDCBreaker(
            protection.batteryBreaker
        );


    // ==================================================
    // PV DC BREAKER
    // ==================================================
    //
    // PV DC BREAKER DOES NOT SHOW PHASE.
    //
    // ==================================================

    const pvBreaker =

        formatDCBreaker(
            protection.pvBreaker
        );


    // ==================================================
    // CHANGEOVER SWITCH
    // ==================================================
    //
    // CHANGEOVER MUST MATCH AC INPUT BREAKER.
    //
    // CHANGEOVER IS AC, THEREFORE PHASE IS SHOWN.
    //
    // ==================================================

    const acInputBreakerRating =

        getProtectionRating(
            protection.acInputBreaker
        );


    const changeOverRating =
        acInputBreakerRating;


    const changeOverDescription =

        changeOverRating !== null

            ? `${changeOverRating}A ${phaseText} Changeover Switch`

            : `Not Selected ${phaseText} Changeover Switch`;


    // ==================================================
    // BUSBAR RULE
    // ==================================================
    //
    // BUSBAR REQUIRED WHEN:
    //
    // Battery quantity >= 2
    //
    // OR
    //
    // Inverter quantity >= 2
    //
    // ==================================================

    const busbarRequired =

        batteryQuantity >= 2 ||

        inverterQuantity >= 2;


    // ==================================================
    // BATTERY BREAKER BASE RATING
    // ==================================================

    const batteryBreakerRating =

        getProtectionRating(
            protection.batteryBreaker
        );


    // ==================================================
    // BUSBAR RATING
    // ==================================================
    //
    // Same as battery breaker where possible.
    //
    // If exact rating is not available:
    //
    // Select next available rating.
    //
    // Maximum:
    //
    // Battery Breaker × 1.5
    //
    // ==================================================

    const busbarRating =

        busbarRequired

            ? selectBusbarRating(
                batteryBreakerRating,
                breakerRatings
            )

            : null;


    // ==================================================
    // BUSBAR DESCRIPTION
    // ==================================================
    //
    // IMPORTANT:
    //
    // NO PHASE TEXT.
    //
    // ==================================================

    const busbarDescription =

        busbarRequired &&

        busbarRating !== null

            ? `${busbarRating}A Copper Busbar`

            : null;


    // ==================================================
    // BUSBAR QUANTITY
    // ==================================================

    const busbarQuantity =

        busbarRequired

            ? 1

            : 0;


    // ==================================================
    // SPD
    // ==================================================

    const acSPD =

        formatSPD(
            protection.acSPD
        );


    const dcSPD =

        formatSPD(
            protection.dcSPD
        );


    // ==================================================
    // BUILD BOQ
    // ==================================================

    const boq = [

        // ==================================================
        // 1. SOLAR PANEL
        // ==================================================

        {

            description:
                `${system.panel.brand} ${system.panel.power}W Solar Panel`,

            unit:
                "pcs",

            quantity:
                panelQuantity,

            unitPrice:
                system.panel.price

        },


        // ==================================================
        // 2. INVERTER
        // ==================================================

        {

            description:
                `${system.inverter.brand} ${system.inverter.model}`,

            unit:
                "pcs",

            quantity:
                inverterQuantity,

            unitPrice:
                system.inverter.price

        },


        // ==================================================
        // 3. BATTERY
        // ==================================================

        {

            description:
                `${system.battery.brand} ${system.battery.model}`,

            unit:
                "pcs",

            quantity:
                batteryQuantity,

            unitPrice:
                system.battery.price

        },


        // ==================================================
        // 4. CHANGEOVER SWITCH
        // ==================================================

        {

            description:
                changeOverDescription,

            unit:
                "pcs",

            quantity:
                inverterQuantity,

            unitPrice:
                0

        },


        // ==================================================
        // 5. AC OUTPUT BREAKER
        // ==================================================

        {

            description:
                `${outputBreaker} AC Output Breaker`,

            unit:
                "pcs",

            quantity:
                inverterQuantity,

            unitPrice:
                0

        },


        // ==================================================
        // 6. AC INPUT BREAKER
        // ==================================================

        {

            description:
                `${inputBreaker} AC Input Breaker`,

            unit:
                "pcs",

            quantity:
                inverterQuantity,

            unitPrice:
                0

        },


        // ==================================================
        // 7. BATTERY BREAKER
        // ==================================================
        //
        // NO PHASE.
        //
        // ==================================================

        {

            description:
                `${batteryBreaker} Battery Breaker`,

            unit:
                "pcs",

            quantity:
                batteryQuantity,

            unitPrice:
                0

        },


        // ==================================================
        // 8. BUSBAR
        // ==================================================
        //
        // NO PHASE.
        //
        // ==================================================

        ...(

            busbarRequired &&

            busbarDescription

                ? [

                    {

                        description:
                            busbarDescription,

                        unit:
                            "pcs",

                        quantity:
                            busbarQuantity,

                        unitPrice:
                            0

                    }

                ]

                : []

        ),


        // ==================================================
        // 9. PV DC BREAKER
        // ==================================================
        //
        // NO PHASE.
        //
        // ==================================================

        {

            description:
                `${pvBreaker} PV DC Breaker`,

            unit:
                "pcs",

            quantity:

                protection.dcIsolator?.quantity ??

                protection.totalStrings ??

                1,

            unitPrice:
                0

        },


        // ==================================================
        // 10. AC SPD
        // ==================================================

        {

            description:
                `${acSPD} AC SPD`,

            unit:
                "pcs",

            quantity:
                inverterQuantity,

            unitPrice:
                0

        },


        // ==================================================
        // 11. DC SPD
        // ==================================================

        {

            description:
                `${dcSPD} DC SPD`,

            unit:
                "pcs",

            quantity:
                inverterQuantity,

            unitPrice:
                0

        },


        // ==================================================
        // 12. PV SOLAR CABLE
        // ==================================================

        {

            description:
                protection.solarCable.specification,

            unit:
                "meters",

            quantity:
                protection.solarCable.length,

            unitPrice:
                0

        },


        // ==================================================
        // 13. AC OUTPUT CABLE
        // ==================================================

        {

            description:
                protection.acCable.output.specification,

            unit:
                "meters",

            quantity:
                acOutputCableLength,

            unitPrice:
                0

        },


        // ==================================================
        // 14. EARTH CABLE
        // ==================================================

        {

            description:
                `${protection.earthCable} Earth Cable`,

            unit:
                "meters",

            quantity:
                20,

            unitPrice:
                0

        },


        // ==================================================
        // 15. BATTERY CABLE
        // ==================================================

        ...(

            batteryCableRequired

                ? [

                    {

                        description:
                            `${protection.cableLug} Battery Cable`,

                        unit:
                            "meters",

                        quantity:
                            batteryCableQty,

                        unitPrice:
                            0

                    }

                ]

                : []

        ),


        // ==================================================
        // 16. BATTERY CABLE LUG
        // ==================================================

        ...(

            batteryQuantity >= 2

                ? [

                    {

                        description:
                            `${protection.cableLug} Heavy Duty Battery Cable Lug`,

                        unit:
                            "pcs",

                        quantity:
                            batteryCableLugQty,

                        unitPrice:
                            0

                    }

                ]

                : []

        ),


        // ==================================================
        // 17. MOUNTING RAIL
        // ==================================================

        {

            description:
                "Aluminum Solar Panel Rail",

            unit:
                "length",

            quantity:
                panelRailQty,

            unitPrice:
                7000

        },


        // ==================================================
        // 18. BOLT & NUT SETS
        // ==================================================

        {

            description:
                "S17 Stainless Steel Bolt & Nut Sets",

            unit:
                "pcs",

            quantity:
                boltAndNutQty,

            unitPrice:
                500

        },


        // ==================================================
        // 19. FLEXIBLE PIPE
        // ==================================================

        {

            description:
                pipeSize,

            unit:
                "meters",

            quantity:
                pipeLength,

            unitPrice:
                400

        },


        // ==================================================
        // 20. PIPE CLIPS
        // ==================================================

        {

            description:
                `Cable Clips (for ${pipeSize})`,

            unit:
                "packet",

            quantity:
                clipPacket,

            unitPrice:
                1500

        },


        // ==================================================
        // 21. TRUNKING
        // ==================================================

        {

            description:
                trunkSize,

            unit:
                "pcs",

            quantity:
                trunkQty,

            unitPrice:
                5000

        },


        // ==================================================
        // 22. INSULATION TAPE
        // ==================================================

        {

            description:
                "High-Grade Electrical Insulation Tape",

            unit:
                "rolls",

            quantity:
                tapeQty,

            unitPrice:
                500

        },


        // ==================================================
        // 23. SCREW PACKETS
        // ==================================================

        {

            description:
                "Assorted Screw Packets",

            unit:
                "packet",

            quantity:
                screwPacket,

            unitPrice:
                500

        },


        // ==================================================
        // 24. PEGS
        // ==================================================

        {

            description:
                pegSpec,

            unit:
                "set",

            quantity:
                1,

            unitPrice:
                1500

        },


        // ==================================================
        // 25. CABLE TIES
        // ==================================================

        {

            description:
                "Heavy Duty Cable Ties",

            unit:
                "packet",

            quantity:
                cableTieQty,

            unitPrice:
                0

        },


        // ==================================================
        // 26. SEALANT
        // ==================================================

        {

            description:
                "Solar Installation Sealant",

            unit:
                "tube",

            quantity:
                sealantQty,

            unitPrice:
                0

        },


        // ==================================================
        // 27. FIRE EXTINGUISHER
        // ==================================================

        {

            description:
                "CO2 Fire Extinguisher (DCP)",

            unit:
                "unit",

            quantity:
                extQty,

            unitPrice:
                16000

        },


        // ==================================================
        // 28. EARTH ROD
        // ==================================================

        {

            description:
                "Copper Earth Rod (1.5m)",

            unit:
                "pcs",

            quantity:
                protection.earthRod,

            unitPrice:
                600

        }

    ];


    // ==================================================
    // ENGINEERING DEBUG INFORMATION
    // ==================================================

    console.log(

        "BOQ PROTECTION SUMMARY:",

        {

            phase:
                phaseText,

            acInputBreaker:
                inputBreaker,

            acOutputBreaker:
                outputBreaker,

            batteryBreaker:
                batteryBreaker,

            pvBreaker:
                pvBreaker,

            changeover:
                changeOverDescription,

            busbarRequired,

            busbarRating,

            busbarDescription,

            batteryQuantity,

            inverterQuantity

        }

    );


    // ==================================================
    // RETURN BOQ
    // ==================================================

    return boq;

}