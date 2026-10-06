"use strict";

/**
 * AE RENEWABLE NETWORK — ARDE CONTROLLER
 * Sizing calculations, appliance lists, BoQ rendering, and submission to Admin.
 */

let lastCalculation = null;

const PRESETS = {
    res3bed: [
        { name: "Inverter AC (1.5 HP)", watts: 1100, qty: 1, hours: 6 },
        { name: "Inverter Refrigerator", watts: 180, qty: 1, hours: 24 },
        { name: "LED Smart TV (55 inch)", watts: 120, qty: 2, hours: 8 },
        { name: "LED Lighting Network", watts: 15, qty: 15, hours: 8 },
        { name: "Ceiling Fans", watts: 65, qty: 4, hours: 10 },
        { name: "WiFi Router & Decoder", watts: 30, qty: 2, hours: 24 }
    ],
    villa: [
        { name: "Inverter AC (2.0 HP)", watts: 1600, qty: 3, hours: 8 },
        { name: "Deep Freezer & Fridge", watts: 300, qty: 2, hours: 24 },
        { name: "Borehole Water Pump (1 HP)", watts: 750, qty: 1, hours: 2 },
        { name: "OLED TVs & Sound System", watts: 250, qty: 3, hours: 8 },
        { name: "Perimeter Security Lighting", watts: 30, qty: 10, hours: 12 },
        { name: "Home Automation & CCTV", watts: 120, qty: 1, hours: 24 },
        { name: "Ceiling Fans", watts: 65, qty: 6, hours: 10 }
    ],
    commercial: [
        { name: "Commercial Inverter AC (3 HP)", watts: 2400, qty: 3, hours: 9 },
        { name: "Server Rack & Network Core", watts: 650, qty: 1, hours: 24 },
        { name: "Desktop Workstations", watts: 200, qty: 8, hours: 9 },
        { name: "Commercial LED Lighting", watts: 36, qty: 30, hours: 10 },
        { name: "Printers & Photocopy", watts: 450, qty: 2, hours: 4 },
        { name: "Security & CCTV System", watts: 250, qty: 1, hours: 24 }
    ],
    custom: [
        { name: "Appliance 1", watts: 500, qty: 1, hours: 6 }
    ]
};

