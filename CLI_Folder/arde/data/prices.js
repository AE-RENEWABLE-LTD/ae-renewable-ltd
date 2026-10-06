// ======================================================
// AE RENEWABLE LTD | ARDE V1.0
// FILE: data/prices.js
// PURPOSE: Central Equipment & Material Pricing Catalog
// Supports dynamic Admin Updates & Custom Materials via Storage / API
// ======================================================

export const DEFAULT_PRICES = {
    // Inverters
    "Firman FPG-1000INV": 120000,
    "Firman FPG-3500INV": 320000,
    "Firman FPG-5500INV": 580000,
    "Firman FPG-11000INV": 1100000,
    "Felicity IVPS3024": 350000,
    "Felicity IVEM5048": 620000,
    "Felicity IVPS8048": 1150000,
    "Felicity IVEM10048": 1450000,
    "Felicity IVEM12048": 1750000,
    "Deye SUN-6K-SG04LP1": 1350000,
    "Deye SUN-8K-SG04LP1": 1750000,
    "Deye SUN-12K-SG04LP3": 2400000,
    "Deye SUN-20K-SG05LP3": 3800000,

    // Panels & Batteries
    "Jinko Tiger Neo N-type 750W": 165000,
    "Felicity LPBF48100-H": 1250000,
    "Felicity LPBF48200": 2300000,
    "Deye SE-G5.1 PRO": 1400000,

    // AC Protection & Breakers
    "32A Single Phase AC Output Breaker": 12500,
    "63A Single Phase AC Output Breaker": 18500,
    "80A Single Phase AC Output Breaker": 25000,
    "100A Single Phase AC Output Breaker": 32000,
    "63A Three Phase AC Output Breaker": 45000,
    "100A Three Phase AC Output Breaker": 65000,
    "125A Three Phase AC Output Breaker": 85000,
    "160A Three Phase AC Output Breaker": 120000,

    "32A Single Phase AC Input Breaker": 12500,
    "63A Single Phase AC Input Breaker": 18500,
    "80A Single Phase AC Input Breaker": 25000,
    "100A Single Phase AC Input Breaker": 32000,
    "63A Three Phase AC Input Breaker": 45000,
    "100A Three Phase AC Input Breaker": 65000,
    "125A Three Phase AC Input Breaker": 85000,
    "160A Three Phase AC Input Breaker": 120000,

    // DC Protection & Breakers
    "16A PV DC Breaker": 14000,
    "25A PV DC Breaker": 16500,
    "32A PV DC Breaker": 19500,
    "63A PV DC Breaker": 26000,

    "100A Battery Breaker": 38000,
    "125A Battery Breaker": 48000,
    "160A Battery Breaker": 65000,
    "200A Battery Breaker": 85000,
    "250A Battery Breaker": 115000,
    "400A Battery Breaker": 175000,
    "630A Battery Breaker": 260000,

    // Switchgear, SPDs & Busbars
    "32A Single Phase Changeover Switch": 28000,
    "63A Single Phase Changeover Switch": 38000,
    "100A Single Phase Changeover Switch": 58000,
    "63A Three Phase Changeover Switch": 75000,
    "100A Three Phase Changeover Switch": 110000,
    "125A Three Phase Changeover Switch": 145000,

    "2P Type II 275V AC SPD": 24000,
    "4P Type II 385V AC SPD": 42000,
    "2P Type II 600V DC SPD": 28000,
    "2P Type II 1000V DC SPD": 36000,

    "250A Copper Busbar": 45000,
    "400A Copper Busbar": 68000,
    "630A Copper Busbar": 98000,

    // Cables (Per Meter)
    "4mm² Solar PV Cable": 1800,
    "6mm² Solar PV Cable": 2500,
    "10mm² Solar PV Cable": 3800,
    "10mm² Single Core AC Cable": 2200,
    "16mm² 4-Core AC Cable": 8500,
    "25mm² 4-Core AC Cable": 14500,
    "35mm² 4-Core AC Cable": 21000,
    "50mm² 4-Core AC Cable": 29500,
    "16mm² Pure Copper Earth Cable": 2800,
    "35mm² Battery Cable": 6500,
    "50mm² Battery Cable": 9200,
    "70mm² Battery Cable": 13500,
    "95mm² Battery Cable": 18500,

    // Accessories & Installation Hardware
    "MC4 Connector Pair": 2500,
    "8-Way PV Combiner Box": 95000,
    "Heavy Duty Battery Cable Lug": 1800,
    "Aluminum Solar Panel Rail": 7000,
    "S17 Stainless Steel Bolt & Nut Sets": 500,
    "32mm Flexible Pipe": 400,
    "50mm Flexible Pipe": 750,
    "75mm Flexible Pipe": 1200,
    "Cable Clips": 1500,
    "75x75 mm PVC Trunking": 5000,
    "100x100 mm PVC Trunking": 8500,
    "150x100 mm PVC Trunking": 13500,
    "High-Grade Electrical Insulation Tape": 500,
    "Assorted Screw Packets": 500,
    "10mm Pegs (1 Packet)": 1500,
    "12mm Pegs (2 Packets)": 3000,
    "12mm Pegs (3 Packets)": 4500,
    "Heavy Duty Cable Ties": 2500,
    "Solar Installation Sealant": 4500,
    "CO2 Fire Extinguisher (DCP)": 16000,
    "Copper Earth Rod (1.5m)": 6500
};

/**
 * Retrieves the active pricing database merging defaults, local storage overrides, and dynamic materials.
 */
export function getActivePrices() {
    let saved = {};
    try {
        const raw = localStorage.getItem("ae_material_prices");
        if (raw) {
            saved = JSON.parse(raw);
        }
    } catch (e) {
        console.warn("Could not load custom prices from storage:", e);
    }
    return { ...DEFAULT_PRICES, ...saved };
}

/**
 * Saves updated price map to storage
 */
export function saveActivePrices(prices) {
    try {
        localStorage.setItem("ae_material_prices", JSON.stringify(prices));
        return true;
    } catch (e) {
        console.error("Error saving prices:", e);
        return false;
    }
}

/**
 * Retrieves custom additional materials defined by admin
 */
export function getCustomMaterials() {
    try {
        const raw = localStorage.getItem("ae_custom_materials");
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

/**
 * Adds a new custom material
 */
export function addCustomMaterial(material) {
    const list = getCustomMaterials();
    list.push({
        id: "mat_" + Date.now(),
        name: material.name,
        category: material.category || "General",
        unit: material.unit || "pcs",
        unitPrice: Number(material.unitPrice) || 0,
        description: material.description || "",
        createdAt: new Date().toISOString()
    });
    localStorage.setItem("ae_custom_materials", JSON.stringify(list));
    return list;
}

/**
 * Removes custom material by ID
 */
export function removeCustomMaterial(id) {
    const list = getCustomMaterials().filter(m => m.id !== id);
    localStorage.setItem("ae_custom_materials", JSON.stringify(list));
    return list;
}