"use strict";

const { query } = require("../config/database");

/**
 * AE RENEWABLE ENGINEERING CALCULATION ENGINE
 * Deterministic electrical and solar sizing formulas based on standard engineering principles.
 */

const DEFAULT_ASSUMPTIONS = {
    peakSunHours: 4.8, // Nigerian average daily peak sun hours
    systemVoltage: 48, // 48V DC standard for modern hybrid systems
    autonomyDays: 1.0, // 1 day full autonomy
    batteryDod: 0.90, // 90% usable Depth of Discharge for LiFePO4
    inverterEfficiency: 0.93, // 93% inverter conversion efficiency
    systemLosses: 0.80, // 80% combined derating (dust, temperature, cable drop, clipping)
    powerFactor: 0.85, // Standard power factor
    inverterSafetyMargin: 1.25, // 25% head room for motor surges and expansion
    defaultPanelWattage: 550, // 550W Tier-1 Mono PERC
    labourPercentage: 0.12, // 12% of hardware cost for installation labor
    transportFlatRate: 45000, // Standard base transport fee in NGN
    engineeringFeeRate: 0.05, // 5% engineering design & commissioning fee
    vatRate: 0.075 // 7.5% Nigerian VAT
};

/**
 * Perform complete deterministic solar system engineering calculation
 * @param {Object} input - Load items or aggregate requirements
 */
