/**
 * AE RENEWABLE LTD — ARDE V1.0 DESIGN ENGINE
 * Interactive Landing Page Controller
 * landing.js
 */

document.addEventListener("DOMContentLoaded", () => {
    // Sizer Elements
    const loadSlider = document.getElementById("dailyLoadSlider");
    const loadValDisplay = document.getElementById("dailyLoadVal");

    const backupBtns = document.querySelectorAll("[data-backup-hours]");
    const batteryTypeBtns = document.querySelectorAll("[data-battery-type]");

    // Outputs
    const resInverter = document.getElementById("calcInverterSize");
    const resBatteryKwh = document.getElementById("calcBatteryKwh");
    const resBatteryAh = document.getElementById("calcBatteryAh");
    const resSolarKwp = document.getElementById("calcSolarKwp");
    const resPanelCount = document.getElementById("calcPanelCount");
    const resProtection = document.getElementById("calcProtection");

    const launchStudioBtn = document.getElementById("launchStudioWithCalcBtn");

    // State
    let state = {
        loadWatts: 6000,
        backupHours: 8,
        batteryType: "lithium", // lithium (80% DoD) or gel (50% DoD)
        psh: 5.0,
        panelRatingWatts: 550,
        systemVoltage: 48
    };

    function calculateInteractiveModel() {
        // Continuous Load & Inverter Sizing (1.25 safety headroom)
        const inverterWatts = Math.ceil((state.loadWatts * 1.25) / 1000);
        const standardInverterSizes = [3, 5, 8, 10, 12, 15, 20, 30];
        let chosenInverter = standardInverterSizes.find(size => size >= inverterWatts) || inverterWatts;

        // Daily Energy demand for backup window
        const backupKwh = (state.loadWatts * state.backupHours) / 1000;

        // Depth of discharge & battery efficiency
        const dod = state.batteryType === "lithium" ? 0.85 : 0.50;
        const efficiency = state.batteryType === "lithium" ? 0.95 : 0.85;

        // Battery Bank Required (kWh)
        const batteryKwhRequired = Math.round((backupKwh / (dod * efficiency)) * 10) / 10;

        // Amp Hours @ 48V nominal
        const batteryAhRequired = Math.round((batteryKwhRequired * 1000) / state.systemVoltage);

        // Solar PV Sizing (to replenish battery + run day loads)
        // Daily production requirement
        const totalDailyNeedKwh = backupKwh * 1.3; // 1.3 factor for system losses & daytime direct supply
        const pvKwpRequired = Math.round((totalDailyNeedKwh / state.psh) * 10) / 10;

        // Panel Count using 550W Tier-1 Panels
        const totalPvWatts = pvKwpRequired * 1000;
        const panelCount = Math.max(4, Math.ceil(totalPvWatts / state.panelRatingWatts));
        const actualPvKwp = Math.round(((panelCount * state.panelRatingWatts) / 1000) * 10) / 10;

        // Protection sizing
        let dcBreaker = "125A 2P DC";
        if (chosenInverter >= 10) {
            dcBreaker = "250A 2P DC Molded";
        } else if (chosenInverter >= 5) {
            dcBreaker = "160A 2P DC";
        }

        // Render Outputs
        if (resInverter) resInverter.textContent = `${chosenInverter} kVA / kW`;
        if (resBatteryKwh) resBatteryKwh.textContent = `${batteryKwhRequired} kWh`;
        if (resBatteryAh) resBatteryAh.textContent = `${batteryAhRequired} Ah @ 48V`;
        if (resSolarKwp) resSolarKwp.textContent = `${actualPvKwp} kWp`;
        if (resPanelCount) resPanelCount.textContent = `${panelCount}x 550W Panels`;
        if (resProtection) resProtection.textContent = `${dcBreaker} + 600V SPD`;

        // Update Transfer CTA href
        if (launchStudioBtn) {
            launchStudioBtn.href = `/arde/studio?load=${state.loadWatts}&backup=${state.backupHours}&batteryType=${state.batteryType}`;
        }
    }

    // Slider listener
    if (loadSlider && loadValDisplay) {
        loadSlider.addEventListener("input", (e) => {
            state.loadWatts = parseInt(e.target.value, 10);
            loadValDisplay.textContent = `${(state.loadWatts / 1000).toFixed(1)} kW (${state.loadWatts.toLocaleString()} W)`;
            calculateInteractiveModel();
        });
    }

    // Backup Buttons listener
    backupBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            backupBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            state.backupHours = parseFloat(btn.dataset.backupHours);
            calculateInteractiveModel();
        });
    });

    // Battery Type Buttons listener
    batteryTypeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            batteryTypeBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            state.batteryType = btn.dataset.batteryType;
            calculateInteractiveModel();
        });
    });

    // Initial calculation
    calculateInteractiveModel();

    // Mobile Navigation Toggle
    const mobileToggle = document.getElementById("mobileToggle");
    const mobileMenu = document.getElementById("mobileMenuDrawer");
    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener("click", () => {
            mobileMenu.classList.toggle("open");
        });
    }
});
