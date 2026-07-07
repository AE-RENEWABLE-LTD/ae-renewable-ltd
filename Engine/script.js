/* ================= RESULT CARD ================= */

const resultCard = document.getElementById("resultCard");

/* ================= SYSTEM SUMMARY ================= */

// const resultLoadPower = document.getElementById("rLoad");
// const resultBackupTime = document.getElementById("rBackup");
// const resultDailyEnergy = document.getElementById("rEnergy");
// const resultBatterySize = document.getElementById("rBattery");
// const resultSolarPV = document.getElementById("rPV");
// const resultPanelCount = document.getElementById("rPanels");
const resultRecommendedInverter = document.getElementById("rInverter") ;
const resultInverterQuantity = document.getElementById("rQty") + "Unit";

/* ================= MATERIAL REQUIREMENT ================= */

// Solar Panel
// const materialPanelQty = document.getElementById("mPanelQty");
const materialPanelPrice = document.getElementById("mPanelPrice").toLocaleString;

// Inverter
const materialInverterQty = document.getElementById("mInvQty") + "Unit";
const materialInverterPrice = document.getElementById("mInvPrice").toLocaleString;

// Battery
const materialBatteryQty = document.getElementById("mBatteryQty");
const materialBatteryPrice = document.getElementById("mBatteryPrice");

// PV Combiner Box
const materialCombinerQty = document.getElementById("mCombinerQty");
const materialCombinerPrice = document.getElementById("mCombinerPrice");

// MC4 Connector
const materialMC4Qty = document.getElementById("mMC4Qty");
const materialMC4Price = document.getElementById("mMC4Price");

// Solar Cable
const materialSolarCableQty = document.getElementById("mSolarCableQty");
const materialSolarCablePrice = document.getElementById("mSolarCablePrice");

// AC Cable
const materialACCableQty = document.getElementById("mACCableQty");
const materialACCablePrice = document.getElementById("mACCablePrice");

// AC Breaker
const materialACBreakerQty = document.getElementById("mACBreakerQty");
const materialACBreakerPrice = document.getElementById("mACBreakerPrice");

// DC Breaker
const materialDCBreakerQty = document.getElementById("mDCBreakerQty");
const materialDCBreakerPrice = document.getElementById("mDCBreakerPrice");

// SPD
const materialSPDQty = document.getElementById("mSPDQty");
const materialSPDPrice = document.getElementById("mSPDPrice");

// Busbar
const materialBusbarQty = document.getElementById("mBusbarQty");
const materialBusbarPrice = document.getElementById("mBusbarPrice");

// Cable Lug
const materialCableLugQty = document.getElementById("mCableLugQty");
const materialCableLugPrice = document.getElementById("mCableLugPrice");

// Flexible Pipe
const materialFlexiblePipeQty = document.getElementById("mFlexQty");
const materialFlexiblePipePrice = document.getElementById("mFlexPrice");

// PVC Pipe
const materialPVCPipeQty = document.getElementById("mPVCQty");
const materialPVCPipePrice = document.getElementById("mPVCPrice");

// Trunking
const materialTrunkingQty = document.getElementById("mTrunkQty");
const materialTrunkingPrice = document.getElementById("mTrunkPrice");

// Screw
const materialScrewQty = document.getElementById("mScrewQty");
const materialScrewPrice = document.getElementById("mScrewPrice");

// Clip
const materialClipQty = document.getElementById("mClipQty");
const materialClipPrice = document.getElementById("mClipPrice");

// Silicone
const materialSiliconeQty = document.getElementById("mSiliconeQty");
const materialSiliconePrice = document.getElementById("mSiliconePrice");

// Peg
const materialPegQty = document.getElementById("mPegQty");
const materialPegPrice = document.getElementById("mPegPrice");

// Bolt & Nut
const materialBoltNutQty = document.getElementById("mBoltQty");
const materialBoltNutPrice = document.getElementById("mBoltPrice");




// =============================
// Percentage Buttons
// =============================

const percentButtons = document.querySelectorAll(".percent");
const batteryInput = document.getElementById("batteryInput");

percentButtons.forEach(button => {

    button.addEventListener("click", () => {

        // Remove active state
        percentButtons.forEach(btn => btn.classList.remove("active"));

        // Add active state
        button.classList.add("active");

        // Update input value
        batteryInput.value = parseInt(button.textContent);

    });

});


// =============================
// Compute Array (Demo)
// =============================

const form = document.getElementById("sizingForm");

