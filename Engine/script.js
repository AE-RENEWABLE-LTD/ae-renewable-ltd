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
    const comsumption = (load / 0.8) ;
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
    const inverterChoose =( batteryWh / psh) + comsumption

    // panel numbers
     const panelsNumber =(( batteryWh / psh) + comsumption) / panelW




    alert(
`SYSTEM RESULT

Load Power:
${load} W

Backup:
${backup} Hours

Daily Energy:
${GeneratedailyEnergy.toLocaleString()} Wh

Battery Requirement:
${batteryWh.toLocaleString()} Wh

panel Number:
${panelsNumber.toLocaleString()} Wh

 Solar Sizing:
${inverterChoose.toLocaleString()} pv W`
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

document.querySelectorAll(".secondary-btn")[1].addEventListener("click", () => {

    alert(
        "Quotation Generator will be connected here."
    );

});