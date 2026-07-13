// ======================================================
//
// AE RENEWABLE LTD
// ARDE V1.0
//
// FILE
// script.js
//
// PURPOSE
// Main Application Controller
//
// ======================================================

import { designSystem } from "./calculations/designEngine.js";

import { updateResultCard } from "./ui/resultCard.js";

import { updateMaterialTable } from "./ui/materialTable.js";

import { updateProtectionCard } from "./ui/protectionCard.js";

import { updatePVStringCard } from "./ui/pvStringCard.js";

import { buildMaterialList } from "./materials/materialBuilder.js";


// ======================================================
// DOM
// ======================================================

const designForm = document.getElementById("designForm");


// ======================================================
// EVENTS
// ======================================================

designForm.addEventListener(

    "submit",

    computeDesign

);


// ======================================================
// COMPUTE
// ======================================================

function computeDesign(event){

    event.preventDefault();

    try{

        const input = collectInput();

        const system = designSystem(input);

        updateUI(system);

        console.log(system);

    }

    catch(error){

        alert(error.message);

        console.error(error);

    }

}


// ======================================================
// INPUT
// ======================================================

function collectInput(){

    return{

        load:Number(

            document.getElementById("load").value

        ),

        backup:Number(

            document.getElementById("backup").value

        ),

        psh:Number(

            document.getElementById("psh").value

        ),

        panelFactor:Number(

            document.getElementById("panelFactor").value

        ),

        dod:Number(

            document.getElementById("dod").value

        ),

        losses:Number(

            document.getElementById("losses").value

        ),

        batteryPercent:Number(

            document.getElementById("batteryPercent").value

        )

    };

}


// ======================================================
// UPDATE UI
// ======================================================

function updateUI(system){

    // System Design Result
    updateResultCard(system);

    // Bill of Materials
    const materials = buildMaterialList(system);
    updateMaterialTable(materials);

    // Protection Design
    updateProtectionCard(system);

    // PV String Configuration
    updatePVStringCard(system);

}


// ======================================================
// RESET
// ======================================================

designForm.addEventListener(

    "reset",

    ()=>{

        console.clear();

    }

);

