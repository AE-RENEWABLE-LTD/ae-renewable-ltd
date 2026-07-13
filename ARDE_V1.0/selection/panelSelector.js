// ======================================================
//
// AE RENEWABLE LTD
// ARDE V1.0
//
// FILE
// panelSelector.js
//
// PURPOSE
// Automatic Solar Panel Selection
//
// ======================================================
// import { choosePanel } from "../selection/panelSelector.js";
import { panels } from "../data/panels.js";

export function choosePanel(

    solarPvRequired

){

    let best = null;

    for(const panel of panels){

        const quantity = Math.ceil(

            solarPvRequired /

            panel.power

        );

        const installedPower =

            quantity *

            panel.power;

        if(

            best === null ||

            installedPower < best.installedPower

        ){

            best = {

                panel,

                quantity,

                installedPower

            };

        }

    }

    return best;

}