form.addEventListener("submit", function (e) {

    e.preventDefault();

    const load = Number(document.getElementById("load").value);
    const backup = Number(document.getElementById("backup").value);
    const psh = Number(document.querySelectorAll("input")[2].value);
    const panelFactor = Number(document.querySelectorAll("input")[3].value);
    const dod = Number(document.querySelectorAll("input")[4].value);
    const losses = Number(document.querySelectorAll("input")[5].value);
    const batteryPercent = Number(batteryInput.value);

    if (!load || load <= 0) {
        alert("Please enter a valid load power.");
        return;
    }

    // Daily energy
    const loadEff = load / losses
    const dailyEnergy = (load * backup) ;
    

    // Battery energy
    const batteryEnergy =
        (dailyEnergy * (batteryPercent / 100)) / dod;

    // Solar Array
    const solarArray =
        (dailyEnergy * panelFactor) 
          // recommended ppanel;

    // batery values
    const batteryWh = batteryEnergy;

    // round up value
    const arrayW = solarArray + batteryWh;

    //  daily energy
    const GeneratedailyEnergy = (batteryEnergy + ((load / losses)  * psh)) ;

    // recommended solar 

    const panelW = 750
    const inverterChoose = (batteryEnergy / psh) + loadEff




   alert(
`SYSTEM RESULT

==============================
SYSTEM SUMMARY
==============================

Load Power:
${load} W

Backup Time:
${backup} Hours

Daily Energy:
${GeneratedailyEnergy.toLocaleString()} Wh

Battery Requirement:
${batteryWh.toLocaleString()} Wh

Recommended Solar Array:
${inverterChoose.toLocaleString()} W

750W Panels:
${document.getElementById("rPanels").textContent}

Recommended Inverter:
${document.getElementById("rInverter").textContent}

Inverter Quantity:
${document.getElementById("rQty").textContent}

==============================
MATERIAL REQUIREMENT
==============================

Solar Panel (750W):
${document.getElementById("mPanelQty").textContent}
Price: ₦${document.getElementById("mPanelPrice").textContent}

Inverter:
${document.getElementById("mInvQty").textContent}
Price: ₦${document.getElementById("mInvPrice").textContent}

Lithium Battery:
${document.getElementById("mBatteryQty").textContent}
Price: ₦${document.getElementById("mBatteryPrice").textContent}

PV Combiner Box:
${document.getElementById("mCombinerQty").textContent}
Price: ₦${document.getElementById("mCombinerPrice").textContent}

MC4 Connector Pair:
${document.getElementById("mMC4Qty").textContent}
Price: ₦${document.getElementById("mMC4Price").textContent}

Solar Cable (6mm²):
${document.getElementById("mSolarCableQty").textContent}
Price: ₦${document.getElementById("mSolarCablePrice").textContent}

AC Cable:
${document.getElementById("mACCableQty").textContent}
Price: ₦${document.getElementById("mACCablePrice").textContent}

AC Breaker:
${document.getElementById("mACBreakerQty").textContent}
Price: ₦${document.getElementById("mACBreakerPrice").textContent}

DC Breaker:
${document.getElementById("mDCBreakerQty").textContent}
Price: ₦${document.getElementById("mDCBreakerPrice").textContent}

SPD:
${document.getElementById("mSPDQty").textContent}
Price: ₦${document.getElementById("mSPDPrice").textContent}

Busbar:
${document.getElementById("mBusbarQty").textContent}
Price: ₦${document.getElementById("mBusbarPrice").textContent}

Cable Lug:
${document.getElementById("mCableLugQty").textContent}
Price: ₦${document.getElementById("mCableLugPrice").textContent}

Flexible Pipe:
${document.getElementById("mFlexQty").textContent}
Price: ₦${document.getElementById("mFlexPrice").textContent}

PVC Pipe:
${document.getElementById("mPVCQty").textContent}
Price: ₦${document.getElementById("mPVCPrice").textContent}

Trunking:
${document.getElementById("mTrunkQty").textContent}
Price: ₦${document.getElementById("mTrunkPrice").textContent}

Screw:
${document.getElementById("mScrewQty").textContent}
Price: ₦${document.getElementById("mScrewPrice").textContent}

Clip:
${document.getElementById("mClipQty").textContent}
Price: ₦${document.getElementById("mClipPrice").textContent}

Silicone:
${document.getElementById("mSiliconeQty").textContent}
Price: ₦${document.getElementById("mSiliconePrice").textContent}

Peg:
${document.getElementById("mPegQty").textContent}
Price: ₦${document.getElementById("mPegPrice").textContent}

Bolt & Nut:
${document.getElementById("mBoltQty").textContent}
Price: ₦${document.getElementById("mBoltPrice").textContent}
`
);

});


