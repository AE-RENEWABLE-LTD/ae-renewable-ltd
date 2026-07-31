// ======================================================
// AE RENEWABLE LTD | ARDE V1.0
// FILE: materials/pricing.js
// PURPOSE: Cost evaluation engine for BOM line items
// ======================================================

import { DEFAULT_PRICES } from "../data/prices.js";

/**
 * Applies price mappings to the material list and calculates sub-totals.
 * 
 * @param {Array<Object>} materialsList - BOM array from materialBuilder.js
 * @param {Object} [priceOverrides] - Custom price lookup object
 * @returns {Object} Line items with calculated prices and financial breakdown
 */
export function applyPricing(materialsList, priceOverrides = {}) {
    const prices = { ...DEFAULT_PRICES, ...priceOverrides };
    let equipmentSubtotal = 0;

    const pricedItems = materialsList.map(item => {
        // Search lookup table or fall back to 0
        const unitPrice = prices[item.name] || prices[item.id] || 0;
        const totalPrice = unitPrice * item.quantity;
        equipmentSubtotal += totalPrice;

        return {
            ...item,
            unitPrice: Number(unitPrice.toFixed(2)),
            totalPrice: Number(totalPrice.toFixed(2))
        };
    });

    // Standard BOS, Balance of Plant & Installation parameters
    const balanceOfSystemCost = equipmentSubtotal * 0.08; // Accessories, Trunking, Clamps, Fasteners
    const laborAndInstallationCost = equipmentSubtotal * 0.07; // Workmanship & Engineering Commissioning

    const grandTotal = equipmentSubtotal + balanceOfSystemCost + laborAndInstallationCost;

    return {
        lineItems: pricedItems,
        summary: {
            equipmentSubtotal: Number(equipmentSubtotal.toFixed(2)),
            balanceOfSystemCost: Number(balanceOfSystemCost.toFixed(2)),
            laborAndInstallationCost: Number(laborAndInstallationCost.toFixed(2)),
            grandTotal: Number(grandTotal.toFixed(2))
        }
    };
}