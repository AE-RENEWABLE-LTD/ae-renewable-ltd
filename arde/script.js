// ======================================================
// AE RENEWABLE LTD — ARDE V1.0 ENGINEERING STUDIO
// FILE: script.js
// PURPOSE: Complete Application Controller & Real-Life Work Logic
// ======================================================

import { designSystem } from "./calculations/designEngine.js";
import { buildMaterialList } from "./materials/materialBuilder.js";
import { calculateMaterialCost } from "./calculations/materialCost.js";
import { getActivePrices } from "./data/prices.js";

// ======================================================
// STATE
// ======================================================
let currentSystem = null;
let currentMaterials = null;
let currentCostSummary = null;

let activeClient = {
    fullName: "Eniola Abdulrasaq",
    firstName: "Eniola",
    projectCode: "PRJ-202610-4757",
    propertyType: "Residential",
    email: "eniola@aerenewable.com",
    phone: "+234 803 123 4567",
    address: "Plot 14, Guzape Hills, Abuja, FCT"
};

// Sizing Presets
const PRESETS = {
    res3bed: {
        name: "3-Bed Residence",
        load: 5000,
        backup: 8,
        psh: 5.0,
        panelFactor: 1.3,
        dod: 0.8,
        losses: 0.8,
        batteryPercent: 100
    },
    villa: {
        name: "Executive Mansion",
        load: 10000,
        backup: 10,
        psh: 5.0,
        panelFactor: 1.3,
        dod: 0.8,
        losses: 0.8,
        batteryPercent: 100
    },
    commercial: {
        name: "Commercial Plaza",
        load: 16000,
        backup: 12,
        psh: 5.0,
        panelFactor: 1.3,
        dod: 0.8,
        losses: 0.8,
        batteryPercent: 100
    },
    industrial: {
        name: "Industrial Mini-Grid",
        load: 30000,
        backup: 12,
        psh: 5.0,
        panelFactor: 1.3,
        dod: 0.8,
        losses: 0.8,
        batteryPercent: 100
    }
};

// ======================================================
// DOM ELEMENTS
// ======================================================
const designForm = document.getElementById("designForm");
const btnQuotation = document.getElementById("generateQuotation");
const btnBOQ = document.getElementById("generateBOQ");
const btnPrint = document.getElementById("printReport");
const btnPDF = document.getElementById("exportPDF");
const btnReset = document.getElementById("btnReset");

// Modal Elements
const printUpModal = document.getElementById("printUpModal");
const sheetBackBtn = document.getElementById("sheetBackBtn");
const sheetCloseBtn = document.getElementById("sheetCloseBtn");
const tabQuotationBtn = document.getElementById("tabQuotationBtn");
const tabBOQBtn = document.getElementById("tabBOQBtn");
const quotationView = document.getElementById("quotationView");
const boqView = document.getElementById("boqView");
const sheetPrintBtn = document.getElementById("sheetPrintBtn");
const sheetPdfBtn = document.getElementById("sheetPdfBtn");

// Mail Notification Strip
const mailAlertStrip = document.getElementById("mailAlertStrip");
const mailAlertText = document.getElementById("mailAlertText");
const btnDismissMailAlert = document.getElementById("btnDismissMailAlert");

// Sidebar Quick Action Buttons
const sidebarOpenQuotation = document.getElementById("sidebarOpenQuotation");
const sidebarOpenBOQ = document.getElementById("sidebarOpenBOQ");

// ======================================================
// INITIALIZATION
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
    updateDynamicDates();
    loadClientFromStorage();
    initPresets();
    initEventListeners();
    initIcons();

    // Initial default compute
    runComputation(false);
});

function updateDynamicDates() {
    const todayFormatted = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const docDateEl = document.getElementById("docDate");
    if (docDateEl) docDateEl.textContent = todayFormatted;
    const resDocDateEl = document.getElementById("resDocDate");
    if (resDocDateEl) resDocDateEl.textContent = todayFormatted;
}

function initIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Load Client Info from Intake if present
function loadClientFromStorage() {
    // 1. Check URL parameters first (from client intake redirect)
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.get("clientEmail")) activeClient.email = params.get("clientEmail").trim();
        if (params.get("clientName")) activeClient.fullName = params.get("clientName").trim();
        if (params.get("clientPhone")) activeClient.phone = params.get("clientPhone").trim();
        if (params.get("clientAddress")) activeClient.address = params.get("clientAddress").trim();
        if (params.get("projectCode")) activeClient.projectCode = params.get("projectCode").trim();
        if (params.get("propertyType")) activeClient.propertyType = params.get("propertyType").trim();
        if (params.get("load")) {
            const loadInput = document.getElementById("load");
            if (loadInput) loadInput.value = params.get("load");
        }
        if (params.get("backup")) {
            const backupInput = document.getElementById("backup");
            if (backupInput) backupInput.value = params.get("backup");
        }
        if (params.get("psh")) {
            const pshInput = document.getElementById("psh");
            if (pshInput) pshInput.value = params.get("psh");
        }
    } catch (err) {
        console.warn("URL params parse warning:", err);
    }

    // 2. Load and overlay from localStorage
    try {
        const raw = localStorage.getItem("ae_active_client");
        if (raw) {
            const data = JSON.parse(raw);
            if (data.fullName && (!activeClient.fullName || activeClient.fullName === "Eniola Abdulrasaq")) activeClient.fullName = data.fullName;
            if (data.projectCode && (!activeClient.projectCode || activeClient.projectCode === "PRJ-202610-4757")) activeClient.projectCode = data.projectCode;
            if (data.propertyType) activeClient.propertyType = data.propertyType;
            if (data.email && (!activeClient.email || activeClient.email === "eniola@aerenewable.com")) activeClient.email = data.email;
            if (data.phone && (!activeClient.phone || activeClient.phone === "+234 803 123 4567")) activeClient.phone = data.phone;
            if (data.address && (!activeClient.address || activeClient.address === "Plot 14, Guzape Hills, Abuja, FCT")) activeClient.address = data.address;
        }
    } catch (e) {
        console.warn("Using default client intake data", e);
    }

    // Extract first name as initial password
    activeClient.firstName = (activeClient.fullName || "Client").trim().split(" ")[0] || "Client";

    // Save synced version back to localStorage
    try {
        localStorage.setItem("ae_active_client", JSON.stringify(activeClient));
    } catch (e) {}

    // Update Banner
    const bannerClientName = document.getElementById("bannerClientName");
    const bannerProjectCode = document.getElementById("bannerProjectCode");
    const bannerPropertyType = document.getElementById("bannerPropertyType");
    if (bannerClientName) bannerClientName.textContent = activeClient.fullName;
    if (bannerProjectCode) bannerProjectCode.textContent = activeClient.projectCode;
    if (bannerPropertyType) bannerPropertyType.textContent = activeClient.propertyType;

    // Update Sidebar
    const sidebarUsername = document.getElementById("sidebarUsername");
    const sidebarPassword = document.getElementById("sidebarPassword");
    const sidebarClientEmail = document.getElementById("sidebarClientEmail");
    if (sidebarUsername) sidebarUsername.textContent = activeClient.projectCode;
    if (sidebarPassword) sidebarPassword.textContent = activeClient.firstName;
    if (sidebarClientEmail) sidebarClientEmail.textContent = activeClient.email;
}

// ======================================================
// PRESETS
// ======================================================
function initPresets() {
    const pills = document.querySelectorAll(".preset-pill");
    pills.forEach(pill => {
        pill.addEventListener("click", () => {
            pills.forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            const key = pill.getAttribute("data-preset");
            applyPreset(key);
        });
    });
}

function applyPreset(key) {
    const preset = PRESETS[key];
    if (!preset) return;

    document.getElementById("load").value = preset.load;
    document.getElementById("backup").value = preset.backup;
    document.getElementById("psh").value = preset.psh;
    document.getElementById("panelFactor").value = preset.panelFactor;
    document.getElementById("dod").value = preset.dod;
    document.getElementById("losses").value = preset.losses;
    document.getElementById("batteryPercent").value = preset.batteryPercent;

    runComputation(false);
}

// ======================================================
// INPUT EXTRACTION
// ======================================================
function collectInput() {
    return {
        load: Number(document.getElementById("load").value) || 5000,
        backup: Number(document.getElementById("backup").value) || 8,
        psh: Number(document.getElementById("psh").value) || 5.0,
        panelFactor: Number(document.getElementById("panelFactor").value) || 1.3,
        dod: Number(document.getElementById("dod").value) || 0.8,
        losses: Number(document.getElementById("losses").value) || 0.8,
        batteryPercent: Number(document.getElementById("batteryPercent").value) || 100
    };
}

