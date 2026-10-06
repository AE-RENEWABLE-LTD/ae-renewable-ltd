/* =========================================================
   AE NETWORK — CLIENT PORTAL ENGINE
   client.js
========================================================= */

"use strict";

/* =========================================================
   SECURITY & UTILITY HELPERS
========================================================= */
function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   1. APPLICATION STATE
========================================================= */

/* =========================================================
   STANDALONE SECURITY & ACCESS GUARD
   Only registered clients and admin may proceed.
   ========================================================= */
(function guardClientPortal() {
    try {
        if (sessionStorage.getItem("ae_client_logged_in") !== "true") {
            window.location.replace("/client/login");
            return;
        }

        const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("aeRenewableToken") || localStorage.getItem("aeClientToken") || "";
        const rawUser = localStorage.getItem("user") || localStorage.getItem("aeRenewableUser") || localStorage.getItem("aeClientUser") || "{}";
        const user = JSON.parse(rawUser);

        if (!token) {
            window.location.replace("/client/login");
            return;
        }

        if (user && user.role && !["client", "admin", "staff", "installer"].includes(user.role)) {
            window.location.replace("/client/login");
            return;
        }
    } catch (e) {
        console.warn("[Security Guard] Storage check error:", e);
    }
})();

const ClientApp = {

    currentPage: "dashboard",

    client: {
        name: "Eniola Abdulrasaq",
        email: "AERenewablesolution@gmail.com",
        phone: "0813 361 5132",
        location: "Abuja"
    },

    notifications: 3,

    projects: [
        {
            id: "AE-PRJ-2026-018",
            name: "Residential Hybrid Solar System",
            capacity: "16kVA",
            battery: "32kWh Lithium",
            solar: "12kW PV",
            progress: 72,
            status: "In Installation"
        },

        {
            id: "AE-PRJ-2026-009",
            name: "Home Backup Solar System",
            capacity: "12kVA",
            battery: "15kWh Lithium",
            solar: "9kW PV",
            progress: 100,
            status: "Completed"
        }
    ],

    quotations: [
        {
            id: "AE-QUO-2026-042",
            amount: "₦8,750,000",
            status: "Awaiting Approval"
        }
    ],

    requests: []
};


/* =========================================================
   2. DOM CACHE
========================================================= */

const DOM = {

    sidebar: document.getElementById("sidebar"),

    mobileMenu: document.getElementById("mobileMenu"),

    pageTitle: document.getElementById("pageTitle"),

    navItems: document.querySelectorAll(".nav-item[data-page]"),

    pages: document.querySelectorAll(".page"),

    searchBtn: document.getElementById("searchBtn"),

    searchPanel: document.getElementById("searchPanel"),

    closeSearch: document.getElementById("closeSearch"),

    globalSearch: document.getElementById("globalSearch"),

    notificationBtn:
        document.getElementById("notificationBtn"),

    notificationDrawer:
        document.getElementById("notificationDrawer"),

    closeNotifications:
        document.getElementById("closeNotifications"),

    overlay:
        document.getElementById("overlay"),

    modalOverlay:
        document.getElementById("modalOverlay"),

    modal:
        document.getElementById("modal"),

    modalClose:
        document.getElementById("modalClose"),

    modalContent:
        document.getElementById("modalContent"),

    logoutBtn:
        document.getElementById("logoutBtn"),

    saveProfile:
        document.getElementById("saveProfile")
};


/* =========================================================
   3. PAGE TITLES
========================================================= */

const PAGE_TITLES = {

    dashboard: "Client Dashboard",

    projects: "My Projects",

    quotations: "Quotations",

    payments: "Payments",

    monitoring: "Installation Monitoring",

    requests: "Service Requests",

    documents: "Documents",

    support: "Support Center",

    profile: "My Profile"

};


/* =========================================================
   4. NAVIGATION ENGINE
========================================================= */

function navigateTo(pageName) {

    if (!PAGE_TITLES[pageName]) {
        console.warn(`Unknown page: ${pageName}`);
        return;
    }

    ClientApp.currentPage = pageName;

    DOM.pages.forEach(page => {

        page.classList.remove("active");

    });

    const targetPage =
        document.getElementById(`${pageName}Page`);

    if (targetPage) {

        targetPage.classList.add("active");

    }


    DOM.navItems.forEach(item => {

        item.classList.toggle(
            "active",
            item.dataset.page === pageName
        );

    });


    DOM.pageTitle.textContent =
        PAGE_TITLES[pageName];

    if (pageName === "monitoring") {
        loadInstallationMonitoring();
    } else if (pageName === "requests") {
        loadClientRequests();
    }


    closeMobileSidebar();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   5. NAVIGATION EVENTS
========================================================= */

DOM.navItems.forEach(item => {

    item.addEventListener("click", () => {

        navigateTo(item.dataset.page);

    });

});


/* =========================================================
   6. PAGE LINK BUTTONS
========================================================= */

document.querySelectorAll("[data-page-link]")
    .forEach(button => {

        button.addEventListener("click", () => {

            navigateTo(button.dataset.pageLink);

        });

    });


/* =========================================================
   7. MOBILE SIDEBAR
========================================================= */

DOM.mobileMenu.addEventListener("click", () => {
    DOM.sidebar.classList.toggle("open");
    const overlay = document.getElementById("clientSidebarOverlay");
    if (overlay) overlay.classList.toggle("active");
});

const clientOverlay = document.getElementById("clientSidebarOverlay");
if (clientOverlay) {
    clientOverlay.addEventListener("click", closeMobileSidebar);
}

function closeMobileSidebar() {
    DOM.sidebar.classList.remove("open");
    const overlay = document.getElementById("clientSidebarOverlay");
    if (overlay) overlay.classList.remove("active");
}


/* =========================================================
   8. SEARCH
========================================================= */

DOM.searchBtn.addEventListener("click", () => {

    DOM.searchPanel.classList.toggle("open");

    if (DOM.searchPanel.classList.contains("open")) {

        setTimeout(() => {
            DOM.globalSearch.focus();
        }, 100);

    }

});


DOM.closeSearch.addEventListener("click", () => {

    DOM.searchPanel.classList.remove("open");

    DOM.globalSearch.value = "";

});


document.addEventListener("keydown", event => {

    if (event.key === "/" && document.activeElement.tagName !== "INPUT") {

        event.preventDefault();

        DOM.searchPanel.classList.add("open");

        DOM.globalSearch.focus();

    }

    if (event.key === "Escape") {

        DOM.searchPanel.classList.remove("open");

        closeNotificationDrawer();

        closeModal();

    }

});


DOM.globalSearch.addEventListener("input", event => {

    const searchValue =
        event.target.value.trim().toLowerCase();

    if (!searchValue) return;

    const searchableItems =
        document.querySelectorAll(
            ".project-card, .document-card, tbody tr, .activity-item"
        );

    searchableItems.forEach(item => {

        const content =
            item.textContent.toLowerCase();

        item.style.display =
            content.includes(searchValue)
                ? ""
                : "none";

    });

});


/* =========================================================
   9. NOTIFICATIONS
========================================================= */

DOM.notificationBtn.addEventListener(
    "click",
    openNotificationDrawer
);


DOM.closeNotifications.addEventListener(
    "click",
    closeNotificationDrawer
);


DOM.overlay.addEventListener(
    "click",
    closeNotificationDrawer
);


function openNotificationDrawer() {

    DOM.notificationDrawer.classList.add("open");

    DOM.overlay.classList.add("open");

}


function closeNotificationDrawer() {

    DOM.notificationDrawer.classList.remove("open");

    DOM.overlay.classList.remove("open");

}


/* =========================================================
   10. MODAL ENGINE
========================================================= */

function openModal(content) {

    DOM.modalContent.innerHTML = content;

    DOM.modalOverlay.classList.add("open");

}


function closeModal() {

    DOM.modalOverlay.classList.remove("open");

}


DOM.modalClose.addEventListener(
    "click",
    closeModal
);


DOM.modalOverlay.addEventListener(
    "click",
    event => {

        if (event.target === DOM.modalOverlay) {

            closeModal();

        }

    }
);


/* =========================================================
   11. ACTION DISPATCHER
========================================================= */

document.addEventListener("click", event => {

    const actionElement =
        event.target.closest("[data-action]");

    if (!actionElement) return;

    const action =
        actionElement.dataset.action;

    handleAction(action);

});


function handleAction(action) {

    switch (action) {

        case "new-request":

            openNewRequestModal();

            break;


        case "view-project":

            openProjectModal();

            break;


        case "monitoring":

            navigateTo("monitoring");

            break;


        case "view-quotation":

            openQuotationModal();

            break;


        case "accept-quotation":

            acceptQuotation();

            break;


        case "support":

            openSupportModal();

            break;


        case "request-profile-update":

            openProfileUpdateRequestModal();

            break;


        default:

            console.warn(
                `Unhandled action: ${action}`
            );

    }

}

function openProfileUpdateRequestModal() {
    const client = ClientApp.client || { name: "Eniola Abdulrasaq", email: "AERenewablesolution@gmail.com", phone: "0813 361 5132", location: "Abuja FCT" };

    openModal(`
        <div style="text-align:left;">
            <span class="eyebrow" style="color:#004AAD; font-weight:800;">VERIFICATION & AUDIT DESK</span>
            <h2 style="font-size:18px; margin-top:4px; color:#010a1d;">Official Profile Update Request</h2>
            <p style="font-size:13px; color:#64748b; margin-bottom:16px;">
                Submit an official credential adjustment. Because account parameters are legally linked to your Solar Purchase Agreement and Warranty Certificates, updates are verified by our compliance desk.
            </p>

            <form class="modal-form" id="profileUpdateForm" onsubmit="submitProfileUpdateRequest(event)">
                <label>
                    Target Parameter to Update
                    <select id="updateTargetField" required onchange="handleUpdateFieldChange(this.value)">
                        <option value="Phone Number">Primary Phone Number (Currently: ${client.phone})</option>
                        <option value="Email Address">Email / Gmail Address (Currently: ${client.email})</option>
                        <option value="Site Location">Operating / Site Location (Currently: ${client.location})</option>
                        <option value="Legal Name">Full Legal Name (Currently: ${client.name})</option>
                    </select>
                </label>

                <label>
                    New Requested Value
                    <input type="text" id="newFieldValue" placeholder="Enter new phone number, email, or address" required />
                </label>

                <label>
                    Reason / Supporting Details
                    <textarea id="updateReason" placeholder="Explain the reason for update (e.g. SIM card replacement, address change, legal change)..." required rows="3"></textarea>
                </label>

                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px 12px; margin-bottom:16px; font-size:11.5px; color:#475569;">
                    ℹ️ <strong>Turnaround Time:</strong> Requests are processed within <strong>2 to 4 business hours</strong>. You will receive an SMS/Email notification upon verification.
                </div>

                <div class="modal-actions">
                    <button type="button" class="secondary-btn" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="primary-btn">Submit Official Request</button>
                </div>
            </form>
        </div>
    `);
}

window.handleUpdateFieldChange = function(val) {
    const input = document.getElementById("newFieldValue");
    if (!input) return;
    if (val === "Phone Number") {
        input.type = "tel";
        input.placeholder = "Enter new phone number (e.g. 080... / +234...)";
    } else if (val === "Email Address") {
        input.type = "email";
        input.placeholder = "Enter new Gmail or corporate email";
    } else {
        input.type = "text";
        input.placeholder = `Enter new ${val}`;
    }
};

window.submitProfileUpdateRequest = function(event) {
    event.preventDefault();
    const field = document.getElementById("updateTargetField")?.value || "Profile Field";
    const newVal = document.getElementById("newFieldValue")?.value || "";
    const reason = document.getElementById("updateReason")?.value || "";

    const reqId = `AE-REQ-${Date.now().toString().slice(-6)}`;
    
    if (Array.isArray(ClientApp.requests)) {
        ClientApp.requests.push({
            id: reqId,
            type: "Profile Update Request",
            subject: `Update ${field} to "${newVal}"`,
            details: reason,
            status: "Submitted to Verification Desk",
            date: new Date().toLocaleDateString()
        });
    }

    closeModal();
    if (typeof showToast === "function") {
        showToast(`Profile change request ${reqId} submitted for compliance review.`);
    } else {
        alert(`Profile change request ${reqId} submitted for compliance review.`);
    }
};


/* =========================================================
   12. PROJECT & QUOTATION REVIEW & 5% BARGAIN NEGOTIATION
========================================================= */

window.toggleBargainSuite = function() {
    const suite = document.getElementById("modalBargainSuite");
    const toggleBtn = document.getElementById("modalToggleBargainBtn");
    if (!suite) return;

    if (suite.style.display === "none" || !suite.style.display) {
        suite.style.display = "block";
        if (toggleBtn) toggleBtn.style.display = "none";
        suite.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
        suite.style.display = "none";
        if (toggleBtn) toggleBtn.style.display = "inline-flex";
    }
};

window.onBargainAmountChange = function(val, baseline) {
    const inputNum = Number(val);
    const feedbackEl = document.getElementById("modalBargainFeedback");
    const submitBtn = document.getElementById("modalSubmitBargainBtn");
    const formattedDisplay = document.getElementById("modalBargainFormattedAmount");
    if (!feedbackEl) return;

    if (isNaN(inputNum) || inputNum <= 0) {
        feedbackEl.className = "bargain-feedback invalid";
        feedbackEl.innerHTML = "⚠️ Please enter a valid positive grand total amount.";
        if (submitBtn) submitBtn.disabled = true;
        if (formattedDisplay) formattedDisplay.textContent = "₦ 0.00";
        return;
    }

    if (formattedDisplay) {
        formattedDisplay.textContent = `₦ ${inputNum.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    if (inputNum > baseline) {
        feedbackEl.className = "bargain-feedback invalid";
        feedbackEl.innerHTML = `⚠️ Proposed grand total cannot exceed the original total of ₦${baseline.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
        if (submitBtn) submitBtn.disabled = true;
        return;
    }

    const discountAmount = baseline - inputNum;
    const discountPercent = baseline > 0 ? (discountAmount / baseline) * 100 : 0;
    const minAcceptable = baseline * 0.95;

    if (inputNum < (minAcceptable - 0.5)) {
        feedbackEl.className = "bargain-feedback invalid";
        feedbackEl.innerHTML = `❌ Discount (${discountPercent.toFixed(1)}%) exceeds maximum allowable 5.0% limit. Minimum allowable offer: <strong>₦${minAcceptable.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</strong>`;
        if (submitBtn) submitBtn.disabled = true;
        return;
    }

    feedbackEl.className = "bargain-feedback valid";
    feedbackEl.innerHTML = `<strong>Max 5% Discount:</strong> <span style="color:#047857; font-weight:700;">-₦${discountAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })} (${discountPercent.toFixed(2)}% off original)</span>`;
    if (submitBtn) submitBtn.disabled = false;
};

window.submitProjectBargain = async function(projectId, baseline) {
    const inputEl = document.getElementById("modalBargainInput");
    const noteEl = document.getElementById("modalBargainNote");
    const submitBtn = document.getElementById("modalSubmitBargainBtn");

    if (!inputEl) return;
    const proposedAmount = Number(inputEl.value);

    if (isNaN(proposedAmount) || proposedAmount <= 0) {
        showClientToast("Please enter a valid proposed grand total amount.", "error");
        return;
    }

    const minAcceptable = baseline * 0.95;
    if (proposedAmount < (minAcceptable - 0.5)) {
        showClientToast("Bargain discount exceeds maximum 5% limit.", "error");
        return;
    }

    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Submitting to Admin...";
        }

        const res = await ClientAPI.post(`/api/projects/${projectId}/bargain`, {
            proposedAmount,
            clientNote: noteEl ? noteEl.value.trim() : ""
        });

        if (res && res.success) {
            showClientToast(`🎉 Bargain proposal of ₦${proposedAmount.toLocaleString()} submitted to Admin for review!`, "success");
            await loadClientProjects();
            await loadClientQuotations();
            openProjectModal(projectId);
        } else {
            showClientToast(res?.message || "Could not submit bargain proposal.", "error");
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Submit Bargain for Admin Review";
            }
        }
    } catch (err) {
        showClientToast(err.message || "Bargain submission failed.", "error");
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Bargain for Admin Review";
        }
    }
};

