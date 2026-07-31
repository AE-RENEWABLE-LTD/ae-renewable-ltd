// ======================================================
//
// AE RENEWABLE LTD
// ARDE V1.0
//
// FILE
// pvStringSelector.js
//
// PURPOSE
// PV STRING CONFIGURATION ENGINE
//
// LOGIC
//
// 1. Read inverter maximum PV voltage
// 2. Read panel Voc
// 3. Apply 10% PV voltage design margin
// 4. Calculate maximum safe panels per string
// 5. Calculate total PV strings
// 6. Balance panels across strings
// 7. Check inverter MPPT capacity
// 8. Distribute strings across MPPTs
// 9. Calculate MC4 connector pairs
// 10. Add 1.5 procurement margin to MC4
// 11. Introduce PV combiner at 10 or more strings
//
// ======================================================


export function choosePVString({

    panel,

    panelQuantity,

    inverter

}) {


    console.log(
        "PV STRING ENGINE LOADED"
    );


    // ==================================================
    // VALIDATION
    // ==================================================

    if (!panel) {

        throw new Error(
            "PV panel data is missing."
        );

    }


    if (!inverter) {

        throw new Error(
            "Inverter data is missing."
        );

    }


    if (
        !panelQuantity ||
        panelQuantity <= 0
    ) {

        throw new Error(
            "PV panel quantity must be greater than zero."
        );

    }


    // ==================================================
    // PANEL DATA
    // ==================================================

    const panelPower =
        Number(panel.power) || 0;


    const panelVoc =
        Number(panel.voc) || 0;


    const panelVmp =
        Number(panel.vmp) || 0;


    const panelIsc =
        Number(panel.isc) || 0;


    // ==================================================
    // INVERTER PV DATA
    // ==================================================

    const maxPvVoltage =

        Number(
            inverter.inverterPvVoltage
        ) || 0;


    const mppt =

        Number(
            inverter.mppt
        ) || 1;


    const stringsPerMppt =

        Number(
            inverter.stringsPerMppt
        ) || 1;


    // ==================================================
    // PV VOLTAGE DESIGN MARGIN
    //
    // Use 90% of inverter maximum PV voltage.
    //
    // Example:
    //
    // Max PV Voltage = 800V
    //
    // Design Voltage:
    //
    // 800 × 0.90 = 720V
    //
    // ==================================================

    const pvVoltageMargin =
        0.90;


    const designPvVoltage =

        maxPvVoltage *
        pvVoltageMargin;


    // ==================================================
    // MAXIMUM PANELS PER STRING
    //
    // Based on:
    //
    // Design PV Voltage ÷ Panel Voc
    //
    // Example:
    //
    // 720V ÷ 52V
    //
    // = 13 panels maximum
    //
    // ==================================================

    let maxPanelsPerString =

        panelVoc > 0 &&
        designPvVoltage > 0

            ? Math.floor(

                designPvVoltage /
                panelVoc

            )

            : 1;


    // ==================================================
    // SAFETY
    // ==================================================

    maxPanelsPerString =

        Math.max(

            1,

            maxPanelsPerString

        );


    // ==================================================
    // MAXIMUM INVERTER STRING CAPACITY
    //
    // Example:
    //
    // 4 MPPT
    // 2 strings per MPPT
    //
    // 4 × 2 = 8 strings maximum
    //
    // ==================================================

    const maximumStringCapacity =

        mppt *
        stringsPerMppt;


    // ==================================================
    // MINIMUM REQUIRED STRINGS
    //
    // Example:
    //
    // 48 panels
    // 13 panels/string
    //
    // 48 ÷ 13 = 3.69
    //
    // Minimum strings = 4
    //
    // ==================================================

    const minimumStringsRequired =

        Math.ceil(

            panelQuantity /
            maxPanelsPerString

        );


    // ==================================================
    // TOTAL STRINGS
    // ==================================================

    const totalStrings =

        minimumStringsRequired;


    // ==================================================
    // MPPT CAPACITY CHECK
    // ==================================================

    const mpptOverloaded =

        totalStrings >
        maximumStringCapacity;


    // ==================================================
    // BALANCED STRING CONFIGURATION
    //
    // Example:
    //
    // 48 panels
    // 4 strings
    //
    // 48 ÷ 4 = 12
    //
    // Result:
    //
    // String 1 = 12 panels
    // String 2 = 12 panels
    // String 3 = 12 panels
    // String 4 = 12 panels
    //
    // ==================================================

    const basePanelsPerString =

        Math.floor(

            panelQuantity /
            totalStrings

        );


    const extraPanels =

        panelQuantity %
        totalStrings;


    // ==================================================
    // INDIVIDUAL STRING CONFIGURATION
    // ==================================================

    const stringConfiguration = [];


    for (

        let i = 0;

        i < totalStrings;

        i++

    ) {


        const panelsInString =

            basePanelsPerString +

            (

                i < extraPanels

                    ? 1

                    : 0

            );


        const stringVoc =

            panelsInString *
            panelVoc;


        const stringVmp =

            panelsInString *
            panelVmp;


        const stringPower =

            panelsInString *
            panelPower;


        stringConfiguration.push({

            string:

                i + 1,


            panels:

                panelsInString,


            voc:

                stringVoc,


            vmp:

                stringVmp,


            power:

                stringPower,


            current:

                panelIsc

        });

    }


    // ==================================================
    // CHECK STRING VOLTAGE
    // ==================================================

    const stringVoltageExceeded =

        stringConfiguration.some(

            string =>

                string.voc >
                designPvVoltage

        );


    // ==================================================
    // PANELS PER STRING
    //
    // Maximum number of panels in any string.
    //
    // ==================================================

    const panelsPerString =

        Math.max(

            ...stringConfiguration.map(

                string =>

                    string.panels

            )

        );


    // ==================================================
    // MINIMUM PANELS PER STRING
    // ==================================================

    const minimumPanelsPerString =

        Math.min(

            ...stringConfiguration.map(

                string =>

                    string.panels

            )

        );


    // ==================================================
    // REMAINING PANELS
    //
    // All panels are distributed into strings.
    //
    // Therefore:
    //
    // Remaining panels = 0
    //
    // ==================================================

    const remainingPanels =

        0;


    // ==================================================
    // PARTIAL STRING
    // ==================================================

    const partialString =

        false;


    // ==================================================
    // RECOMMENDED PANEL QUANTITY
    // ==================================================

    const recommendedPanelQuantity =

        panelQuantity;


    // ==================================================
    // SPARE PANELS
    // ==================================================

    const sparePanels =

        0;


    // ==================================================
    // STRING ELECTRICAL VALUES
    //
    // Based on the largest string.
    //
    // ==================================================

    const stringVoc =

        panelsPerString *
        panelVoc;


    const stringVmp =

        panelsPerString *
        panelVmp;


    const stringPower =

        panelsPerString *
        panelPower;


    const stringCurrent =

        panelIsc;


    // ==================================================
    // TOTAL PV POWER
    // ==================================================

    const totalPvPower =

        panelQuantity *
        panelPower;


    // ==================================================
    // RECOMMENDED PV POWER
    // ==================================================

    const recommendedPvPower =

        totalPvPower;


    // ==================================================
    // REQUIRED MPPT
    // ==================================================

    const requiredMppt =

        Math.ceil(

            totalStrings /
            stringsPerMppt

        );


    // ==================================================
    // MPPT CONFIGURATION
    // ==================================================

    const mpptConfiguration = [];


    for (

        let i = 0;

        i < mppt;

        i++

    ) {


        const startIndex =

            i *
            stringsPerMppt;


        const assignedStrings =

            stringConfiguration.slice(

                startIndex,

                startIndex +
                stringsPerMppt

            );


        // ==============================================
        // EMPTY MPPT
        // ==============================================

        if (

            assignedStrings.length === 0

        ) {

            mpptConfiguration.push({

                mppt:

                    i + 1,


                strings:

                    0,


                panels:

                    0,


                power:

                    0,


                stringDetails:

                    []

            });


            continue;

        }


        // ==============================================
        // MPPT PANEL COUNT
        // ==============================================

        const mpptPanels =

            assignedStrings.reduce(

                (

                    total,

                    string

                ) =>

                    total +
                    string.panels,

                0

            );


        // ==============================================
        // MPPT POWER
        // ==============================================

        const mpptPower =

            assignedStrings.reduce(

                (

                    total,

                    string

                ) =>

                    total +
                    string.power,

                0

            );


        // ==============================================
        // SAVE MPPT CONFIGURATION
        // ==============================================

        mpptConfiguration.push({

            mppt:

                i + 1,


            strings:

                assignedStrings.length,


            panels:

                mpptPanels,


            power:

                mpptPower,


            stringDetails:

                assignedStrings

        });

    }


    // ==================================================
    // PV COMBINER RULE
    //
    // 1 - 9 STRINGS:
    // NO PV COMBINER
    //
    // 10+ STRINGS:
    // PV COMBINER REQUIRED
    //
    // ==================================================

    const combinerRequired =

        totalStrings >= 10;


    // ==================================================
    // COMBINER CAPACITY
    //
    // Each combiner is treated as 8-way.
    //
    // ==================================================

    const combinerWays =

        8;


    // ==================================================
    // COMBINER QUANTITY
    // ==================================================

    const combinerQuantity =

        combinerRequired

            ? Math.ceil(

                totalStrings /
                combinerWays

            )

            : 0;


    // ==================================================
    // MC4 CONNECTOR PAIRS
    //
    // 1 PV STRING:
    //
    // 1 Positive
    // 1 Negative
    //
    // Therefore:
    //
    // 1 String = 1 MC4 Pair
    //
    // ==================================================

    const mc4PairsRequired =

        totalStrings;


    // ==================================================
    // MC4 INDIVIDUAL CONNECTORS
    //
    // 1 Pair = 2 Connectors
    //
    // ==================================================

    const mc4ConnectorsRequired =

        totalStrings *
        2;


    // ==================================================
    // MC4 PROCUREMENT MARGIN
    //
    // User Rule:
    //
    // Required Quantity × 1.5
    //
    // ==================================================

    const mc4Margin =

        1.5;


    // ==================================================
    // MC4 PAIRS WITH MARGIN
    // ==================================================

    const mc4PairsWithMargin =

        Math.ceil(

            mc4PairsRequired *
            mc4Margin

        );


    // ==================================================
    // MC4 CONNECTORS WITH MARGIN
    // ==================================================

    const mc4ConnectorsWithMargin =

        Math.ceil(

            mc4ConnectorsRequired *
            mc4Margin

        );


    // ==================================================
    // STRING CONFIGURATION TEXT
    // ==================================================

    const stringConfig =

        `${panelsPerString} Panels/String × ${totalStrings} Strings`;


    // ==================================================
    // MPPT WARNING
    // ==================================================

    let mpptWarning =

        null;


    if (

        mpptOverloaded

    ) {

        mpptWarning =

            `Warning: ${totalStrings} PV strings require ${requiredMppt} MPPT channels, but inverter provides only ${mppt} MPPTs with ${stringsPerMppt} strings per MPPT.`;

    }


    // ==================================================
    // STRING VOLTAGE WARNING
    // ==================================================

    let stringVoltageWarning =

        null;


    if (

        stringVoltageExceeded

    ) {

        stringVoltageWarning =

            `Warning: One or more PV strings exceed the ${designPvVoltage.toFixed(0)}V design PV voltage limit.`;

    }


    // ==================================================
    // FINAL RESULT
    // ==================================================

    const result = {


        // ==============================================
        // PANEL INFORMATION
        // ==============================================

        panelModel:

            `${panel.brand ?? ""} ${
                panel.model ?? ""
            }`.trim(),


        panelPowerW:

            panelPower,


        panelVoc:

            panelVoc,


        panelVmp:

            panelVmp,


        panelIsc:

            panelIsc,


        // ==============================================
        // INVERTER PV LIMIT
        // ==============================================

        inverterMaxPvVoltage:

            maxPvVoltage,


        pvVoltageMargin:

            `${(
                (1 - pvVoltageMargin) *
                100
            ).toFixed(0)}%`,


        designPvVoltage:

            designPvVoltage,


        // ==============================================
        // STRING LIMITS
        // ==============================================

        maxPanelsPerString:

            maxPanelsPerString,


        panelsPerString:

            panelsPerString,


        minimumPanelsPerString:

            minimumPanelsPerString,


        // ==============================================
        // STRING CONFIGURATION
        // ==============================================

        totalStrings:

            totalStrings,


        remainingPanels:

            remainingPanels,


        partialString:

            partialString,


        recommendedPanelQuantity:

            recommendedPanelQuantity,


        sparePanels:

            sparePanels,


        stringConfiguration:

            stringConfiguration,


        // ==============================================
        // STRING ELECTRICAL VALUES
        // ==============================================

        stringVoc:

            stringVoc,


        stringVmp:

            stringVmp,


        stringPower:

            stringPower,


        stringCurrent:

            stringCurrent,


        // ==============================================
        // PV POWER
        // ==============================================

        totalPvPower:

            totalPvPower,


        recommendedPvPower:

            recommendedPvPower,


        // ==============================================
        // MPPT
        // ==============================================

        inverterMppt:

            mppt,


        stringsPerMppt:

            stringsPerMppt,


        maximumStringCapacity:

            maximumStringCapacity,


        requiredMppt:

            requiredMppt,


        mpptOverloaded:

            mpptOverloaded,


        mpptConfiguration:

            mpptConfiguration,


        // ==============================================
        // PV COMBINER
        // ==============================================

        combinerRequired:

            combinerRequired,


        combinerQuantity:

            combinerQuantity,


        combinerWays:

            combinerWays,


        // ==============================================
        // MC4
        // ==============================================

        mc4PairsRequired:

            mc4PairsRequired,


        mc4ConnectorsRequired:

            mc4ConnectorsRequired,


        mc4Margin:

            mc4Margin,


        mc4PairsWithMargin:

            mc4PairsWithMargin,


        mc4ConnectorsWithMargin:

            mc4ConnectorsWithMargin,


        // ==============================================
        // CONFIGURATION TEXT
        // ==============================================

        stringConfig:

            stringConfig,


        // ==============================================
        // WARNINGS
        // ==============================================

        mpptWarning:

            mpptWarning,


        stringVoltageExceeded:

            stringVoltageExceeded,


        stringVoltageWarning:

            stringVoltageWarning,


        partialStringWarning:

            null

    };


    // ==================================================
    // CONSOLE OUTPUT
    // ==================================================

    console.log(

        "PV STRING CONFIGURATION RESULT:",

        result

    );


    // ==================================================
    // RETURN RESULT
    // ==================================================

    return result;

}