// ======================================================
// CORE COMPUTATION RUNNER
// ======================================================
function runComputation(isExplicitSubmit = false) {
    try {
        const input = collectInput();

        // 1. Run ARDE Engineering Calculations
        const system = designSystem(input);
        currentSystem = system;

        // 2. Build Priced Bill of Materials
        const materials = buildMaterialList(system);
        currentMaterials = materials;

        // 3. Compute Project Cost Summary
        const costs = calculateMaterialCost(materials);
        currentCostSummary = costs;

        // 4. Update Main Studio Summary Cards
        updateStudioCards(system, costs);

        // 5. Populate A4 Quotation (AE.html format)
        populateA4Quotation(system, materials, costs);

        // 6. Populate Residential BOQ (Residential_Quotation.html format)
        populateResidentialBOQ(system, materials, costs);

        // If explicitly clicked "⚡ Compute Design":
        if (isExplicitSubmit) {
            dispatchClientAccountAndEmail();
            openPrintUpModal("quotation");
        }

    } catch (error) {
        console.error("Computation Error:", error);
        alert("Engineering Engine Notice: " + error.message);
    }
}

// ======================================================
// UPDATE MAIN STUDIO CARDS
// ======================================================
function updateStudioCards(system, costs) {
    const panelsPerString = system.pvString?.panelsPerString || 0;
    const totalStrings = system.pvString?.totalStrings || 0;
    const stringsPerMPPT = system.pvString?.stringsPerMPPT || (system.inverter?.mppt ? Math.ceil(totalStrings / system.inverter.mppt) : 1);
    
    // Remaining panels calculated based on panelQuantity and panelsPerString
    const remainingPanels = panelsPerString > 0 ? (system.panelQuantity % panelsPerString) : 0;
    const mc4Pairs = system.pvString?.mc4PairsWithMargin || system.pvString?.mc4Pairs || (totalStrings * 2);

    // Update Summary UI
    const elPanelsPerString = document.getElementById("resultPanelsPerString");
    if (elPanelsPerString) elPanelsPerString.textContent = panelsPerString;

    const elTotalStrings = document.getElementById("resultTotalStrings");
    if (elTotalStrings) elTotalStrings.textContent = totalStrings;

    const elStringsPerMPPT = document.getElementById("resultStringsPerMPPT");
    if (elStringsPerMPPT) elStringsPerMPPT.textContent = stringsPerMPPT;

    const elRemainingPanels = document.getElementById("resultRemainingPanels");
    if (elRemainingPanels) elRemainingPanels.textContent = remainingPanels;

    const elMC4 = document.getElementById("resultMC4");
    if (elMC4) elMC4.textContent = `${mc4Pairs} Pairs`;

    const elGrandTotal = document.getElementById("summaryGrandTotal");
    if (elGrandTotal) elGrandTotal.textContent = formatNaira(costs.grandTotal);

    const liveStatusTag = document.getElementById("liveStatusTag");
    if (liveStatusTag) {
        liveStatusTag.innerHTML = `<span>●</span> ${system.load}W System Active`;
    }
}

// ======================================================
// DISPATCH CLIENT ACCOUNT & NOTIFICATION
// ======================================================
function dispatchClientAccountAndEmail() {
    const username = activeClient.projectCode;
    const password = activeClient.firstName;

    // Show on-screen notification sign
    if (mailAlertStrip) {
        if (mailAlertText) {
            mailAlertText.innerHTML = `Login credentials sent to client mail (<strong>${activeClient.email}</strong>). Username (Client ID): <strong>${username}</strong> | Password: <strong>${password}</strong>. PDF quotation ready to save.`;
        }
        mailAlertStrip.classList.add("show");
    }

    // Determine backend API endpoint
    const endpoint = window.location.origin.includes(":5000")
        ? "/api/engineering/submit-project"
        : (window.location.protocol.startsWith("http") && !window.location.origin.includes(":5000")
            ? "http://localhost:5000/api/engineering/submit-project"
            : "/api/engineering/submit-project");

    try {
        fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customer: activeClient,
                engineeringInput: collectInput(),
                calculationResult: {
                    engineering: {
                        pvCapacityKw: (currentSystem.installedPvPower / 1000).toFixed(2),
                        batteryCapacityKwh: (currentSystem.installedBatteryWh / 1000).toFixed(2),
                        panelCount: currentSystem.panelQuantity,
                        inverterCapacityKva: (currentSystem.inverter.inverterSize / 1000).toFixed(1)
                    },
                    commercial: currentCostSummary,
                    boqItems: currentMaterials
                }
            })
        })
        .then(res => res.json())
        .then(data => {
            console.log("Project successfully submitted and quotation email dispatched:", data);
        })
        .catch(err => console.log("Backend offline or standalone fallback:", err));
    } catch (e) {
        console.warn("Dispatch warning:", e);
    }
}