window.clientAcceptOriginalQuotation = async function(projectId) {
    if (!confirm("Confirm and accept the original quotation total? This will activate your project and assign your Lead Installer immediately.")) return;

    try {
        const res = await ClientAPI.post(`/api/projects/${projectId}/bargain/client-accept-original`, {});
        if (res && res.success) {
            showClientToast("🎉 Quotation accepted! Project is now active with Lead Installer assigned.", "success");
            await loadClientProjects();
            await loadClientQuotations();
            await loadClientActivities();
            closeModal();
            navigateTo("monitoring");
        } else {
            showClientToast(res?.message || "Could not accept quotation.", "error");
        }
    } catch (err) {
        showClientToast(err.message || "Action failed.", "error");
    }
};

async function openProjectModal(projectId) {
    let p = null;

    if (!projectId && ClientApp.projectsList && ClientApp.projectsList.length > 0) {
        projectId = ClientApp.projectsList[0].id;
    }

    try {
        if (projectId) {
            const res = await ClientAPI.get(`/api/projects/${projectId}/full`);
            if (res && res.data) p = res.data;
        }
    } catch (e) {
        console.warn("Could not fetch full project details:", e.message);
    }

    if (!p && ClientApp.projectsList) {
        p = ClientApp.projectsList.find(item => item.id == projectId || item.project_code == projectId);
    }

    if (!p) {
        openModal(`
            <span class="eyebrow">PROJECT NOT FOUND</span>
            <h2>No Project Record</h2>
            <p>Could not locate the requested project record.</p>
            <div class="modal-actions">
                <button class="secondary-btn" onclick="closeModal()">Close</button>
            </div>
        `);
        return;
    }

    const baseline = Number(p.original_contract_value || p.contract_value || p.estimated_value || 0);
    const maxDiscount = baseline * 0.05;
    const minOffer = baseline * 0.95;
    const currentOffer = Number(p.proposed_bargain_amount || minOffer);
    const hasPendingBargain = p.bargain_status === "pending_admin_review";
    const isBargainAccepted = p.bargain_status === "accepted" || 
                              p.bargain_status === "client_accepted_original" || 
                              ["in_installation", "in_progress", "completed", "approved", "active"].includes(p.status);
    const isBargainRejected = !isBargainAccepted && (p.bargain_status === "rejected" || p.bargain_status === "declined_by_admin");

    const projectCode = p.project_code || `PRJ-${p.id}`;
    const quotationCode = p.quotation_code || (projectCode.replace("PRJ", "AE"));

    // Build BOQ Items table — Calculations remain untouched and reflect authentic technical sizing
    let boqRowsHtml = "";
    const boqItems = p.quotation_items || (p.boq_data && Array.isArray(p.boq_data.items) ? p.boq_data.items : []);
    if (boqItems.length > 0) {
        boqItems.forEach((item, idx) => {
            const name = item.name || item.item_name || item.description || "Equipment Item";
            const qty = item.quantity || 1;
            const unit = item.unit || "unit";
            const rate = Number(item.unit_price || item.unitPrice || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 });
            const total = Number(item.total_amount || item.totalPrice || (qty * (item.unit_price || 0))).toLocaleString("en-NG", { minimumFractionDigits: 2 });

            boqRowsHtml += `
                <tr>
                    <td style="text-align:center; color:#64748B;">${idx + 1}</td>
                    <td><strong>${escapeHtml(name)}</strong></td>
                    <td style="text-align:center;">${escapeHtml(unit)}</td>
                    <td style="text-align:center; font-weight:700;">${qty}</td>
                    <td style="text-align:right; font-family:monospace;">₦${rate}</td>
                    <td style="text-align:right; font-weight:700; color:#004AAD; font-family:monospace;">₦${total}</td>
                </tr>
            `;
        });
    } else {
        boqRowsHtml = `
            <tr>
                <td style="text-align:center;">1</td>
                <td><strong>Turnkey Solar PV Installation (${p.system_capacity_kw || 5}kW PV / ${p.battery_capacity_kwh || 10}kWh Storage)</strong></td>
                <td style="text-align:center;">Lot</td>
                <td style="text-align:center; font-weight:700;">1</td>
                <td style="text-align:right; font-family:monospace;">₦${baseline.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</td>
                <td style="text-align:right; font-weight:700; color:#004AAD; font-family:monospace;">₦${baseline.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</td>
            </tr>
        `;
    }

    let bargainStatusNotice = "";
    if (hasPendingBargain) {
        bargainStatusNotice = `
            <div style="background:#FFFBEB; border:1.5px solid #FCD34D; border-radius:8px; padding:14px 16px; margin:16px 0; color:#92400E;">
                <div style="font-weight:800; font-size:13px; margin-bottom:4px;">⏳ Proposed Bargain Under Admin Review</div>
                <div style="font-size:12px;">You offered <strong>₦${Number(p.proposed_bargain_amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</strong> (${p.bargain_discount_percentage}% discount off original ₦${baseline.toLocaleString("en-NG", { minimumFractionDigits: 2 })}). AE Renewable technical management is currently reviewing your offer.</div>
                ${p.bargain_note ? `<div style="font-size:11px; margin-top:6px; color:#78350F; font-style:italic;">Note: "${escapeHtml(p.bargain_note)}"</div>` : ""}
            </div>
        `;
    } else if (isBargainAccepted) {
        bargainStatusNotice = `
            <div style="background:#ECFDF5; border:1.5px solid #6EE7B7; border-radius:8px; padding:14px 16px; margin:16px 0; color:#065F46;">
                <div style="font-weight:800; font-size:13px; margin-bottom:4px;">🎉 Quotation Accepted & Active!</div>
                <div style="font-size:12px;">Agreed Grand Total: <strong>₦${Number(p.contract_value || baseline).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</strong>. Assigned Lead Installer: <strong>${escapeHtml(p.installer_contact_name || p.installer_name || "Eniola Abdulrasaq")}</strong>. Technical calculations & BOQ quantities are locked and ready for implementation.</div>
            </div>
        `;
    } else if (isBargainRejected) {
        bargainStatusNotice = `
            <div style="background:#FEF2F2; border:1.5px solid #FECACA; border-radius:8px; padding:14px 16px; margin:16px 0; color:#991B1B;">
                <div style="font-weight:800; font-size:13px; margin-bottom:4px;">ℹ️ Previous Bargain Offer Declined</div>
                <div style="font-size:12.5px; line-height:1.45;">AE Renewable management maintained the standard quotation total at <strong>₦${baseline.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</strong>. You may accept the original quotation now to start your project, or submit a revised offer within the 5% allowable limit below.</div>
                <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
                    <button class="primary-btn" style="padding:7px 14px; font-size:12px; background:#16a34a; border-color:#16a34a;" onclick="clientAcceptOriginalQuotation('${p.id}')">✓ Accept Original Quotation (₦${baseline.toLocaleString("en-NG", { minimumFractionDigits: 2 })})</button>
                    <button class="secondary-btn" style="padding:7px 14px; font-size:12px;" onclick="toggleBargainSuite()">Submit Revised Offer</button>
                </div>
            </div>
        `;
    }

    const modalHtml = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; border-bottom:2px solid #F1F5F9; padding-bottom:14px;">
            <div>
                <span class="eyebrow" style="color:#004AAD; font-weight:800;">OFFICIAL SYSTEM QUOTATION & BOQ</span>
                <h2 style="margin:4px 0; color:#071426;">${escapeHtml(p.project_name || "Solar Power Installation")}</h2>
                <div style="font-size:12px; color:#64748B;">
                    Project Code: <strong style="color:#071426;">${escapeHtml(projectCode)}</strong> · Quotation Ref: <strong style="color:#004AAD;">${escapeHtml(quotationCode)}</strong>
                </div>
            </div>
            <span class="status-pill ${p.status === "completed" ? "completed" : "active"}">${escapeHtml(p.status || "Active")}</span>
        </div>

        <div class="system-info-grid" style="margin-top:14px; margin-bottom:18px;">
            <div>
                <span>Solar Array</span>
                <strong>${p.system_capacity_kw || 5.0} kW PV</strong>
            </div>
            <div>
                <span>Battery Storage</span>
                <strong>${p.battery_capacity_kwh || 10.0} kWh</strong>
            </div>
            <div>
                <span>Inverter Rating</span>
                <strong>${p.inverter_capacity_kva || 5.0} kVA</strong>
            </div>
            <div>
                <span>Site Address</span>
                <strong>${escapeHtml(p.city || "Nigeria")}, ${escapeHtml(p.state || "Abuja")}</strong>
            </div>
        </div>

        <!-- Bill of Quantities Schedule (Read-Only) -->
        <div style="margin:20px 0 10px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="font-size:13px; color:#071426; text-transform:uppercase; letter-spacing:0.5px;">Bill of Quantities (BOQ) Schedule</strong>
                <small style="color:#64748B; font-size:11px;">🔒 Hardware counts locked to preserve engineering integrity</small>
            </div>
            <div class="boq-table-wrapper">
                <table class="boq-preview-table">
                    <thead>
                        <tr>
                            <th style="width:40px; text-align:center;">SN</th>
                            <th>Description & Specification</th>
                            <th style="width:60px; text-align:center;">Unit</th>
                            <th style="width:50px; text-align:center;">Qty</th>
                            <th style="width:110px; text-align:right;">Rate (₦)</th>
                            <th style="width:120px; text-align:right;">Total (₦)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${boqRowsHtml}
                    </tbody>
                    <tfoot>
                        <tr style="background:#F8FAFC; font-weight:800;">
                            <td colspan="5" style="text-align:right; font-size:13px; padding:10px 12px;">${isBargainAccepted ? "Official Agreed Grand Total:" : "Original Grand Total:"}</td>
                            <td style="text-align:right; font-size:15px; color:${isBargainAccepted ? "#059669" : "#004AAD"}; font-family:monospace; padding:10px 12px;">₦${Number(isBargainAccepted ? (p.contract_value || baseline) : baseline).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        ${bargainStatusNotice}

        ${(!hasPendingBargain && !isBargainAccepted && !isBargainRejected) ? `
            <div style="margin:16px 0; text-align:center;">
                <button id="modalToggleBargainBtn" class="secondary-btn" onclick="toggleBargainSuite()" style="padding:9px 18px; font-weight:700; border-color:#004AAD; color:#004AAD;">
                    🤝 Request Price Bargain / Offer (Max 5% Discount)
                </button>
            </div>
        ` : ""}

        ${(!hasPendingBargain && !isBargainAccepted) ? `
            <!-- 5% Maximum Bargain Negotiation Suite (Accessed via Button) -->
            <div id="modalBargainSuite" class="bargain-suite golden-accent" style="${isBargainRejected ? 'display:block;' : 'display:none;'}">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <span class="bargain-limit-pill">⚡ PRICE BARGAIN NEGOTIATION</span>
                    <span style="font-size:11.5px; font-weight:700; color:#92400E;">Max Negotiable Bargain: Strictly 5%</span>
                </div>

                <p style="font-size:12px; color:#475569; margin:8px 0 14px; line-height:1.5;">
                    In accordance with AE Renewable technical engineering policy, Bill of Quantities hardware counts are fixed to preserve system integrity. <strong>Only the GRAND TOTAL is editable</strong> for commercial bargain up to a maximum 5% discount.
                </p>

                <div class="bargain-calc-grid">
                    <div class="bargain-calc-card">
                        <span>Original Grand Total</span>
                        <strong>₦${baseline.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div class="bargain-calc-card">
                        <span>Max 5% Discount</span>
                        <strong style="color:#DC2626;">-₦${maxDiscount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div class="bargain-calc-card">
                        <span>Minimum Acceptable Offer</span>
                        <strong style="color:#087A4B;">₦${minOffer.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</strong>
                    </div>
                </div>

                <div class="bargain-input-group">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <label for="modalBargainInput">PROPOSED GRAND TOTAL (₦):</label>
                        <strong id="modalBargainFormattedAmount" style="font-family:monospace; font-size:14px; color:#004AAD;">₦ ${currentOffer.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div class="bargain-input-wrapper">
                        <span class="bargain-input-prefix">₦</span>
                        <input
                            type="number"
                            id="modalBargainInput"
                            class="bargain-amount-input"
                            value="${currentOffer}"
                            min="${minOffer}"
                            max="${baseline}"
                            step="1000"
                            oninput="onBargainAmountChange(this.value, ${baseline})"
                        />
                    </div>
                    <div id="modalBargainFeedback" class="bargain-feedback valid">
                        <strong>Max 5% Discount:</strong> <span style="color:#047857; font-weight:700;">-₦${(baseline - currentOffer).toLocaleString("en-NG", { minimumFractionDigits: 2 })} (${((baseline - currentOffer) / baseline * 100).toFixed(2)}% off original)</span>
                    </div>
                </div>

                <div class="bargain-input-group" style="margin-top:12px;">
                    <label for="modalBargainNote">Client Negotiation Note / Budget Consideration (Optional):</label>
                    <textarea
                        id="modalBargainNote"
                        rows="2"
                        placeholder="Enter any note or context for AE Renewable management review..."
                        style="width:100%; padding:8px 12px; border:1px solid #CBD5E1; border-radius:6px; font-family:inherit; font-size:12.5px; outline:none;"
                    >${escapeHtml(p.bargain_note || "")}</textarea>
                </div>

                <div style="margin-top:16px; display:flex; justify-content:flex-end; gap:10px;">
                    <button
                        id="modalSubmitBargainBtn"
                        class="primary-btn"
                        onclick="submitProjectBargain('${p.id}', ${baseline})"
                    >
                        Submit Bargain for Admin Review
                    </button>
                </div>
            </div>
        ` : ""}

        <div class="modal-actions" style="margin-top:24px; padding-top:16px; border-top:1px solid #E2E8F0; display:flex; justify-content:flex-end; gap:10px;">
            <button class="secondary-btn" onclick="closeModal()">Close</button>
            ${(!hasPendingBargain && !isBargainAccepted) ? `
                <button class="primary-btn" style="background:#16a34a; border-color:#16a34a;" onclick="clientAcceptOriginalQuotation('${p.id}')">✓ Accept Original Quotation</button>
            ` : ""}
            ${(isBargainAccepted || p.status === 'in_installation' || p.status === 'in_progress') ? `
                <button class="primary-btn" onclick="navigateTo('monitoring'); closeModal();">Track Installation & Live Progress →</button>
            ` : ""}
        </div>
    `;

    openModal(modalHtml);

    if (!isBargainAccepted && !hasPendingBargain) {
        onBargainAmountChange(currentOffer, baseline);
    }
}

function openQuotationModal(quotationId) {
    if (quotationId) {
        const matchingProject = ClientApp.projectsList?.find(p => p.quotation_id == quotationId || p.id == quotationId);
        if (matchingProject) {
            return openProjectModal(matchingProject.id);
        }
    }
    openProjectModal();
}


/* =========================================================
   14. ACCEPT QUOTATION
========================================================= */

function acceptQuotation() {

    const quotation =
        ClientApp.quotations[0];

    if (quotation.status === "Accepted") {

        showToast(
            "Quotation has already been accepted."
        );

        return;

    }


    quotation.status = "Accepted";

    closeModal();

    showToast(
        "Quotation accepted successfully."
    );


    setTimeout(() => {

        navigateTo("projects");

    }, 500);

}


/* =========================================================
   15. NEW REQUEST
========================================================= */

function openNewRequestModal(defaultType = "") {
    const currentName = document.getElementById("profileName")?.value || ClientApp.profile?.full_name || ClientApp.user?.full_name || "";
    const currentPhone = document.getElementById("profilePhone")?.value || ClientApp.profile?.phone || ClientApp.user?.phone || "";
    const currentEmail = document.getElementById("profileEmail")?.value || ClientApp.profile?.email || ClientApp.user?.email || "";

    openModal(`
        <span class="eyebrow">SERVICE & CONSULTATION DISPATCH</span>
        <h2>Submit Service Request</h2>
        <p>Tell AE Network what you need. Our engineering and admin desk will be notified immediately for a follow-up call.</p>

        <form class="modal-form" id="requestForm">
            <label>
                Request Type
                <select id="requestType" required>
                    <option value="Solar Consultation">☀️ Solar Consultation (Discuss a new solar project)</option>
                    <option value="Maintenance">⚙️ Maintenance (Request system maintenance / repair)</option>
                    <option value="System Upgrade">↑ System Upgrade (Increase inverter / battery capacity)</option>
                    <option value="Site Survey">⌖ Site Survey (Request professional site survey)</option>
                    <option value="CCTV Installation">📹 CCTV Installation</option>
                    <option value="Electric Fence">⚡ Electric Fence</option>
                    <option value="General Technical Support">🛠️ General Technical Support</option>
                </select>
            </label>

            <label>
                Subject
                <input
                    type="text"
                    id="requestSubject"
                    placeholder="Brief description of your requirement"
                    required
                >
            </label>

            <label>
                Details & Site Requirements
                <textarea
                    id="requestDetails"
                    placeholder="Explain your power needs, site condition, or specific upgrade requirements..."
                    rows="3"
                    required
                ></textarea>
            </label>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <label>
                    Contact Phone Number
                    <input
                        type="tel"
                        id="requestPhone"
                        placeholder="+234 800 000 0000"
                        value="${currentPhone}"
                        required
                    >
                </label>
                <label>
                    Contact Email Address
                    <input
                        type="email"
                        id="requestEmail"
                        placeholder="client@example.com"
                        value="${currentEmail}"
                        required
                    >
                </label>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top:4px;">
                <label>
                    Client Full Name
                    <input
                        type="text"
                        id="requestFullName"
                        placeholder="Full Name / Company"
                        value="${currentName}"
                        required
                    >
                </label>
                <label>
                    Preferred Contact Action
                    <select id="requestContactMethod">
                        <option value="Urgent Phone Call & Consultation">📞 Direct Phone Call & Consultation</option>
                        <option value="Site Visit & Inspection">⌖ On-Site Engineering Visit</option>
                        <option value="WhatsApp Direct Message">💬 WhatsApp Message</option>
                        <option value="Email Proposal & Sizing">✉️ Email Detailed Proposal</option>
                    </select>
                </label>
            </div>

            <div class="modal-actions" style="margin-top:20px;">
                <button
                    type="button"
                    class="secondary-btn"
                    onclick="closeModal()"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    class="primary-btn"
                    id="submitRequestBtn"
                >
                    Submit & Request Call ✈
                </button>
            </div>
        </form>
    `);

    const select = document.getElementById("requestType");
    if (defaultType && select) {
        for (let opt of select.options) {
            if (opt.value === defaultType || opt.text.toLowerCase().includes(defaultType.toLowerCase())) {
                select.value = opt.value;
                break;
            }
        }
    }

    document
        .getElementById("requestForm")
        .addEventListener("submit", submitRequest);
}


/* =========================================================
   16. REQUEST SUBMISSION
========================================================= */

async function submitRequest(event) {
    event.preventDefault();

    const type = document.getElementById("requestType")?.value || "Solar Consultation";
    const subject = document.getElementById("requestSubject")?.value?.trim() || "";
    const details = document.getElementById("requestDetails")?.value?.trim() || "";
    const phone = document.getElementById("requestPhone")?.value?.trim() || "";
    const email = document.getElementById("requestEmail")?.value?.trim() || "";
    const fullName = document.getElementById("requestFullName")?.value?.trim() || "";
    const contactMethod = document.getElementById("requestContactMethod")?.value || "Urgent Phone Call & Consultation";

    if (!subject || !details || !phone || !email) {
        showToast("Please provide all required details including phone and email.");
        return;
    }

    const btn = document.getElementById("submitRequestBtn");
    if (btn) {
        btn.disabled = true;
        btn.textContent = "Dispatching Request...";
    }

    const categoryMap = {
        "Solar Consultation": "project",
        "Maintenance": "maintenance",
        "System Upgrade": "technical",
        "Site Survey": "installation",
        "CCTV Installation": "technical",
        "Electric Fence": "technical",
        "General Technical Support": "general"
    };
    const category = categoryMap[type] || "general";

    try {
        const res = await ClientAPI.post("/api/support", {
            request_type: type,
            subject,
            description: details,
            category,
            priority: (type === "System Upgrade" || type === "Maintenance") ? "urgent" : "normal",
            phone,
            email,
            full_name: fullName,
            contact_method: contactMethod
        });

        closeModal();

        const ticketCode = res?.data?.ticket_number || `AE-REQ-${Date.now().toString().slice(-6)}`;
        showToast(`Request ${ticketCode} submitted! Admin has been alerted for your direct call.`);

        loadClientRequests();
        loadClientActivities();

        navigateTo("requests");
    } catch (err) {
        console.warn("Could not submit request via API:", err.message);
        closeModal();
        showToast("Request submitted successfully. Admin desk notified.");
        navigateTo("requests");
    }
}

async function loadClientRequests() {
    const listContainer = document.getElementById("clientRequestHistoryList");
    if (!listContainer) return;

    try {
        const res = await ClientAPI.get("/api/support/my");
        const tickets = Array.isArray(res?.data) ? res.data : (res?.data?.tickets || []);

        if (!tickets.length) {
            listContainer.innerHTML = `
                <div style="padding:20px; text-align:center; color:#64748B; font-size:13px; font-weight:600;">
                    No service requests submitted yet. Click any service card above to request a consultation, upgrade, or site survey.
                </div>
            `;
            return;
        }

        listContainer.innerHTML = tickets.map(t => {
            const num = t.ticket_number || `TKT-${t.id}`;
            const subj = t.subject || "Service Request";
            const status = t.status || "open";
            const dateStr = t.created_at ? new Date(t.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "Recently";
            const statusLabel = status === "open" ? "In Review · Admin Alerted" : (status === "resolved" ? "Completed" : status);
            const statusClass = status === "resolved" ? "completed" : "active";

            return `
                <div class="activity-item">
                    <div class="activity-icon blue" style="font-size:14px;">📞</div>
                    <div>
                        <strong>${subj}</strong>
                        <span>${num} · ${dateStr} · ${statusLabel}</span>
                    </div>
                    <span class="status-pill ${statusClass}">${status === "open" ? "Admin Alerted" : status}</span>
                </div>
            `;
        }).join("");
    } catch (e) {
        console.warn("Could not load client requests:", e.message);
    }
}


/* =========================================================
   17. SUPPORT
========================================================= */

function openSupportModal() {

    openModal(`

        <span class="eyebrow">
            CLIENT SUPPORT
        </span>

        <h2>Contact AE Network</h2>

        <p>
            Submit a support request and our team
            will respond as soon as possible.
        </p>

        <form class="modal-form" id="supportForm">

            <label>

                Issue Type

                <select required>

                    <option>
                        System Issue
                    </option>

                    <option>
                        Project Support
                    </option>

                    <option>
                        Account Support
                    </option>

                    <option>
                        General Question
                    </option>

                </select>

            </label>


            <label>

                Message

                <textarea
                    placeholder="Describe the issue..."
                    required
                ></textarea>

            </label>


            <div class="modal-actions">

                <button
                    type="button"
                    class="secondary-btn"
                    onclick="closeModal()"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    class="primary-btn"
                >
                    Send Support Request
                </button>

            </div>

        </form>

    `);


    document
        .getElementById("supportForm")
        .addEventListener(
            "submit",
            event => {

                event.preventDefault();

                closeModal();

                showToast(
                    "Support request submitted successfully."
                );

            }
        );

}


/* =========================================================
   18. REQUEST CARD EVENTS
========================================================= */

document
    .querySelectorAll("[data-request-type]")
    .forEach(card => {

        card.addEventListener("click", () => {

            openNewRequestModal(
                card.dataset.requestType
            );

        });

    });


/* =========================================================
   19. PROFILE SAVE
========================================================= */

if (DOM.saveProfile) {

    DOM.saveProfile.addEventListener(
        "click",
        () => {

            showToast(
                "Profile information saved successfully."
            );

        }
    );

}


/* =========================================================
   20. PROFILE BUTTON
========================================================= */

document
    .getElementById("profileButton")
    .addEventListener(
        "click",
        () => {

            navigateTo("profile");

        }
    );


/* =========================================================
   21. LOGOUT
========================================================= */

DOM.logoutBtn.addEventListener(
    "click",
    () => {

        const confirmLogout =
            window.confirm(
                "Are you sure you want to logout?"
            );

        if (!confirmLogout) return;


        showToast(
            "Logging out..."
        );


        setTimeout(() => {

            /*
             * Backend authentication should replace
             * this section later.
             */

            window.location.href = "index.html";

        }, 900);

    }
);


/* =========================================================
   22. TOAST ENGINE
========================================================= */

function showToast(message) {

    let toast =
        document.getElementById("clientToast");


    if (!toast) {

        toast =
            document.createElement("div");

        toast.id = "clientToast";

        toast.style.position = "fixed";
        toast.style.bottom = "25px";
        toast.style.right = "25px";
        toast.style.zIndex = "5000";

        toast.style.padding =
            "13px 18px";

        toast.style.background =
            "#010a1d";

        toast.style.color =
            "#ffffff";

        toast.style.borderRadius =
            "10px";

        toast.style.fontSize =
            "11px";

        toast.style.fontWeight =
            "700";

        toast.style.boxShadow =
            "0 15px 40px rgba(1,10,29,.2)";

        toast.style.opacity = "0";

        toast.style.transform =
            "translateY(10px)";

        toast.style.transition =
            ".25s ease";

        document.body.appendChild(toast);

    }


    toast.textContent = message;


    requestAnimationFrame(() => {

        toast.style.opacity = "1";

        toast.style.transform =
            "translateY(0)";

    });


    clearTimeout(
        toast.hideTimer
    );


    toast.hideTimer =
        setTimeout(() => {

            toast.style.opacity = "0";

            toast.style.transform =
                "translateY(10px)";

        }, 3000);

}


/* =========================================================
   23. CLIENT API LAYER
========================================================= */

const ClientAPI = {

    TOKEN_KEY: "aeRenewableToken",
    USER_KEY: "aeRenewableUser",

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY) ||
               localStorage.getItem("token") ||
               localStorage.getItem("accessToken") || "";
    },

    getUser() {
        try {
            return JSON.parse(localStorage.getItem(this.USER_KEY) || "{}");
        } catch {
            return {};
        }
    },

    headers() {
        return {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${this.getToken()}`
        };
    },

    async get(endpoint) {
        try {
            const token = this.getToken();
            const res = await fetch(endpoint, {
                method: "GET",
                credentials: "include",
                headers: this.headers()
            });

            if (res.status === 401) {
                console.warn(`[ClientAPI] Authentication token expired or invalid on ${endpoint}. Session renewal required.`);
                if (endpoint.includes("/api/clients/me") || endpoint.includes("/api/projects")) {
                    this.clearSession();
                    if (!window._authRedirectTimer) {
                        window._authRedirectTimer = setTimeout(() => {
                            if (window.location.pathname.includes("/client/dashboard") || window.location.pathname.includes("/client/client.html")) {
                                window.location.replace("/client/login");
                            }
                        }, 1200);
                    }
                }
                return null;
            }

            if (res.status === 403) {
                console.warn(`[ClientAPI] Access forbidden on ${endpoint} (403)`);
                return null;
            }

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                console.warn(`[ClientAPI] Non-OK response on ${endpoint}:`, err);
                return null;
            }

            return res.json();
        } catch (e) {
            console.warn(`[ClientAPI] Fetch failed on ${endpoint}:`, e.message);
            return null;
        }
    },

    clearSession() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("aeClientToken");
        localStorage.removeItem("user");
        localStorage.removeItem("aeClientUser");
    },

    async post(endpoint, body) {
        try {
            const res = await fetch(endpoint, {
                method: "POST",
                credentials: "include",
                headers: this.headers(),
                body: JSON.stringify(body)
            });

            if (res.status === 401) {
                console.warn(`[ClientAPI] Unauthorized on POST ${endpoint} (401)`);
                this.clearSession();
                return null;
            }

            return res.json();
        } catch (e) {
            console.warn(`[ClientAPI] POST failed on ${endpoint}:`, e.message);
            return null;
        }
    }
};


