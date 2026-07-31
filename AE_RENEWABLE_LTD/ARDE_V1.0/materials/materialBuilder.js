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
    let pipeSize, clipPacket, tapeQty, screwPacket, pegSpec, trunkQty, extQty;

    if (projectSize === "Small") {
        pipeSize = "25mm Flexible Pipe";
        clipPacket = 1;
        tapeQty = 3;
        screwPacket = 1;
        pegSpec = "10mm Pegs (1 Packet)";
        trunkQty = 2;
        extQty = 1;
    } else if (projectSize === "Medium") {
        pipeSize = "50mm Flexible Pipe";
        clipPacket = 2;
        tapeQty = 6;
        screwPacket = 2;
        pegSpec = "12mm Pegs (2 Packets)";
        trunkQty = 3;
        extQty = 2;
    } else {
        pipeSize = "75mm Flexible Pipe";
        clipPacket = 3;
        tapeQty = 10;
        screwPacket = 3;
        pegSpec = "12mm Pegs (3 Packets)";
        trunkQty = 4;
        extQty = 3;
    }

    // Dynamic Calculations
    const boltAndNutQty = Math.ceil(panelQuantity * 2.5);
    const panelRailQty = Math.ceil(panelQuantity / 2);
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
            description: "Aluminum Solar Panel Rail (L-Profile)",
            unit: "length",
            quantity: panelRailQty,
            unitPrice: 0
        },
        {
            description: "M8 Stainless Steel Bolt & Nut Sets",
            unit: "pcs",
            quantity: boltAndNutQty,
            unitPrice: 0
        },

        // --- CONDUIT, TRUNKING & CLIPS ---
        {
            description: pipeSize,
            unit: "rolls",
            quantity: 1,
            unitPrice: 0
        },
        {
            description: `Cable Clips (for ${pipeSize})`,
            unit: "packet",
            quantity: clipPacket,
            unitPrice: 0
        },
        {
            description: "PVC Trunking (2 Inch)",
            unit: "pcs",
            quantity: trunkQty,
            unitPrice: 0
        },

        // --- FASTENERS & INSULATION ---
        {
            description: "High-Grade Electrical Insulation Tape",
            unit: "rolls",
            quantity: tapeQty,
            unitPrice: 0
        },
        {
            description: "Assorted Screw Packets",
            unit: "packet",
            quantity: screwPacket,
            unitPrice: 0
        },
        {
            description: pegSpec,
            unit: "set",
            quantity: 1,
            unitPrice: 0
        },

        // --- SAFETY & PROTECTION ---
        {
            description: "Co2 Fire Extinguisher (DCP)",
            unit: "unit",
            quantity: extQty,
            unitPrice: 0
        },
        {
            description: "Copper Earth Rod (1.5m)",
            unit: "pcs",
            quantity: protection.earthRod,
            unitPrice: 0
        }
    ];
}