async function calculateSystem(input = {}) {
    const warnings = [];
    const assumptions = {
        ...DEFAULT_ASSUMPTIONS,
        ...(input.assumptions || {})
    };

    let totalDailyWh = 0;
    let continuousPeakW = 0;
    let surgePeakW = 0;
    const appliances = Array.isArray(input.appliances) ? input.appliances : [];

    if (appliances.length > 0) {
        for (const app of appliances) {
            const watts = Number(app.watts || 0);
            const qty = Math.max(1, Number(app.qty || 1));
            const hours = Number(app.hours || 0);
            const surgeMultiplier = Number(app.surgeMultiplier || (app.isInductive ? 3.0 : 1.0));

            const appTotalWatts = watts * qty;
            const appDailyWh = appTotalWatts * hours;

            continuousPeakW += appTotalWatts;
            surgePeakW += appTotalWatts * surgeMultiplier;
            totalDailyWh += appDailyWh;
        }
    } else {
        // Direct aggregate inputs
        continuousPeakW = Number(input.peakLoadWatts || input.continuousLoadWatts || 3000);
        surgePeakW = continuousPeakW * 1.5;
        totalDailyWh = Number(input.dailyEnergyWh || (continuousPeakW * (Number(input.operatingHours) || 6)));
    }

    if (continuousPeakW <= 0) {
        warnings.push("Peak load is 0 W. Defaulting to minimum baseline of 1,000 W.");
        continuousPeakW = 1000;
        surgePeakW = 1500;
        totalDailyWh = Math.max(totalDailyWh, 5000);
    }

    // 1. INVERTER SIZING
    const continuousKw = continuousPeakW / 1000;
    const requiredInverterKw = continuousKw * assumptions.inverterSafetyMargin;
    const requiredInverterKva = requiredInverterKw / assumptions.powerFactor;

    // Fetch matched inverter from equipment database
    const inverterRes = await query(
        `
        SELECT * FROM equipment
        WHERE category = 'inverter' AND status = 'active'
        ORDER BY (specifications->>'powerRatingKw')::numeric ASC
        `
    );

    let selectedInverter = null;
    const availableInverters = inverterRes.rows;
    for (const inv of availableInverters) {
        const ratingKw = Number(inv.specifications?.powerRatingKw || 0);
        if (ratingKw >= requiredInverterKw) {
            selectedInverter = inv;
            break;
        }
    }
    // If requirement exceeds single largest unit, select the largest available
    if (!selectedInverter && availableInverters.length > 0) {
        selectedInverter = availableInverters[availableInverters.length - 1];
        warnings.push(`Load (${requiredInverterKw.toFixed(1)}kW) exceeds single largest inverter (${selectedInverter.rating}). Paralleling recommended.`);
    }

    // 2. PV ARRAY SIZING
    // Daily energy needed accounting for inverter efficiency and wire losses
    const effectiveDailyEnergyWh = totalDailyWh / (assumptions.inverterEfficiency * assumptions.systemLosses);
    const requiredPvCapacityWp = effectiveDailyEnergyWh / assumptions.peakSunHours;
    const panelWattage = Number(input.panelWattage || assumptions.defaultPanelWattage);

    const calculatedPanelCount = Math.ceil(requiredPvCapacityWp / panelWattage);
    // Make panel count even for dual string balance
    const panelCount = calculatedPanelCount % 2 === 0 ? calculatedPanelCount : calculatedPanelCount + 1;
    const actualPvCapacityWp = panelCount * panelWattage;
    const actualPvCapacityKw = actualPvCapacityWp / 1000;

    // Fetch selected panel from equipment database
    const panelRes = await query(
        `SELECT * FROM equipment WHERE category = 'solar_panel' AND status = 'active' ORDER BY ABS((specifications->>'wattage')::numeric - $1) ASC LIMIT 1`,
        [panelWattage]
    );
    const selectedPanel = panelRes.rows[0] || null;

    // 3. BATTERY SIZING (STORAGE)
    // Night consumption or backup portion (default 70% of daily consumption or full autonomy)
    const backupEnergyWh = (totalDailyWh * assumptions.autonomyDays) / assumptions.batteryDod;
    const backupEnergyKwh = backupEnergyWh / 1000;
    const requiredBatteryAh = (backupEnergyWh / assumptions.systemVoltage);

    // Fetch available lithium batteries
    const batteryRes = await query(
        `SELECT * FROM equipment WHERE category = 'battery' AND status = 'active' ORDER BY (specifications->>'capacityKwh')::numeric ASC`
    );
    const availableBatteries = batteryRes.rows;
    // Choose standard 5.12kWh or 10.24kWh module
    let selectedBattery = null;
    if (backupEnergyKwh > 7.5 && availableBatteries.find(b => Number(b.specifications?.capacityKwh) >= 10)) {
        selectedBattery = availableBatteries.find(b => Number(b.specifications?.capacityKwh) >= 10);
    } else {
        selectedBattery = availableBatteries[0] || null;
    }

    const batteryUnitCapacityKwh = selectedBattery ? Number(selectedBattery.specifications?.capacityKwh || 5.12) : 5.12;
    const batteryUnits = Math.max(1, Math.ceil(backupEnergyKwh / batteryUnitCapacityKwh));
    const actualBatteryCapacityKwh = batteryUnits * batteryUnitCapacityKwh;

    // 4. BALANCE OF SYSTEM (BOS)
    const bosItems = [];

    // Mounting kits: 1 set for every 2 panels
    const mountingUnits = Math.ceil(panelCount / 2);
    const mountingRes = await query(`SELECT * FROM equipment WHERE category = 'mounting_system' AND status = 'active' LIMIT 1`);
    if (mountingRes.rows[0]) {
        bosItems.push({ equipment: mountingRes.rows[0], quantity: mountingUnits, purpose: "Solar rail and roof mount clamps" });
    }

    // Solar DC Cable: 1 drum per ~12 panels
    const dcCableDrums = Math.max(1, Math.ceil(panelCount / 12));
    const dcCableRes = await query(`SELECT * FROM equipment WHERE category = 'dc_cable' AND status = 'active' ORDER BY selling_price ASC LIMIT 1`);
    if (dcCableRes.rows[0]) {
        bosItems.push({ equipment: dcCableRes.rows[0], quantity: dcCableDrums, purpose: "UV-resistant DC string cabling" });
    }

    // MC4 Connectors
    const mc4Pairs = Math.max(2, Math.ceil(panelCount / 2));
    const mc4Res = await query(`SELECT * FROM equipment WHERE category = 'mc4_connector' AND status = 'active' LIMIT 1`);
    if (mc4Res.rows[0]) {
        bosItems.push({ equipment: mc4Res.rows[0], quantity: mc4Pairs, purpose: "String interconnection plugs" });
    }

    // DC SPD & Breaker
    const spdRes = await query(`SELECT * FROM equipment WHERE category = 'spd' AND rating ILIKE '%DC%' AND status = 'active' LIMIT 1`);
    if (spdRes.rows[0]) {
        bosItems.push({ equipment: spdRes.rows[0], quantity: 1, purpose: "DC lightning surge protector" });
    }
    const dcBreakerRes = await query(`SELECT * FROM equipment WHERE category = 'circuit_breaker' AND rating ILIKE '%DC%' AND status = 'active' LIMIT 1`);
    if (dcBreakerRes.rows[0]) {
        bosItems.push({ equipment: dcBreakerRes.rows[0], quantity: 1, purpose: "DC string isolation breaker" });
    }

    // Battery Breaker & Cables
    const batBreakerCode = (selectedInverter && Number(selectedInverter.specifications?.powerRatingKw || 0) >= 10)
        ? "PROT-BAT-BREAKER-250A"
        : "PROT-BAT-BREAKER-125A";
    const batBreakerRes = await query(`SELECT * FROM equipment WHERE equipment_code = $1 LIMIT 1`, [batBreakerCode]);
    if (batBreakerRes.rows[0]) {
        bosItems.push({ equipment: batBreakerRes.rows[0], quantity: 1, purpose: "Heavy-duty battery DC disconnect" });
    }

    const batCableRes = await query(`SELECT * FROM equipment WHERE category = 'bos' AND equipment_code LIKE 'CBL-BAT%' ORDER BY selling_price DESC LIMIT 1`);
    if (batCableRes.rows[0]) {
        bosItems.push({ equipment: batCableRes.rows[0], quantity: 4, purpose: "Pure copper flexible battery interconnect cables (meters)" });
    }

    // AC SPD & Changeover Switch
    const acSpdRes = await query(`SELECT * FROM equipment WHERE category = 'spd' AND rating ILIKE '%AC%' AND status = 'active' LIMIT 1`);
    if (acSpdRes.rows[0]) {
        bosItems.push({ equipment: acSpdRes.rows[0], quantity: 1, purpose: "AC grid surge protection" });
    }
    const atsRes = await query(`SELECT * FROM equipment WHERE equipment_code = 'ACC-CHANGEOVER-63A' LIMIT 1`);
    if (atsRes.rows[0]) {
        bosItems.push({ equipment: atsRes.rows[0], quantity: 1, purpose: "Inverter bypass / Automatic Transfer Switch" });
    }

    // Earthing Kit
    const earthRes = await query(`SELECT * FROM equipment WHERE category = 'earthing' LIMIT 1`);
    if (earthRes.rows[0]) {
        bosItems.push({ equipment: earthRes.rows[0], quantity: 1, purpose: "Copper ground rod & surge discharge earthing" });
    }

    // Distribution Board Enclosure
    const dbRes = await query(`SELECT * FROM equipment WHERE category = 'distribution_board' LIMIT 1`);
    if (dbRes.rows[0]) {
        bosItems.push({ equipment: dbRes.rows[0], quantity: 1, purpose: "Surface mount IP65 protection enclosure" });
    }

    // 5. BILL OF QUANTITIES (BOQ) & PRICING
    const boqItems = [];

    // Inverter
    if (selectedInverter) {
        boqItems.push({
            equipment_id: selectedInverter.id,
            equipment_code: selectedInverter.equipment_code,
            item_name: selectedInverter.name,
            category: "inverter",
            quantity: 1,
            unit: selectedInverter.unit || "unit",
            unit_price: Number(selectedInverter.selling_price),
            total_price: Number(selectedInverter.selling_price),
            specifications: selectedInverter.specifications
        });
    }

    // Panels
    if (selectedPanel && panelCount > 0) {
        boqItems.push({
            equipment_id: selectedPanel.id,
            equipment_code: selectedPanel.equipment_code,
            item_name: selectedPanel.name,
            category: "solar_panel",
            quantity: panelCount,
            unit: selectedPanel.unit || "pcs",
            unit_price: Number(selectedPanel.selling_price),
            total_price: Number(selectedPanel.selling_price) * panelCount,
            specifications: selectedPanel.specifications
        });
    }

    // Batteries
    if (selectedBattery && batteryUnits > 0) {
        boqItems.push({
            equipment_id: selectedBattery.id,
            equipment_code: selectedBattery.equipment_code,
            item_name: selectedBattery.name,
            category: "battery",
            quantity: batteryUnits,
            unit: selectedBattery.unit || "unit",
            unit_price: Number(selectedBattery.selling_price),
            total_price: Number(selectedBattery.selling_price) * batteryUnits,
            specifications: selectedBattery.specifications
        });
    }

    // BOS Items
    for (const bos of bosItems) {
        const eq = bos.equipment;
        const qty = bos.quantity;
        boqItems.push({
            equipment_id: eq.id,
            equipment_code: eq.equipment_code,
            item_name: `${eq.name} (${bos.purpose})`,
            category: eq.category,
            quantity: qty,
            unit: eq.unit || "pcs",
            unit_price: Number(eq.selling_price),
            total_price: Number(eq.selling_price) * qty,
            specifications: eq.specifications
        });
    }

    // 6. COMMERCIAL TOTALS
    const subtotalEquipment = boqItems.reduce((acc, item) => acc + item.total_price, 0);
    const installationLabour = Math.round(subtotalEquipment * assumptions.labourPercentage);
    const transportCost = assumptions.transportFlatRate;
    const engineeringFee = Math.round(subtotalEquipment * assumptions.engineeringFeeRate);

    const subtotalBeforeVat = subtotalEquipment + installationLabour + transportCost + engineeringFee;
    const vatAmount = Math.round(subtotalBeforeVat * assumptions.vatRate);
    const finalQuotationAmount = subtotalBeforeVat + vatAmount;

    return {
        success: true,
        engineering: {
            dailyEnergyWh: Math.round(totalDailyWh),
            dailyEnergyKwh: +(totalDailyWh / 1000).toFixed(2),
            continuousPeakWatts: Math.round(continuousPeakW),
            continuousPeakKw: +(continuousPeakW / 1000).toFixed(2),
            surgePeakWatts: Math.round(surgePeakW),
            requiredInverterKw: +requiredInverterKw.toFixed(2),
            requiredInverterKva: +requiredInverterKva.toFixed(2),
            selectedInverter: selectedInverter ? {
                id: selectedInverter.id,
                code: selectedInverter.equipment_code,
                name: selectedInverter.name,
                rating: selectedInverter.rating,
                powerKw: selectedInverter.specifications?.powerRatingKw,
                price: Number(selectedInverter.selling_price)
            } : null,
            pvCapacityWp: Math.round(actualPvCapacityWp),
            pvCapacityKw: +actualPvCapacityKw.toFixed(2),
            panelCount,
            panelWattage,
            selectedPanel: selectedPanel ? {
                id: selectedPanel.id,
                code: selectedPanel.equipment_code,
                name: selectedPanel.name,
                rating: selectedPanel.rating,
                price: Number(selectedPanel.selling_price)
            } : null,
            backupEnergyKwh: +backupEnergyKwh.toFixed(2),
            batteryCapacityKwh: +actualBatteryCapacityKwh.toFixed(2),
            batteryUnits,
            selectedBattery: selectedBattery ? {
                id: selectedBattery.id,
                code: selectedBattery.equipment_code,
                name: selectedBattery.name,
                rating: selectedBattery.rating,
                price: Number(selectedBattery.selling_price)
            } : null
        },
        boqItems,
        commercial: {
            subtotalEquipment,
            installationLabour,
            transportCost,
            engineeringFee,
            subtotalBeforeVat,
            vatRate: assumptions.vatRate,
            vatAmount,
            finalQuotationAmount,
            currency: "NGN"
        },
        assumptions,
        warnings
    };
}

module.exports = {
    calculateSystem,
    DEFAULT_ASSUMPTIONS
};