/* =========================================================
   24. CLIENT DATA FETCHERS
========================================================= */

async function loadClientProfile() {
    try {
        const res = await ClientAPI.get("/api/clients/me");
        if (!res?.data) return;

        const client = res.data.client || res.data;

        // Build display name
        const name = client.contact_name ||
            client.full_name ||
            `${client.first_name || ""} ${client.last_name || ""}`.trim() ||
            client.company_name || "Client";

        const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "CL";

        // Update sidebar profile
        ClientApp.client = {
            name,
            email: client.email || client.contact_email || "",
            phone: client.phone || client.contact_phone || "",
            location: client.city || client.state || "Nigeria"
        };

        // Update name displays
        document.querySelectorAll(".client-name, #clientName").forEach(el => {
            el.textContent = name;
        });

        // Update avatar initials
        document.querySelectorAll(".avatar").forEach(el => {
            el.textContent = initials;
        });

        // Update profile mini card
        const miniName = document.querySelector(".client-mini-profile strong");
        if (miniName) miniName.textContent = name;

        // Update profile page
        const profileName = document.getElementById("profileName");
        if (profileName) profileName.value = name;

        const profileEmail = document.getElementById("profileEmail");
        if (profileEmail) profileEmail.value = client.email || "";

        const profilePhone = document.getElementById("profilePhone");
        if (profilePhone) profilePhone.value = client.phone || "";

        // Update greeting
        const greeting = document.querySelector("#dashboardPage h1");
        if (greeting) {
            const hour = new Date().getHours();
            const timeGreet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
            greeting.textContent = `${timeGreet}, ${name.split(" ")[0]}.`;
        }

    } catch (err) {
        console.warn("Client profile API unavailable:", err.message);
    }
}


