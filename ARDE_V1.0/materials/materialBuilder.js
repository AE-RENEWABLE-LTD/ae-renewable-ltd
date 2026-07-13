// ======================================================
//
// Build Material List
//
// ======================================================

export function buildMaterialList(system){

    return [

        {

            description:
                `${system.panel.brand} ${system.panel.power}W Solar Panel`,

            unit:"pcs",

            quantity:
                system.panelQuantity,

            unitPrice:
                system.panel.price

        },

        {

            description:
                `${system.inverter.brand} ${system.inverter.model}`,

            unit:"pcs",

            quantity:
                system.inverterQuantity,

            unitPrice:
                system.inverter.price

        },

        {

            description:
                `${system.battery.brand} ${system.battery.model}`,

            unit:"pcs",

            quantity:
                system.batteryQuantity,

            unitPrice:
                system.battery.price

        }

    ];

}