function renderApplianceTable(appliances) {
    const tbody = document.getElementById("applianceListBody");
    tbody.innerHTML = "";

    appliances.forEach((item, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <input type="text" class="app-name" value="${item.name}" placeholder="Appliance Name" onchange="updateConnectedWatts()">
            </td>
            <td>
                <input type="number" class="app-watts" value="${item.watts}" min="1" step="1" onchange="updateConnectedWatts()">
            </td>
            <td>
                <input type="number" class="app-qty" value="${item.qty}" min="1" step="1" onchange="updateConnectedWatts()">
            </td>
            <td>
                <input type="number" class="app-hours" value="${item.hours}" min="1" max="24" step="0.5" onchange="updateConnectedWatts()">
            </td>
            <td style="text-align: center;">
                <button class="btn-remove-row" onclick="removeApplianceRow(${index})" title="Remove">✕</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updateConnectedWatts();
}

function getAppliancesFromDOM() {
    const rows = document.querySelectorAll("#applianceListBody tr");
    const list = [];
    rows.forEach(tr => {
        const name = tr.querySelector(".app-name").value.trim();
        const watts = Number(tr.querySelector(".app-watts").value || 0);
        const qty = Number(tr.querySelector(".app-qty").value || 1);
        const hours = Number(tr.querySelector(".app-hours").value || 0);
        if (watts > 0) {
            list.push({ name, watts, qty, hours });
        }
    });
    return list;
}

function updateConnectedWatts() {
    const apps = getAppliancesFromDOM();
    const totalWatts = apps.reduce((acc, curr) => acc + (curr.watts * curr.qty), 0);
    document.getElementById("displayConnectedWatts").textContent = `${totalWatts.toLocaleString()} W (${(totalWatts / 1000).toFixed(2)} kW)`;
}

function addApplianceRow() {
    const tbody = document.getElementById("applianceListBody");
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td><input type="text" class="app-name" placeholder="New Appliance" onchange="updateConnectedWatts()"></td>
        <td><input type="number" class="app-watts" value="100" min="1" step="1" onchange="updateConnectedWatts()"></td>
        <td><input type="number" class="app-qty" value="1" min="1" step="1" onchange="updateConnectedWatts()"></td>
        <td><input type="number" class="app-hours" value="6" min="1" max="24" step="0.5" onchange="updateConnectedWatts()"></td>
        <td style="text-align: center;"><button class="btn-remove-row" onclick="this.closest('tr').remove(); updateConnectedWatts();">✕</button></td>
    `;
    tbody.appendChild(tr);
    updateConnectedWatts();
}

function removeApplianceRow(index) {
    const apps = getAppliancesFromDOM();
    apps.splice(index, 1);
    renderApplianceTable(apps);
}

function applyPreset(key) {
    document.querySelectorAll(".preset-chip").forEach(c => c.classList.remove("active"));
    const chips = Array.from(document.querySelectorAll(".preset-chip"));
    const clicked = chips.find(c => c.getAttribute("onclick")?.includes(key));
    if (clicked) clicked.classList.add("active");

    const preset = PRESETS[key] || PRESETS.custom;
    renderApplianceTable(preset);
}

// -------------------------------------------------------------
// RUN ENGINEERING CALCULATION VIA BACKEND API
// -------------------------------------------------------------
async function runEngineeringCalculation() {
    const btn = document.getElementById("btnCalculate");
    btn.disabled = true;
    btn.textContent = "Calculating Engineering Sizing...";

    const appliances = getAppliancesFromDOM();
    const psh = Number(document.getElementById("paramPsh").value || 4.8);
    const voltage = Number(document.getElementById("paramVoltage").value || 48);
    const autonomy = Number(document.getElementById("paramAutonomy").value || 1.0);
    const panelWattage = Number(document.getElementById("paramPanelWattage").value || 550);

    const payload = {
        appliances,
        panelWattage,
        assumptions: {
            peakSunHours: psh,
            systemVoltage: voltage,
            autonomyDays: autonomy
        }
    };

    try {
        const response = await fetch("/api/engineering/calculate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Failed to calculate sizing");
        }

        const data = await response.json();
        lastCalculation = data;

        // Render Telemetry
        const eng = data.engineering;
        document.getElementById("resDailyKwh").innerHTML = `${eng.dailyEnergyKwh} <small style="font-size: 0.9rem;">kWh/day</small>`;
        document.getElementById("resPeakLoad").textContent = `Peak Continuous: ${eng.continuousPeakWatts.toLocaleString()} W`;

        document.getElementById("resInverterKw").innerHTML = `${eng.requiredInverterKw} <small style="font-size: 0.9rem;">kW (${eng.requiredInverterKva} kVA)</small>`;
        document.getElementById("resInverterModel").textContent = eng.selectedInverter ? `${eng.selectedInverter.name}` : "Standard Hybrid Inverter";

        document.getElementById("resPvKw").innerHTML = `${eng.pvCapacityKw} <small style="font-size: 0.9rem;">kWp</small>`;
        document.getElementById("resPanelCount").textContent = `${eng.panelCount} × ${eng.panelWattage}W Tier-1 Panels`;

        document.getElementById("resBatteryKwh").innerHTML = `${eng.batteryCapacityKwh} <small style="font-size: 0.9rem;">kWh</small>`;
        document.getElementById("resBatteryUnits").textContent = `${eng.batteryUnits} × LiFePO4 Battery Unit(s)`;

        // Render BOQ
        const boqTbody = document.getElementById("boqTableBody");
        boqTbody.innerHTML = "";
        data.boqItems.forEach(item => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${item.item_name}</strong><br><small style="color: var(--text-muted);">${item.category}</small></td>
                <td>${item.quantity} ${item.unit}</td>
                <td>₦${item.unit_price.toLocaleString()}</td>
                <td><strong>₦${item.total_price.toLocaleString()}</strong></td>
            `;
            boqTbody.appendChild(tr);
        });

        // Render Commercial
        const comm = data.commercial;
        document.getElementById("resEquipSubtotal").textContent = `₦${comm.subtotalEquipment.toLocaleString()}`;
        document.getElementById("resLabour").textContent = `₦${comm.installationLabour.toLocaleString()}`;
        document.getElementById("resLogistics").textContent = `₦${(comm.transportCost + comm.engineeringFee).toLocaleString()}`;
        document.getElementById("resVat").textContent = `₦${comm.vatAmount.toLocaleString()}`;
        document.getElementById("resFinalAmount").textContent = `₦${comm.finalQuotationAmount.toLocaleString()}`;

        // Enable Submit Button
        document.getElementById("btnSubmitProject").disabled = false;

    } catch (err) {
        alert("Calculation error: " + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "⚡ Calculate System & Generate Sizing";
    }
}

// -------------------------------------------------------------
// SUBMIT TO ADMIN (ARDE -> ADMIN WORKFLOW)
// -------------------------------------------------------------
async function submitToAdmin() {
    if (!lastCalculation) {
        alert("Please calculate the system sizing first.");
        return;
    }

    const fullName = document.getElementById("custName").value.trim();
    const email = document.getElementById("custEmail").value.trim();
    const phone = document.getElementById("custPhone").value.trim();
    const state = document.getElementById("custState").value.trim();

    if (!fullName || !email) {
        alert("Please enter customer name and email address.");
        return;
    }

    const btn = document.getElementById("btnSubmitProject");
    btn.disabled = true;
    btn.textContent = "Finalizing Project & Quotation in Database...";

    const payload = {
        customer: {
            fullName,
            email,
            phone,
            address: state,
            state: state.includes("Abuja") ? "FCT" : "Lagos",
            city: state.split(",")[0] || "Abuja"
        },
        engineeringInput: {
            appliances: getAppliancesFromDOM(),
            assumptions: lastCalculation.assumptions
        },
        calculationResult: lastCalculation,
        notes: `Engineered via ARDE Suite for ${fullName}. Sizing: ${lastCalculation.engineering.pvCapacityKw}kW PV, ${lastCalculation.engineering.batteryCapacityKwh}kWh Storage.`
    };

    try {
        const response = await fetch("/api/engineering/submit-project", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || "Failed to submit project");
        }

        const project = result.data.project;
        const quotation = result.data.quotation;

        // Show Modal
        document.getElementById("modalProjectCode").textContent = project.project_code;
        document.getElementById("modalQuotationCode").textContent = quotation.quotation_code;
        document.getElementById("modalProjectValue").textContent = `₦${Number(project.contract_value).toLocaleString()}`;
        document.getElementById("successModal").style.display = "grid";

    } catch (err) {
        alert("Submission failed: " + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "🚀 Create Project & Submit Quotation to Admin";
    }
}

function closeModal() {
    document.getElementById("successModal").style.display = "none";
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    applyPreset("res3bed");
});
