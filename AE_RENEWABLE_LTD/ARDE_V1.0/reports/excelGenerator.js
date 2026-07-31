// ======================================================
// AE RENEWABLE LTD | ARDE V1.0
// FILE: reports/excelGenerator.js
// PURPOSE: Export design reports, BOM, and financial totals as downloadable CSV/Excel rows
// ======================================================

/**
 * Converts report data into CSV row matrix ready for Excel downloads.
 * 
 * @param {Object} reportData - Object returned by buildReportData
 * @returns {string} CSV formatted text
 */
export function generateExcelCsv(reportData) {
    const rows = [];

    // Header Meta
    rows.push(["AE RENEWABLE LTD - SYSTEM DESIGN EXPORT"]);
    rows.push(["Project Reference", reportData.meta.projectRef]);
    rows.push(["Generated Date", reportData.meta.generatedAt]);
    rows.push(["Client Name", reportData.clientInfo.name]);
    rows.push([]);

    // System Tech Summary
    rows.push(["SYSTEM TECHNICAL SPECIFICATION"]);
    rows.push(["Peak Load (kW)", reportData.loadProfile.peakLoadKw]);
    rows.push(["Daily Energy (kWh)", reportData.loadProfile.dailyEnergyKwh]);
    rows.push(["Inverter", reportData.systemConfiguration.inverter]);
    rows.push(["Battery Storage", reportData.systemConfiguration.batteryBank]);
    rows.push(["PV Modules", reportData.systemConfiguration.pvArray]);
    rows.push(["String Wiring", reportData.systemConfiguration.stringConfig]);
    rows.push([]);

    // Bill of Materials
    rows.push(["BILL OF MATERIALS"]);
    rows.push(["Item", "Specification", "Quantity", "Unit Price (NGN)", "Total Price (NGN)"]);

    reportData.bomItems.forEach(item => {
        rows.push([
            `"${item.item}"`,
            `"${item.specification}"`,
            item.quantity,
            item.unitPrice || 0,
            item.totalPrice || 0
        ]);
    });

    rows.push([]);
    if (reportData.financials.grandTotal) {
        rows.push(["FINANCIAL SUMMARY"]);
        rows.push(["Equipment Subtotal", reportData.financials.equipmentTotal || 0]);
        rows.push(["Balance of System", reportData.financials.balanceOfSystem || 0]);
        rows.push(["Installation & Labor", reportData.financials.installationAndLabor || 0]);
        rows.push(["GRAND TOTAL", reportData.financials.grandTotal || 0]);
    }

    return rows.map(r => r.join(",")).join("\n");
}