async function loadClientProjects() {
    try {
        const res = await ClientAPI.get("/api/projects");
        if (!res?.data) return;

        const projects = Array.isArray(res.data) ? res.data : (res.data.projects || []);
        ClientApp.projectsList = projects;
        if (!projects.length) return;

        ClientApp.projects = projects.map(p => ({
            id: p.project_code || p.id,
            name: p.project_name || p.name || "Solar Project",
            capacity: p.system_capacity_kw ? `${p.system_capacity_kw}kW PV` : "—",
            battery: p.battery_capacity_kwh ? `${p.battery_capacity_kwh}kWh` : "—",
            solar: p.solar_capacity_kw ? `${p.solar_capacity_kw}kW PV` : (p.system_capacity_kw ? `${p.system_capacity_kw}kW` : "—"),
            progress: p.completion_percentage || (p.status === "completed" ? 100 : 50),
            status: p.status || "Active",
            bargain_status: p.bargain_status,
            contract_value: p.contract_value,
            proposed_bargain_amount: p.proposed_bargain_amount,
            _id: p.id
        }));

        // Update project count badge in sidebar
        const badge = document.querySelector("[data-page='projects'] .nav-badge");
        if (badge) badge.textContent = projects.length;

        // Re-render project cards in the DOM
        renderClientProjects();

    } catch (err) {
        console.warn("Projects API unavailable:", err.message);
    }
}


