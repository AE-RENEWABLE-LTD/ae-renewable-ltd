// ======================================================
// AE RENEWABLE LTD | ARDE V1.0
// FILE: utils/constants.js
// PURPOSE: System-wide engineering constants & safety multipliers
// ======================================================

export const SYSTEM_CONSTANTS = {
    // Inverter Sizing Constants
    INVERTER_SAFETY_MARGIN: 1.25, // 25% overhead above peak continuous load
    
    // Battery Sizing Constants
    BATTERY_DOD_DEFAULT: 0.90,    // 90% Depth of Discharge default for LiFePO4
    INVERTER_EFFICIENCY: 0.92,   // 92% efficiency rating
    
    // PV Module Constants
    PEAK_SUN_HOURS_DEFAULT: 4.5, // Average PSH in West Africa / Nigeria
    PV_SAFETY_FACTOR: 1.25,      // Standard sizing multiplier
    TEMP_COEFF_VOC: -0.0028,     // Temperature coefficient per degree Celsius
    DEFAULT_PANEL_WATT: 750,     // Primary panel: Jinko Tiger Neo 750W
    
    // Protection & Wire Sizing
    BREAKER_SAFETY_FACTOR: 1.25, // Continuous load factor
    PV_ISC_FACTOR: 1.25          // NEC standard short circuit factor
};