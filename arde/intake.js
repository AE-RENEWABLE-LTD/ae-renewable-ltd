/**
 * AE RENEWABLE LTD — ARDE V1.0
 * CLIENT INTAKE & PRE-STUDIO NOTEPAD CONTROLLER
 * intake.js
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    // State
    const state = {
        gridReliability: "Band B (16-20h/day)",
        batteryType: "lithium",
        loadWatts: 0,
        appliances: {}
    };

    // DOM Elements - Sections
    const sectionCard1 = document.getElementById("sectionCard1");
    const sectionCard2 = document.getElementById("sectionCard2");
    const sectionCard3 = document.getElementById("sectionCard3");
    const card3ErrorBanner = document.getElementById("card3ErrorBanner");

    // Inputs - Card 3 (Client)
    const custFullName = document.getElementById("custFullName");
    const custCompany = document.getElementById("custCompany");
    const custEmail = document.getElementById("custEmail");
    const custPhone = document.getElementById("custPhone");
    const custPropertyType = document.getElementById("custPropertyType");
    const custAddress = document.getElementById("custAddress");
    const custCity = document.getElementById("custCity");
    const custState = document.getElementById("custState");

    // Inputs - Card 2 (Site Survey)
    const generatorKva = document.getElementById("generatorKva");
    const existingInverter = document.getElementById("existingInverter");
    const siteNotes = document.getElementById("siteNotes");

    // Inputs - Card 1 (Energy Profiling)
    const generalNotes = document.getElementById("generalNotes");
    const applianceTotalBadge = document.getElementById("applianceTotalBadge");
    const applianceItems = document.querySelectorAll(".appliance-item");

    // Action button
    const btnProceed = document.getElementById("btnProceed");

    // Launch Overlay & Modals
    const studioLaunchOverlay = document.getElementById("studioLaunchOverlay");
    const siteSurveyModal = document.getElementById("siteSurveyModal");
    const btnCloseSiteModal = document.getElementById("btnCloseSiteModal");
    const energyInquiryModal = document.getElementById("energyInquiryModal");
    const btnCloseEnergyModal = document.getElementById("btnCloseEnergyModal");

    function showLaunchOverlay(show) {
        if (!studioLaunchOverlay) return;
        if (show) {
            studioLaunchOverlay.classList.add("active");
        } else {
            studioLaunchOverlay.classList.remove("active");
        }
    }

    // Toast
    const toast = document.getElementById("toast");

    function showToast(msg, type = "info") {
        if (!toast) return;
        toast.textContent = msg;
        toast.className = `toast active ${type}`;
        setTimeout(() => {
            toast.className = "toast";
        }, 4000);
    }

    // 1. APPLIANCE STEPPERS & LOAD CALCULATION
    function calculateApplianceTotal() {
        let total = 0;
        applianceItems.forEach(item => {
            const watts = Number(item.dataset.watts) || 0;
            const qty = Number(item.querySelector(".step-qty")?.textContent) || 0;
            const name = item.dataset.name || "Appliance";
            if (qty > 0) {
                total += (watts * qty);
                state.appliances[name] = qty;
            } else {
                delete state.appliances[name];
            }
        });
        state.loadWatts = total;
        if (applianceTotalBadge) {
            applianceTotalBadge.textContent = `${total.toLocaleString()} W (${(total / 1000).toFixed(2)} kW)`;
        }
        return total;
    }

    applianceItems.forEach(item => {
        const btnMinus = item.querySelector(".btn-step-minus");
        const btnPlus = item.querySelector(".btn-step-plus");
        const qtyDisplay = item.querySelector(".step-qty");

        if (btnPlus && qtyDisplay) {
            btnPlus.addEventListener("click", () => {
                let val = Number(qtyDisplay.textContent) || 0;
                val++;
                qtyDisplay.textContent = val;
                calculateApplianceTotal();
            });
        }

        if (btnMinus && qtyDisplay) {
            btnMinus.addEventListener("click", () => {
                let val = Number(qtyDisplay.textContent) || 0;
                if (val > 0) val--;
                qtyDisplay.textContent = val;
                calculateApplianceTotal();
            });
        }
    });

    // 2. CHIP SELECTORS (Grid Tier & Battery Chemistry)
    function setupChipGroup(selector, stateKey) {
        const chips = document.querySelectorAll(selector);
        chips.forEach(chip => {
            chip.addEventListener("click", () => {
                chips.forEach(c => c.classList.remove("active"));
                chip.classList.add("active");
                state[stateKey] = chip.dataset.value || chip.innerText.trim();
            });
        });
    }

    setupChipGroup(".chip-grid-tier", "gridReliability");
    setupChipGroup(".chip-battery", "batteryType");

    // 3. CLEAR RED FLAGGING ON CARD 3 AS USER TYPES
    const card3Inputs = [custFullName, custEmail, custPhone, custAddress, custCity, custCompany];
    card3Inputs.forEach(input => {
        if (input) {
            input.addEventListener("input", () => {
                if (sectionCard3 && sectionCard3.classList.contains("card-flag-red")) {
                    sectionCard3.classList.remove("card-flag-red");
                }
            });
        }
    });

    // 4. PROCEED BUTTON HANDLER
    if (btnProceed) {
        btnProceed.addEventListener("click", handleProceed);
    }

    async function handleProceed(e) {
        if (e) e.preventDefault();

        // Check Card 3 (Client)
        const fullName = custFullName?.value.trim() || "";
        const email = custEmail?.value.trim() || "";
        const phone = custPhone?.value.trim() || "";
        const address = custAddress?.value.trim() || "";
        const city = custCity?.value.trim() || "Abuja";
        const stateVal = custState?.value || "FCT";
        const companyName = custCompany?.value.trim() || null;
        const propertyType = custPropertyType?.value || "Residential";

        const isClientFilled = Boolean(fullName && email && phone && address);

        // Check Card 2 (Site Survey)
        const genKva = generatorKva?.value.trim() ? Number(generatorKva.value) : null;
        const invType = existingInverter?.value || "None";
        const physicalNotes = siteNotes?.value.trim() || null;
        const isSiteTouched = Boolean(genKva || physicalNotes || (invType && invType !== "None"));

        // Check Card 1 (Energy Profiling)
        const totalWatts = calculateApplianceTotal();
        const engNotes = generalNotes?.value.trim() || null;
        const hasAppliances = Object.keys(state.appliances).length > 0;
        const isEnergyTouched = Boolean(hasAppliances || engNotes || totalWatts > 0);

        // SCENARIO 1: Empty or User clicked proceed without doing anything on Card 3 and didn't touch Card 1 or 2
        if (!isClientFilled && !isSiteTouched && !isEnergyTouched) {
            flagCard3Red();
            return;
        }

        // SCENARIO 2: Client chose ONLY 2. Site Survey & Infrastructure Assessment
        if (isSiteTouched && !isClientFilled && !isEnergyTouched) {
            await submitSiteSurveyOnly({
                gridReliability: state.gridReliability,
                generatorKva: genKva,
                existingInverter: invType,
                siteNotes: physicalNotes
            });
            return;
        }

        // SCENARIO 3: Client chose ONLY 1. Energy Profiling & Sizing Targets
        if (isEnergyTouched && !isClientFilled && !isSiteTouched) {
            await submitEnergyProfileOnly({
                loadWatts: totalWatts > 0 ? totalWatts : 5000,
                appliances: Object.keys(state.appliances).map(k => `${k} x ${state.appliances[k]}`),
                batteryType: state.batteryType,
                generalNotes: engNotes
            });
            return;
        }

        // If client attempted partial client info but missed required fields (*), flag Card 3
        if (!isClientFilled) {
            flagCard3Red();
            return;
        }

        // SCENARIO 4: Client chose ONLY 3. Client & Contact Profiling
        const isOnlyClient = isClientFilled && !isSiteTouched && !isEnergyTouched;
        const scenario = isOnlyClient ? "client_only" : "full";

        // SCENARIO 5: Full assessment (All 3 cards or Client + other sections)
        await submitFullOrClientProfile({
            fullName,
            companyName,
            email,
            phone,
            address,
            city,
            stateVal,
            propertyType,
            genKva,
            invType,
            physicalNotes,
            totalWatts,
            engNotes,
            scenario
        });
    }

    // Flag Section 3 Red helper
    function flagCard3Red() {
        if (sectionCard3) {
            sectionCard3.classList.add("card-flag-red");
            sectionCard3.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        if (custFullName) {
            setTimeout(() => custFullName.focus(), 400);
        }
        showToast("Please complete Section 3 (Client & Contact Profiling) to proceed", "error");
    }

    // SUBMIT: Site Survey Only
    async function submitSiteSurveyOnly(siteData) {
        setBtnLoading(true);
        try {
            const payload = {
                intakeScenario: "site_only",
                client: {
                    fullName: "Site Survey Visitor Lead",
                    email: `site-lead-${Date.now()}@aerenewable.com`,
                    phone: "+234 813 361 5132",
                    address: "Physical Site Assessment",
                    city: "Abuja",
                    state: "FCT",
                    propertyType: "Residential"
                },
                site: siteData,
                loadProfile: {
                    loadWatts: 5000,
                    batteryType: state.batteryType
                }
            };

            const res = await fetch("/api/engineering/client-intake", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (siteSurveyModal) {
                siteSurveyModal.classList.add("active");
            }
        } catch (err) {
            showToast("Error: " + err.message, "error");
        } finally {
            setBtnLoading(false);
        }
    }

    // SUBMIT: Energy Profile Only
    async function submitEnergyProfileOnly(energyData) {
        setBtnLoading(true);
        try {
            const payload = {
                intakeScenario: "energy_only",
                client: {
                    fullName: "Energy Profiling Visitor Lead",
                    email: `energy-lead-${Date.now()}@aerenewable.com`,
                    phone: "+234 813 361 5132",
                    address: "Energy Profiling Inquiry",
                    city: "Abuja",
                    state: "FCT",
                    propertyType: "Residential"
                },
                site: {
                    gridReliability: state.gridReliability,
                    existingInverter: "None"
                },
                loadProfile: energyData
            };

            const res = await fetch("/api/engineering/client-intake", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (energyInquiryModal) {
                energyInquiryModal.classList.add("active");
            }
        } catch (err) {
            showToast("Error: " + err.message, "error");
        } finally {
            setBtnLoading(false);
        }
    }

    // SUBMIT: Client Only or Full Profile
    async function submitFullOrClientProfile(params) {
        setBtnLoading(true);
        showLaunchOverlay(true);
        try {
            const payload = {
                intakeScenario: params.scenario,
                client: {
                    fullName: params.fullName,
                    companyName: params.companyName,
                    email: params.email,
                    phone: params.phone,
                    address: params.address,
                    city: params.city,
                    state: params.stateVal,
                    propertyType: params.propertyType
                },
                site: {
                    gridReliability: state.gridReliability,
                    generatorKva: params.genKva,
                    existingInverter: params.invType,
                    siteNotes: params.physicalNotes
                },
                loadProfile: {
                    loadWatts: params.totalWatts > 0 ? params.totalWatts : 6000,
                    backupHours: 8,
                    batteryType: state.batteryType,
                    appliances: Object.keys(state.appliances).map(k => `${k} x ${state.appliances[k]}`),
                    generalNotes: params.engNotes
                }
            };

            const res = await fetch("/api/engineering/client-intake", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (!res.ok || !result.success) {
                showLaunchOverlay(false);
                throw new Error(result.message || "Failed to create client assessment");
            }

            const data = result.data;
            try {
                localStorage.setItem("ae_active_client", JSON.stringify({
                    fullName: params.fullName || (data.client?.contact_name || "Client"),
                    projectCode: data.project?.project_code || `PRJ-${Date.now().toString().slice(-6)}`,
                    propertyType: params.propertyType || "Residential",
                    email: params.email || (data.client?.email || ""),
                    phone: params.phone || (data.client?.phone || ""),
                    address: params.address || (data.client?.address || "Abuja, FCT")
                }));
            } catch (e) {
                console.warn(e);
            }

            // Immediate transition to ARDE Studio without showing any modals or credentials in-between
            if (data.studioUrl) {
                window.location.href = data.studioUrl;
            } else {
                window.location.href = "/arde/studio";
            }

        } catch (err) {
            showLaunchOverlay(false);
            showToast("Error: " + err.message, "error");
        } finally {
            setBtnLoading(false);
        }
    }

    function setBtnLoading(isLoading) {
        if (!btnProceed) return;
        btnProceed.disabled = isLoading;
        btnProceed.innerHTML = isLoading 
            ? `<span>⏳ Launching ARDE Studio...</span>` 
            : `<span>Proceed →</span>`;
    }

    // Open Section 3 for client contact profiling
    function openSection3Profiling() {
        if (siteSurveyModal) siteSurveyModal.classList.remove("active");
        if (energyInquiryModal) energyInquiryModal.classList.remove("active");
        if (sectionCard3) {
            sectionCard3.classList.remove("card-flag-red");
            sectionCard3.classList.add("card-highlight-active");
            sectionCard3.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if (custFullName) {
            setTimeout(() => {
                custFullName.focus();
                showToast("Please enter your contact details to complete profiling.", "info");
            }, 350);
        }
    }
    window.openSection3Profiling = openSection3Profiling;

    const btnOpenSection3FromSite = document.getElementById("btnOpenSection3FromSite");
    if (btnOpenSection3FromSite) {
        btnOpenSection3FromSite.addEventListener("click", openSection3Profiling);
    }
    const btnOpenSection3FromEnergy = document.getElementById("btnOpenSection3FromEnergy");
    if (btnOpenSection3FromEnergy) {
        btnOpenSection3FromEnergy.addEventListener("click", openSection3Profiling);
    }

    // Modal Close Listeners
    if (btnCloseSiteModal) {
        btnCloseSiteModal.addEventListener("click", () => {
            if (siteSurveyModal) siteSurveyModal.classList.remove("active");
        });
    }

    if (btnCloseEnergyModal) {
        btnCloseEnergyModal.addEventListener("click", () => {
            if (energyInquiryModal) energyInquiryModal.classList.remove("active");
        });
    }

    // Modal backdrop click to close
    [siteSurveyModal, energyInquiryModal].forEach(m => {
        if (m) {
            m.addEventListener("click", (e) => {
                if (e.target === m) m.classList.remove("active");
            });
        }
    });
});