// ======================================================
// POPULATE A4 ENGINEERING QUOTATION (AE.HTML FORMAT)
// ======================================================
function populateA4Quotation(system, materials, costs) {
    // Header & Meta
    const docQuotationNumber = document.getElementById("docQuotationNumber");
    if (docQuotationNumber) docQuotationNumber.textContent = activeClient.projectCode.replace("PRJ", "AE");

    const docDate = document.getElementById("docDate");
    if (docDate) docDate.textContent = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    const docUsername = document.getElementById("docUsername");
    if (docUsername) docUsername.textContent = activeClient.projectCode;

    const docPassword = document.getElementById("docPassword");
    if (docPassword) docPassword.textContent = activeClient.firstName;

    // Client Info
    const docClientName = document.getElementById("docClientName");
    if (docClientName) docClientName.textContent = activeClient.fullName;

    const docClientProperty = document.getElementById("docClientProperty");
    if (docClientProperty) docClientProperty.textContent = `${activeClient.propertyType} Solar Power Installation • ${activeClient.address}`;

    const docClientEmail = document.getElementById("docClientEmail");
    if (docClientEmail) docClientEmail.textContent = activeClient.email;

    const docSystemSpec = document.getElementById("docSystemSpec");
    if (docSystemSpec) docSystemSpec.textContent = `${(system.installedPvPower / 1000).toFixed(1)} kW Solar PV / ${(system.installedBatteryWh / 1000).toFixed(1)} kWh Storage (${system.inverter.brand} ${system.inverter.model})`;

    const docDailyYield = document.getElementById("docDailyYield");
    if (docDailyYield) docDailyYield.textContent = `${(system.dailyEnergy / 1000).toFixed(1)} kWh/day`;

    // Table
    const tbody = document.getElementById("docQuotationTableBody");
    if (tbody) {
        tbody.innerHTML = "";
        materials.forEach((item, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td style="text-align:center; color:#718096; font-weight:700;">${index + 1}</td>
                <td>
                    <strong style="color:#071426; display:block;">${item.description}</strong>
                </td>
                <td style="text-align:center; color:#718096;">${item.unit}</td>
                <td style="text-align:center; font-weight:700; color:#071426;">${item.quantity}</td>
                <td style="text-align:right; font-family:monospace;">${formatNaira(item.unitPrice)}</td>
                <td style="text-align:right; font-weight:700; color:#064B86; font-family:monospace;">${formatNaira(item.totalPrice)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Summary
    const docMaterialSubtotal = document.getElementById("docMaterialSubtotal");
    if (docMaterialSubtotal) docMaterialSubtotal.textContent = formatNaira(costs.materialCost);

    const docTransport = document.getElementById("docTransport");
    if (docTransport) docTransport.textContent = formatNaira(costs.transportCost);

    const docLabour = document.getElementById("docLabour");
    if (docLabour) docLabour.textContent = formatNaira(costs.labourCost + costs.installationCost);

    const docVat = document.getElementById("docVat");
    if (docVat) docVat.textContent = formatNaira(costs.vatCost);

    const docGrandTotal = document.getElementById("docGrandTotal");
    if (docGrandTotal) docGrandTotal.textContent = formatNaira(costs.grandTotal);
}

// ======================================================
// POPULATE RESIDENTIAL BOQ (RESIDENTIAL_QUOTATION.HTML FORMAT)
// ======================================================
function populateResidentialBOQ(system, materials, costs) {
    const resDocDate = document.getElementById("resDocDate");
    if (resDocDate) resDocDate.textContent = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    const tbody = document.getElementById("resBoqTableBody");
    if (tbody) {
        tbody.innerHTML = "";
        materials.forEach((item, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td style="color:#555555; font-weight:700;">${index + 1}</td>
                <td><strong>${item.description}</strong></td>
                <td style="text-align:center; color:#555555;">${item.unit}</td>
                <td style="text-align:center; font-weight:700;">${item.quantity}</td>
                <td style="text-align:right; font-family:monospace;">${formatNaira(item.unitPrice)}</td>
                <td style="text-align:right; font-weight:700; color:#0A3C82; font-family:monospace;">${formatNaira(item.totalPrice)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    const resCostEquipment = document.getElementById("resCostEquipment");
    if (resCostEquipment) resCostEquipment.textContent = formatNaira(costs.materialCost);

    const resCostTransport = document.getElementById("resCostTransport");
    if (resCostTransport) resCostTransport.textContent = formatNaira(costs.transportCost);

    const resCostLabour = document.getElementById("resCostLabour");
    if (resCostLabour) resCostLabour.textContent = formatNaira(costs.labourCost + costs.installationCost);

    const resCostGrand = document.getElementById("resCostGrand");
    if (resCostGrand) resCostGrand.textContent = formatNaira(costs.grandTotal);
}

// ======================================================
// PRINT-UP MODAL CONTROLLER
// ======================================================
function openPrintUpModal(initialTab = "quotation") {
    printUpModal.classList.add("open");
    switchTab(initialTab);
    initIcons();
}

function closePrintUpModal() {
    printUpModal.classList.remove("open");
}

function switchTab(tab) {
    if (tab === "quotation") {
        if (tabQuotationBtn) tabQuotationBtn.classList.add("active");
        if (tabBOQBtn) tabBOQBtn.classList.remove("active");
        if (quotationView) quotationView.classList.add("active");
        if (boqView) boqView.classList.remove("active");
    } else {
        if (tabBOQBtn) tabBOQBtn.classList.add("active");
        if (tabQuotationBtn) tabQuotationBtn.classList.remove("active");
        if (boqView) boqView.classList.add("active");
        if (quotationView) quotationView.classList.remove("active");
    }
}

// ======================================================
// EVENT LISTENERS
// ======================================================
function initEventListeners() {
    // Form Submit => ⚡ Compute Design
    if (designForm) {
        designForm.addEventListener("submit", (e) => {
            e.preventDefault();
            runComputation(true);
        });
    }

    // Reset button
    if (btnReset) {
        btnReset.addEventListener("click", () => {
            setTimeout(() => {
                applyPreset("res3bed");
            }, 50);
        });
    }

    // Direct Action & Modal Buttons
    if (btnQuotation) {
        btnQuotation.addEventListener("click", () => {
            runComputation(true);
            openPrintUpModal("quotation");
        });
    }

    if (btnBOQ) {
        btnBOQ.addEventListener("click", () => {
            runComputation(true);
            openPrintUpModal("boq");
        });
    }

    if (sidebarOpenQuotation) {
        sidebarOpenQuotation.addEventListener("click", () => {
            runComputation(true);
            openPrintUpModal("quotation");
        });
    }

    if (sidebarOpenBOQ) {
        sidebarOpenBOQ.addEventListener("click", () => {
            runComputation(true);
            openPrintUpModal("boq");
        });
    }

    if (btnPrint) {
        btnPrint.addEventListener("click", () => {
            runComputation(true);
            openPrintUpModal("quotation");
            setTimeout(() => window.print(), 350);
        });
    }

    if (btnPDF) {
        btnPDF.addEventListener("click", () => {
            runComputation(true);
            openPrintUpModal("quotation");
            setTimeout(() => window.print(), 350);
        });
    }

    if (sheetPrintBtn) {
        sheetPrintBtn.addEventListener("click", () => window.print());
    }

    if (sheetPdfBtn) {
        sheetPdfBtn.addEventListener("click", () => window.print());
    }

    // Tabs inside modal
    if (tabQuotationBtn) {
        tabQuotationBtn.addEventListener("click", () => switchTab("quotation"));
    }

    if (tabBOQBtn) {
        tabBOQBtn.addEventListener("click", () => switchTab("boq"));
    }

    // Modal close controls
    if (sheetCloseBtn) {
        sheetCloseBtn.addEventListener("click", closePrintUpModal);
    }

    if (sheetBackBtn) {
        sheetBackBtn.addEventListener("click", closePrintUpModal);
    }

    if (printUpModal) {
        printUpModal.addEventListener("click", (e) => {
            if (e.target === printUpModal) closePrintUpModal();
        });
    }

    // Dismiss mail alert banner
    if (btnDismissMailAlert) {
        btnDismissMailAlert.addEventListener("click", () => {
            mailAlertStrip.classList.remove("show");
        });
    }
}

// ======================================================
// FORMATTER UTILITY
// ======================================================
function formatNaira(amount) {
    return "₦" + Number(amount || 0).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
