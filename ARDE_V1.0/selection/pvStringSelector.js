// ======================================================
//
// AE RENEWABLE LTD
// ARDE V1.0
//
// FILE
// pvStringSelector.js
//
// PURPOSE
// PV String Configuration
//
// ======================================================

export function choosePVString(system){

    const panel = system.panel;

    const panelQuantity = system.panelQuantity;

    const inverter = system.inverter;

    const panelsPerString = Math.floor(

        inverter.inverterPvVoltage /

        panel.voc

    );

    const totalStrings = Math.ceil(

        panelQuantity /

        panelsPerString

    );

    const stringsPerMPPT = Math.ceil(

        totalStrings /

        inverter.mppt

    );

    const remainingPanels =

        panelQuantity %

        panelsPerString;

    const combinerQuantity =

        totalStrings > 2

        ? Math.ceil(totalStrings / 4)

        : 0;

    const mc4Pairs =

        totalStrings * 2;

 return {

    panelsPerString,

    totalStrings,

    stringsPerMPPT,

    remainingPanels,

    combinerQuantity,

    mc4Pairs

};

}