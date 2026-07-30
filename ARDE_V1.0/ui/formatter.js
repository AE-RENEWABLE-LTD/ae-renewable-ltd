// ======================================================
// AE RENEWABLE LTD | ARDE V1.0
// FILE: ui/formatter.js
// PURPOSE: UI display text and unit formatting helpers
// ======================================================

/**
 * Formats values for UI card rendering.
 */
export function uiFormatCurrency(val) {
    if (isNaN(val)) return "₦0.00";
    return `₦${Number(val).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export function uiFormatPower(watts) {
    if (!watts || isNaN(watts)) return "0 W";
    if (watts >= 1000) return `${(watts / 1000).toFixed(2)} kW`;
    return `${Math.round(watts)} W`;
}

export function uiFormatCapacity(wh) {
    if (!wh || isNaN(wh)) return "0 Wh";
    if (wh >= 1000) return `${(wh / 1000).toFixed(2)} kWh`;
    return `${Math.round(wh)} Wh`;
}