// =============================
// Reset Button
// =============================

form.addEventListener("reset", () => {

    setTimeout(() => {

        batteryInput.value = 100;

        percentButtons.forEach(btn =>
            btn.classList.remove("active")
        );

        percentButtons[0].classList.add("active");

    }, 50);

});


// =============================
// Input Animation
// =============================

const inputs = document.querySelectorAll("input");

inputs.forEach(input => {

    input.addEventListener("focus", () => {
        input.parentElement.classList.add("focused");
    });

    input.addEventListener("blur", () => {
        input.parentElement.classList.remove("focused");
    });

});


// =============================
// Future Quotation Button
// =============================

// document.querySelectorAll("showResultBtn")[1].addEventListener("click", () => {

//    alert(
// `SYSTEM RESULT

// ==============================
// SYSTEM SUMMARY
// ==============================

// Load Power:
// ${load} W

// Backup Time:
// ${backup} Hours

// Daily Energy:
// ${GeneratedailyEnergy.toLocaleString()} Wh

// Battery Requirement:
// ${batteryWh.toLocaleString()} Wh

// Recommended Solar Array:
// ${inverterChoose.toLocaleString()} W

// 750W Panels:
// ${document.getElementById("rPanels").textContent}

// Recommended Inverter:
// ${document.getElementById("rInverter").textContent}

// Inverter Quantity:
// ${document.getElementById("rQty").textContent}

// ==============================
// MATERIAL REQUIREMENT
// ==============================

// Solar Panel (750W):
// ${document.getElementById("mPanelQty").textContent}
// Price: ₦${document.getElementById("mPanelPrice").textContent}

// Inverter:
// ${document.getElementById("mInvQty").textContent}
// Price: ₦${document.getElementById("mInvPrice").textContent}

// Lithium Battery:
// ${document.getElementById("mBatteryQty").textContent}
// Price: ₦${document.getElementById("mBatteryPrice").textContent}

// PV Combiner Box:
// ${document.getElementById("mCombinerQty").textContent}
// Price: ₦${document.getElementById("mCombinerPrice").textContent}

// MC4 Connector Pair:
// ${document.getElementById("mMC4Qty").textContent}
// Price: ₦${document.getElementById("mMC4Price").textContent}

// Solar Cable (6mm²):
// ${document.getElementById("mSolarCableQty").textContent}
// Price: ₦${document.getElementById("mSolarCablePrice").textContent}

// AC Cable:
// ${document.getElementById("mACCableQty").textContent}
// Price: ₦${document.getElementById("mACCablePrice").textContent}

// AC Breaker:
// ${document.getElementById("mACBreakerQty").textContent}
// Price: ₦${document.getElementById("mACBreakerPrice").textContent}

// DC Breaker:
// ${document.getElementById("mDCBreakerQty").textContent}
// Price: ₦${document.getElementById("mDCBreakerPrice").textContent}

// SPD:
// ${document.getElementById("mSPDQty").textContent}
// Price: ₦${document.getElementById("mSPDPrice").textContent}

// Busbar:
// ${document.getElementById("mBusbarQty").textContent}
// Price: ₦${document.getElementById("mBusbarPrice").textContent}

// Cable Lug:
// ${document.getElementById("mCableLugQty").textContent}
// Price: ₦${document.getElementById("mCableLugPrice").textContent}

// Flexible Pipe:
// ${document.getElementById("mFlexQty").textContent}
// Price: ₦${document.getElementById("mFlexPrice").textContent}

// PVC Pipe:
// ${document.getElementById("mPVCQty").textContent}
// Price: ₦${document.getElementById("mPVCPrice").textContent}

// Trunking:
// ${document.getElementById("mTrunkQty").textContent}
// Price: ₦${document.getElementById("mTrunkPrice").textContent}

// Screw:
// ${document.getElementById("mScrewQty").textContent}
// Price: ₦${document.getElementById("mScrewPrice").textContent}

// Clip:
// ${document.getElementById("mClipQty").textContent}
// Price: ₦${document.getElementById("mClipPrice").textContent}

// Silicone:
// ${document.getElementById("mSiliconeQty").textContent}
// Price: ₦${document.getElementById("mSiliconePrice").textContent}

// Peg:
// ${document.getElementById("mPegQty").textContent}
// Price: ₦${document.getElementById("mPegPrice").textContent}

// Bolt & Nut:
// ${document.getElementById("mBoltQty").textContent}
// Price: ₦${document.getElementById("mBoltPrice").textContent}
// `
// );

// });