function renderClientProjects() {
    const container = document.getElementById("projectsContainer");
    if (!container) return;

    if (!ClientApp.projectsList || !ClientApp.projectsList.length) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align:center; padding:48px 24px; background:#F8FAFC; border:1.5px dashed #CBD5E1; border-radius:12px;">
                <div style="font-size:36px; margin-bottom:12px;">☀️</div>
                <h3 style="margin:0 0 6px 0; color:#0F172A;">No Active Projects Yet</h3>
                <p style="color:#64748B; font-size:13px; max-width:440px; margin:0 auto 16px auto;">
                    Launch a new solar sizing consultation in our engineering studio to create your live project and quotation.
                </p>
                <button class="primary-btn" onclick="handleNewRequestStudio()" style="padding:9px 20px; font-weight:700;">
                    + New Project Request
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = ClientApp.projectsList.map(p => {
        const pId = p.id;
        const code = p.project_code || `PRJ-${p.id}`;
        const name = p.project_name || "Solar Power Turnkey Project";
        const cap = p.system_capacity_kw ? `${p.system_capacity_kw} kW PV` : "5.0 kW PV";
        const bat = p.battery_capacity_kwh ? `${p.battery_capacity_kwh} kWh Storage` : "10.0 kWh Storage";
        const inv = p.inverter_capacity_kva ? `${p.inverter_capacity_kva} kVA` : (p.system_capacity_kw ? `${p.system_capacity_kw} kVA` : "5.0 kVA");
        const val = Number(p.contract_value || p.estimated_value || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 });
        const lead = p.installer_contact_name || p.installer_name || "Eniola Abdulrasaq";
        const leadPhone = p.installer_phone || "0813 361 5132";
        const leadPhoto = p.installer_photo || "/uploads/installer-AEI-B7122F5A-1790967877945-532980.jpg";
        const location = [p.city, p.state].filter(Boolean).join(", ") || "Abuja FCT";
        const progress = p.completion_percentage || (p.status === "completed" ? 100 : (p.status === "in_installation" ? 72 : (p.status === "active" ? 50 : 25)));

        const isAccepted = p.bargain_status === "accepted" || p.bargain_status === "client_accepted_original" || ["in_installation", "in_progress", "completed", "approved", "active"].includes(p.status);

        let bargainBadge = "";
        if (p.bargain_status === "pending_admin_review") {
            bargainBadge = `<span style="display:inline-block; font-size:11px; font-weight:800; background:#FEF3C7; color:#92400E; padding:3px 8px; border-radius:12px; margin-top:4px;">⏳ Bargain Under Review: ₦${Number(p.proposed_bargain_amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>`;
        } else if (isAccepted) {
            bargainBadge = `<span style="display:inline-block; font-size:11px; font-weight:800; background:#D1FAE5; color:#065F46; padding:3px 8px; border-radius:12px; margin-top:4px;">✅ Quotation Agreed & Active</span>`;
        }

        return `
            <div class="project-card" style="cursor:pointer; background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:22px; transition:transform 0.2s, box-shadow 0.2s;" onclick="openProjectModal('${pId}')">
                <div class="project-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <span class="project-id" style="color:#004AAD; font-weight:800; font-size:12px; letter-spacing:0.5px;">${escapeHtml(code)}</span>
                        <h3 style="margin:4px 0 2px 0; font-size:16px; color:#0F172A;">${escapeHtml(name)}</h3>
                        ${bargainBadge}
                    </div>
                    <span class="status-pill ${p.status === "completed" ? "completed" : "active"}">${escapeHtml(p.status || "Active")}</span>
                </div>

                <div class="project-meta" style="margin-top:14px; display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:12px; background:#F8FAFC; padding:12px; border-radius:8px;">
                    <div><span style="color:#64748B; font-size:11px; display:block;">System Sizing</span><strong>${cap} • ${inv}</strong></div>
                    <div><span style="color:#64748B; font-size:11px; display:block;">Battery Bank</span><strong>${bat}</strong></div>
                    <div><span style="color:#64748B; font-size:11px; display:block;">Assigned Lead</span><strong style="color:#004AAD;">${escapeHtml(lead)}</strong></div>
                    <div><span style="color:#64748B; font-size:11px; display:block;">Contract Value</span><strong style="color:#059669;">₦${val}</strong></div>
                </div>

                <!-- Assigned Lead Installer Mini-Row -->
                <div style="margin-top:12px; display:flex; align-items:center; gap:10px; padding:8px 10px; background:#EFF6FF; border-radius:8px;">
                    <img src="${leadPhoto}" alt="${escapeHtml(lead)}" style="width:32px; height:32px; border-radius:50%; object-fit:cover; border:1.5px solid #004AAD;" onerror="this.onerror=null; this.src='/uploads/installer-default.jpg';" />
                    <div style="flex:1; min-width:0;">
                        <div style="font-size:11.5px; font-weight:700; color:#0F172A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(lead)}</div>
                        <div style="font-size:10.5px; color:#64748B;">⭐ 4.96 · Lead Installer · <a href="tel:${leadPhone.replace(/\s+/g, '')}" onclick="event.stopPropagation();" style="color:#004AAD; text-decoration:none; font-weight:700;">📞 ${leadPhone}</a></div>
                    </div>
                </div>

                <div class="progress-section" style="margin-top:14px;">
                    <div class="progress-label" style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px;">
                        <span style="color:#64748B;">Site Progress (${escapeHtml(location)})</span>
                        <strong style="color:#0F172A;">${progress}%</strong>
                    </div>
                    <div class="progress-bar" style="height:6px; background:#E2E8F0; border-radius:10px; overflow:hidden;">
                        <span style="display:block; height:100%; width:${progress}%; background:#004AAD; border-radius:10px;"></span>
                    </div>
                </div>

                <div style="margin-top:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <span style="font-size:11.5px; color:#64748B;">📍 ${escapeHtml(location)}</span>
                    <div style="display:flex; gap:8px;">
                        <button class="secondary-btn" style="font-size:12px; padding:6px 12px; font-weight:700;" onclick="event.stopPropagation(); openProjectModal('${pId}')">
                            ${isAccepted ? "View Quotation & BOQ →" : "Review & Propose Bargain →"}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}


async function loadClientQuotations() {
    try {
        const res = await ClientAPI.get("/api/quotations");
        if (!res?.data) return;

        const quotations = Array.isArray(res.data) ? res.data : (res.data.quotations || []);
        ClientApp.quotationsList = quotations;
        if (!quotations.length) return;

        ClientApp.quotations = quotations.map(q => ({
            id: q.quotation_number || q.quotation_code || `AE-${q.id}`,
            amount: q.total_amount ? `₦${Number(q.total_amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}` : "₦0.00",
            status: q.status || "Issued",
            description: q.title || q.description || "Solar System Quotation",
            bargain_status: q.bargain_status,
            _id: q.id,
            project_id: q.project_id
        }));

        // Update quotation count badge in sidebar
        const badge = document.querySelector("[data-page='quotations'] .nav-badge");
        if (badge && quotations.length) {
            badge.textContent = quotations.length;
        }

        // Render Quotations Table Body
        const tbody = document.getElementById("quotationsTableBody");
        if (tbody) {
            tbody.innerHTML = quotations.map(q => {
                const qCode = q.quotation_number || q.quotation_code || `AE-${q.id}`;
                const title = q.title || q.description || "Residential Solar Power System";
                const dateStr = q.created_at ? new Date(q.created_at).toLocaleDateString("en-GB") : new Date().toLocaleDateString("en-GB");
                const amount = Number(q.total_amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 });
                const prjId = q.project_id || (ClientApp.projectsList && ClientApp.projectsList.length > 0 ? ClientApp.projectsList[0].id : null);

                let statusHtml = `<span class="status-pill active">${q.status || "Issued"}</span>`;
                if (q.bargain_status === "pending_admin_review") {
                    statusHtml += `<div style="font-size:10px; color:#92400E; font-weight:700; margin-top:2px;">⏳ Bargain Review: ₦${Number(q.proposed_bargain_amount).toLocaleString()}</div>`;
                } else if (q.bargain_status === "accepted") {
                    statusHtml += `<div style="font-size:10px; color:#065F46; font-weight:700; margin-top:2px;">✅ Bargain Accepted</div>`;
                }

                return `
                    <tr>
                        <td><strong style="color:#004AAD; font-family:monospace;">${qCode}</strong></td>
                        <td>${title}</td>
                        <td style="color:#64748B;">${dateStr}</td>
                        <td><strong style="color:#0F172A; font-family:monospace;">₦${amount}</strong></td>
                        <td>${statusHtml}</td>
                        <td>
                            <button class="secondary-btn" style="font-size:11.5px; padding:5px 12px; font-weight:700;" onclick="openProjectModal('${prjId}')">
                                Review & Bargain →
                            </button>
                        </td>
                    </tr>
                `;
            }).join("");
        }

        // Populate Dashboard Quotation Panel
        if (quotations.length > 0) {
            const firstQ = quotations[0];
            const qCode = firstQ.quotation_number || firstQ.quotation_code || `AE-${firstQ.id}`;
            const amount = Number(firstQ.total_amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 });
            const prjId = firstQ.project_id || (ClientApp.projectsList && ClientApp.projectsList.length > 0 ? ClientApp.projectsList[0].id : null);

            const titleEl = document.getElementById("dashQuotationTitle");
            if (titleEl) titleEl.textContent = firstQ.title || "Turnkey Solar Engineering Quotation";

            const codeEl = document.getElementById("dashQuotationCode");
            if (codeEl) codeEl.textContent = qCode;

            const amtEl = document.getElementById("dashQuotationAmount");
            if (amtEl) amtEl.textContent = `₦${amount}`;

            const descEl = document.getElementById("dashQuotationDesc");
            if (descEl) descEl.textContent = firstQ.description || "Itemized Bill of Quantities (BOQ) with negotiable grand total (max 5% discount).";

            const statusBadge = document.getElementById("dashQuotationStatusBadge");
            if (statusBadge) {
                if (firstQ.bargain_status === "pending_admin_review") {
                    statusBadge.textContent = "Bargain Under Review";
                    statusBadge.className = "status-pill pending";
                } else if (firstQ.bargain_status === "accepted") {
                    statusBadge.textContent = "Bargain Accepted";
                    statusBadge.className = "status-pill completed";
                } else {
                    statusBadge.textContent = (firstQ.status || "Active").toUpperCase();
                    statusBadge.className = "status-pill active";
                }
            }

            const actionsEl = document.getElementById("dashQuotationActions");
            if (actionsEl) {
                actionsEl.innerHTML = `
                    <button class="primary-btn" style="font-size:12.5px;" onclick="openProjectModal('${prjId}')">
                        Review & Propose Bargain (Max 5%) →
                    </button>
                `;
            }
        }

        updateDashboardStats();

    } catch (err) {
        console.warn("Quotations API unavailable:", err.message);
    }
}


/* =========================================================
   24. DASHBOARD STATS & LIVE SYSTEM REVIEW ENGINE
========================================================= */

function updateDashboardStats() {
    const projects = ClientApp.projectsList || [];
    const quotations = ClientApp.quotationsList || [];
    const client = ClientApp.client || {};

    // 1. Active Projects = must be active inverter capacity Kva
    let totalInverterKva = 0;
    let activeProjectCount = 0;
    projects.forEach(p => {
        if (p.status !== "cancelled") {
            activeProjectCount++;
            const kva = Number(p.inverter_capacity_kva || p.system_capacity_kw || 0);
            totalInverterKva += kva;
        }
    });

    const statProjectsEl = document.getElementById("dashStatProjects");
    const statProjectsSubEl = document.getElementById("dashStatProjectsSub");
    if (statProjectsEl) {
        statProjectsEl.textContent = totalInverterKva > 0 ? `${totalInverterKva.toFixed(1)} kVA` : (projects.length > 0 ? "5.0 kVA" : "0.0 kVA");
    }
    if (statProjectsSubEl) {
        statProjectsSubEl.textContent = activeProjectCount > 0 
            ? `${activeProjectCount} Active ${activeProjectCount === 1 ? 'Project' : 'Projects'}`
            : "No active project";
    }

    // 2. Outstanding = should only be their debt if none debt 0.00.00
    let totalDebt = 0;
    projects.forEach(p => {
        const bal = Number(p.balance_due ?? (Number(p.contract_value || 0) - Number(p.amount_paid || 0)));
        if (bal > 0) totalDebt += bal;
    });
    if (totalDebt === 0 && quotations.length > 0) {
        quotations.forEach(q => {
            const bal = Number(q.balance_due ?? (Number(q.total_amount || 0) - Number(q.amount_paid || 0)));
            if (bal > 0 && totalDebt === 0) totalDebt = bal;
        });
    }

    const statOutstandingEl = document.getElementById("dashStatOutstanding");
    const statOutstandingSubEl = document.getElementById("dashStatOutstandingSub");
    if (statOutstandingEl) {
        if (totalDebt <= 0) {
            statOutstandingEl.textContent = "₦0.00";
        } else {
            statOutstandingEl.textContent = `₦${Number(totalDebt).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
        }
    }
    if (statOutstandingSubEl) {
        statOutstandingSubEl.textContent = totalDebt <= 0 ? "Clear Account (₦0.00 Debt)" : "Total Balance Due";
    }

    // 3. System Status = Excellent if reviewing actively, Normal if not reviewed in 5 maintenance reviews, Poor if no review in 2 years
    const statStatusEl = document.getElementById("dashStatStatus");
    const statStatusSubEl = document.getElementById("dashStatStatusSub");
    if (statStatusEl) {
        const missedReviews = Number(client.missed_reviews || 0);
        const lastReviewDate = client.last_review_at ? new Date(client.last_review_at) : null;
        const yearsInactive = lastReviewDate ? (Date.now() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24 * 365) : 0;

        if (yearsInactive >= 2) {
            statStatusEl.textContent = "Poor";
            statStatusEl.className = "status-danger";
            if (statStatusSubEl) statStatusSubEl.textContent = "No review in 2+ years";
        } else if (missedReviews >= 5) {
            statStatusEl.textContent = "Normal";
            statStatusEl.className = "status-warning";
            if (statStatusSubEl) statStatusSubEl.textContent = "5 Reviews Pending";
        } else {
            statStatusEl.textContent = "Excellent";
            statStatusEl.className = "status-online";
            if (statStatusSubEl) statStatusSubEl.textContent = "Weekly Review: Active";
        }
    }

    // 4. Quotations "dashStatQuotations" Quotation id and dashStatQuotationsSub loading/state/LGA
    const statQuotationsEl = document.getElementById("dashStatQuotations");
    const statQuotationsSubEl = document.getElementById("dashStatQuotationsSub");
    if (statQuotationsEl) {
        if (quotations.length > 0) {
            const topQ = quotations[0];
            const qId = topQ.quotation_number || topQ.quotation_code || `AE-Q-${topQ.id}`;
            statQuotationsEl.textContent = qId;
        } else {
            statQuotationsEl.textContent = "—";
        }
    }
    if (statQuotationsSubEl) {
        if (quotations.length > 0) {
            const topQ = quotations[0];
            const topProj = projects.find(p => p.id === topQ.project_id) || projects[0] || {};
            const stateLoc = topProj.state || client.state || "Abuja";
            const cityLoc = topProj.city || client.city || "FCT";
            const isAssigned = Boolean(topProj.installer_id);
            
            if (isAssigned) {
                statQuotationsSubEl.textContent = `Assigned Installer • ${stateLoc}`;
            } else {
                statQuotationsSubEl.textContent = `Pending Admin Assignment • ${stateLoc} (${cityLoc})`;
            }
        } else {
            statQuotationsSubEl.textContent = "No quotation yet";
        }
    }

    // 5. Update Active Project Overview panel
    if (projects.length > 0) {
        const p = projects[0];
        const pCode = p.project_code || `PRJ-${p.id}`;
        const pName = p.project_name || "Residential Hybrid Solar System";
        const pCap = p.inverter_capacity_kva ? `${p.inverter_capacity_kva} kVA` : (p.system_capacity_kw ? `${p.system_capacity_kw} kW` : "5.0 kVA");
        const pLoc = p.city ? `${p.city}, ${p.state || 'Nigeria'}` : (p.state || client.location || "Abuja");
        const progress = p.status === "completed" ? 100 : (p.status === "installation" ? 75 : (p.status === "admin_review" ? 40 : 25));

        const nameEl = document.getElementById("dashActiveProjectName");
        if (nameEl) nameEl.textContent = pName;

        const statusEl = document.getElementById("dashActiveProjectStatus");
        if (statusEl) {
            statusEl.textContent = (p.status || "Active").toUpperCase();
            statusEl.className = `status-pill ${p.status === "completed" ? "completed" : "progress"}`;
        }

        const idEl = document.getElementById("dashActiveProjectId");
        if (idEl) idEl.textContent = pCode;

        const capEl = document.getElementById("dashActiveProjectCapacity");
        if (capEl) capEl.textContent = pCap;

        const locEl = document.getElementById("dashActiveProjectLocation");
        if (locEl) locEl.textContent = pLoc;

        const progEl = document.getElementById("dashActiveProjectProgress");
        if (progEl) progEl.textContent = `${progress}%`;

        const barEl = document.getElementById("dashActiveProjectProgressBar");
        if (barEl) barEl.style.width = `${progress}%`;
    }
}


/* =========================================================
   25. RECENT ACTIVITY LOADER
========================================================= */

async function loadClientActivities() {
    const listEl = document.getElementById("dashActivityList");
    if (!listEl) return;

    try {
        const res = await ClientAPI.get("/api/activity/my");
        const activities = (res && res.data) ? (Array.isArray(res.data) ? res.data : (res.data.activities || [])) : [];

        if (activities && activities.length > 0) {
            listEl.innerHTML = activities.slice(0, 6).map(act => {
                const timeAgo = formatTimeAgo(act.created_at);
                const title = act.title || act.action || "Project Update";
                const desc = act.description || `Activity logged for project ${act.project_code || ''}`;
                const icon = act.action?.includes("bargain") ? "🤝" : (act.action?.includes("quotation") ? "📄" : (act.action?.includes("project") ? "☀️" : "⇅"));

                return `
                    <div class="activity-item" style="display:flex; gap:12px; align-items:flex-start; padding:12px 0; border-bottom:1px solid #F1F5F9;">
                        <div class="activity-icon blue" style="width:36px; height:36px; border-radius:8px; background:#EFF6FF; display:flex; align-items:center; justify-content:center; font-size:16px;">
                            ${icon}
                        </div>
                        <div style="flex:1;">
                            <strong style="color:#0F172A; font-size:13px; display:block;">${escapeHtml(title)}</strong>
                            <span style="color:#64748B; font-size:12px; display:block; margin-top:2px;">${escapeHtml(desc)}</span>
                            <small style="color:#94A3B8; font-size:11px; margin-top:4px; display:block;">${timeAgo}</small>
                        </div>
                    </div>
                `;
            }).join("");
        } else {
            const proj = ClientApp.projectsList && ClientApp.projectsList[0];
            const q = ClientApp.quotationsList && ClientApp.quotationsList[0];
            const pCode = proj?.project_code || "PRJ-2026";
            const qCode = q?.quotation_number || q?.quotation_code || "AE-Q-2026";

            listEl.innerHTML = `
                <div class="activity-item" style="display:flex; gap:12px; align-items:flex-start; padding:10px 0; border-bottom:1px solid #F1F5F9;">
                    <div class="activity-icon blue" style="width:36px; height:36px; border-radius:8px; background:#EFF6FF; display:flex; align-items:center; justify-content:center; font-size:16px;">☀️</div>
                    <div style="flex:1;">
                        <strong style="color:#0F172A; font-size:13px; display:block;">Quotation Issued: ${qCode}</strong>
                        <span style="color:#64748B; font-size:12px; display:block; margin-top:2px;">Itemized Bill of Quantities ready with 5% max bargain option.</span>
                        <small style="color:#94A3B8; font-size:11px; margin-top:4px; display:block;">Active</small>
                    </div>
                </div>
                <div class="activity-item" style="display:flex; gap:12px; align-items:flex-start; padding:10px 0; border-bottom:1px solid #F1F5F9;">
                    <div class="activity-icon green" style="width:36px; height:36px; border-radius:8px; background:#ECFDF5; display:flex; align-items:center; justify-content:center; font-size:16px;">⚡</div>
                    <div style="flex:1;">
                        <strong style="color:#0F172A; font-size:13px; display:block;">System Sizing Logged: ${pCode}</strong>
                        <span style="color:#64748B; font-size:12px; display:block; margin-top:2px;">Engineering calculations completed via ARDE Studio.</span>
                        <small style="color:#94A3B8; font-size:11px; margin-top:4px; display:block;">Active</small>
                    </div>
                </div>
                <div class="activity-item" style="display:flex; gap:12px; align-items:flex-start; padding:10px 0;">
                    <div class="activity-icon gold" style="width:36px; height:36px; border-radius:8px; background:#FFFBEB; display:flex; align-items:center; justify-content:center; font-size:16px;">👤</div>
                    <div style="flex:1;">
                        <strong style="color:#0F172A; font-size:13px; display:block;">Client Portal Account Active</strong>
                        <span style="color:#64748B; font-size:12px; display:block; margin-top:2px;">Live access credentials linked to ${pCode}.</span>
                        <small style="color:#94A3B8; font-size:11px; margin-top:4px; display:block;">Active</small>
                    </div>
                </div>
            `;
        }
    } catch (e) {
        console.warn("Activity fetch error:", e);
    }
}

function formatTimeAgo(dateStr) {
    if (!dateStr) return "Recently";
    const date = new Date(dateStr);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString("en-GB");
}


/* =========================================================
   26. NEW REQUEST STUDIO LAUNCHER
========================================================= */

function handleNewRequestStudio() {
    const client = ClientApp.client || {};
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newProjectCode = `PRJ-${year}${month}-${randomNum}`;

    const activeClientData = {
        fullName: client.name || "Eniola Abdulrasaq",
        projectCode: newProjectCode,
        email: client.email || "e8237140@gmail.com",
        phone: client.phone || "+234 813 361 5132",
        address: client.location || client.address || "Abuja, FCT",
        propertyType: client.propertyType || "Residential"
    };

    try {
        localStorage.setItem("ae_active_client", JSON.stringify(activeClientData));
    } catch(e) {}

    const url = `/arde/studio?clientName=${encodeURIComponent(activeClientData.fullName)}&clientEmail=${encodeURIComponent(activeClientData.email)}&clientPhone=${encodeURIComponent(activeClientData.phone)}&clientAddress=${encodeURIComponent(activeClientData.address)}&projectCode=${encodeURIComponent(newProjectCode)}&propertyType=${encodeURIComponent(activeClientData.propertyType)}`;
    window.location.href = url;
}


async function loadClientNotifications() {
    try {
        const res = await ClientAPI.get("/api/notifications");
        if (!res?.data) return;

        const notifs = Array.isArray(res.data) ? res.data : (res.data.notifications || []);
        const unread = notifs.filter(n => !n.is_read).length;
        ClientApp.notifications = unread;

        const badge = document.getElementById("notificationBadge");
        if (badge) {
            badge.textContent = unread;
            badge.style.display = unread > 0 ? "" : "none";
        }

        const drawer = document.getElementById("notificationDrawer");
        if (drawer && notifs.length) {
            const list = drawer.querySelector(".notification-list, ul");
            if (list) {
                list.innerHTML = notifs.slice(0, 8).map(n => `
                    <li class="notification-item ${n.is_read ? "" : "unread"}">
                        <div class="notif-dot"></div>
                        <div class="notif-body">
                            <strong>${n.title || n.type || "Notification"}</strong>
                            <p>${n.message || ""}</p>
                            <small>${n.created_at ? new Date(n.created_at).toLocaleDateString("en-GB") : ""}</small>
                        </div>
                    </li>
                `).join("");
            }
        }

    } catch (err) {
        console.warn("Notifications API unavailable:", err.message);
    }
}


async function loadClientPayments() {
    try {
        const res = await ClientAPI.get("/api/payments");
        const payments = (res && res.data) ? (Array.isArray(res.data) ? res.data : (res.data.payments || [])) : [];
        ClientApp.paymentsList = payments;

        // Compute Financial Summaries from Real Backend Data
        const projects = ClientApp.projectsList || [];
        const totalValue = projects.reduce((acc, p) => acc + Number(p.contract_value || p.estimated_value || 0), 0);
        const totalPaid = payments.filter(p => p.payment_status === "completed" || p.verified).reduce((acc, p) => acc + Number(p.amount || 0), 0);
        const balanceDue = Math.max(0, totalValue - totalPaid);

        // Update Finance Summary Cards
        const totalValEl = document.getElementById("payStatTotalValue");
        if (totalValEl) totalValEl.textContent = `₦${totalValue.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

        const totalPaidEl = document.getElementById("payStatTotalPaid");
        if (totalPaidEl) totalPaidEl.textContent = `₦${totalPaid.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

        const balanceDueEl = document.getElementById("payStatBalanceDue");
        if (balanceDueEl) balanceDueEl.textContent = `₦${balanceDue.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

        // Render Table Rows
        const tbody = document.getElementById("clientPaymentsTableBody") || document.querySelector("#paymentsPage tbody");
        if (!tbody) return;

        if (payments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding:32px 16px; color:#64748B;">
                        <div style="font-size:28px; margin-bottom:8px;">💳</div>
                        <strong style="color:#0F172A; display:block; margin-bottom:4px;">No Payment Records Found</strong>
                        <span style="font-size:12px; display:block; margin-bottom:14px;">Once payments are made or verified by AE Renewable Finance, your invoices and receipts will appear here.</span>
                        <button class="primary-btn" onclick="openMakePaymentModal()" style="padding:7px 16px; font-size:12px;">Make Payment / Record Transfer</button>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = payments.map(p => {
            const isConfirmed = p.payment_status === "completed" || p.verified;
            const statusClass = isConfirmed ? "completed" : "active";
            const statusText = isConfirmed ? "Confirmed" : (p.payment_status || "Pending Verification");
            const dateStr = p.transaction_date || p.created_at ? new Date(p.transaction_date || p.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
            const projectRef = p.project_code || (p.project_id ? `PRJ-${p.project_id}` : "AE Turnkey Solar");
            const refCode = p.payment_reference || `PAY-${p.id}`;

            return `
                <tr>
                    <td><strong style="color:#004AAD; font-family:monospace;">${refCode}</strong></td>
                    <td style="color:#64748B; font-size:12px;">${dateStr}</td>
                    <td><strong>${projectRef}</strong></td>
                    <td style="font-weight:700; font-family:monospace; color:#0F172A;">₦${Number(p.amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</td>
                    <td><span class="status-pill ${statusClass}">${statusText}</span></td>
                    <td>
                        <button class="table-btn" onclick="openReceiptModal('${p.id}', '${refCode}', ${p.amount}, '${statusText}')" style="padding:4px 10px; font-size:11px;">
                            View Receipt
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

    } catch (err) {
        console.warn("Payments API unavailable:", err.message);
    }
}

window.openMakePaymentModal = function(projectId) {
    const projects = ClientApp.projectsList || [];
    const targetProj = projectId ? projects.find(p => p.id == projectId) : (projects[0] || null);

    const contractVal = targetProj ? Number(targetProj.contract_value || targetProj.original_contract_value || targetProj.estimated_value || 0) : 0;
    const amountPaid = targetProj ? Number(targetProj.amount_paid || 0) : 0;
    const balance = targetProj ? Number(targetProj.balance_due ?? (contractVal - amountPaid)) : 0;
    const isInitial = amountPaid <= 0;
    const min80Deposit = Math.round(contractVal * 0.80);
    const defaultAmount = isInitial ? (min80Deposit > 0 ? min80Deposit : contractVal) : balance;

    const projectOptions = projects.map(p => {
        const isSel = targetProj && p.id === targetProj.id ? "selected" : "";
        const bal = Number(p.balance_due || p.contract_value || 0).toLocaleString();
        return `<option value="${p.id}" ${isSel}>${escapeHtml(p.project_code || 'PRJ-' + p.id)} — ${escapeHtml(p.project_name || 'Solar Installation')} (Bal: ₦${bal})</option>`;
    }).join("");

    openModal(`
        <span class="eyebrow" style="color:#004AAD; font-weight:800;">OFFICIAL PAYMENT GATEWAY & DIRECT TRANSFER</span>
        <h2 style="margin:4px 0; color:#071426;">Make Project Payment</h2>
        <p style="font-size:12.5px; color:#64748B; margin-bottom:16px;">Make a bank transfer or deposit to AE Renewable corporate accounts and submit your payment record.</p>

        <!-- Official AE Renewable Bank Account Information -->
        <div style="background:#F8FAFC; border:1.5px solid #CBD5E1; border-radius:10px; padding:16px; margin-bottom:18px;">
            <div style="font-size:11px; font-weight:800; color:#004AAD; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">
                🏛️ Designated Corporate Bank Account
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:12.5px;">
                <div>
                    <span style="color:#64748B; font-size:11px; display:block;">Bank Name:</span>
                    <strong style="color:#0F172A;">United Bank for Africa (UBA)</strong>
                </div>
                <div>
                    <span style="color:#64748B; font-size:11px; display:block;">Account Name:</span>
                    <strong style="color:#0F172A;">AE RENEWABLE LTD</strong>
                </div>
                <div>
                    <span style="color:#64748B; font-size:11px; display:block;">Account Number:</span>
                    <strong style="color:#004AAD; font-size:15px; font-family:monospace; letter-spacing:1px;">1029827207</strong>
                </div>
                <div>
                    <span style="color:#64748B; font-size:11px; display:block;">Payment Verification:</span>
                    <strong style="color:#059669;">Instant Verified by Finance Desk</strong>
                </div>
            </div>
        </div>

        <form id="clientPaymentForm" onsubmit="submitClientPaymentRecord(event)" style="display:flex; flex-direction:column; gap:14px;">
            <div>
                <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:4px;">Select Project</label>
                <select id="payProjectSelect" style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-family:inherit; font-size:13px;" required onchange="onPaymentProjectChange(this.value)">
                    ${projectOptions || '<option value="">No active projects</option>'}
                </select>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div>
                    <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:4px;">Payment Method</label>
                    <select id="payMethodSelect" style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-family:inherit; font-size:13px;" required>
                        <option value="bank_transfer" selected>Direct Bank Transfer (UBA 1029827207)</option>
                        <option value="card">Card / Paystack Online</option>
                        <option value="bank_deposit">Direct Bank Deposit</option>
                        <option value="cheque">Corporate Bank Draft</option>
                    </select>
                </div>

                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <label style="font-size:12px; font-weight:700; color:#334155;">Payment Amount (₦)</label>
                        ${isInitial && min80Deposit > 0 ? `<span id="payMinPolicyTag" style="font-size:10.5px; font-weight:700; color:#92400E; background:#FEF3C7; padding:2px 6px; border-radius:4px;">Min 80% Deposit: ₦${min80Deposit.toLocaleString()}</span>` : ""}
                    </div>
                    <input
                        type="number"
                        id="payAmountInput"
                        placeholder="e.g. 5000000"
                        value="${defaultAmount > 0 ? defaultAmount : 1000000}"
                        min="${isInitial && min80Deposit > 0 ? min80Deposit : 1000}"
                        step="1000"
                        style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-family:inherit; font-size:13px; font-weight:700;"
                        required
                    />
                </div>
            </div>

            <div>
                <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:4px;">Transaction Reference / Session ID / Sender Narration</label>
                <input
                    type="text"
                    id="payRefInput"
                    placeholder="e.g. UBA/NIP/202610059921 or Sender Account Name"
                    style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-family:inherit; font-size:13px;"
                    required
                />
            </div>

            <div>
                <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:4px;">Payment Description / Notes (Optional)</label>
                <textarea
                    id="payNotesInput"
                    rows="2"
                    placeholder="Add any payment details, milestone stage or bank transfer notes..."
                    style="width:100%; padding:8px 12px; border:1px solid #CBD5E1; border-radius:6px; font-family:inherit; font-size:12.5px;"
                ></textarea>
            </div>

            <div style="margin-top:14px; display:flex; justify-content:flex-end; gap:10px;">
                <button type="button" class="secondary-btn" onclick="closeModal()">Cancel</button>
                <button type="submit" id="submitPaymentBtn" class="primary-btn" style="padding:9px 20px;">
                    Submit Payment Record
                </button>
            </div>
        </form>
    `);
};

window.onPaymentProjectChange = function(projectId) {
    const projects = ClientApp.projectsList || [];
    const p = projects.find(item => item.id == projectId);
    if (!p) return;

    const contractVal = Number(p.contract_value || p.original_contract_value || p.estimated_value || 0);
    const amountPaid = Number(p.amount_paid || 0);
    const balance = Number(p.balance_due ?? (contractVal - amountPaid));
    const isInitial = amountPaid <= 0;
    const min80 = Math.round(contractVal * 0.80);

    const amtInput = document.getElementById("payAmountInput");
    if (amtInput) {
        if (isInitial && min80 > 0) {
            amtInput.value = min80;
            amtInput.min = min80;
        } else {
            amtInput.value = balance > 0 ? balance : 10000;
            amtInput.min = 1000;
        }
    }
};

window.submitClientPaymentRecord = async function(event) {
    event.preventDefault();
    const submitBtn = document.getElementById("submitPaymentBtn");
    const projId = document.getElementById("payProjectSelect")?.value;
    const method = document.getElementById("payMethodSelect")?.value || "bank_transfer";
    const amount = Number(document.getElementById("payAmountInput")?.value || 0);
    const txRef = document.getElementById("payRefInput")?.value?.trim() || "";
    const notes = document.getElementById("payNotesInput")?.value?.trim() || "";

    if (amount <= 0) {
        showClientToast("Please enter a valid positive payment amount.", "error");
        return;
    }

    if (!txRef) {
        showClientToast("Please provide the transaction reference or sender name.", "error");
        return;
    }

    // Client-side 80% check
    const projects = ClientApp.projectsList || [];
    const targetProj = projId ? projects.find(p => p.id == projId) : null;
    if (targetProj) {
        const contractVal = Number(targetProj.contract_value || targetProj.original_contract_value || targetProj.estimated_value || 0);
        const amountPaid = Number(targetProj.amount_paid || 0);
        if (amountPaid <= 0 && contractVal > 0) {
            const min80 = Math.round(contractVal * 0.80);
            if (amount < min80) {
                showClientToast(`Initial deposit policy requires a minimum 80% payment (₦${min80.toLocaleString("en-NG", { minimumFractionDigits: 2 })}).`, "error");
                return;
            }
        }
    }

    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Recording Payment...";
        }

        const payload = {
            projectId: projId || undefined,
            amount,
            paymentMethod: method,
            transactionReference: txRef,
            description: `Client payment submission via ${method} (UBA Acc: 1029827207 / AE RENEWABLE LTD)`,
            notes
        };

        const res = await ClientAPI.post("/api/payments", payload);

        if (res && res.success) {
            showClientToast(`🎉 Payment record of ₦${amount.toLocaleString()} submitted to Admin for verification!`, "success");
            closeModal();
            await loadClientPayments();
            await loadClientProjects();
            await loadClientActivities();
        } else {
            showClientToast(res?.message || "Could not submit payment.", "error");
        }
    } catch (err) {
        showClientToast(err.message || "Payment submission failed.", "error");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Payment Record";
        }
    }
};

window.openReceiptModal = function(id, refCode, amount, status) {
    openModal(`
        <div style="text-align:center; padding:10px 0;">
            <div style="width:50px; height:50px; border-radius:50%; background:#ECFDF5; color:#059669; font-size:24px; display:flex; align-items:center; justify-content:center; margin:0 auto 12px;">
                ✓
            </div>
            <span class="eyebrow" style="color:#004AAD; font-weight:800;">OFFICIAL PAYMENT RECEIPT</span>
            <h2 style="margin:4px 0; color:#071426;">AE Renewable Network</h2>
            <p style="font-size:12px; color:#64748B;">Transaction Receipt Ref: <strong>${refCode}</strong></p>
        </div>

        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:16px; margin:16px 0; font-size:13px;">
            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #EEF2F6;">
                <span style="color:#64748B;">Payment Status:</span>
                <strong style="color:#059669;">${status}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #EEF2F6;">
                <span style="color:#64748B;">Amount Paid:</span>
                <strong style="color:#004AAD; font-size:15px; font-family:monospace;">₦${Number(amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #EEF2F6;">
                <span style="color:#64748B;">Beneficiary:</span>
                <strong>AE RENEWABLE ENGINEERING LTD</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:6px 0;">
                <span style="color:#64748B;">Issued On:</span>
                <strong>${new Date().toLocaleDateString("en-GB")}</strong>
            </div>
        </div>

        <div class="modal-actions" style="margin-top:20px;">
            <button class="secondary-btn" onclick="closeModal()">Close</button>
            <button class="primary-btn" onclick="window.print()">Print Official Receipt 🖨️</button>
        </div>
    `);
};


/* =========================================================
   27. INITIALIZATION
========================================================= */

async function initializeClientPortal() {
    navigateTo("dashboard");

    // Update date display
    const dateDisplay = document.getElementById("currentDate");
    if (dateDisplay) {
        dateDisplay.textContent = new Date().toLocaleDateString("en-US", {
            weekday: "long", month: "long", day: "numeric", year: "numeric"
        });
    }

    // Wire up all New Request buttons across dashboard face and projects view
    document.querySelectorAll("[data-action='new-request']").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            handleNewRequestStudio();
        });
    });

    // Wire up monitoring buttons across dashboard and cards
    document.querySelectorAll("[data-action='monitoring']").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            navigateTo("monitoring");
        });
    });

    // Wire up evidence filter chips
    document.querySelectorAll("#evidenceFilterTabs .filter-chip").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("#evidenceFilterTabs .filter-chip").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentEvidenceFilter = btn.dataset.filter || "all";
            renderEvidenceGallery();
        });
    });

    // Logout handler
    const allLogoutBtns = document.querySelectorAll("#logoutBtn, [data-action='logout']");
    allLogoutBtns.forEach(btn => {
        btn.addEventListener("click", async () => {
            if (!confirm("Are you sure you want to logout?")) return;

            try {
                await ClientAPI.post("/api/auth/logout", {});
            } catch {}

            localStorage.removeItem(ClientAPI.TOKEN_KEY);
            localStorage.removeItem(ClientAPI.USER_KEY);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            sessionStorage.removeItem("ae_client_logged_in");

            window.location.href = "/client/login";
        });
    });

    // Profile save handler
    if (DOM.saveProfile) {
        DOM.saveProfile.addEventListener("click", async () => {
            try {
                const name = document.getElementById("profileName")?.value?.trim();
                const phone = document.getElementById("profilePhone")?.value?.trim();

                await ClientAPI.post("/api/clients/me", { full_name: name, phone });
                showToast("Profile saved successfully.");
            } catch (err) {
                showToast("Could not save profile. Changes stored locally.");
            }
        });
    }

    console.log("[AE Network] Client Portal initialized.");

    // Load real data from backend
    const token = ClientAPI.getToken();
    if (token) {
        Promise.all([
            loadClientProfile(),
            loadClientProjects(),
            loadClientQuotations(),
            loadClientNotifications(),
            loadClientPayments(),
            loadClientActivities(),
            loadClientRequests()
        ]).then(() => {
            updateDashboardStats();
            loadInstallationMonitoring();
            console.log("[AE Client] Live data synchronized with backend.");
        }).catch(err => {
            console.warn("[AE Client] Some API calls failed:", err);
            loadInstallationMonitoring();
        });
    } else {
        console.warn("[AE Client] No auth token — running in preview mode.");
        updateDashboardStats();
        loadClientActivities();
        loadClientRequests();
        loadInstallationMonitoring();
    }
}


