// ======================================================
// AE RENEWABLE LTD | ARDE V1.0
// FILE: calculations/materialCost.js
// PURPOSE: Automated project costing, margins, tax, and total pricing calculation
// ======================================================

/**
 * Computes cost summary for the complete bill of materials.
 * 
 * @param {Array<Object>} materialList - List of material items with total prices
 * @param {Object} options - Pricing multipliers
 * @returns {Object} Complete breakdown of project cost
 */
export function calculateMaterialCost(materialList = [], options = {}) {
    const {
        labourPercent = 0.10,        // 10% Labour
        transportPercent = 0.05,     // 5% Logistics
        installationPercent = 0.08,  // 8% Workmanship
        vatPercent = 0.075,          // 7.5% Standard VAT
        profitPercent = 0.15         // 15% Company Profit Margin
    } = options;

    // Calculate total materials base cost
    const totalMaterialCost = materialList.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    const labourCost = Math.round(totalMaterialCost * labourPercent);
    const transportCost = Math.round(totalMaterialCost * transportPercent);
    const installationCost = Math.round(totalMaterialCost * installationPercent);

    const subTotal = totalMaterialCost + labourCost + transportCost + installationCost;

    const profitCost = Math.round(subTotal * profitPercent);
    const vatCost = Math.round((subTotal + profitCost) * vatPercent);

    const grandTotal = subTotal + profitCost + vatCost;

    return {
        materialCost: totalMaterialCost,
        labourCost,
        transportCost,
        installationCost,
        vatCost,
        profitCost,
        grandTotal
    };
}