// ======================================================
// AE RENEWABLE LTD | ARDE V1.0
// FILE: reports/reportBuilder.js
// PURPOSE: Aggregate system design data into structured report payloads
// ======================================================

/**
 * Builds a standardized report data object from design and quotation outputs.
 * 
 * @param {Object} loadData - Calculated load parameters (peak load, daily Wh, run hours)
 * @param {Object} selectionData - Equipment selection (Inverter, Battery, PV Strings, Protection)
 * @param {Object} quotationData - Pricing and financial breakdown
 * @param {Object} [clientData] - Optional customer details
 * @returns {Object} Consolidated report dataset
 */
export function buildReportData(loadData, selectionData, quotationData, clientData = {}) {
    return {
        meta: {
            title: "AE RENEWABLE LTD - SYSTEM DESIGN REPORT",
            company: "AE RENEWABLE LTD",
            generatedAt: new Date().toLocaleString(),
            projectRef: quotationData.header?.quoteReference || `AE-${Date.now().toString().slice(-6)}`
        },
        clientInfo: {
            name: clientData.name || "Valued Client",
            address: clientData.address || "Site Location",
            phone: clientData.phone || "N/A",
            email: clientData.email || "N/A"
        },
        loadProfile: {
            peakLoadKw: loadData.peakPowerKw || 0,
            dailyEnergyKwh: loadData.dailyEnergyKwh || 0,
            autonomyDays: loadData.autonomyDays || 1
        },
        systemConfiguration: {
            inverter: `${selectionData.inverter.brand} ${selectionData.inverter.model} (${selectionData.inverter.capacityKva}kVA)`,
            batteryBank: `${selectionData.battery.selectedModel.brand} ${selectionData.battery.selectedModel.model} x ${selectionData.battery.totalUnitsRequired} (${selectionData.battery.totalBankCapacityKwh}kWh Total)`,
            pvArray: `${selectionData.pvConfig.totalPanels}x ${selectionData.pvConfig.panelModel} (${selectionData.pvConfig.totalCapacityKw}kWp)`,
            stringConfig: selectionData.pvConfig.stringConfig,
            protection: {
                acBreaker: selectionData.protection.acBreaker.label,
                dcBreaker: selectionData.protection.dcBreaker.label,
                spd: `${selectionData.protection.acSpd.label} / ${selectionData.protection.dcSpd.label}`
            }
        },
        financials: quotationData.financialBreakdown || {},
        bomItems: quotationData.billOfMaterials || []
    };
}