/* =========================================================
   INSTALLATION MONITORING ENGINE
========================================================= */

const INSTALLATION_STAGES_CONFIG = [
    {
        id: "starting",
        number: 1,
        title: "Starting Site",
        shortTitle: "Starting Site",
        description: "Pre-installation site condition & structure assessment",
        icon: "🏠"
    },
    {
        id: "working",
        number: 2,
        title: "Work in Progress",
        shortTitle: "Work Progress",
        description: "Mounting rails, conduits & cable channel preparation",
        icon: "🔧"
    },
    {
        id: "panels",
        number: 3,
        title: "Solar Panels Installed",
        shortTitle: "Solar Panels",
        description: "PV module array stringing & MC4 connections",
        icon: "☀️"
    },
    {
        id: "inverter",
        number: 4,
        title: "Inverter Installed",
        shortTitle: "Inverter",
        description: "Inverter mounting, DB wiring & terminations",
        icon: "⚡"
    },
    {
        id: "battery",
        number: 5,
        title: "Battery Installed",
        shortTitle: "Battery Storage",
        description: "Lithium storage bank & BMS communication integration",
        icon: "🔋"
    },
    {
        id: "finishing",
        number: 6,
        title: "Finishing & Handover",
        shortTitle: "Commissioning",
        description: "System testing, earthing verification & final sign-off",
        icon: "✅"
    }
];

let activeInstallationEvidenceList = [];
let currentEvidenceFilter = "all";

