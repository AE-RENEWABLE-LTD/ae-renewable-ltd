// ======================================================
//
// AE RENEWABLE LTD
// ARDE V1.0
//
// FILE
// pvStringCard.js
//
// PURPOSE
// Update PV String Configuration Section
//
// ======================================================


// ======================================================
// SET TEXT HELPER
// ======================================================

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (!element) {

        console.warn(
            `Missing element: ${id}`
        );

        return;

    }


    element.textContent =

        value !== undefined &&
        value !== null

            ? value

            : "-";

}


// ======================================================
// UPDATE PV STRING CARD
// ======================================================

export function updatePVStringCard(system) {


    // ==================================================
    // GET PV STRING DATA
    // ==================================================

    const pvString =
        system?.pvString;


    // ==================================================
    // SAFETY CHECK
    // ==================================================

    if (!pvString) {

        console.warn(
            "PV String Configuration data not found."
        );

        return;

    }


    // ==================================================
    // DEBUG
    // ==================================================

    console.log(
        "PV STRING OUTPUT:",
        pvString
    );


    // ==================================================
    // PANELS PER STRING
    // ==================================================

    setText(

        "resultPanelsPerString",

        pvString.panelsPerString != null

            ? `${pvString.panelsPerString}`

            : "-"

    );


    // ==================================================
    // TOTAL STRINGS
    // ==================================================

    setText(

        "resultTotalStrings",

        pvString.totalStrings != null

            ? `${pvString.totalStrings}`

            : "-"

    );


    // ==================================================
    // STRINGS PER MPPT
    // ==================================================

    setText(

        "resultStringsPerMPPT",

        pvString.stringsPerMppt != null

            ? `${pvString.stringsPerMppt}`

            : "-"

    );


    // ==================================================
    // REMAINING PANELS
    // ==================================================

    setText(

        "resultRemainingPanels",

        pvString.remainingPanels != null

            ? `${pvString.remainingPanels}`

            : "-"

    );

// ==================================================
// PV COMBINER
// ==================================================

setText(

    "resultCombiner",

    pvString.combinerRequired

        ? `${pvString.combinerQuantity} × ${pvString.combinerWays}-Way Combiner`

        : "Not Required"

);


// ==================================================
// MC4 CONNECTOR PAIRS
// ==================================================

setText(

    "resultMC4",

    pvString.mc4PairsWithMargin != null

        ? `${pvString.mc4PairsWithMargin} Pairs`

        : "-"

);

}