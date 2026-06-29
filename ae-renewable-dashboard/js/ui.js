
/* ==========================================
   AE RENEWABLE UI CONTROLLER
========================================== */

/*
|--------------------------------------------------------------------------
| DOM ELEMENTS
|--------------------------------------------------------------------------
*/

const loadInput =
document.getElementById("loadKw");

const solarInput =
document.getElementById("solarWatt");

const backupInput =
document.getElementById("backupHours");

const panelInput =
document.getElementById("panelUnitWatt");

const calculateBtn =
document.getElementById("calculateBtn");

const resetBtn =
document.getElementById("resetBtn");

const quoteBtn =
document.getElementById("generateQuoteBtn");

const resultsGrid =
document.getElementById("resultsGrid");

const errorOutput =
document.getElementById("errorOutput");

/*
|--------------------------------------------------------------------------
| DASHBOARD CARDS
|--------------------------------------------------------------------------
*/

const loadDisplay =
document.getElementById("loadDisplay");

const solarDisplay =
document.getElementById("solarDisplay");

const batteryDisplay =
document.getElementById("batteryDisplay");

const costDisplay =
document.getElementById("costDisplay");

/*
|--------------------------------------------------------------------------
| APPLICATION STATE
|--------------------------------------------------------------------------
*/

let currentSystem = null;

/*
|--------------------------------------------------------------------------
| INITIALIZE
|--------------------------------------------------------------------------
*/

document.addEventListener(
    "DOMContentLoaded",
    init
);

function init() {

    calculateBtn.addEventListener(
        "click",
        runSizing
    );

    resetBtn.addEventListener(
        "click",
        resetForm
    );

    quoteBtn.addEventListener(
        "click",
        generateCustomerQuotation
    );

}

/*
|--------------------------------------------------------------------------
| VALIDATION
|--------------------------------------------------------------------------
*/

function validateInputs() {

    const loadKW =
    Number(loadInput.value);

    const solarW =
    Number(solarInput.value);

    const backupHours =
    Number(backupInput.value);

    if(!loadKW){

        showError(
            "Enter load requirement."
        );

        return false;

    }

    if(!solarW){

        showError(
            "Enter solar watt target."
        );

        return false;

    }

    if(!backupHours){

        showError(
            "Enter backup hours."
        );

        return false;

    }

    hideError();

    return true;

}

/*
|--------------------------------------------------------------------------
| RUN SIZING
|--------------------------------------------------------------------------
*/

function runSizing() {

    if(
        !validateInputs()
    ) return;

    const loadKW =
    Number(loadInput.value);

    const solarTarget =
    Number(solarInput.value);

    const backupHours =
    Number(backupInput.value);

    const panelWatt =
    Number(panelInput.value);

    currentSystem =
    designSystem(
        loadKW,
        backupHours,
        solarTarget,
        panelWatt
    );

    renderResults(
        currentSystem
    );

    updateDashboardCards(
        currentSystem
    );

}

/*
|--------------------------------------------------------------------------
| RESULTS
|--------------------------------------------------------------------------
*/

function renderResults(
    system
) {

    resultsGrid.innerHTML =

    `

    <div class="result-card">

        <div class="result-card-header">

            <h3>
                Recommended Inverter
            </h3>

        </div>

        <div class="result-card-body">

            <p>
                <strong>Brand:</strong>
                ${system.inverter.inverter.brand}
            </p>

            <p>
                <strong>Model:</strong>
                ${system.inverter.inverter.model}
            </p>

            <p>
                <strong>Quantity:</strong>
                ${system.inverter.quantity}
            </p>

            <p>
                <strong>Total Capacity:</strong>
                ${system.inverter.totalKVA} kVA
            </p>

        </div>

    </div>

    <div class="result-card">

        <div class="result-card-header">

            <h3>
                Battery Bank
            </h3>

        </div>

        <div class="result-card-body">

            <p>
                <strong>Brand:</strong>
                ${system.battery.brand}
            </p>

            <p>
                <strong>Model:</strong>
                ${system.battery.model}
            </p>

            <p>
                <strong>Capacity:</strong>
                ${system.battery.kwh} kWh
            </p>

            <p>
                <strong>Chemistry:</strong>
                ${system.battery.chemistry}
            </p>

        </div>

    </div>

    <div class="result-card">

        <div class="result-card-header">

            <h3>
                Solar Array
            </h3>

        </div>

        <div class="result-card-body">

            <p>
                <strong>Panel Size:</strong>
                ${system.solar.panelWatt}W
            </p>

            <p>
                <strong>Panel Qty:</strong>
                ${system.solar.quantity}
            </p>

            <p>
                <strong>Total Array:</strong>
                ${system.solar.totalWatt}W
            </p>

        </div>

    </div>

    `;

}

/*
|--------------------------------------------------------------------------
| UPDATE DASHBOARD
|--------------------------------------------------------------------------
*/

function updateDashboardCards(
    system
) {

    loadDisplay.textContent =
    `${system.loadKW} kW`;

    solarDisplay.textContent =
    `${system.solar.totalWatt} W`;

    batteryDisplay.textContent =
    `${system.battery.kwh} kWh`;

    const quote =
    generateQuotation(system);

    costDisplay.textContent =
    formatMoney(
        quote.grandTotal
    );

}

/*
|--------------------------------------------------------------------------
| QUOTATION
|--------------------------------------------------------------------------
*/

function generateCustomerQuotation() {

    if(!currentSystem){

        alert(
            "Calculate a system first."
        );

        return;

    }

    const customer = {

        name:
        prompt(
            "Customer Name"
        ) || "Customer",

        phone:
        prompt(
            "Phone Number"
        ) || "-",

        location:
        prompt(
            "Location"
        ) || "-"

    };

    renderQuotation(
        customer,
        currentSystem
    );

    document
    .getElementById(
        "quotationContainer"
    )
    .scrollIntoView({
        behavior:"smooth"
    });

}

/*
|--------------------------------------------------------------------------
| RESET
|--------------------------------------------------------------------------
*/

function resetForm() {

    loadInput.value = "";

    solarInput.value = "";

    backupInput.value = "";

    panelInput.value = "650";

    resultsGrid.innerHTML = "";

    document
    .getElementById(
        "quotationContainer"
    ).innerHTML = "";

    loadDisplay.textContent =
    "0 kW";

    solarDisplay.textContent =
    "0 W";

    batteryDisplay.textContent =
    "0 kWh";

    costDisplay.textContent =
    "₦0";

    currentSystem = null;

    hideError();

}

/*
|--------------------------------------------------------------------------
| ERROR HANDLING
|--------------------------------------------------------------------------
*/

function showError(
    message
) {

    errorOutput.style.display =
    "block";

    errorOutput.textContent =
    message;

}

function hideError() {

    errorOutput.style.display =
    "none";

}

/*
|--------------------------------------------------------------------------
| PRINT SUPPORT
|--------------------------------------------------------------------------
*/

function printCurrentQuotation() {

    printQuotation();

}

