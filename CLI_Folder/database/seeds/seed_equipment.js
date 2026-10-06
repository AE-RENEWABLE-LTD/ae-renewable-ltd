"use strict";

const { query } = require("../../backend/config/database");

const equipmentData = [
    // Solar Panels
    {
        equipment_code: "PAN-LONGI-550W",
        name: "Longi Hi-MO 5 550W Mono PERC Solar Panel",
        brand: "Longi Solar",
        model: "LR5-72HPH-550M",
        category: "solar_panel",
        rating: "550W",
        unit: "pcs",
        specifications: { wattage: 550, voc: 49.8, vmp: 41.95, isc: 13.98, imp: 13.12, efficiency: 21.3, cellType: "Mono PERC" },
        description: "Tier 1 high-efficiency monocrystalline solar panel for residential and commercial systems.",
        cost_price: 85000,
        selling_price: 105000,
        supplier: "Longi Nigeria Distribution",
        in_stock: true
    },
    {
        equipment_code: "PAN-JA-600W",
        name: "JA Solar 600W N-type Bi-facial Solar Panel",
        brand: "JA Solar",
        model: "JAM72D40-600/MB",
        category: "solar_panel",
        rating: "600W",
        unit: "pcs",
        specifications: { wattage: 600, voc: 52.1, vmp: 43.8, isc: 14.45, imp: 13.7, efficiency: 22.1, cellType: "N-Type TOPCon" },
        description: "Bifacial double-glass solar panel offering up to 25% bifacial gain.",
        cost_price: 98000,
        selling_price: 122000,
        supplier: "JA Solar West Africa",
        in_stock: true
    },
    {
        equipment_code: "PAN-CANADIAN-450W",
        name: "Canadian Solar 450W HiKu Mono Solar Panel",
        brand: "Canadian Solar",
        model: "CS3W-450MS",
        category: "solar_panel",
        rating: "450W",
        unit: "pcs",
        specifications: { wattage: 450, voc: 49.3, vmp: 41.5, isc: 11.6, imp: 10.85, efficiency: 20.4, cellType: "Mono PERC" },
        description: "Proven high reliability solar module with lower LCOE.",
        cost_price: 72000,
        selling_price: 88000,
        supplier: "AE Renewable Direct Store",
        in_stock: true
    },

    // Inverters
    {
        equipment_code: "INV-DEYE-5KW",
        name: "Deye 5kW 48V Single Phase Hybrid Inverter",
        brand: "Deye",
        model: "SUN-5K-SG03LP1-EU",
        category: "inverter",
        rating: "5kW / 5kVA",
        unit: "unit",
        specifications: { powerRatingKw: 5, powerRatingKva: 5, nominalVoltage: 48, mpptCount: 2, maxPvInputKw: 6.5, maxDcVoltage: 500, phase: "Single Phase", hybrid: true },
        description: "Premium single phase hybrid inverter with generator tie-in, smart load, and AC coupling.",
        cost_price: 1150000,
        selling_price: 1380000,
        supplier: "Deye Authorized Dealer",
        in_stock: true
    },
    {
        equipment_code: "INV-DEYE-8KW",
        name: "Deye 8kW 48V Single Phase Hybrid Inverter",
        brand: "Deye",
        model: "SUN-8K-SG01LP1-EU",
        category: "inverter",
        rating: "8kW / 8kVA",
        unit: "unit",
        specifications: { powerRatingKw: 8, powerRatingKva: 8, nominalVoltage: 48, mpptCount: 2, maxPvInputKw: 10.4, maxDcVoltage: 500, phase: "Single Phase", hybrid: true },
        description: "Heavy-duty 8kW hybrid inverter suitable for large residential villas with AC loads.",
        cost_price: 1650000,
        selling_price: 1950000,
        supplier: "Deye Authorized Dealer",
        in_stock: true
    },
    {
        equipment_code: "INV-DEYE-12KW-3P",
        name: "Deye 12kW 3-Phase Low Voltage Hybrid Inverter",
        brand: "Deye",
        model: "SUN-12K-SG04LP3-EU",
        category: "inverter",
        rating: "12kW / 12kVA",
        unit: "unit",
        specifications: { powerRatingKw: 12, powerRatingKva: 12, nominalVoltage: 48, mpptCount: 2, maxPvInputKw: 15.6, maxDcVoltage: 800, phase: "Three Phase", hybrid: true },
        description: "3-Phase 48V low-voltage hybrid inverter with 100% unbalanced phase output.",
        cost_price: 2450000,
        selling_price: 2850000,
        supplier: "Deye Authorized Dealer",
        in_stock: true
    },
    {
        equipment_code: "INV-DEYE-16KW",
        name: "Deye 16kW Single Phase Hybrid Inverter",
        brand: "Deye",
        model: "SUN-16K-SG01LP1-EU",
        category: "inverter",
        rating: "16kW / 16kVA",
        unit: "unit",
        specifications: { powerRatingKw: 16, powerRatingKva: 16, nominalVoltage: 48, mpptCount: 3, maxPvInputKw: 20.8, maxDcVoltage: 500, phase: "Single Phase", hybrid: true },
        description: "Largest single phase low-voltage hybrid inverter on the market, ideal for mansions and plazas.",
        cost_price: 3200000,
        selling_price: 3680000,
        supplier: "Deye Authorized Dealer",
        in_stock: true
    },
    {
        equipment_code: "INV-FELICITY-10KW",
        name: "Felicity Solar 10kVA 48V Pure Sine Wave Inverter",
        brand: "Felicity Solar",
        model: "FL-IVPS10048",
        category: "inverter",
        rating: "10kVA / 8kW",
        unit: "unit",
        specifications: { powerRatingKw: 8, powerRatingKva: 10, nominalVoltage: 48, mpptCount: 1, maxPvInputKw: 9.6, phase: "Single Phase", hybrid: false },
        description: "Reliable off-grid transformer-based inverter with high surge tolerance for pump and motor loads.",
        cost_price: 920000,
        selling_price: 1100000,
        supplier: "Felicity West Africa",
        in_stock: true
    },

    // Batteries (LiFePO4)
    {
        equipment_code: "BAT-FELICITY-5KWH",
        name: "Felicity Solar 5.12kWh 48V 100Ah Lithium Battery LiFePO4",
        brand: "Felicity Solar",
        model: "LPBF48100-M",
        category: "battery",
        rating: "5.12kWh / 100Ah",
        unit: "unit",
        specifications: { capacityKwh: 5.12, nominalVoltage: 51.2, capacityAh: 100, dod: 90, cycleLife: 6000, chemistry: "LiFePO4", maxDischargeRateC: 0.8 },
        description: "Wall-mounted deep cycle lithium iron phosphate battery with smart BMS and LCD screen.",
        cost_price: 1250000,
        selling_price: 1480000,
        supplier: "Felicity West Africa",
        in_stock: true
    },
    {
        equipment_code: "BAT-FELICITY-10KWH",
        name: "Felicity Solar 10.24kWh 48V 200Ah Lithium Battery LiFePO4",
        brand: "Felicity Solar",
        model: "LPBA48200",
        category: "battery",
        rating: "10.24kWh / 200Ah",
        unit: "unit",
        specifications: { capacityKwh: 10.24, nominalVoltage: 51.2, capacityAh: 200, dod: 90, cycleLife: 6000, chemistry: "LiFePO4", maxDischargeRateC: 1.0 },
        description: "Floor-standing high capacity lithium iron phosphate battery module with CAN/RS485 comms.",
        cost_price: 2150000,
        selling_price: 2480000,
        supplier: "Felicity West Africa",
        in_stock: true
    },
    {
        equipment_code: "BAT-DEYE-5.32KWH",
        name: "Deye SE-G5.3 Pro 5.32kWh 48V LiFePO4 Battery",
        brand: "Deye",
        model: "SE-G5.3 Pro",
        category: "battery",
        rating: "5.32kWh / 104Ah",
        unit: "unit",
        specifications: { capacityKwh: 5.32, nominalVoltage: 51.2, capacityAh: 104, dod: 95, cycleLife: 6000, chemistry: "LiFePO4", maxDischargeRateC: 1.0 },
        description: "Cobalt-free LiFePO4 battery pack with seamless integration into Deye hybrid inverters.",
        cost_price: 1550000,
        selling_price: 1820000,
        supplier: "Deye Authorized Dealer",
        in_stock: true
    },
    {
        equipment_code: "BAT-PYLONTECH-3.55KWH",
        name: "Pylontech US3000C 3.55kWh 48V Lithium Battery",
        brand: "Pylontech",
        model: "US3000C",
        category: "battery",
        rating: "3.55kWh / 74Ah",
        unit: "unit",
        specifications: { capacityKwh: 3.55, nominalVoltage: 48, capacityAh: 74, dod: 95, cycleLife: 6000, chemistry: "LiFePO4" },
        description: "Rack-mountable modular lithium battery standard for professional telecom and energy storage.",
        cost_price: 1100000,
        selling_price: 1300000,
        supplier: "AE Renewable Store",
        in_stock: true
    },

    // Mounting Systems
    {
        equipment_code: "MNT-ROOF-ALU-PAIR",
        name: "Anodized Aluminum Solar Rail & Bracket Set (2-Panel Mount)",
        brand: "Chiko Solar",
        model: "CK-AL-R2",
        category: "mounting_system",
        rating: "Corrosion Resistant",
        unit: "set",
        specifications: { material: "AL6005-T5 Aluminum", windLoadMax: "60m/s", snowLoadMax: "1.4KN/m2" },
        description: "Heavy-duty rail mounting kit with mid-clamps, end-clamps, and L-feet for corrugated/pitched roofs.",
        cost_price: 24000,
        selling_price: 32000,
        supplier: "Chiko Solar Hardware",
        in_stock: true
    },
    {
        equipment_code: "MNT-GROUND-STEEL",
        name: "Ground Mount Hot-Dip Galvanized Rack Structure (4-Panel Unit)",
        brand: "AE Engineering",
        model: "AE-GM4",
        category: "mounting_system",
        rating: "Hot-Dip Galvanized",
        unit: "set",
        specifications: { material: "Q235 Hot-Dip Galvanized Steel", tiltAngle: "15-20 deg" },
        description: "Engineered ground-mounting rack for open field and ground arrays.",
        cost_price: 45000,
        selling_price: 60000,
        supplier: "AE Renewable Fabrication",
        in_stock: true
    },

    // Cables & Electrical
    {
        equipment_code: "CBL-DC-4MM",
        name: "4mm² Solar PV DC Cable (100m Drum, Red & Black pair)",
        brand: "KBE Solar",
        model: "H1Z2Z2-K 4mm²",
        category: "dc_cable",
        rating: "1500V DC / 55A",
        unit: "drum",
        specifications: { crossSection: "4mm²", maxVoltage: "1500V DC", tempRange: "-40C to +90C", conductor: "Tinned Copper" },
        description: "TUV certified UV and weather-resistant double-insulated halogen-free solar cable.",
        cost_price: 140000,
        selling_price: 175000,
        supplier: "KBE Distribution",
        in_stock: true
    },
    {
        equipment_code: "CBL-DC-6MM",
        name: "6mm² Solar PV DC Cable (100m Drum, Red & Black pair)",
        brand: "KBE Solar",
        model: "H1Z2Z2-K 6mm²",
        category: "dc_cable",
        rating: "1500V DC / 70A",
        unit: "drum",
        specifications: { crossSection: "6mm²", maxVoltage: "1500V DC", tempRange: "-40C to +90C", conductor: "Tinned Copper" },
        description: "TUV certified heavy gauge solar cable for long runs and high amperage strings.",
        cost_price: 195000,
        selling_price: 240000,
        supplier: "KBE Distribution",
        in_stock: true
    },
    {
        equipment_code: "CBL-BAT-35MM",
        name: "35mm² Pure Copper Flexible Battery Cable (per meter)",
        brand: "Coleman Wires",
        model: "BF35-CU",
        category: "bos",
        rating: "1000V / 200A",
        unit: "meter",
        specifications: { crossSection: "35mm²", material: "Pure Oxygen-Free Copper" },
        description: "Ultra-flexible pure copper battery interconnect cable.",
        cost_price: 14000,
        selling_price: 18000,
        supplier: "Coleman Cables Nigeria",
        in_stock: true
    },
    {
        equipment_code: "CBL-BAT-50MM",
        name: "50mm² Pure Copper Flexible Battery Cable (per meter)",
        brand: "Coleman Wires",
        model: "BF50-CU",
        category: "bos",
        rating: "1000V / 300A",
        unit: "meter",
        specifications: { crossSection: "50mm²", material: "Pure Oxygen-Free Copper" },
        description: "Heavy-duty pure copper battery cable for inverters 8kVA to 16kVA.",
        cost_price: 21000,
        selling_price: 27000,
        supplier: "Coleman Cables Nigeria",
        in_stock: true
    },

    // Protection & BOS
    {
        equipment_code: "PROT-DC-SPD",
        name: "DC Surge Protection Device (SPD 500V-1000V 2P Type 2)",
        brand: "Suntree",
        model: "SUP2H-PV",
        category: "spd",
        rating: "1000V DC / 40kA",
        unit: "pcs",
        specifications: { uc: "1000V", imax: "40kA", poles: 2 },
        description: "Protects inverters and solar arrays from lightning surges and transient voltages.",
        cost_price: 18000,
        selling_price: 26000,
        supplier: "Suntree Electrical",
        in_stock: true
    },
    {
        equipment_code: "PROT-AC-SPD",
        name: "AC Surge Protection Device (SPD 275V 2P Type 2)",
        brand: "Schneider / Suntree",
        model: "SUP1-40",
        category: "spd",
        rating: "275V AC / 40kA",
        unit: "pcs",
        specifications: { uc: "275V", imax: "40kA", poles: 2 },
        description: "Protects inverter output and home distribution board from grid surges.",
        cost_price: 16000,
        selling_price: 24000,
        supplier: "Schneider Electric Nigeria",
        in_stock: true
    },
    {
        equipment_code: "PROT-DC-BREAKER-63A",
        name: "DC Molded Miniature Circuit Breaker 63A 550V 2P",
        brand: "Suntree",
        model: "SL7-63",
        category: "circuit_breaker",
        rating: "63A / 550V DC",
        unit: "pcs",
        specifications: { current: "63A", voltage: "550V DC", poles: 2 },
        description: "DC string isolation and overload protection breaker.",
        cost_price: 12000,
        selling_price: 18000,
        supplier: "Suntree Electrical",
        in_stock: true
    },
    {
        equipment_code: "PROT-BAT-BREAKER-125A",
        name: "DC Battery Breaker 125A 2P with Enclosure",
        brand: "Suntree / FEEO",
        model: "FMB1-125-2P",
        category: "circuit_breaker",
        rating: "125A / 250V DC",
        unit: "pcs",
        specifications: { current: "125A", voltage: "250V DC", poles: 2 },
        description: "High breaking capacity DC breaker for battery banks up to 10kVA.",
        cost_price: 32000,
        selling_price: 45000,
        supplier: "FEEO Electric",
        in_stock: true
    },
    {
        equipment_code: "PROT-BAT-BREAKER-250A",
        name: "DC Battery Molded Case Circuit Breaker (MCCB) 250A 2P",
        brand: "Chint / Suntree",
        model: "NM1-250S-DC",
        category: "circuit_breaker",
        rating: "250A / 250V DC",
        unit: "pcs",
        specifications: { current: "250A", voltage: "250V DC", poles: 2 },
        description: "Industrial MCCB battery isolator for inverters 10kVA to 20kVA.",
        cost_price: 68000,
        selling_price: 92000,
        supplier: "Chint Electric Nigeria",
        in_stock: true
    },
    {
        equipment_code: "ACC-MC4-PAIR",
        name: "Solar MC4 Connectors Male + Female Waterproof Pair (IP67)",
        brand: "Staubli / Suntree",
        model: "MC4-1500V",
        category: "mc4_connector",
        rating: "1500V / 30A IP67",
        unit: "pair",
        specifications: { rating: "30A", voltage: "1500V DC", ipRating: "IP67" },
        description: "Standard PV waterproof connectors for string connections.",
        cost_price: 1200,
        selling_price: 2000,
        supplier: "AE Renewable Accessories",
        in_stock: true
    },
    {
        equipment_code: "ACC-EARTH-KIT",
        name: "Copper Earth Rod Kit (1.5m 5/8\" Pure Copper + Clamp + Earthing Cable 16mm²)",
        brand: "AE Electrical",
        model: "EARTH-CU-15",
        category: "earthing",
        rating: "Pure Copper 1.5m",
        unit: "kit",
        specifications: { rodLength: "1.5m", diameter: "5/8 inch", earthingCable: "10m 16mm²" },
        description: "Complete earthing kit to safeguard inverters, panels, and lightning arrestors.",
        cost_price: 48000,
        selling_price: 68000,
        supplier: "AE Renewable Store",
        in_stock: true
    },
    {
        equipment_code: "ACC-DB-BOX-8W",
        name: "Surface Mount Distribution Board Box (8-Way Waterproof IP65)",
        brand: "Hager / Chint",
        model: "HT-8",
        category: "distribution_board",
        rating: "8-Way IP65",
        unit: "pcs",
        specifications: { capacity: "8 Modules", ipRating: "IP65", material: "ABS Plastic" },
        description: "Waterproof enclosure for DC/AC breakers and SPDs.",
        cost_price: 15000,
        selling_price: 22000,
        supplier: "Chint Electric Nigeria",
        in_stock: true
    },
    {
        equipment_code: "ACC-CHANGEOVER-63A",
        name: "Automatic Transfer Switch (ATS) / Manual Changeover Switch 63A 2P",
        brand: "TOMZN",
        model: "TOQ5-63/2P",
        category: "accessory",
        rating: "63A 220V",
        unit: "pcs",
        specifications: { current: "63A", transferTime: "<50ms" },
        description: "Seamless dual power automatic transfer switch between Solar Inverter and Public Grid / Generator.",
        cost_price: 28000,
        selling_price: 39000,
        supplier: "TOMZN Direct",
        in_stock: true
    }
];

