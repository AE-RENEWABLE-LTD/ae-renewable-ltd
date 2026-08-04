// ======================================================
//
// AE RENEWABLE LTD
// ARDE V1.0
//
// FILE
// buildMaterialList.js
//
// PURPOSE
// Build Complete Bill of Quantities (BOQ) Schedule
//
// ======================================================

export function buildMaterialList(system) {
    const { protection, panelQuantity, inverterQuantity, batteryQuantity } = system;
    const projectSize = protection.earthProject; // "Small", "Medium", or "Large"

    // ==================================================
    // SYSTEM CAPACITY RULES
    // ==================================================
    let pipeSize, pipeLength, clipPacket, tapeQty, screwPacket, pegSpec, trunkQty, extQty;

    if (projectSize === "Small") {
        pipeSize = "25mm Flexible Pipe";
        pipeLength = 20;
        clipPacket = 1;
        tapeQty = 2;
        screwPacket = 1;
        pegSpec = "10mm Pegs (1 Packet)";
        trunkQty = 2;
        extQty = 1;
    } else if (projectSize === "Medium") {
        pipeSize = "50mm Flexible Pipe";
        pipeLength = 40;
        clipPacket = 2;
        tapeQty = 6;
        screwPacket = 2;
        pegSpec = "12mm Pegs (2 Packets)";
        trunkQty = 3;
        extQty = 1;
    } else {
        pipeSize = "75mm Flexible Pipe";
        pipeLength = 50;
        clipPacket = 3;
        tapeQty = 10;
        screwPacket = 3;
        pegSpec = "12mm Pegs (3 Packets)";
        trunkQty = 4;
        extQty = 2;
    }

    // Dynamic Calculations
    const boltAndNutQty = Math.ceil(panelQuantity * 2.5);
    const panelRailQty = Math.ceil(panelQuantity / 4);
    const cableLugQty = (inverterQuantity * 4) + (batteryQuantity * 2);

    return [
        // --- MAJOR HARDWARE ---
        {
            description: `${system.panel.brand} ${system.panel.power}W Solar Panel`,
            unit: "pcs",
            quantity: panelQuantity,
            unitPrice: system.panel.price
        },
        {
            description: `${system.inverter.brand} ${system.inverter.model}`,
            unit: "pcs",
            quantity: inverterQuantity,
            unitPrice: system.inverter.price
        },
        {
            description: `${system.battery.brand} ${system.battery.model}`,
            unit: "pcs",
            quantity: batteryQuantity,
            unitPrice: system.battery.price
        },

        // --- CABLES & LUGS ---
        {
            description: protection.solarCable.specification,
            unit: "meters",
            quantity: protection.solarCable.length,
            unitPrice: 0
        },
        {
            description: protection.acCable.output.specification,
            unit: "meters",
            quantity: protection.acCable.output.length,
            unitPrice: 0
        },
        {
            description: `${protection.earthCable} Earth Cable`,
            unit: "meters",
            quantity: 20,
            unitPrice: 0
        },
        {
            description: `${protection.cableLug} Heavy Duty Cable Lug`,
            unit: "pcs",
            quantity: cableLugQty,
            unitPrice: 0
        },

        // --- MOUNTING & RACKING ---
        {
            description: "Aluminum Solar Panel Rail ",
            unit: "length",
            quantity: panelRailQty,
            unitPrice: 7000
        },
        {
            description: "S17 Stainless Steel Bolt & Nut Sets",
            unit: "pcs",
            quantity: boltAndNutQty,
            unitPrice: 500
        },

        // --- CONDUIT, TRUNKING & CLIPS ---
        {
            description: pipeSize,
            unit: "Meters",
            quantity: pipeLength,
            unitPrice: 400
        },
        {
            description: `Cable Clips (for ${pipeSize})`,
            unit: "packet",
            quantity: clipPacket,
            unitPrice: 1500
        },
        {
            description: "PVC Trunking ",
            unit: "Length",
            quantity: trunkQty,
            unitPrice: 5000
        },

        // --- FASTENERS & INSULATION ---
        {
            description: "High-Grade Electrical Insulation Tape",
            unit: "Pcs",
            quantity: tapeQty,
            unitPrice: 500
        },
        {
            description: "Assorted Screw Packets",
            unit: "packet",
            quantity: screwPacket,
            unitPrice: 500
        },
        {
            description: pegSpec,
            unit: "set",
            quantity: 1,
            unitPrice: 1500
        },

        // --- SAFETY & PROTECTION ---
        {
            description: "Co2 Fire Extinguisher (DCP)",
            unit: "unit",
            quantity: extQty,
            unitPrice: 16000
        },
        {
            description: "Copper Earth Rod (1.5m)",
            unit: "pcs",
            quantity: protection.earthRod,
            unitPrice: 600
        }
    ];
}