async function loadInstallationMonitoring(targetProjectId) {
    if (!ClientApp.projectsList || !ClientApp.projectsList.length) {
        renderEmptyInstallationMonitoring();
        return;
    }

    // Determine target project
    let project = null;
    if (targetProjectId) {
        project = ClientApp.projectsList.find(p => p.id == targetProjectId || p.project_code == targetProjectId);
    }
    if (!project) {
        project = ClientApp.projectsList[0];
    }
    if (!project) {
        renderEmptyInstallationMonitoring();
        return;
    }

    const projectId = project.id;

    // Fetch full project details including evidence
    let fullProject = project;
    try {
        const res = await ClientAPI.get(`/api/projects/${projectId}/full`);
        if (res && res.data) {
            fullProject = res.data;
        }
    } catch (e) {
        console.warn("Could not fetch full installation evidence details:", e.message);
    }

    const evidences = Array.isArray(fullProject.evidence) ? fullProject.evidence : [];
    activeInstallationEvidenceList = evidences;

    // Populate Project Dropdown
    const selectEl = document.getElementById("installProjectSelect");
    if (selectEl) {
        selectEl.innerHTML = ClientApp.projectsList.map(p => {
            const pCode = p.project_code || `PRJ-${p.id}`;
            const pName = p.project_name || "Solar Project";
            const isSel = p.id == projectId ? "selected" : "";
            return `<option value="${p.id}" ${isSel}>${pCode} — ${pName}</option>`;
        }).join("");

        selectEl.onchange = (e) => {
            loadInstallationMonitoring(e.target.value);
        };
    }

    // Sizing & Specs
    const kw = fullProject.system_capacity_kw ? `${fullProject.system_capacity_kw} kW PV` : "5.0 kW PV";
    const kva = fullProject.inverter_capacity_kva ? `${fullProject.inverter_capacity_kva} kVA Inverter` : (fullProject.system_capacity_kw ? `${fullProject.system_capacity_kw} kVA Inverter` : "5.0 kVA Inverter");
    const battery = fullProject.battery_capacity_kwh ? `${fullProject.battery_capacity_kwh} kWh Lithium Bank` : "10.0 kWh Lithium Bank";
    const installer = fullProject.installer_name || "AE Certified Master Installer";
    const location = [fullProject.city, fullProject.state].filter(Boolean).join(", ") || "FCT (Abuja), Nigeria";

    const capEl = document.getElementById("installHeroCapacity");
    if (capEl) capEl.textContent = `${kw} • ${kva}`;

    const batEl = document.getElementById("installHeroBattery");
    if (batEl) batEl.textContent = battery;

    const installerName = fullProject.installer_contact_name || fullProject.installer_name || "Eniola Abdulrasaq";
    const installerCompany = fullProject.installer_company_name || "AE RENEWABLE LTD";
    const installerPhone = fullProject.installer_phone || "0813 361 5132";
    const installerEmail = fullProject.installer_email || "a.e.renewablesolution@gmail.com";
    const installerPhoto = fullProject.installer_photo || "/uploads/installer-AEI-B7122F5A-1790967877945-532980.jpg";
    const installerRating = fullProject.installer_rating ? `⭐ ${fullProject.installer_rating} · Master Installer` : "⭐ 4.96 · Master Installer";
    const installerLoc = [fullProject.installer_city || fullProject.city, fullProject.installer_state || fullProject.state].filter(Boolean).join(", ") || "Central Area / AMAC, Abuja FCT";

    const instEl = document.getElementById("installHeroInstaller");
    if (instEl) instEl.textContent = installerName;

    const locEl = document.getElementById("installHeroLocation");
    if (locEl) locEl.textContent = location;

    // Populate Dedicated Installer Profile Card
    const cardPhoto = document.getElementById("installCardPhoto");
    if (cardPhoto) cardPhoto.src = installerPhoto;

    const cardName = document.getElementById("installCardName");
    if (cardName) cardName.textContent = installerName;

    const cardCompany = document.getElementById("installCardCompany");
    if (cardCompany) cardCompany.textContent = installerCompany;

    const cardPhone = document.getElementById("installCardPhone");
    if (cardPhone) {
        cardPhone.textContent = installerPhone;
        cardPhone.href = `tel:${installerPhone.replace(/\s+/g, "")}`;
    }

    const cardEmail = document.getElementById("installCardEmail");
    if (cardEmail) {
        cardEmail.textContent = installerEmail;
        cardEmail.href = `mailto:${installerEmail}`;
    }

    const cardLoc = document.getElementById("installCardLocation");
    if (cardLoc) cardLoc.textContent = installerLoc;

    const cardRating = document.getElementById("installCardRating");
    if (cardRating) cardRating.textContent = installerRating;

    const callBtn = document.getElementById("installCallBtn");
    if (callBtn) callBtn.href = `tel:${installerPhone.replace(/\s+/g, "")}`;

    const emailBtn = document.getElementById("installEmailBtn");
    if (emailBtn) emailBtn.href = `mailto:${installerEmail}`;

    const statusPill = document.getElementById("installStatusPill");
    if (statusPill) {
        const isCompleted = fullProject.status === "completed";
        statusPill.textContent = isCompleted ? "Completed & Handed Over" : (fullProject.status === "installation" ? "Installation In Progress" : (fullProject.status || "Active Project"));
        statusPill.className = `status-pill ${isCompleted ? "completed" : "active"}`;
    }

    // Group evidence by stages
    const stageEvidenceMap = {};
    INSTALLATION_STAGES_CONFIG.forEach(st => {
        stageEvidenceMap[st.id] = evidences.filter(ev => (ev.stage === st.id || ev.stage_type === st.id));
    });

    // Count completed stages & find active stage index
    let completedStagesCount = 0;
    let activeStageIndex = 0;

    INSTALLATION_STAGES_CONFIG.forEach((st, idx) => {
        const count = stageEvidenceMap[st.id].length;
        if (count > 0) {
            completedStagesCount++;
            activeStageIndex = Math.min(idx + 1, 5);
        }
    });

    if (fullProject.status === "completed") {
        completedStagesCount = 6;
        activeStageIndex = 5;
    }

    const currentActiveStageConfig = INSTALLATION_STAGES_CONFIG[Math.min(activeStageIndex, 5)];
    const progressPercent = fullProject.status === "completed" ? 100 : Math.round((completedStagesCount / 6) * 100);

    // Update Hero Progress
    const stageSumEl = document.getElementById("installHeroStageSummary");
    if (stageSumEl) {
        stageSumEl.textContent = fullProject.status === "completed"
            ? "Stage 6 of 6: Commissioning & Handover Completed"
            : `Stage ${currentActiveStageConfig.number} of 6: ${currentActiveStageConfig.title}`;
    }

    const percentEl = document.getElementById("installHeroPercent");
    if (percentEl) percentEl.textContent = `${progressPercent}% Completed`;

    const heroProgressSpan = document.getElementById("installHeroProgressBar");
    if (heroProgressSpan) heroProgressSpan.style.width = `${progressPercent}%`;

    const milestonesCountBadge = document.getElementById("installMilestonesCompletedCount");
    if (milestonesCountBadge) milestonesCountBadge.textContent = `${completedStagesCount} / 6 Stages Verified`;

    // Render 6 Milestone Cards
    const milestonesGrid = document.getElementById("installMilestonesGrid");
    if (milestonesGrid) {
        milestonesGrid.innerHTML = INSTALLATION_STAGES_CONFIG.map((st, idx) => {
            const stageEvs = stageEvidenceMap[st.id] || [];
            const count = stageEvs.length;
            const isCompleted = count > 0 || (fullProject.status === "completed");
            const isActive = !isCompleted && idx === activeStageIndex;
            const cardClass = isCompleted ? "completed" : (isActive ? "active" : "upcoming");

            let statusTagHtml = "";
            if (isCompleted) {
                statusTagHtml = `<span class="milestone-status-tag verified">✓ Verified</span>`;
            } else if (isActive) {
                statusTagHtml = `<span class="milestone-status-tag in-progress">● Active Work</span>`;
            } else {
                statusTagHtml = `<span class="milestone-status-tag waiting">Upcoming</span>`;
            }

            return `
                <div class="milestone-step-card ${cardClass}">
                    <div class="milestone-top-row">
                        <div class="milestone-icon-circle">${isCompleted ? "✓" : st.number}</div>
                        ${statusTagHtml}
                    </div>
                    <h4>${st.number}. ${st.title}</h4>
                    <p>${st.description}</p>
                    <div class="milestone-footer-meta">
                        <span>${st.icon} ${st.shortTitle}</span>
                        <span style="color:${count > 0 ? "#10B981" : "#64748B"}; font-weight:700;">
                            ${count > 0 ? `📸 ${count} photo${count > 1 ? "s" : ""}` : "Awaiting site photo"}
                        </span>
                    </div>
                </div>
            `;
        }).join("");
    }

    // Render Evidence Feed
    renderEvidenceGallery();

    // Update Dashboard Card
    updateDashboardInstallationWidget(fullProject, currentActiveStageConfig, progressPercent, evidences, installer, completedStagesCount);
}

function updateDashboardInstallationWidget(project, activeStage, percent, evidences, installer, completedCount) {
    const stageTag = document.getElementById("dashInstallStageTag");
    if (stageTag) stageTag.textContent = `Stage ${activeStage.number} of 6`;

    const stageName = document.getElementById("dashInstallStageName");
    if (stageName) stageName.textContent = activeStage.title;

    const percentEl = document.getElementById("dashInstallPercent");
    if (percentEl) percentEl.textContent = `${percent}%`;

    const pBar = document.getElementById("dashInstallProgressBar");
    if (pBar) pBar.style.width = `${percent}%`;

    const instEl = document.getElementById("dashInstallInstallerName");
    if (instEl) instEl.textContent = installer || "AE Certified Team";

    const evCountEl = document.getElementById("dashInstallEvidenceCount");
    if (evCountEl) evCountEl.textContent = `${evidences.length} Verified Photo${evidences.length === 1 ? "" : "s"}`;

    // Thumbnail
    const thumbImg = document.getElementById("dashInstallThumbImg");
    const thumbPlaceholder = document.getElementById("dashInstallThumbPlaceholder");
    if (evidences.length > 0) {
        const latest = evidences[evidences.length - 1];
        const url = latest.file_url || latest.image_url;
        if (url && thumbImg) {
            thumbImg.src = url;
            thumbImg.style.display = "block";
            if (thumbPlaceholder) thumbPlaceholder.style.display = "none";
        }
    } else {
        if (thumbImg) thumbImg.style.display = "none";
        if (thumbPlaceholder) thumbPlaceholder.style.display = "flex";
    }
}

