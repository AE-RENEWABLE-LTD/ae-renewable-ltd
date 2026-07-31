// ======================================================
// AE RENEWABLE LTD | ARDE V1.0
// FILE: materials/quotation.js
// PURPOSE: Formats system pricing into a formal proposal document
// ======================================================

/**
 * Formats pricing data into an official AE Renewable Ltd Quotation format.
 * 
 * @param {Object} pricingData - Results from pricing.js
 * @param {Object} [clientInfo] - Customer details (Name, Address, Project Ref)
 * @returns {Object} Complete client quotation object
 */
export function generateQuotation(pricingData, clientInfo = {}) {
    const { lineItems, summary } = pricingData;
    const dateToday = new Date().toISOString().split("T")[0];

    return {
        header: {
            company: "AE RENEWABLE LTD",
            documentTitle: "COMMERCIAL & RESIDENTIAL SOLAR QUOTATION",
            quoteReference: `AE-${Math.floor(100000 + Math.random() * 900000)}`,
            date: dateToday,
            validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] // Valid 14 days
        },
        client: {
            name: clientInfo.name || "Valued Client",
            address: clientInfo.address || "Site Location",
            phone: clientInfo.phone || "N/A",
            email: clientInfo.email || "N/A"
        },
        billOfMaterials: lineItems.map(item => ({
            item: item.name,
            specification: item.specification,
            quantity: `${item.quantity} ${item.unit}`,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
        })),
        financialBreakdown: {
            equipmentTotal: summary.equipmentSubtotal,
            balanceOfSystem: summary.balanceOfSystemCost,
            installationAndLabor: summary.laborAndInstallationCost,
            grandTotal: summary.grandTotal,
            currency: "NGN"
        },
        termsAndConditions: [
            "All equipment supplied carries manufacturer warranties (Inverters/Batteries: 3-5 Years, Solar Panels: 12-25 Years).",
            "Payment Terms: 80% Mobilization Deposit, 20% upon successful testing & commissioning.",
            "Quotation remains valid for 14 days from the date of issue."
        ]
    };
}