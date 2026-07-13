// ======================================================
//
// Update PV String Configuration
//
// ======================================================

function setText(id,value){

    const element = document.getElementById(id);

    if(element){

        element.textContent = value;

    }

}

function updateUI(system){

    updateResultCard(system);

    const materials = buildMaterialList(system);

    updateMaterialTable(materials);

    updateProtectionCard(system);

    // THIS MUST BE HERE
    updatePVStringCard(system);

}

export function updatePVStringCard(system){

    const pv = system.pvString;

    setText(

        "resultPanelsPerString",

        pv.panelsPerString

    );

    setText(

        "resultTotalStrings",

        pv.totalStrings

    );

    setText(

        "resultStringsPerMPPT",

        pv.stringsPerMPPT

    );

    setText(

        "resultRemainingPanels",

        pv.remainingPanels

    );

    setText(

        "resultCombiner",

        pv.combinerQuantity

    );

    setText(

        "resultMC4",

        pv.mc4Pairs

    );

}