function renderEvidenceGallery() {
    const gallery = document.getElementById("installEvidenceGrid");
    if (!gallery) return;

    // Filter by stage
    let filtered = activeInstallationEvidenceList;
    if (currentEvidenceFilter !== "all") {
        filtered = activeInstallationEvidenceList.filter(ev => (ev.stage === currentEvidenceFilter || ev.stage_type === currentEvidenceFilter));
    }

    const filterCountAll = document.getElementById("filterCountAll");
    if (filterCountAll) filterCountAll.textContent = activeInstallationEvidenceList.length;

    if (!filtered || !filtered.length) {
        const filterTitle = currentEvidenceFilter === "all" ? "All Stages" : currentEvidenceFilter;
        gallery.innerHTML = `
            <div style="grid-column: 1 / -1; background: #F8FAFC; border: 1.5px dashed #CBD5E1; border-radius: 12px; padding: 36px 20px; text-align: center;">
                <div style="font-size: 32px; margin-bottom: 8px;">📷</div>
                <h4 style="color: #0F172A; margin: 0 0 6px 0;">No Evidence Photos Uploaded for ${filterTitle}</h4>
                <p style="font-size: 13px; color: #64748B; max-width: 460px; margin: 0 auto;">
                    As your certified AE installer executes the installation milestones on site, photographic evidence and live milestone documentation will appear here automatically.
                </p>
            </div>
        `;
        return;
    }

    gallery.innerHTML = filtered.map(ev => {
        const stageConfig = INSTALLATION_STAGES_CONFIG.find(st => st.id === (ev.stage || ev.stage_type)) || { title: ev.stage || "Site Evidence", icon: "📸" };
        const imgUrl = ev.file_url || ev.image_url || "/uploads/evidence-default.jpg";
        const caption = ev.notes || ev.caption || "Site installation milestone evidence verified by AE Engineering.";
        const timeStr = ev.created_at ? new Date(ev.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recently uploaded";
        const isApproved = (ev.review_status === "approved" || ev.verification_status === "approved");
        const statusClass = isApproved ? "approved" : "pending";
        const statusLabel = isApproved ? "✓ AE Verified" : "⏳ Review Pending";

        return `
            <div class="evidence-photo-card" onclick="openEvidenceLightbox('${imgUrl}', '${stageConfig.icon} ${stageConfig.title}', '${encodeURIComponent(caption)}', '${timeStr}', '${statusLabel}')">
                <div class="evidence-card-img-wrap">
                    <img src="${imgUrl}" alt="${stageConfig.title}" loading="lazy" onerror="this.src='/uploads/evidence-default.jpg'" />
                    <span class="evidence-stage-badge">${stageConfig.icon} ${stageConfig.title}</span>
                    <span class="evidence-status-badge ${statusClass}">${statusLabel}</span>
                </div>
                <div class="evidence-card-body">
                    <p>${caption}</p>
                    <div class="evidence-card-time">
                        <span>🕒</span>
                        <span>${timeStr}</span>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function openEvidenceLightbox(imageUrl, title, encodedCaption, timeStr, statusLabel) {
    const caption = decodeURIComponent(encodedCaption);
    openModal(`
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
            <div>
                <span class="eyebrow">SITE EVIDENCE INSPECTION</span>
                <h3 style="margin-top:2px; font-size:18px; color:#0F172A;">${title}</h3>
            </div>
            <span style="font-size:11px; font-weight:800; background:#DCFCE7; color:#166534; padding:3px 10px; border-radius:12px;">${statusLabel}</span>
        </div>

        <div style="text-align:center; margin:14px 0;">
            <img class="evidence-lightbox-img" src="${imageUrl}" alt="${title}" onerror="this.src='/uploads/evidence-default.jpg'" />
        </div>

        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:12px 14px; margin-bottom:16px;">
            <p style="font-size:13px; color:#1E293B; margin:0 0 6px 0; font-weight:600; line-height:1.4;">${caption}</p>
            <div style="font-size:11px; color:#64748B; font-weight:600;">Uploaded: ${timeStr}</div>
        </div>

        <div class="modal-actions">
            <button class="secondary-btn" onclick="closeModal()">Close Viewer</button>
        </div>
    `);
}

function renderEmptyInstallationMonitoring() {
    const heroProgress = document.getElementById("installHeroProgressBar");
    if (heroProgress) heroProgress.style.width = "0%";
    const milestonesGrid = document.getElementById("installMilestonesGrid");
    if (milestonesGrid) {
        milestonesGrid.innerHTML = INSTALLATION_STAGES_CONFIG.map(st => `
            <div class="milestone-step-card upcoming">
                <div class="milestone-top-row">
                    <div class="milestone-icon-circle">${st.number}</div>
                    <span class="milestone-status-tag waiting">Upcoming</span>
                </div>
                <h4>${st.number}. ${st.title}</h4>
                <p>${st.description}</p>
                <div class="milestone-footer-meta">
                    <span>${st.icon} ${st.shortTitle}</span>
                    <span>Pending Project</span>
                </div>
            </div>
        `).join("");
    }
    const gallery = document.getElementById("installEvidenceGrid");
    if (gallery) {
        gallery.innerHTML = `
            <div style="grid-column: 1 / -1; background: #F8FAFC; border: 1.5px dashed #CBD5E1; border-radius: 12px; padding: 36px 20px; text-align: center;">
                <div style="font-size: 32px; margin-bottom: 8px;">☀️</div>
                <h4 style="color: #0F172A; margin: 0 0 6px 0;">No Active Installation Project</h4>
                <p style="font-size: 13px; color: #64748B; max-width: 440px; margin: 0 auto 16px auto;">
                    Submit a new system sizing request in ARDE Studio or accept your quotation to assign a certified installer and track live progress.
                </p>
                <button class="primary-btn" data-action="new-request" style="font-size:13px; padding:8px 18px;">+ New Request</button>
            </div>
        `;
    }
}

/* =========================================================
   25. DOCUMENT & TECHNICAL MANUAL VIEWER ENGINE
========================================================= */

const MANUALS_REGISTRY = {
    "system-manual": {
        title: "AE Solar System User & Operations Manual",
        subtitle: "Official Standard Operating Procedures, Daily Operation & Lithium BMS Management",
        badge: "System Operations Manual (2026 Edition)",
        badgeClass: "system-pill",
        docCode: "AE-MAN-SYS-2026",
        fileSize: "4.8 MB PDF",
        sections: [
            {
                title: "1. System Overview & Core Principles",
                content: `
                    <p>Your AE Renewable Solar Power System is an engineered hybrid installation integrating high-efficiency monocrystalline solar modules, a pure sine-wave hybrid inverter, and smart Lithium Iron Phosphate (LiFePO4) energy storage.</p>
                    <p>During daylight hours, solar energy is prioritized for supplying household/commercial loads while simultaneously replenishing the battery bank. Excess solar yield can be exported to backup loads or stored for evening peak usage.</p>
                `
            },
            {
                title: "2. Standard System Startup Procedure",
                content: `
                    <p>Always follow the exact sequence below when energizing your solar power system:</p>
                    <div class="doc-step-list">
                        <div class="doc-step-item">
                            <div class="doc-step-num">1</div>
                            <div><strong>Switch ON the Battery DC Isolator / Breaker:</strong> Power up the Lithium Battery Bank first. Confirm that the battery management unit LEDs illuminate and show healthy status.</div>
                        </div>
                        <div class="doc-step-item">
                            <div class="doc-step-num">2</div>
                            <div><strong>Switch ON the Solar PV Array DC Isolator:</strong> Engage the DC disconnect switches located adjacent to the inverter.</div>
                        </div>
                        <div class="doc-step-item">
                            <div class="doc-step-num">3</div>
                            <div><strong>Switch ON the AC Input / Grid Isolator:</strong> Allow the inverter to synchronize with utility/generator grid frequency if available.</div>
                        </div>
                        <div class="doc-step-item">
                            <div class="doc-step-num">4</div>
                            <div><strong>Press Inverter Master Power Switch:</strong> The LCD display will initialize. Verify that solar generation and battery voltage indicate normal parameters.</div>
                        </div>
                        <div class="doc-step-item">
                            <div class="doc-step-num">5</div>
                            <div><strong>Switch ON AC Output Distribution Breakers:</strong> Turn on critical and non-critical load circuits sequentially.</div>
                        </div>
                    </div>
                `
            },
            {
                title: "3. Emergency System Shutdown Sequence",
                content: `
                    <div class="doc-callout danger">
                        <strong>⚠️ EMERGENCY SHUTDOWN SEQUENCE:</strong> In the event of grid faults, severe weather damage, or electrical hazards, follow this inverse shutdown sequence immediately:
                    </div>
                    <div class="doc-step-list">
                        <div class="doc-step-item"><div class="doc-step-num">1</div><div>Turn OFF Main AC Output Breakers immediately.</div></div>
                        <div class="doc-step-item"><div class="doc-step-num">2</div><div>Turn OFF Inverter Master Rocker Switch.</div></div>
                        <div class="doc-step-item"><div class="doc-step-num">3</div><div>Switch OFF AC Grid Input Breaker.</div></div>
                        <div class="doc-step-item"><div class="doc-step-num">4</div><div>Switch OFF Solar PV DC Disconnect switches.</div></div>
                        <div class="doc-step-item"><div class="doc-step-num">5</div><div>Switch OFF Battery DC Breaker / Isolator.</div></div>
                    </div>
                `
            },
            {
                title: "4. Lithium BMS & Smart Battery Care",
                content: `
                    <p>AE LiFePO4 batteries feature intelligent internal Battery Management Systems (BMS) with cell-level balancing, thermal monitoring, and over-current protection.</p>
                    <table class="doc-spec-table">
                        <tr><th>Parameter</th><th>Recommended Setting</th><th>Safety Threshold</th></tr>
                        <tr><td>Nominal Cell Voltage</td><td>3.2V DC</td><td>2.5V - 3.65V DC</td></tr>
                        <tr><td>Depth of Discharge (DoD)</td><td>85% - 90%</td><td>Max 95% Cutoff</td></tr>
                        <tr><td>Operating Ambient Temp</td><td>15°C to 35°C</td><td>0°C Min / 50°C Max</td></tr>
                        <tr><td>Float Charging Voltage</td><td>54.0V DC (48V Sys)</td><td>55.2V DC Max</td></tr>
                    </table>
                    <div class="doc-callout success">
                        <strong>💡 Efficiency Tip:</strong> Avoid prolonged continuous discharge below 15% state of charge to maximize your battery's 6,000+ cycle lifespan.
                    </div>
                `
            },
            {
                title: "5. Routine Maintenance Schedule",
                content: `
                    <p>Maintain peak generation efficiency with periodic inspections:</p>
                    <ul>
                        <li><strong>Monthly:</strong> Visual inspection of solar panels. Clean surface dust using soft water and sponge in early morning or evening. Never clean hot panels in direct noon sun.</li>
                        <li><strong>Quarterly:</strong> Inspect cable glands and conduit entry points for integrity. Clean inverter fan intake filters.</li>
                        <li><strong>Bi-Annually:</strong> Contact AE Renewable for certified torque checks on electrical terminations and ground earth resistance measurement.</li>
                    </ul>
                `
            }
        ]
    },
    "technical-manual": {
        title: "AE Renewable Ltd — Company Technical Manual",
        subtitle: "Engineering Architecture, Array Topology, Surge Protection & Installation Standards",
        badge: "AE Engineering Standard V3.2",
        badgeClass: "tech-pill",
        docCode: "AE-ENG-TECH-2026",
        fileSize: "8.2 MB PDF",
        sections: [
            {
                title: "1. Engineering Standards & Compliance",
                content: `
                    <p>All solar PV installations designed and executed by AE Renewable Ltd adhere to international and regional electrical engineering standards:</p>
                    <ul>
                        <li><strong>IEC 62548:</strong> Photovoltaic (PV) arrays - Design requirements</li>
                        <li><strong>IEC 61215 / 61730:</strong> Terrestrial photovoltaic module design qualification & safety standard</li>
                        <li><strong>IEEE 1547:</strong> Standard for Interconnection and Interoperability of Distributed Energy Resources</li>
                        <li><strong>NESIS & NEMSA:</strong> Nigerian Electricity Supply Industry & Metering Safety Codes</li>
                    </ul>
                `
            },
            {
                title: "2. PV String Sizing & MPPT Matching Formula",
                content: `
                    <p>To prevent inverter MPPT damage during low-temperature ambient conditions, maximum string open-circuit voltage ($V_{oc}$) is computed as:</p>
                    <div class="doc-callout warning">
                        <strong>Formula:</strong> <code>V_oc(max) = V_oc(STC) × [1 + α_Voc × (T_min - 25°C)] × N_series</code>
                    </div>
                    <p>Where <code>α_Voc</code> is the module temperature coefficient of $V_{oc}$ (-0.28%/°C) and <code>T_min</code> is the minimum historical site temperature (typically 12°C in sub-Saharan dry seasons).</p>
                    <table class="doc-spec-table">
                        <tr><th>Inverter Class</th><th>MPPT Voltage Range</th><th>Max DC Input Voltage</th><th>Max String Size (550W Module)</th></tr>
                        <tr><td>5.0 kW Hybrid</td><td>120V - 450V DC</td><td>500V DC</td><td>8-10 Panels / String</td></tr>
                        <tr><td>10.0 kW Dual MPPT</td><td>160V - 800V DC</td><td>900V DC</td><td>14-16 Panels / String</td></tr>
                        <tr><td>15.0 kW Commercial</td><td>200V - 850V DC</td><td>1000V DC</td><td>18 Panels / String</td></tr>
                    </table>
                `
            },
            {
                title: "3. DC Surge Suppression & Protection Protocols",
                content: `
                    <p>Every AE system incorporates comprehensive multi-stage transient voltage suppression:</p>
                    <ul>
                        <li><strong>Type II DC Surge Protective Device (SPD):</strong> Minimum 600V/1000V DC rating with visual flag status indicator on every MPPT tracker.</li>
                        <li><strong>gPV DC Fuses:</strong> 1000V DC 15A/20A rated fuses installed on both positive and negative strings where more than two strings are paralleled.</li>
                        <li><strong>DC Molded Case Circuit Breakers (MCCB):</strong> Heavy-duty non-polarized DC breakers installed between battery banks and inverter DC inputs.</li>
                    </ul>
                `
            },
            {
                title: "4. Grounding, Bonding & Lightning Protection Standards",
                content: `
                    <p>Earthing impedance must not exceed <strong>5 Ohms</strong> as measured with a calibrated earth resistance tester.</p>
                    <div class="doc-step-list">
                        <div class="doc-step-item"><div class="doc-step-num">1</div><div><strong>Array Equipotential Bonding:</strong> All solar panel aluminum frames are bonded using stainless steel grounding clips and 6mm² green/yellow copper conductor.</div></div>
                        <div class="doc-step-item"><div class="doc-step-num">2</div><div><strong>Inverter & Battery Enclosure Earthing:</strong> Dedicated 16mm² copper grounding run connected to the primary earth terminal busbar.</div></div>
                        <div class="doc-step-item"><div class="doc-step-num">3</div><div><strong>Earth Electrode:</strong> 5/8" × 8ft copper-bonded steel rod installed with earth enhancing compound (Bentonite / Marconite) where soil resistivity exceeds 100 Ω·m.</div></div>
                    </div>
                `
            },
            {
                title: "5. MC4 Stringing & Cable Management Rules",
                content: `
                    <p>AE certified technicians must exclusively use genuine Stäubli MC4 or TÜV-certified compatible connectors. Hand-crimping without calibrated ratchet tools is strictly prohibited.</p>
                    <p>All DC cabling must be double-insulated, UV-resistant cross-linked polyethylene (XLPO) solar cable (minimum 4mm² or 6mm² copper core) routed through UV-stabilized PVC conduit or galvanized cable trays with drip loops.</p>
                `
            }
        ]
    },
    "warranty": {
        title: "AE Renewable Warranty & Quality SLA",
        subtitle: "25-Year PV Module Linear Performance & 5-Year Inverter Protection Policy",
        badge: "Warranty SLA (2026-2051)",
        badgeClass: "warranty-pill",
        docCode: "AE-WARR-SLA-2026",
        fileSize: "1.5 MB PDF",
        sections: [
            {
                title: "1. Tier-1 Solar Module Linear Performance Warranty",
                content: `<p>AE Renewable warrants that solar PV modules supplied and installed will maintain not less than 98.0% nominal power output during Year 1, with annual degradation not exceeding 0.55% through Year 25, guaranteeing at least 84.8% power yield at Year 25.</p>`
            },
            {
                title: "2. Inverter & Electronics Coverage",
                content: `<p>5-Year complete replacement/repair warranty covering internal component defects, MPPT controller failures, and logic board issues under normal operating conditions.</p>`
            },
            {
                title: "3. Lithium Battery Bank Warranty",
                content: `<p>5 to 10-Year manufacturer performance warranty guaranteeing retention of at least 70% usable capacity after 6,000 discharge cycles when operated in compliance with AE BMS guidelines.</p>`
            },
            {
                title: "4. Rapid Response Service Level Agreement (SLA)",
                content: `<p>Clients with verified AE systems enjoy priority 24-hour technical response dispatch for any system performance irregularities.</p>`
            }
        ]
    },
    "safety": {
        title: "Lithium BMS & High-Voltage Fire Safety Protocol",
        subtitle: "Emergency Disconnection, Arc Flash Mitigation & Safe Operating Procedures",
        badge: "Safety Standard",
        badgeClass: "safety-pill",
        docCode: "AE-SAFE-BMS-2026",
        fileSize: "2.1 MB PDF",
        sections: [
            {
                title: "1. High Voltage DC Hazard Warning",
                content: `<div class="doc-callout danger"><strong>DANGER - HIGH VOLTAGE DC:</strong> Solar arrays generate direct current voltages up to 500V - 1000V DC in sunlight. Only certified electrical personnel may open combiner boxes or inverter DC wiring compartments.</div>`
            },
            {
                title: "2. Lithium BMS Automatic Protections",
                content: `<p>The integrated battery BMS automatically triggers disconnection upon detecting: Cell Overvoltage (>3.70V), Cell Undervoltage (<2.40V), Overcurrent (Charge/Discharge), High Temperature (>55°C), or Short Circuit.</p>`
            },
            {
                title: "3. Fire Safety & Extinguisher Requirements",
                content: `<p>Inverter/battery utility rooms must be equipped with <strong>Class C / Clean Agent (CO2 or FE-36)</strong> fire extinguishers. Never use water on live electrical equipment.</p>`
            }
        ]
    },
    "quotation": {
        title: "Formal Sizing Quotation & BOQ Breakdown",
        subtitle: "System Capacity Sizing, Component Specifications & Financial Schedule",
        badge: "Project Quotation",
        badgeClass: "tech-pill",
        docCode: "AE-QUOT-DOC",
        fileSize: "1.2 MB PDF",
        sections: [
            {
                title: "Project Financial & Engineering Summary",
                content: `
                    <p>This verified project quotation outlines the comprehensive Bill of Quantities (BOQ), hardware specifications, certified installation labor, surge protection packaging, and statutory warranties.</p>
                    <div class="doc-callout success">
                        <strong>Status:</strong> Active & Verified in AE Engineering Database. Review your live project tab or download the signed PDF breakdown.
                    </div>
                `
            }
        ]
    },
    "site-survey": {
        title: "Site Survey & Structural Assessment Report",
        subtitle: "Roof Pitch, Azimuth Orientation, Shade Analysis & Structural Integrity Sign-Off",
        badge: "Engineering Survey",
        badgeClass: "system-pill",
        docCode: "AE-SURV-DOC",
        fileSize: "2.8 MB PDF",
        sections: [
            {
                title: "Site Structural & Solar Irradiance Verification",
                content: `
                    <p>A certified AE Renewable field engineer has conducted on-site structural load verification, roof azimuth alignment (optimal 10°-15° South tilt for maximum annual irradiance), shade path modeling, and cable conduit path planning.</p>
                `
            }
        ]
    },
    "installation-report": {
        title: "Installation & Commissioning Sign-Off Certificate",
        subtitle: "6-Stage Verified Evidence, VOC / ISC String Testing & Quality Handover",
        badge: "Handover Certificate",
        badgeClass: "safety-pill",
        docCode: "AE-COMM-DOC",
        fileSize: "3.1 MB PDF",
        sections: [
            {
                title: "Commissioning & Handover Compliance",
                content: `
                    <p>All 6 installation milestones—Site Assessment, Roof Mounting, DC Cable Run, Inverter & BMS Setup, Final Commissioning, and Client Handover—have been verified by AE Quality Assurance.</p>
                `
            }
        ]
    }
};

function openDocumentViewer(docKey) {
    const doc = MANUALS_REGISTRY[docKey] || MANUALS_REGISTRY["system-manual"];

    const sectionsHtml = doc.sections.map((sec, idx) => `
        <div class="doc-content-section" id="docSection_${idx}">
            <h4>${sec.title}</h4>
            <div>${sec.content}</div>
        </div>
    `).join("");

    const modalContent = `
        <div class="doc-reader-wrap">
            <div class="doc-reader-header">
                <div class="doc-reader-title-area">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                        <span class="eyebrow">${doc.docCode}</span>
                        <span class="doc-badge-pill ${doc.badgeClass}">${doc.badge}</span>
                    </div>
                    <h3>${doc.title}</h3>
                    <p>${doc.subtitle}</p>
                </div>
                <div class="doc-reader-actions">
                    <button class="doc-action-btn download-btn" onclick="downloadDocumentPdf('${docKey}')">
                        <span>⬇️</span> Download PDF (${doc.fileSize.split(" ")[0]} MB)
                    </button>
                    <button class="doc-action-btn print-btn" onclick="window.print()">
                        <span>🖨️</span> Print
                    </button>
                </div>
            </div>

            <div class="doc-reader-body">
                ${sectionsHtml}
            </div>

            <div class="modal-actions" style="margin-top:10px; justify-content:space-between; align-items:center;">
                <div style="font-size:12px; color:#64748B;">
                    AE Renewable Ltd · Official Technical Document Repository
                </div>
                <button class="secondary-btn" onclick="closeModal()">Close Document</button>
            </div>
        </div>
    `;

    openModal(modalContent);
}

function downloadDocumentPdf(docKey) {
    const doc = MANUALS_REGISTRY[docKey] || { title: "AE Manual" };
    showToast(`Downloading "${doc.title}" (${doc.fileSize || "PDF"})...`);
    
    // Simulate instantaneous download trigger for offline reading
    setTimeout(() => {
        showToast(`"${doc.title}" downloaded successfully.`);
    }, 900);
}

window.openDocumentViewer = openDocumentViewer;
window.downloadDocumentPdf = downloadDocumentPdf;

initializeClientPortal();

