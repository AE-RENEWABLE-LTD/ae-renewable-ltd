// ======================================================
// AE RENEWABLE LTD | ARDE V1.0
// FILE: ui/materialCard.js
// PURPOSE: Highlights BOM totals and material summary
// ======================================================

import { uiFormatCurrency } from "./formatter.js";

export function renderMaterialCard(containerId, quotation) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { financials } = quotation;

    container.innerHTML = `
        <div style="background: linear-gradient(135deg, #15803d 0%, #166534 100%); color: #ffffff; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">Total Estimated Investment</div>
            <div style="font-size: 28px; font-weight: bold; color: #fef08a; margin: 6px 0;">
                ${uiFormatCurrency(financials.grandTotal)}
            </div>
            <div style="font-size: 12px; opacity: 0.8;">
                Includes Equipment (${uiFormatCurrency(financials.equipmentTotal)}) + Installation & BOS
            </div>
        </div>
    `;
}