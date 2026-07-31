// ======================================================
// AE RENEWABLE LTD | ARDE V1.0
// FILE: calculations/stringing.js
// PURPOSE: PV String design, MPPT distribution, combiners, and MC4 connectors
// ======================================================

/**
 * Calculates string configuration, string counts, remaining panels, combiner boxes, and MC4 pairs.
 * 
 * @param {Object} params
 * @param {number} params.totalPanels - Total number of solar panels
 * @param {Object} params.panel - Selected panel specs (Voc, Vmp, Isc, Imp, maxSeries)
 * @param {Object} params.inverter - Selected inverter specs (maxPvVoltage, mpptVoltageMin, mpptVoltageMax, mpptCount, maxMpptCurrent)
 * @returns {Object} Comprehensive PV string configuration
 */
export function calculatePVStringing({ totalPanels, panel, inverter }) {
    if (!panel || !inverter) {
        return {
            panelsPerString: 0,
            totalStrings: 0,
            stringsPerMPPT: 0,
            remainingPanels: totalPanels,
            combinerQuantity: 0,
            mc4Pairs: 0
        };
    }

    // Safety factor for cold weather voltage expansion
    const VOLTAGE_SAFETY_FACTOR = 1.15;
    const maxAllowedVoc = (inverter.maxPvVoltage || 500) / VOLTAGE_SAFETY_FACTOR;

    // Ideal string length based on inverter max Voc
    let maxPanelsPerString = Math.floor(maxAllowedVoc / panel.voc);
    if (panel.maxSeries) {
        maxPanelsPerString = Math.min(maxPanelsPerString, panel.maxSeries);
    }

    // Minimum string length to strike MPPT minimum operating voltage
    const minPanelsPerString = Math.ceil((inverter.mpptVoltageMin || 120) / panel.vmp);
    const panelsPerString = Math.max(minPanelsPerString, maxPanelsPerString);

    if (panelsPerString <= 0 || totalPanels < panelsPerString) {
        // Fallback for smaller system arrays
        const totalStrings = 1;
        const remainingPanels = 0;
        const stringsPerMPPT = 1;
        const combinerQuantity = 0;
        const mc4Pairs = totalPanels * 2;

        return {
            panelsPerString: totalPanels,
            totalStrings,
            stringsPerMPPT,
            remainingPanels,
            combinerQuantity,
            mc4Pairs
        };
    }

    // Calculate whole strings and remaining panels
    const totalStrings = Math.floor(totalPanels / panelsPerString);
    const remainingPanels = totalPanels % panelsPerString;

    const mpptCount = inverter.mpptCount || 1;
    const stringsPerMPPT = Math.ceil(totalStrings / mpptCount);

    // Combiner box needed if parallel strings per MPPT exceed 2
    const combinerQuantity = stringsPerMPPT > 2 ? mpptCount : 0;

    // MC4 pairs: 2 per string + 2 per panel connection
    const mc4Pairs = (totalStrings * 2) + totalPanels;

    return {
        panelsPerString,
        totalStrings,
        stringsPerMPPT,
        remainingPanels,
        combinerQuantity,
        mc4Pairs
    };
}