async function seedEquipment() {
    console.log("Seeding equipment database...");
    let inserted = 0;
    let updated = 0;

    for (const item of equipmentData) {
        const res = await query(
            `
            INSERT INTO equipment (
                equipment_code,
                name,
                brand,
                model,
                category,
                rating,
                unit,
                specifications,
                description,
                cost_price,
                selling_price,
                currency,
                supplier,
                status,
                in_stock
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'NGN', $12, 'active', $13)
            ON CONFLICT (equipment_code) DO UPDATE SET
                name = EXCLUDED.name,
                brand = EXCLUDED.brand,
                model = EXCLUDED.model,
                category = EXCLUDED.category,
                rating = EXCLUDED.rating,
                unit = EXCLUDED.unit,
                specifications = EXCLUDED.specifications,
                description = EXCLUDED.description,
                cost_price = EXCLUDED.cost_price,
                selling_price = EXCLUDED.selling_price,
                supplier = EXCLUDED.supplier,
                in_stock = EXCLUDED.in_stock,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id, (xmax = 0) AS is_insert
            `,
            [
                item.equipment_code,
                item.name,
                item.brand,
                item.model,
                item.category,
                item.rating,
                item.unit,
                JSON.stringify(item.specifications),
                item.description,
                item.cost_price,
                item.selling_price,
                item.supplier,
                item.in_stock
            ]
        );

        if (res.rows[0]?.is_insert) {
            inserted++;
        } else {
            updated++;
        }
    }

    console.log(`Equipment seed completed: ${inserted} inserted, ${updated} updated.`);
}

if (require.main === module) {
    seedEquipment()
        .then(() => process.exit(0))
        .catch(err => {
            console.error("Seed failed:", err);
            process.exit(1);
        });
}

module.exports = { seedEquipment };
