// ======================================================
// AE RENEWABLE LTD — ARDE V1.0 ENGINEERING ENGINE
// Unified Engine Export Entry Point
// ======================================================

export { designSystem } from "./calculations/designEngine.js";
export { calculateEnergy } from "./calculations/energy.js";
export { calculateBattery } from "./calculations/battery.js";
export { calculatePV } from "./calculations/solar.js";
export { chooseProtection } from "./calculations/protection.js";
export { calculatePVStringing } from "./calculations/stringing.js";
export { calculateMaterialCost } from "./calculations/materialCost.js";

export { buildMaterialList } from "./materials/materialBuilder.js";
export { applyPricing } from "./materials/pricing.js";
export { generateQuotation } from "./materials/quotation.js";

export { buildReportData } from "./reports/reportBuilder.js";
export { generatePdfHtml } from "./reports/pdfGenerator.js";
export { generateExcelCsv } from "./reports/excelGenerator.js";

export { choosePanel } from "./selection/panelSelector.js";
export { chooseInverter } from "./selection/inverterSelector.js";
export { chooseBattery } from "./selection/batterySelector.js";
export { choosePVString } from "./selection/pvStringSelector.js";
export { chooseBreaker } from "./selection/breakerSelector.js";
