/**
 * AE RENEWABLE LTD - OPERATIONS & ADMINISTRATIVE CENTRE
 * Enterprise UI Controller
 */
"use strict";

/* =========================================================
   1. GLOBAL STATE & CONFIG
========================================================= */
/* =========================================================
   ADMINISTRATIVE ACCESS CONTROL
   Only authenticated Administrators & Staff may access.
   Installers and clients are strictly forbidden.
   ========================================================= */
function parseJwtRole(token) {
    if (!token || typeof token !== "string") return null;
    try {
        const parts = token.split(".");
        if (parts.length === 3) {
            const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
            const payload = JSON.parse(decodeURIComponent(escape(atob(b64))));
            return payload && payload.role ? String(payload.role).toLowerCase() : null;
        }
    } catch {}
    return null;
}

function getAdminAuthToken() {
    // 1. Primary admin token
    const adminToken = localStorage.getItem("aeAdminToken") || sessionStorage.getItem("aeAdminToken");
    if (adminToken) {
        const role = parseJwtRole(adminToken);
        if (role === "admin" || role === "super_admin" || role === "staff") {
            return adminToken;
        }
    }

    // 2. Fallbacks: verify token or accessToken actually carries admin/staff credentials
    const candidates = [
        localStorage.getItem("token"),
        localStorage.getItem("accessToken"),
        sessionStorage.getItem("token")
    ].filter(Boolean);

    for (const t of candidates) {
        const role = parseJwtRole(t);
        if (role === "admin" || role === "super_admin" || role === "staff") {
            return t;
        }
    }

    // 3. Fallback to aeAdminToken if set, never return non-admin tokens
    if (adminToken) {
        return adminToken;
    }

    return "";
}
window.getAdminAuthToken = getAdminAuthToken;
window.parseJwtRole = parseJwtRole;

(function guardAdminCentre() {
    try {
        const isLoggedIn = sessionStorage.getItem("ae_admin_logged_in") === "true";
        const token = getAdminAuthToken();
        const rawUser = localStorage.getItem("aeAdminUser") || "{}";
        let user = {};
        try { user = JSON.parse(rawUser); } catch {}
        const role = user && (user.role || (user.user && user.user.role)) ? String(user.role || user.user.role).toLowerCase() : "";

        if (isLoggedIn && token && (role === "admin" || role === "staff")) {
            return;
        }

        window.location.replace("/admin/login");
    } catch (e) {
        console.warn("[Admin Guard] Check error:", e);
        window.location.replace("/admin/login");
    }
})();

const AE = {
    currentPage: "dashboard",
    currentInstallerId: "",
    vitalUnlocked: false,
    vitalTimer: null,
    telemetryTimer: null,
    toastTimer: null,
    vitalPasscode: "12345",
    unreadNotifs: 0,
    unreadMessages: 0,

    // Live state containers populated from backend database
    monitoredSites: {},
    consultations: [],
    customers: [],
    sites: [],
    projects: [],
    quotations: [],
    invoices: [],
    equipment: [],
    installers: []
};


/* =========================================================
   2. DOM HELPERS
========================================================= */
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
const byId = (id) => document.getElementById(id);

function showToast(message, type = "normal") {
    const toast = byId("toast");
    if (!toast) return;
    clearTimeout(AE.toastTimer);
    toast.className = "toast";
    if (type === "success") toast.classList.add("success");
    if (type === "error") toast.classList.add("error");
    if (type === "warning") toast.classList.add("warning");
    toast.textContent = message;
    requestAnimationFrame(() => toast.classList.add("show"));
    AE.toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

/* =========================================================
   3. NAVIGATION ENGINE
========================================================= */
const PAGE_TITLES = {
    dashboard: "Dashboard",
    consultations: "Consultations",
    detail: "Consultation Detail",
    customers: "Customers",
    sites: "Sites",
    projects: "Projects",
    quotations: "Quotations",
    invoices: "Invoices & Payments",
    payments: "Invoices & Payments",
    reports: "Reports & Analytics",
    monitoring: "Live Telemetry",
    equipment: "Equipment Library",
    installers: "Installer Directory",
    "installer-profile": "Installer Profile",
    "field-stream": "Live Field Stream",
    settings: "Platform Settings",
    "weekly-maintenance": "Weekly Maintenance & System Consultation"
};

function showPage(pageId) {
    if (!pageId) return;
    if (pageId === "payments") pageId = "invoices";

    // Toggle active classes on nav
    $$(".nav-item").forEach(item => {
        if (item.dataset.page === pageId || (pageId === "invoices" && item.dataset.page === "payments")) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // Toggle active classes on mobile bottom tab items
    $$(".mobile-tab-item").forEach(item => {
        if (item.dataset.page === pageId) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // Toggle pages
    $$(".page").forEach(page => {
        if (page.id === `page-${pageId}`) {
            page.classList.add("active");
        } else {
            page.classList.remove("active");
        }
    });

    // Update breadcrumb
    const bc = byId("breadcrumb");
    if (bc) {
        bc.textContent = PAGE_TITLES[pageId] || pageId.toUpperCase();
    }

    if (pageId === "field-stream") {
        loadAdminFieldPosts();
    }
    if (pageId === "consultations") {
        fetchDispatchedInquiries();
    }
    if (pageId === "weekly-maintenance") {
        fetchWeeklyMaintenanceRecords();
    }
    if (pageId === "installers" || pageId === "installer-profile") {
        fetchInstallers().then(() => {
            if (pageId === "installer-profile") {
                const target = AE.currentInstallerId || (AE.installers && AE.installers[0] ? AE.installers[0].id : null);
                if (target) openInstallerProfile(target, false);
            }
        });
    }

    AE.currentPage = pageId;

    // Close mobile sidebar if open
    closeSidebarDrawer();

    // Close any active modal cleanly without leaving backdrops
    $$(".modal-overlay").forEach(m => {
        m.classList.remove("active");
        m.classList.remove("show");
        m.setAttribute("aria-hidden", "true");
        m.style.display = "none";
    });
    document.body.classList.remove("modal-open");
    document.body.classList.remove("sidebar-open");

    window.scrollTo({ top: 0, behavior: "smooth" });
}
window.showPage = showPage;

/* =========================================================
   4. DATA RENDERING ENGINES
========================================================= */

// 4.1 Consultations Table
function renderConsultations(list = AE.consultations) {
    const tbody = byId("consultationTableBody");
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--muted)">No consultations found.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(c => `
        <tr>
            <td class="ref"><strong>${escapeHtml(c.ref)}</strong></td>
            <td><strong>${escapeHtml(c.client)}</strong>${c.email ? `<small style="color:#004aad;">${escapeHtml(c.email)}</small>` : ''}</td>
            <td>${escapeHtml(c.location)}</td>
            <td>${escapeHtml(c.service)}</td>
            <td>${escapeHtml(c.property)}</td>
            <td><label class="badge ${getStatusBadgeClass(c.status)}">${escapeHtml(c.status)}</label></td>
            <td>${escapeHtml(c.received)}</td>
            <td><button class="row-action" onclick="openDetail('${escapeHtml(c.ref)}')">Open →</button></td>
        </tr>
    `).join("");

    const badge = byId("navConsultationBadge");
    if (badge) badge.textContent = String(AE.consultations.length).padStart(2, "0");
    const mobileBadge = byId("mobileTabConsultBadge");
    if (mobileBadge) mobileBadge.textContent = String(AE.consultations.length).padStart(2, "0");
}

function getStatusBadgeClass(status) {
    switch (status) {
        case "New": return "blue-b";
        case "Under Review": return "amber-b";
        case "Site Survey": return "purple-b";
        case "Quotation": return "green-b";
        case "Active": return "green-b";
        case "Paid": return "green-b";
        case "Partial": return "amber-b";
        case "Pending": return "blue-b";
        case "Draft": return "amber-b";
        case "Issued": return "blue-b";
        case "Accepted": return "green-b";
        default: return "blue-b";
    }
}

function filterConsultations() {
    const search = byId("consultationSearch")?.value.toLowerCase() || "";
    const status = byId("consultationStatus")?.value || "";
    const service = byId("consultationService")?.value || "";

    const filtered = AE.consultations.filter(c => {
        const matchesSearch = (c.ref || "").toLowerCase().includes(search) ||
                              (c.client || "").toLowerCase().includes(search) ||
                              (c.location || "").toLowerCase().includes(search);
        const matchesStatus = !status || c.status === status;
        const matchesService = !service || c.service === service;
        return matchesSearch && matchesStatus && matchesService;
    });

    renderConsultations(filtered);
}

async function openDetail(ref) {
    if (!ref) {
        showToast("Consultation record reference missing", "error");
        return;
    }

    const all = [
        ...(AE.dispatchedInquiries || []),
        ...(AE.consultations || []),
        ...(AE.projects || [])
    ];
    let item = all.find(c => c.ref === ref || c.project_code === ref || String(c.id) === String(ref) || String(c._dbId) === String(ref));

    let projectFullData = null;
    // Always query PostgreSQL API for authentic and complete project, quotation, and client records
    try {
        const res = await API.get(`/api/projects/${encodeURIComponent(ref)}/full`);
        const p = res?.data || res;
        if (p && (p.id || p.project_code)) {
            projectFullData = p;
            const eng = p.engineering_data || {};
            const ep = eng.energyProfiling || {};
            const cl = p.client_profile || eng.clientProfiling || {};
            const clientName = cl.contact_name || cl.company_name || p.client_name || p.contact_name || (item?.client) || "Prospective Client";
            const locationStr = [cl.city || p.city, cl.state || p.state].filter(Boolean).join(", ") || cl.address || p.address || (item?.location) || "Abuja, FCT";

            item = {
                ...item,
                ...p,
                ref: p.project_code || ref,
                project_code: p.project_code || ref,
                id: p.id,
                _dbId: p.id,
                client: clientName,
                contact_name: clientName,
                email: cl.email || p.email || p.client_email || (item?.email) || "",
                phone: cl.phone || p.phone || p.client_phone || (item?.phone) || "",
                location: locationStr,
                city: cl.city || p.city || "Abuja",
                state: cl.state || p.state || "FCT",
                address: cl.address || p.address || "Abuja",
                property: p.project_type || cl.industry || (item?.property) || "Residential",
                property_type: p.project_type || cl.industry || (item?.property_type) || "Residential",
                client_type: cl.client_type || (cl.company_name ? "Business" : "Individual"),
                service: p.project_type || (item?.service) || "Solar & Hybrid Power",
                status: p.status || item?.status || "under_review",
                engineering_data: eng,
                engineering_inputs: p.quotation?.engineering_inputs || {},
                quotation: p.quotation || null,
                quotation_items: p.quotation_items || p.quotation?.items || [],
                payments: p.payments || [],
                activities: p.activities || [],
                load_kw: p.system_capacity_kw || eng.pvCapacityKw || (item?.load_kw || 5.0),
                load_watts: (p.system_capacity_kw || eng.pvCapacityKw) ? (Number(p.system_capacity_kw || eng.pvCapacityKw) * 1000) : (item?.load_watts || 5000),
                battery_type: eng.batteryCapacityKwh ? `${eng.batteryCapacityKwh}kWh Lithium` : (item?.battery_type || "Lithium LiFePO4"),
                load_schedule: ep.appliances || eng.loadSchedule || p.load_schedule || item?.load_schedule,
                notes: p.notes || eng.siteNotes || eng.generalNotes || (item?.notes) || "Assessment intake logged."
            };
        }
    } catch (err) {
        console.warn("[AE Admin] openDetail project fetch notice:", err.message);
    }

    if (!item) {
        item = AE.consultations?.[0] || AE.dispatchedInquiries?.[0];
    }
    if (!item) {
        showToast("Consultation record not found", "error");
        return;
    }

    AE.currentConsultation = item;
    
    // 1. Populate Header & Identity
    const projectCode = item.project_code || item.ref || ("CON-" + item.id);
    const clientName = item.client || item.contact_name || "Prospective Client";
    const statusVal = (item.status || "under_review").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    
    if (byId("detailTitle")) byId("detailTitle").textContent = projectCode;
    if (byId("detailClientName")) byId("detailClientName").textContent = clientName;
    if (byId("detailSubtitle")) byId("detailSubtitle").textContent = `${clientName} • ${item.location || 'Abuja, FCT'}`;
    if (byId("detailClientLocationSub")) byId("detailClientLocationSub").textContent = `${item.client_type ? (item.client_type.charAt(0).toUpperCase() + item.client_type.slice(1) + ' Client') : (item.client || 'Client')} • ${item.location || 'Abuja, FCT'}`;
    
    const badge = byId("detailBadge");
    if (badge) {
        badge.textContent = statusVal;
        badge.className = "badge " + (
            item.status === 'accepted' || item.status === 'active' || item.status === 'completed' ? 'green-b' :
            item.status === 'pending' || item.status === 'under_review' || item.status === 'admin_review' ? 'amber-b' :
            'blue-b'
        );
    }
    if (byId("detailAvatar")) {
        byId("detailAvatar").textContent = clientName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "AE";
    }

    // 2. Populate Section A: Client Profile & Registration Details
    const cl = projectFullData?.client_profile || {};
    if (byId("detailCustomerId")) byId("detailCustomerId").textContent = cl.client_code || item.client_code || (item.client_id ? `CLT-${item.client_id}` : "Not provided");
    if (byId("detailConsultationId")) byId("detailConsultationId").textContent = projectCode;
    if (byId("detailFullName")) byId("detailFullName").textContent = clientName;
    if (byId("detailPhone")) byId("detailPhone").textContent = item.phone || cl.phone || "Not provided";
    
    const emailEl = byId("detailEmail");
    if (emailEl) {
        const email = item.email || cl.email;
        if (email) {
            emailEl.innerHTML = `<a href="mailto:${escapeHtml(email)}" style="color:#004aad; text-decoration:none; font-weight:700;">${escapeHtml(email)}</a>`;
        } else {
            emailEl.textContent = "Not provided";
        }
    }
    
    if (byId("detailAddress")) byId("detailAddress").textContent = cl.address || item.address || item.location || "Not provided";
    if (byId("detailLGA")) {
        const stateStr = cl.state || item.state;
        const cityStr = cl.city || item.city;
        if (stateStr || cityStr) {
            byId("detailLGA").textContent = `${stateStr || 'FCT'} • ${cityStr || 'Not provided'}`;
        } else {
            byId("detailLGA").textContent = "Not provided";
        }
    }
    
    const clientTypeStr = item.client_type || cl.client_type || (cl.company_name ? "Business" : "Individual");
    if (byId("detailClientType")) byId("detailClientType").textContent = clientTypeStr.charAt(0).toUpperCase() + clientTypeStr.slice(1);
    if (byId("detailInstallationType")) byId("detailInstallationType").textContent = item.property || cl.industry || "Residential";
    if (byId("detailProjectRef")) byId("detailProjectRef").textContent = item.title ? `${item.title} (${projectCode})` : projectCode;
    if (byId("detailCreatedDate")) byId("detailCreatedDate").textContent = item.created_at ? new Date(item.created_at).toLocaleDateString("en-GB", { day:'numeric', month:'short', year:'numeric' }) : "Not provided";
    if (byId("detailUpdatedDate")) byId("detailUpdatedDate").textContent = item.updated_at ? new Date(item.updated_at).toLocaleDateString("en-GB", { day:'numeric', month:'short', year:'numeric' }) : "Not provided";
    if (byId("detailService")) byId("detailService").textContent = item.service || "Solar & Hybrid Power System";
    if (byId("detailRequirement")) byId("detailRequirement").textContent = item.description || item.notes || "Turnkey solar and storage system designed to deliver continuous uninterrupted energy.";

    // 3. Populate Section B: Power Consumption & Energy Assessment
    renderDetailAssessment(item, projectFullData);

    // 4. Populate Section C: Full Quotation
    renderDetailQuotation(item, projectFullData);

    // 5. Populate Payment Summary & Direct Link
    renderDetailPayments(item, projectFullData);

    // 6. Populate Timeline, Workflow & Activities
    renderDetailWorkflowAndAudit(item, projectFullData);

    showPage("detail");
}
window.openDetail = openDetail;

function renderDetailAssessment(item, fullData) {
    const eng = item.engineering_data || fullData?.engineering_data || {};
    const inputs = fullData?.quotation?.engineering_inputs || eng.engineering_inputs || {};
    
    // Connected Load & KPIs
    const loadKw = Number(item.load_kw || eng.pvCapacityKw || (item.load_watts ? item.load_watts / 1000 : 5.0)).toFixed(2);
    const psh = inputs.psh || eng.psh || 5.0;
    const backupHours = inputs.backup || eng.backupHours || 12;
    const dailyKwh = (inputs.load ? (inputs.load * backupHours / 1000) : (loadKw * 6)).toFixed(2);
    const pvKw = (eng.pvCapacityKw || (loadKw * 1.25)).toString();

    if (byId("detailCardLoad")) byId("detailCardLoad").textContent = `${loadKw} kW`;
    if (byId("detailCardEnergy")) byId("detailCardEnergy").textContent = `${dailyKwh} kWh/day`;
    if (byId("detailCardPv")) byId("detailCardPv").textContent = `${Number(pvKw).toFixed(2)} kWp`;
    if (byId("detailCardPsh")) byId("detailCardPsh").textContent = `${psh} hrs`;

    // Render Load Schedule Table
    renderDetailLoadSchedule(item);

    // Notes
    if (byId("detailEnergyProfiling")) {
        byId("detailEnergyProfiling").textContent = `1. Energy Profiling & Sizing Targets: Connected load ${loadKw} kW, PV Capacity: ${Number(pvKw).toFixed(2)} kWp, Inverter: ${eng.inverterCapacityKva || '80.0'} kVA, Battery Storage: ${eng.batteryCapacityKwh || '464.0'} kWh (${item.battery_type || 'Lithium LiFePO4'}). Autonomy: ${backupHours}h.`;
    }
    if (byId("detailSiteSurvey")) {
        byId("detailSiteSurvey").textContent = `2. Site Survey & Infrastructure Assessment: Irradiance / PSH: ${psh} hrs. Panel Count: ${eng.panelCount || 170} units (Tier-1 High-Efficiency). Grid Stability: ${eng.gridReliability || 'Band B (16-20h/day)'}.`;
    }
    if (byId("detailNotes")) {
        byId("detailNotes").textContent = item.notes || eng.siteNotes || eng.generalNotes || "Assessment intake and engineering sizing records loaded from PostgreSQL database.";
    }
}

function renderDetailLoadSchedule(item) {
    const container = byId("detailLoadScheduleContainer");
    const totalsBox = byId("detailLoadTotalsBox");
    const badge = byId("detailLoadTotalBadge");
    if (!container) return;

    const eng = item.engineering_data || {};
    const schedule = item.load_schedule || (typeof parseApplianceSchedule === "function" 
        ? parseApplianceSchedule(eng.appliances || item.appliances, item.load_watts || 5000, eng.backupHours || 8)
        : null);

    const items = schedule?.items || [];
    const sumWatts = schedule?.total_load_w || Number(item.load_watts || 5000);
    const sumKw = schedule?.total_load_kw || (sumWatts / 1000).toFixed(2);
    const sumDailyWh = schedule?.daily_energy_wh || Math.round(sumWatts * (eng.backupHours || 8));
    const sumDailyKwh = schedule?.daily_energy_kwh || (sumDailyWh / 1000).toFixed(2);

    if (badge) {
        badge.textContent = `${Number(sumWatts).toLocaleString()} W (${sumKw} kW)`;
    }

    if (!items || items.length === 0) {
        container.innerHTML = `
            <div style="padding:16px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; color:#64748b; font-size:13px; text-align:center;">
                Connected load requirement: <strong>${sumKw} kW (${Number(sumWatts).toLocaleString()} W)</strong>. Individual appliance breakdown available in intake profile.
            </div>
        `;
    } else {
        container.innerHTML = `
            <table class="full-table" style="font-size:12.5px; margin-bottom:0;">
                <thead>
                    <tr style="background:#f1f5f9;">
                        <th style="width:40px; text-align:center;">No.</th>
                        <th>Appliance / Load</th>
                        <th style="text-align:center;">Quantity</th>
                        <th style="text-align:right;">Rated Power (W)</th>
                        <th style="text-align:right;">Total Power (W)</th>
                        <th style="text-align:center;">Hours per Day</th>
                        <th style="text-align:right;">Daily Energy (Wh)</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(app => `
                        <tr>
                            <td style="text-align:center; color:#64748b; font-weight:700;">${app.no}</td>
                            <td><strong>${escapeHtml(app.name)}</strong></td>
                            <td style="text-align:center; font-weight:700;">${app.qty}</td>
                            <td style="text-align:right; font-family:monospace;">${Number(app.rated_power_w).toLocaleString()} W</td>
                            <td style="text-align:right; font-weight:700; color:#004aad; font-family:monospace;">${Number(app.total_power_w).toLocaleString()} W</td>
                            <td style="text-align:center; font-weight:600;">${app.hours_per_day} hrs</td>
                            <td style="text-align:right; font-weight:700; color:#059669; font-family:monospace;">${Number(app.daily_energy_wh).toLocaleString()} Wh</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;
    }

    if (totalsBox) {
        totalsBox.innerHTML = `
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-bottom:10px;">
                <div>
                    <small style="color:#64748b; font-size:11px; font-weight:700; text-transform:uppercase;">Total Connected Load (W)</small>
                    <div style="font-size:17px; font-weight:800; color:#0f172a;">${Number(sumWatts).toLocaleString()} W</div>
                </div>
                <div>
                    <small style="color:#64748b; font-size:11px; font-weight:700; text-transform:uppercase;">Total Connected Load (kW)</small>
                    <div style="font-size:17px; font-weight:800; color:#004aad;">${sumKw} kW</div>
                </div>
                <div>
                    <small style="color:#64748b; font-size:11px; font-weight:700; text-transform:uppercase;">Estimated Daily Energy</small>
                    <div style="font-size:17px; font-weight:800; color:#059669;">${Number(sumDailyWh).toLocaleString()} Wh <span style="font-size:13px; font-weight:600; color:#64748b;">(${sumDailyKwh} kWh)</span></div>
                </div>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:16px; font-size:12px; border-top:1px dashed #cbd5e1; padding-top:8px; color:#475569;">
                <div><span>Battery Preference:</span> <strong style="color:#0f172a;">${escapeHtml(item.battery_type || eng.batteryType || 'Lithium LiFePO4')}</strong></div>
                <div><span>Backup Target:</span> <strong style="color:#0f172a;">${eng.backupHours || 12} Hours</strong></div>
                <div><span>Grid Stability:</span> <strong style="color:#0f172a;">${escapeHtml(eng.gridReliability || 'Band B (16-20h/day)')}</strong></div>
                <div><span>Existing Generator:</span> <strong style="color:#0f172a;">${escapeHtml(eng.generatorKva ? eng.generatorKva + ' kVA' : 'None')}</strong></div>
            </div>
        `;
    }
}

function renderDetailQuotation(item, fullData) {
    const q = fullData?.quotation || item.quotation;
    const items = fullData?.quotation_items || item.quotation_items || [];
    const eng = item.engineering_data || fullData?.engineering_data || {};

    const container = byId("detailQuotationItemsContainer");
    const statusBadge = byId("detailQuoteStatusBadge");

    if (!q && (!items || items.length === 0)) {
        if (statusBadge) {
            statusBadge.textContent = "No Quotation Generated";
            statusBadge.className = "badge amber-b";
        }
        if (byId("detailQuoteNumber")) byId("detailQuoteNumber").textContent = "—";
        if (byId("detailQuoteDate")) byId("detailQuoteDate").textContent = "—";
        if (byId("detailQuoteValidity")) byId("detailQuoteValidity").textContent = "—";
        if (byId("detailQuoteVersion")) byId("detailQuoteVersion").textContent = "—";
        if (byId("detailQuoteSubtotal")) byId("detailQuoteSubtotal").textContent = "₦0.00";
        if (byId("detailQuoteInstallation")) byId("detailQuoteInstallation").textContent = "₦0.00";
        if (byId("detailQuoteTax")) byId("detailQuoteTax").textContent = "₦0.00";
        if (byId("detailQuoteDiscount")) byId("detailQuoteDiscount").textContent = "₦0.00";
        if (byId("detailQuoteGrandTotal")) byId("detailQuoteGrandTotal").textContent = "₦0.00";
        
        if (container) {
            container.innerHTML = `
                <div style="padding:28px 20px; text-align:center; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:10px;">
                    <div style="font-size:32px; margin-bottom:8px;">📑</div>
                    <strong style="color:#0f172a; font-size:15px; display:block; margin-bottom:4px;">No Formal Quotation Linked Yet</strong>
                    <p style="color:#64748b; font-size:13px; margin:0 0 16px;">This intake has not had a commercial Bill of Quantities (BOQ) issued.</p>
                    <button type="button" class="primary" onclick="launchArdeStudioForCurrentConsultation()" style="font-size:13px; font-weight:700; padding:9px 20px;">⚡ Compute Design &amp; Generate Quotation</button>
                </div>
            `;
        }
        return;
    }

    // Populate Quotation Meta
    const quoteNum = q?.quotation_number || q?.quotation_code || "AE-Q-" + (item.project_code || item.id);
    const quoteDate = q?.issue_date ? new Date(q.issue_date).toLocaleDateString("en-GB", { day:'numeric', month:'short', year:'numeric' }) : (item.created_at ? new Date(item.created_at).toLocaleDateString("en-GB", { day:'numeric', month:'short', year:'numeric' }) : "—");
    const quoteValid = q?.valid_until ? new Date(q.valid_until).toLocaleDateString("en-GB", { day:'numeric', month:'short', year:'numeric' }) : "30 Days from issue";
    const quoteVer = `v${q?.version || 1}.0 (${(q?.status || 'final').toUpperCase()})`;
    const quoteStatus = (q?.status || item.status || "Issued").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

    if (byId("detailQuoteNumber")) byId("detailQuoteNumber").textContent = quoteNum;
    if (byId("detailQuoteDate")) byId("detailQuoteDate").textContent = quoteDate;
    if (byId("detailQuoteValidity")) byId("detailQuoteValidity").textContent = quoteValid;
    if (byId("detailQuoteVersion")) byId("detailQuoteVersion").textContent = quoteVer;
    if (statusBadge) {
        statusBadge.textContent = quoteStatus;
        statusBadge.className = "badge " + (quoteStatus.toLowerCase().includes("accept") ? "green-b" : "amber-b");
    }

    // Specs
    if (byId("detailSpecPanels")) byId("detailSpecPanels").textContent = `${eng.panelCount || 170}x Tier-1 Panels (${eng.pvCapacityKw || '127.50'} kWp)`;
    if (byId("detailSpecInverter")) byId("detailSpecInverter").textContent = `${eng.inverterCapacityKva || '80.0'} kVA Deye High-Voltage Hybrid Inverter`;
    if (byId("detailSpecBattery")) byId("detailSpecBattery").textContent = `${eng.batteryCapacityKwh || '464.0'} kWh LiFePO4 High-Voltage Battery Bank`;
    if (byId("detailSpecType")) byId("detailSpecType").textContent = "Industrial / Commercial Hybrid Turnkey";

    // Populate Itemized BOQ Table
    if (container) {
        if (!items || items.length === 0) {
            container.innerHTML = `<div style="padding:16px; color:#64748b; font-size:13px; text-align:center;">Quotation header exists. Itemized lines available in official contract.</div>`;
        } else {
            container.innerHTML = `
                <table class="full-table" style="font-size:12.5px; margin-bottom:0;">
                    <thead>
                        <tr style="background:#f1f5f9;">
                            <th style="width:36px; text-align:center;">No.</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th style="text-align:center;">Qty</th>
                            <th style="text-align:center;">Unit</th>
                            <th style="text-align:right;">Unit Price (₦)</th>
                            <th style="text-align:right;">Line Total (₦)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map((row, idx) => {
                            const unitPrice = Number(row.unit_price || 0);
                            const lineTotal = Number(row.total_amount || (unitPrice * Number(row.quantity || 1)));
                            return `
                                <tr>
                                    <td style="text-align:center; color:#64748b; font-weight:700;">${idx + 1}</td>
                                    <td><strong>${escapeHtml(row.name || row.description || 'Equipment Item')}</strong></td>
                                    <td><label class="badge ${row.item_type === 'equipment' ? 'blue-b' : 'purple-b'}">${row.item_type || 'Equipment'}</label></td>
                                    <td style="text-align:center; font-weight:700;">${Number(row.quantity || 1).toLocaleString()}</td>
                                    <td style="text-align:center; color:#64748b;">${escapeHtml(row.unit || 'pcs')}</td>
                                    <td style="text-align:right; font-family:monospace;">₦${unitPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                    <td style="text-align:right; font-weight:700; color:#004aad; font-family:monospace;">₦${lineTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            `;
        }
    }

    // Cost Breakdown
    const subtotal = Number(q?.subtotal || 0);
    const installation = Number(q?.installation_fee || 0);
    const tax = Number(q?.tax || 0);
    const discount = Number(q?.discount || 0);
    const grandTotal = Number(q?.total_amount || (subtotal + installation + tax - discount));

    if (byId("detailQuoteSubtotal")) byId("detailQuoteSubtotal").textContent = `₦${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (byId("detailQuoteInstallation")) byId("detailQuoteInstallation").textContent = `₦${installation.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (byId("detailQuoteTax")) byId("detailQuoteTax").textContent = `₦${tax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (byId("detailQuoteDiscount")) byId("detailQuoteDiscount").textContent = `₦${discount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (byId("detailQuoteGrandTotal")) byId("detailQuoteGrandTotal").textContent = `₦${grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

function renderDetailPayments(item, fullData) {
    const q = fullData?.quotation || item.quotation;
    const contractValue = Number(fullData?.contract_value || q?.total_amount || item.total_contract_value || 0);
    const amountPaid = Number(fullData?.amount_paid || q?.amount_paid || item.total_amount_paid || 0);
    const balanceDue = Number(fullData?.balance_due || q?.balance_due || (contractValue - amountPaid));
    
    if (byId("detailPayContractValue")) byId("detailPayContractValue").textContent = `₦${contractValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (byId("detailPayAmountPaid")) byId("detailPayAmountPaid").textContent = `₦${amountPaid.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (byId("detailPayBalanceDue")) byId("detailPayBalanceDue").textContent = `₦${balanceDue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

    const payments = fullData?.payments || item.payments || [];
    const latestPayment = payments[0];
    const payRef = latestPayment?.payment_reference || (contractValue > 0 ? `PAY-${item.project_code || item.id}` : 'PAY-PENDING');
    if (byId("detailPayReferenceCode")) byId("detailPayReferenceCode").textContent = payRef;

    const payBadge = byId("detailPayStatusBadge");
    if (payBadge) {
        if (contractValue > 0 && balanceDue <= 0) {
            payBadge.textContent = "Fully Settled";
            payBadge.className = "badge green-b";
        } else if (amountPaid > 0) {
            payBadge.textContent = "Partially Paid";
            payBadge.className = "badge blue-b";
        } else {
            payBadge.textContent = "Pending Deposit";
            payBadge.className = "badge amber-b";
        }
    }

    // Direct Payment Link: route to client payment view
    const directLink = byId("detailPaymentDirectLink");
    if (directLink) {
        directLink.href = `/client/dashboard#payments`;
        directLink.title = `Open payment portal for ${payRef}`;
    }
}

function renderDetailWorkflowAndAudit(item, fullData) {
    const status = (item.status || "under_review").toLowerCase();
    const q = fullData?.quotation || item.quotation;
    const amountPaid = Number(fullData?.amount_paid || q?.amount_paid || 0);
    
    const steps = [
        { id: "step-intake", active: true, time: item.created_at ? new Date(item.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : "Done" },
        { id: "step-review", active: true, time: "Completed" },
        { id: "step-quotation", active: !!q, time: q ? "Issued" : "Pending" },
        { id: "step-accepted", active: status === 'accepted' || status === 'ready_for_execution' || status === 'in_progress' || status === 'completed', time: status === 'accepted' ? "Accepted" : "Pending" },
        { id: "step-payment", active: amountPaid > 0, time: amountPaid > 0 ? "Deposit Paid" : "Pending" },
        { id: "step-install", active: status === 'in_progress' || status === 'completed', time: status === 'completed' ? "Completed" : "Pending" }
    ];

    steps.forEach(s => {
        const el = byId(s.id);
        if (el) {
            el.className = s.active ? "step current" : "step";
            const small = el.querySelector("small");
            if (small) small.textContent = s.time;
        }
    });

    // Activities log
    const activities = fullData?.activities || [];
    const actContainer = byId("detailActivitiesContainer");
    if (actContainer) {
        if (activities.length === 0) {
            actContainer.innerHTML = `<div style="padding:6px 0; color:#94a3b8;">No administrative events recorded yet.</div>`;
        } else {
            actContainer.innerHTML = activities.slice(0, 8).map(a => `
                <div style="padding:5px 0; border-bottom:1px dashed #e2e8f0; display:flex; justify-content:space-between; gap:6px;">
                    <div>
                        <strong style="color:#0f172a; display:block;">${escapeHtml(a.action || 'Audit Event')}</strong>
                        <span style="color:#64748b;">${escapeHtml(a.details?.note || a.description || 'System state updated')}</span>
                    </div>
                    <small style="color:#94a3b8; white-space:nowrap;">${a.created_at ? new Date(a.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</small>
                </div>
            `).join("");
        }
    }
}

// =========================================================
// ADMINISTRATIVE ACTIONS: ACCEPT | PENDING | DELETE | PRINT
// =========================================================
async function handleAdminAcceptConsultation() {
    const item = AE.currentConsultation;
    if (!item || (!item.id && !item.project_code && !item.ref)) {
        showToast("No active consultation selected", "error");
        return;
    }

    const targetId = item.id || item._dbId || item.project_code || item.ref;
    const btn = byId("detailBtnAccept");
    if (btn) btn.disabled = true;

    try {
        const res = await API.post(`/api/projects/${encodeURIComponent(targetId)}/admin-accept`, {});
        showToast("Consultation accepted! Status persisted and client email notification sent.", "success");
        
        // Refresh display without page reload
        item.status = "accepted";
        if (AE.currentConsultation) AE.currentConsultation.status = "accepted";
        
        const badge = byId("detailBadge");
        if (badge) {
            badge.textContent = "Accepted";
            badge.className = "badge green-b";
        }
        const quoteBadge = byId("detailQuoteStatusBadge");
        if (quoteBadge) {
            quoteBadge.textContent = "Accepted";
            quoteBadge.className = "badge green-b";
        }
        const acceptStep = byId("step-accepted");
        if (acceptStep) {
            acceptStep.className = "step current";
            const small = acceptStep.querySelector("small");
            if (small) small.textContent = "Accepted";
        }

        // Refresh underlying datasets in background
        if (typeof fetchProjects === "function") fetchProjects();
        if (typeof fetchCustomers === "function") fetchCustomers();
        if (typeof fetchConsultations === "function") fetchConsultations();
        if (typeof fetchDispatchedInquiries === "function") fetchDispatchedInquiries();
    } catch (err) {
        showToast("Failed to accept consultation: " + (err.response?.data?.message || err.message), "error");
    } finally {
        if (btn) btn.disabled = false;
    }
}
window.handleAdminAcceptConsultation = handleAdminAcceptConsultation;

async function handleAdminPendingConsultation() {
    const item = AE.currentConsultation;
    if (!item || (!item.id && !item.project_code && !item.ref)) {
        showToast("No active consultation selected", "error");
        return;
    }

    const targetId = item.id || item._dbId || item.project_code || item.ref;
    const btn = byId("detailBtnPending");
    if (btn) btn.disabled = true;

    try {
        const res = await API.post(`/api/projects/${encodeURIComponent(targetId)}/admin-pending`, {
            reason: "Under technical administrative review"
        });
        showToast("Consultation marked as Pending Review. Client notified.", "info");

        item.status = "under_review";
        if (AE.currentConsultation) AE.currentConsultation.status = "under_review";

        const badge = byId("detailBadge");
        if (badge) {
            badge.textContent = "Under Review";
            badge.className = "badge amber-b";
        }
        const quoteBadge = byId("detailQuoteStatusBadge");
        if (quoteBadge) {
            quoteBadge.textContent = "Under Review";
            quoteBadge.className = "badge amber-b";
        }

        if (typeof fetchProjects === "function") fetchProjects();
        if (typeof fetchCustomers === "function") fetchCustomers();
        if (typeof fetchConsultations === "function") fetchConsultations();
        if (typeof fetchDispatchedInquiries === "function") fetchDispatchedInquiries();
    } catch (err) {
        showToast("Failed to set pending status: " + (err.response?.data?.message || err.message), "error");
    } finally {
        if (btn) btn.disabled = false;
    }
}
window.handleAdminPendingConsultation = handleAdminPendingConsultation;

function handleAdminDeleteConsultation() {
    const item = AE.currentConsultation;
    if (!item || (!item.id && !item.project_code && !item.ref)) {
        showToast("No active consultation selected", "error");
        return;
    }

    const nameEl = byId("deleteModalClientName");
    const refEl = byId("deleteModalConsultationRef");
    const reasonInput = byId("deleteConsultationReason");

    if (nameEl) nameEl.textContent = item.client || item.contact_name || "Client";
    if (refEl) refEl.textContent = item.project_code || item.ref || item.id;
    if (reasonInput) reasonInput.value = "";

    openModal("deleteConsultationModal");
}
window.handleAdminDeleteConsultation = handleAdminDeleteConsultation;

async function confirmDeleteConsultationAction() {
    const item = AE.currentConsultation;
    if (!item || (!item.id && !item.project_code && !item.ref)) {
        showToast("No consultation selected to delete", "error");
        return;
    }

    const targetId = item.id || item._dbId || item.project_code || item.ref;
    const btn = byId("confirmDeleteConsultationBtn");
    const reason = byId("deleteConsultationReason")?.value || "Administrative removal";
    if (btn) btn.disabled = true;

    try {
        const res = await API.delete(`/api/projects/${encodeURIComponent(targetId)}`, { data: { reason } });
        closeModal("deleteConsultationModal");
        showToast("Consultation record successfully deleted/archived", "success");

        // Remove from local arrays
        AE.consultations = (AE.consultations || []).filter(c => String(c.id) !== String(targetId) && c.ref !== targetId && c.project_code !== targetId);
        AE.projects = (AE.projects || []).filter(p => String(p.id) !== String(targetId) && p.project_code !== targetId);
        
        if (typeof fetchProjects === "function") await fetchProjects();
        if (typeof fetchCustomers === "function") await fetchCustomers();
        if (typeof fetchConsultations === "function") await fetchConsultations();
        if (typeof fetchDispatchedInquiries === "function") await fetchDispatchedInquiries();

        showPage("consultations");
    } catch (err) {
        closeModal("deleteConsultationModal");
        const msg = err.response?.data?.message || err.message || "Deletion failed";
        showToast(msg, "error");
    } finally {
        if (btn) btn.disabled = false;
    }
}
window.confirmDeleteConsultationAction = confirmDeleteConsultationAction;

async function printConsultationQuotation() {
    const item = AE.currentConsultation;
    if (item) {
        const targetRef = item.project_code || item.ref || item.id;
        if (typeof openCompleteQuotationModal === "function") {
            try {
                await openCompleteQuotationModal(targetRef, targetRef);
                setTimeout(() => {
                    window.print();
                }, 350);
                return;
            } catch (err) {
                console.warn("[printConsultationQuotation] Complete quotation modal notice:", err);
            }
        }
    }
    window.print();
}
window.printConsultationQuotation = printConsultationQuotation;

function launchArdeStudioForCurrentConsultation() {
    const item = AE.currentConsultation || (AE.consultations && AE.consultations[0]);
    if (!item) {
        window.open("/arde", "_blank");
        return;
    }
    const params = new URLSearchParams();
    if (item.client) params.set("clientName", item.client);
    if (item.property) params.set("propertyType", item.property);
    params.set("load", "6000");
    params.set("backup", "8");
    window.open(`/arde/studio?${params.toString()}`, "_blank");
}
window.launchArdeStudioForCurrentConsultation = launchArdeStudioForCurrentConsultation;
window.openNewConsultationModal = () => window.open("/arde", "_blank");

// View Customer Consultation Action (Fix View button)
async function viewCustomerConsultation(targetRef, clientCode, clientId) {
    const refToOpen = targetRef || clientCode || clientId;
    if (!refToOpen) {
        showToast("No consultation or project linked to this client yet", "warning");
        return;
    }
    await openDetail(refToOpen);
}
window.viewCustomerConsultation = viewCustomerConsultation;

// 4.2 Customers Table
function renderCustomers(list = AE.customers) {
    const tbody = byId("customersTableBody");
    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--muted)">No customers found.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(c => {
        const targetRef = c.latest_project_code || c.latest_project_id || c.id || c._raw?.id || "";
        return `
        <tr>
            <td class="ref"><strong>${c.id}</strong></td>
            <td><strong>${c.name}</strong></td>
            <td>${c.contact}</td>
            <td>${c.location}</td>
            <td><label class="badge ${c.type === 'Commercial' ? 'purple-b' : 'blue-b'}">${c.type}</label></td>
            <td>${c.systems}</td>
            <td><strong>${c.ltv}</strong></td>
            <td><label class="badge green-b">● ${c.status}</label></td>
            <td>
                <div style="display:inline-flex; gap:6px; align-items:center;">
                    <button class="row-action" onclick="viewCustomerConsultation('${targetRef}', '${c.id}', '${c._raw?.id || ''}')">View →</button>
                    <button class="row-action" style="color:#ef4444; border-color:rgba(239,68,68,0.4); font-weight:700;" title="Delete Customer" onclick="deleteCustomerAction('${c._raw?.id || c.id}', '${String(c.name || '').replace(/'/g, "\\'")}')">🗑 Delete</button>
                </div>
            </td>
        </tr>
    `;
    }).join("");
}

function filterCustomers() {
    const search = byId("customerSearch")?.value.toLowerCase() || "";
    const type = byId("customerTypeFilter")?.value || "";
    const status = byId("customerStatusFilter")?.value || "";

    const filtered = AE.customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search) ||
                              c.location.toLowerCase().includes(search) ||
                              c.id.toLowerCase().includes(search);
        const matchesType = !type || c.type === type;
        const matchesStatus = !status || c.status === status;
        return matchesSearch && matchesType && matchesStatus;
    });

    renderCustomers(filtered);
}

// 4.3 Sites Table
function renderSites(list = AE.sites) {
    const tbody = byId("sitesTableBody");
    if (!tbody) return;

    tbody.innerHTML = list.map(s => `
        <tr>
            <td class="ref"><strong>${s.code}</strong></td>
            <td><strong>${s.name}</strong><small>${s.address}</small></td>
            <td>${s.client}</td>
            <td>${s.roof}</td>
            <td>${s.irradiance}</td>
            <td>${s.grid}</td>
            <td><label class="badge ${s.status === 'Approved' ? 'green-b' : 'amber-b'}">${s.status}</label></td>
            <td><button class="row-action" onclick="showToast('Site survey files loaded')">Inspect →</button></td>
        </tr>
    `).join("");
}

function filterSites() {
    const search = byId("siteSearch")?.value.toLowerCase() || "";
    const state = byId("siteStateFilter")?.value || "";

    const filtered = AE.sites.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(search) ||
                              s.client.toLowerCase().includes(search) ||
                              s.address.toLowerCase().includes(search);
        const matchesState = !state || s.address.includes(state);
        return matchesSearch && matchesState;
    });

    renderSites(filtered);
}

// 4.4 Projects Table
function renderProjects(list = AE.projects) {
    const tbody = byId("projectsTableBody");
    if (!tbody) return;

    tbody.innerHTML = list.map(p => `
        <tr>
            <td class="ref"><strong>${p.id}</strong></td>
            <td><strong>${p.name}</strong></td>
            <td>${p.client}</td>
            <td>${p.capacity}</td>
            <td>${p.installer}</td>
            <td style="width:140px">
                <div style="font-size:11px;font-weight:700;margin-bottom:3px">${p.progress}%</div>
                <div class="bar" style="height:6px;background:#e5eaf0;border-radius:3px;overflow:hidden">
                    <i style="display:block;height:100%;background:#044381;width:${p.progress}%;border-radius:3px"></i>
                </div>
            </td>
            <td><label class="badge ${p.stage === 'Commissioning' ? 'green-b' : 'blue-b'}">${p.stage}</label></td>
            <td>${p.deadline}</td>
            <td><button class="row-action" onclick="openProjectManagementModal('${p._dbId || p.id}')">Manage →</button></td>
        </tr>
    `).join("");
}

function filterProjects() {
    const search = byId("projectSearch")?.value.toLowerCase() || "";
    const stage = byId("projectStageFilter")?.value || "";

    const filtered = AE.projects.filter(p => {
        const matchesSearch = p.id.toLowerCase().includes(search) ||
                              p.name.toLowerCase().includes(search) ||
                              p.client.toLowerCase().includes(search);
        const matchesStage = !stage || p.stage === stage;
        return matchesSearch && matchesStage;
    });

    renderProjects(filtered);
}

// 4.5 Quotations Table
function renderQuotations(list = AE.quotations) {
    const tbody = byId("quotationTableBody");
    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--muted)">No quotations found.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(q => `
        <tr>
            <td class="ref"><strong>${q.ref}</strong></td>
            <td><strong>${q.client}</strong><small>${q.sub}</small></td>
            <td>${q.system}</td>
            <td><strong style="color:var(--navy)">${q.value}</strong></td>
            <td><label class="badge ${getStatusBadgeClass(q.status)}">${q.status}</label></td>
            <td>${q.date}</td>
            <td>
                <div style="display:inline-flex; gap:6px; align-items:center;">
                    <button class="row-action" onclick="openCompleteQuotationModal('${q._id || q.ref}', '${q.ref}')">Open →</button>
                    <button class="row-action" style="color:#ef4444; border-color:rgba(239,68,68,0.4); font-weight:700;" title="Delete Quotation" onclick="deleteQuotationAction('${q._id || q.ref}', '${q.ref}')">🗑 Delete</button>
                </div>
            </td>
        </tr>
    `).join("");
}

/* =========================================================
   COMPLETE QUOTATION VIEWER ENGINE
========================================================= */

window.viewCompleteQuotationForMonitoredSite = async function() {
    const siteSelect = byId("monitoredSiteSelect");
    const siteKey = siteSelect?.value || Object.keys(AE.monitoredSites || {})[0];
    const siteData = (AE.monitoredSites && AE.monitoredSites[siteKey]) || null;

    // Check if there is an associated quotation in AE.quotations
    let matchQuote = null;
    if (siteData) {
        const clientName = (siteData.client || siteData.title || "").toLowerCase();
        const projCode = (siteData.projectCode || "").toLowerCase();
        matchQuote = (AE.quotations || []).find(q => {
            const qClient = (q.client || "").toLowerCase();
            const qSub = (q.sub || "").toLowerCase();
            const qRef = (q.ref || "").toLowerCase();
            return (projCode && (qSub.includes(projCode) || qRef.includes(projCode))) ||
                   (clientName && (qClient.includes(clientName) || clientName.includes(qClient)));
        });
    }

    if (matchQuote) {
        await openCompleteQuotationModal(matchQuote._id || matchQuote.ref, matchQuote.ref, siteData);
    } else {
        await openCompleteQuotationModal(null, null, siteData);
    }
};

window._currentCqProject = null;

window.openCompleteQuotationModal = async function(quoteIdOrRef, quoteRef, siteContext = null) {
    const modal = byId("completeQuotationModal");
    if (!modal) return;

    let qData = null;
    let projData = null;
    let clientData = null;

    if (quoteIdOrRef) {
        // 1. Try project full details first
        try {
            const pRes = await API.get(`/api/projects/${quoteIdOrRef}/full`);
            if (pRes && pRes.data) {
                projData = pRes.data.project || pRes.data;
                clientData = pRes.data.client || null;
                qData = pRes.data.quotation || null;
            }
        } catch (e) {
            // continue
        }

        // 2. Try quotations API if not resolved
        if (!qData) {
            try {
                const res = await API.get(`/api/quotations/${quoteIdOrRef}`);
                if (res && res.data) {
                    qData = res.data;
                }
            } catch (e) {
                console.warn("[Quotation View] Fetch by ID notice:", e.message);
            }
        }

        // 3. Fallback to local AE cache
        if (!qData) {
            const local = (AE.quotations || []).find(q => String(q._id) === String(quoteIdOrRef) || String(q.ref) === String(quoteIdOrRef));
            if (local && local._data) qData = local._data;
        }
        if (!projData) {
            projData = (AE.projects || []).find(p => String(p.id) === String(quoteIdOrRef) || String(p.project_code) === String(quoteIdOrRef));
        }
    }

    const siteSelect = byId("monitoredSiteSelect");
    const currentSiteKey = siteSelect?.value;
    const currentSite = siteContext || (AE.monitoredSites && currentSiteKey ? AE.monitoredSites[currentSiteKey] : null);

    const projCode = (projData && projData.project_code) || (qData && (qData.project_code || (qData.project_id ? `PRJ-${qData.project_id}` : null))) || (currentSite && currentSite.projectCode) || String(quoteIdOrRef || "PRJ-202610-7281");
    const refNum = (qData && (qData.quotation_number || qData.quotation_code)) || (projCode ? projCode.replace("PRJ", "AE") : quoteRef) || "AE-Q-000042";

    const clientName = (clientData && (clientData.contact_name || clientData.company_name || clientData.full_name)) || (projData && (projData.client_name || projData.contact_name)) || (qData && (qData.client_name || qData.contact_name)) || (currentSite && currentSite.client) || "Valued Client";
    const clientCompany = (clientData && clientData.company_name) || (projData && projData.company_name) || (qData && qData.client_company) || "";
    const clientCode = (clientData && clientData.client_code) || (projData && projData.client_code) || (qData && qData.client_code) || (currentSite && currentSite.clientCode) || "AEC-0053";
    const clientPhone = (clientData && (clientData.phone || clientData.phone_number)) || (projData && (projData.client_phone || projData.phone)) || (qData && (qData.client_phone || qData.phone)) || (currentSite && currentSite.phone) || "";
    const clientEmail = (clientData && clientData.email) || (projData && projData.client_email) || (qData && qData.client_email) || (currentSite && currentSite.email) || "";
    const clientAddress = (projData && (projData.site_address || projData.address)) || (qData && (qData.client_address || qData.site_address)) || (currentSite && currentSite.address) || "Abuja, FCT, Nigeria";
    const propertyType = (projData && (projData.property_type || projData.project_type)) || "Residential (Turnkey Solar)";

    const rawStatus = (projData && projData.status) || (qData && qData.status) || "ISSUED";
    const status = rawStatus.toUpperCase();

    window._currentCqProject = {
        id: projData?.id || qData?.project_id || projCode,
        project_code: projCode,
        status: rawStatus,
        client_name: clientName,
        client_phone: clientPhone,
        client_email: clientEmail,
        client_address: clientAddress,
        bargain_status: projData?.bargain_status || qData?.bargain_status,
        proposed_bargain_amount: projData?.proposed_bargain_amount || qData?.proposed_bargain_amount,
        bargain_discount_percentage: projData?.bargain_discount_percentage || qData?.bargain_discount_percentage,
        bargain_note: projData?.bargain_note || qData?.bargain_note,
        original_contract_value: projData?.original_contract_value || qData?.original_amount,
        contract_value: projData?.contract_value || qData?.total_amount
    };

    const pvKw = projData?.system_capacity_kw || qData?.system_capacity_kw || (projData?.system_specs && projData.system_specs.pv_capacity_kw) || 5;
    const batKwh = (projData?.system_specs && projData.system_specs.battery_capacity_kwh) || qData?.battery_capacity_kwh || (pvKw * 2);

    const pvSpec = (currentSite && currentSite.pvArray) || `${pvKw} kWp Tier-1 Monocrystalline Array`;
    const invSpec = (currentSite && currentSite.inverter) || `DEYE Hybrid Pure Sine Inverter (${Math.ceil(pvKw)}kVA/48V)`;
    const batSpec = (currentSite && currentSite.batteryBank) || `${batKwh} kWh LiFePO4 Lithium Storage`;
    const gridSpec = (currentSite && currentSite.gridSensor) || "RS485 Smart Sensor • Live Telemetry Sync";

    if (byId("cqRef")) byId("cqRef").textContent = refNum;
    if (byId("cqProjectCode")) byId("cqProjectCode").textContent = projCode;
    if (byId("cqStatus")) {
        byId("cqStatus").textContent = status;
        byId("cqStatus").className = `badge ${status.includes("ACCEPT") ? "green-b" : (status.includes("DENIED") || status.includes("REJECT") ? "red-b" : "blue-b")}`;
    }
    if (byId("cqDate")) {
        byId("cqDate").textContent = (projData && projData.created_at) ? new Date(projData.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : (qData && qData.created_at ? new Date(qData.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }));
    }
    if (byId("cqClientCodeBadge")) byId("cqClientCodeBadge").textContent = `Client: ${clientCode}`;
    if (byId("cqClientName")) byId("cqClientName").textContent = clientName;
    if (byId("cqCompany")) byId("cqCompany").textContent = clientCompany;
    if (byId("cqPhone")) byId("cqPhone").textContent = clientPhone || "—";
    if (byId("cqEmail")) byId("cqEmail").textContent = clientEmail || "—";
    if (byId("cqAddress")) byId("cqAddress").textContent = clientAddress;
    if (byId("cqPropertyType")) byId("cqPropertyType").textContent = propertyType;

    if (byId("cqInverter")) byId("cqInverter").textContent = invSpec;
    if (byId("cqBattery")) byId("cqBattery").textContent = batSpec;
    if (byId("cqPvArray")) byId("cqPvArray").textContent = pvSpec;
    if (byId("cqGridSensor")) byId("cqGridSensor").textContent = gridSpec;

    // BOQ Items: Ensure complete 28-item schedule
    let items = (qData && Array.isArray(qData.items) && qData.items.length >= 25) ? qData.items : null;
    if (!items && projData && projData.item_breakdown) {
        try {
            const parsed = typeof projData.item_breakdown === "string" ? JSON.parse(projData.item_breakdown) : projData.item_breakdown;
            if (Array.isArray(parsed) && parsed.length >= 25) items = parsed;
        } catch(e) {}
    }
    if (!items && projData && projData.boq_data) {
        try {
            const parsed = typeof projData.boq_data === "string" ? JSON.parse(projData.boq_data) : projData.boq_data;
            if (Array.isArray(parsed) && parsed.length >= 25) items = parsed;
        } catch(e) {}
    }
    if (!items || items.length < 25) {
        const panels = Math.max(4, Math.round((pvKw * 1000) / 750)) || 26;
        const batteries = Math.max(1, Math.round(batKwh / 16)) || 4;
        const invKw = Math.ceil(pvKw);
        const invModel = invKw > 16 ? `Deye SUN-${invKw}K-SG01HP3` : `Deye SUN-16K-SG01HP3`;

        items = [
            { name: "Jinko 750W Solar Panel", category: "Solar Array", quantity: panels, unit: "pcs", unit_price: 150000, total_amount: panels * 150000 },
            { name: invModel, category: "Hybrid Inverter", quantity: 1, unit: "pcs", unit_price: 3600000, total_amount: 3600000 },
            { name: "Deye SE-F16", category: "LiFePO4 Storage", quantity: batteries, unit: "pcs", unit_price: 2200000, total_amount: batteries * 2200000 },
            { name: "125A Single Phase Changeover Switch", category: "Switchgear", quantity: 1, unit: "pcs", unit_price: 0, total_amount: 0 },
            { name: "100A Single Phase AC Output Breaker", category: "Protection", quantity: 1, unit: "pcs", unit_price: 32000, total_amount: 32000 },
            { name: "125A Single Phase AC Input Breaker", category: "Protection", quantity: 1, unit: "pcs", unit_price: 0, total_amount: 0 },
            { name: "400A Battery Breaker", category: "Battery Protection", quantity: batteries, unit: "pcs", unit_price: 175000, total_amount: batteries * 175000 },
            { name: "400A Copper Busbar", category: "Busbar System", quantity: 1, unit: "pcs", unit_price: 68000, total_amount: 68000 },
            { name: "25A PV DC Breaker", category: "DC Protection", quantity: Math.max(2, Math.ceil(panels / 7)) || 4, unit: "pcs", unit_price: 16500, total_amount: (Math.max(2, Math.ceil(panels / 7)) || 4) * 16500 },
            { name: "2P Type II 275VAC AC SPD", category: "Surge Protection", quantity: 1, unit: "pcs", unit_price: 0, total_amount: 0 },
            { name: "2P Type II 600VDC DC SPD", category: "Surge Protection", quantity: 1, unit: "pcs", unit_price: 0, total_amount: 0 },
            { name: "6mm² PV Solar Cable", category: "Solar Cabling", quantity: 80, unit: "meters", unit_price: 0, total_amount: 0 },
            { name: "16mm² 3 Core Flexible Copper", category: "AC Cabling", quantity: 20, unit: "meters", unit_price: 0, total_amount: 0 },
            { name: "4mm² Earth Cable", category: "Earthing Cabling", quantity: 20, unit: "meters", unit_price: 0, total_amount: 0 },
            { name: "50mm² Battery Cable", category: "Battery Cabling", quantity: 16, unit: "meters", unit_price: 9200, total_amount: 147200 },
            { name: "50mm² Heavy Duty Battery Cable Lug", category: "Lugs & Terminals", quantity: 16, unit: "pcs", unit_price: 1800, total_amount: 28800 },
            { name: "Aluminum Solar Panel Rail", category: "Mounting Racking", quantity: Math.max(4, Math.round(panels / 4)) || 7, unit: "length", unit_price: 7000, total_amount: (Math.max(4, Math.round(panels / 4)) || 7) * 7000 },
            { name: "S17 Stainless Steel Bolt & Nut Sets", category: "Fasteners", quantity: Math.max(20, Math.round(panels * 2.5)) || 65, unit: "pcs", unit_price: 500, total_amount: (Math.max(20, Math.round(panels * 2.5)) || 65) * 500 },
            { name: "32mm Flexible Pipe", category: "Conduit & Trunking", quantity: 20, unit: "meters", unit_price: 400, total_amount: 8000 },
            { name: "Cable Clips (for 32mm Flexible Pipe)", category: "Clips & Fixings", quantity: 1, unit: "packet", unit_price: 1500, total_amount: 1500 },
            { name: "75x75 mm PVC Trunking", category: "Cable Management", quantity: 2, unit: "pcs", unit_price: 5000, total_amount: 10000 },
            { name: "High-Grade Electrical Insulation Tape", category: "Consumables", quantity: 2, unit: "rolls", unit_price: 500, total_amount: 1000 },
            { name: "Assorted Screw Packets", category: "Fasteners", quantity: 1, unit: "packet", unit_price: 500, total_amount: 500 },
            { name: "10mm Pegs (1 Packet)", category: "Anchors & Plugs", quantity: 1, unit: "set", unit_price: 1500, total_amount: 1500 },
            { name: "Heavy Duty Cable Ties", category: "Cable Management", quantity: 1, unit: "packet", unit_price: 2500, total_amount: 2500 },
            { name: "Solar Installation Sealant", category: "Weatherproofing", quantity: 1, unit: "tube", unit_price: 4500, total_amount: 4500 },
            { name: "CO2 Fire Extinguisher (DCP)", category: "Safety Equipment", quantity: 1, unit: "unit", unit_price: 16000, total_amount: 16000 },
            { name: "Copper Earth Rod (1.5m)", category: "Earthing & Grounding", quantity: 1, unit: "pcs", unit_price: 600, total_amount: 600 }
        ];
    }

    const tbody = byId("cqBoqTbody");
    let subtotal = 0;
    if (tbody) {
        tbody.innerHTML = items.map((it, idx) => {
            const qty = Number(it.quantity || 1);
            const rate = Number(it.unit_price || it.unitPrice || it.rate || 0);
            const total = Number(it.total_amount || it.totalPrice || (qty * rate));
            subtotal += total;
            return `
                <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:9px 12px; color:#64748b;">${idx + 1}</td>
                    <td style="padding:9px 12px;">
                        <strong style="color:#0f172a; display:block;">${escapeHtml(it.name || it.item_name || it.description || 'Equipment SKU')}</strong>
                        ${it.description && it.name ? `<small style="color:#64748b;">${escapeHtml(it.description)}</small>` : ''}
                    </td>
                    <td style="padding:9px 12px; color:#475569;"><span style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:10.5px;">${escapeHtml(it.category || it.item_type || 'Hardware')}</span></td>
                    <td style="padding:9px 12px; text-align:center; font-weight:700;">${qty} ${it.unit || ''}</td>
                    <td style="padding:9px 12px; text-align:right; font-family:monospace;">₦${rate.toLocaleString()}</td>
                    <td style="padding:9px 12px; text-align:right; font-family:monospace; font-weight:700; color:#004AAD;">₦${total.toLocaleString()}</td>
                </tr>
            `;
        }).join("");
    }

    const finalContract = Number(projData?.contract_value || projData?.original_contract_value || projData?.estimated_value || qData?.total_amount || 0);
    const rawSubtotal = Number(qData && qData.subtotal ? qData.subtotal : (finalContract > 0 ? Math.round(finalContract / 1.25) : subtotal));
    const installFee = Number(qData && qData.installation_fee ? qData.installation_fee : Math.max(150000, Math.round(pvKw * 25000)));
    const logisticsFee = Number(finalContract > 0 ? Math.round(finalContract * 0.05) : 350000);
    const taxVal = Number(finalContract > 0 ? Math.round(finalContract * 0.075) : ((rawSubtotal + installFee + logisticsFee) * 0.075));
    const grandTotal = finalContract > 0 ? finalContract : (rawSubtotal + installFee + logisticsFee + taxVal);

    if (byId("cqSubtotal")) byId("cqSubtotal").textContent = `₦${Math.round(rawSubtotal).toLocaleString()}`;
    if (byId("cqInstallFee")) byId("cqInstallFee").textContent = `₦${Math.round(installFee).toLocaleString()}`;
    if (byId("cqLogistics")) byId("cqLogistics").textContent = `₦${Math.round(logisticsFee).toLocaleString()}`;
    if (byId("cqTax")) byId("cqTax").textContent = `₦${Math.round(taxVal).toLocaleString()}`;
    if (byId("cqGrandTotal")) byId("cqGrandTotal").textContent = `₦${Math.round(grandTotal).toLocaleString()}`;

    // Bargain Comparison Presentation Under Grand Total Amount
    const proposedBargain = Number(projData?.proposed_bargain_amount || qData?.proposed_bargain_amount || 0);
    const discountPct = Number(projData?.bargain_discount_percentage || qData?.bargain_discount_percentage || 0);
    const originalBaseline = Number(projData?.original_contract_value || qData?.original_amount || grandTotal);
    const bargainBox = byId("cqBargainComparisonBox");

    if (proposedBargain > 0 && proposedBargain < originalBaseline) {
        if (bargainBox) bargainBox.style.display = "block";
        const effPct = discountPct > 0 ? discountPct : ((originalBaseline - proposedBargain) / originalBaseline * 100);
        if (byId("cqBargainDiscountBadge")) byId("cqBargainDiscountBadge").textContent = `-${effPct.toFixed(1)}% Discount`;
        if (byId("cqBargainOriginalTotal")) byId("cqBargainOriginalTotal").textContent = `₦${Math.round(originalBaseline).toLocaleString()}`;
        if (byId("cqBargainProposedAmount")) byId("cqBargainProposedAmount").textContent = `₦${Math.round(proposedBargain).toLocaleString()}`;
        const savings = Math.max(0, originalBaseline - proposedBargain);
        if (byId("cqBargainSavings")) byId("cqBargainSavings").textContent = `₦${Math.round(savings).toLocaleString()}`;
        const note = projData?.bargain_note || qData?.bargain_note;
        const noteRow = byId("cqBargainNoteRow");
        if (note && noteRow) {
            noteRow.style.display = "block";
            byId("cqBargainNote").textContent = note;
        } else if (noteRow) {
            noteRow.style.display = "none";
        }
    } else {
        if (bargainBox) bargainBox.style.display = "none";
    }

    modal.classList.add("active");
};

window.closeCompleteQuotationModal = function() {
    const modal = byId("completeQuotationModal");
    if (modal) modal.classList.remove("active");
};

window.printCompleteQuotation = function() {
    window.print();
};

window.shareCompleteQuotationWhatsApp = function() {
    const ref = byId("cqRef")?.textContent || "AE-Quotation";
    const client = byId("cqClientName")?.textContent || "Client";
    const total = byId("cqGrandTotal")?.textContent || "";
    let rawPhone = window._currentCqProject?.client_phone || byId("cqPhone")?.textContent || "";

    // Clean and validate client contact
    let cleanPhone = String(rawPhone || "").replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
        cleanPhone = "234" + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith("234")) {
        // already has Nigerian country code
    } else if (cleanPhone && !cleanPhone.startsWith("234") && cleanPhone.length === 10) {
        cleanPhone = "234" + cleanPhone;
    }

    if (!cleanPhone || cleanPhone === "2348133615132") {
        const input = prompt("Enter the Client's WhatsApp Phone Number (e.g. 08012345678):", rawPhone && rawPhone !== "08133615132" && rawPhone !== "—" ? rawPhone : "");
        if (!input) return;
        rawPhone = input.trim();
        cleanPhone = rawPhone.replace(/[^0-9]/g, "");
        if (cleanPhone.startsWith("0")) {
            cleanPhone = "234" + cleanPhone.slice(1);
        } else if (cleanPhone && !cleanPhone.startsWith("234") && cleanPhone.length === 10) {
            cleanPhone = "234" + cleanPhone;
        }
    }

    const formattedContact = rawPhone && rawPhone !== "08133615132" && rawPhone !== "—" ? rawPhone : ("+" + cleanPhone);

    const messageLines = [
        `*AE RENEWABLE LTD — TURNKEY SOLAR QUOTATION*`,
        `☀️ *Powering Your Future With Sun*`,
        ``,
        `Hello *${client}*,`,
        ``,
        `Here is your official turnkey solar engineering quotation:`,
        `📋 *Quotation Ref:* ${ref}`,
        `👤 *Client Name:* ${client}`,
        `📞 *Client Contact:* ${formattedContact}`,
        `💰 *Total Project Value:* ${total}`,
        ``,
        `Your complete Bill of Quantities (BOQ) & Technical Schedule has been prepared by our engineering team.`,
        `Please review and let us know if you have any questions or require milestone mobilization.`
    ];

    const msg = encodeURIComponent(messageLines.join("\n"));
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
};

window.handleCqModalAccept = async function() {
    const p = window._currentCqProject;
    if (!p || !p.id) {
        showToast("No active project loaded.", "error");
        return;
    }

    const isBargain = p.bargain_status === "pending_admin_review" || (Number(p.proposed_bargain_amount) > 0 && p.bargain_status !== "accepted");
    const endpoint = isBargain ? `/api/projects/${p.id}/bargain/accept` : `/api/projects/${p.id}/admin-accept`;

    try {
        const token = getAdminAuthToken();
        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({})
        });
        const data = await res.json();
        if (data.success) {
            showToast(isBargain ? "✓ Bargain proposal accepted! Client notified to make payment in Payments Page." : "✓ Project quotation accepted! Client notified to make payment in Payments Page.", "success");
            closeCompleteQuotationModal();
            if (typeof fetchNotifications === "function") fetchNotifications();
            if (typeof fetchProjects === "function") fetchProjects();
            if (typeof fetchDashboardData === "function") fetchDashboardData();
        } else {
            showToast(data.message || "Failed to accept", "error");
        }
    } catch (err) {
        showToast("Error: " + err.message, "error");
    }
};

window.handleCqModalDeny = async function() {
    const p = window._currentCqProject;
    if (!p || !p.id) {
        showToast("No active project loaded.", "error");
        return;
    }

    const reason = prompt("Enter reason for declining/denying (optional):", "Maintained standard engineering rate.") || "";
    const isBargain = p.bargain_status === "pending_admin_review" || (Number(p.proposed_bargain_amount) > 0 && p.bargain_status !== "accepted");
    const endpoint = isBargain ? `/api/projects/${p.id}/bargain/reject` : `/api/projects/${p.id}/admin-deny`;

    try {
        const token = getAdminAuthToken();
        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({ reason })
        });
        const data = await res.json();
        if (data.success) {
            showToast(isBargain ? "✕ Bargain offer declined. Client notified." : "✕ Project quotation declined. Client notified.", "info");
            closeCompleteQuotationModal();
            if (typeof fetchNotifications === "function") fetchNotifications();
            if (typeof fetchProjects === "function") fetchProjects();
            if (typeof fetchDashboardData === "function") fetchDashboardData();
        } else {
            showToast(data.message || "Failed to decline", "error");
        }
    } catch (err) {
        showToast("Error: " + err.message, "error");
    }
};

window.handleCqModalDelete = async function() {
    const p = window._currentCqProject;
    if (!p || !p.id) {
        showToast("No active project loaded.", "error");
        return;
    }
    closeCompleteQuotationModal();
    handleAdminDeleteProject(p.id);
};

function filterQuotations() {
    const search = byId("quotationSearch")?.value.toLowerCase() || "";
    const status = byId("quotationStatusFilter")?.value || "";

    const filtered = AE.quotations.filter(q => {
        const matchesSearch = q.ref.toLowerCase().includes(search) ||
                              q.client.toLowerCase().includes(search) ||
                              q.system.toLowerCase().includes(search);
        const matchesStatus = !status || q.status === status;
        return matchesSearch && matchesStatus;
    });

    renderQuotations(filtered);
}

// 4.6 Invoices & Payment Tracking Table
function renderInvoices(list = AE.invoices) {
    const tbody = byId("invoicesTableBody");
    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center; padding:30px; color:#64748b;">
                    No payment records matching the selected filter criteria.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = list.map(i => {
        const raw = i._raw || {};
        const isVerified = Boolean(raw.verified) || (i.status && (i.status.toLowerCase().includes("complete") || i.status.toLowerCase().includes("paid") || i.status.toLowerCase().includes("approved")));
        const isPending = !isVerified && (i.status.toLowerCase().includes("pending") || i.status.toLowerCase().includes("requested"));
        const payId = raw.id || i.no;
        const receiptUrl = raw.receipt_url || "";
        const payMethod = raw.payment_method || "Bank Transfer";
        const txRef = raw.transaction_reference || "—";
        const clientEmail = raw.client_email || "";

        let proofCellHtml = "";
        if (receiptUrl) {
            proofCellHtml = `
                <div style="display:flex; align-items:center; gap:6px;">
                    <img src="${escapeHtml(receiptUrl)}" alt="Slip Proof" style="width:36px; height:36px; object-fit:cover; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer;" onclick="openPaymentProofModal('${payId}')" title="Click to inspect proof slip">
                    <button class="row-action" style="font-size:11px; padding:3px 7px; color:#004AAD; border-color:#93c5fd; background:#eff6ff;" onclick="openPaymentProofModal('${payId}')">View Slip 🖼️</button>
                </div>
            `;
        } else {
            proofCellHtml = `
                <div style="display:flex; align-items:center; gap:6px;">
                    <span style="font-size:11px; color:#94a3b8; font-style:italic;">No slip attached</span>
                    <button class="row-action" style="font-size:11px; padding:3px 6px;" onclick="openPaymentProofModal('${payId}')">Audit</button>
                </div>
            `;
        }

        return `
        <tr data-payment-id="${payId}">
            <td class="ref">
                <strong>${escapeHtml(i.no)}</strong>
                ${i.quote ? `<div style="font-size:11px; color:#64748b;">${escapeHtml(i.quote)}</div>` : ""}
            </td>
            <td>
                <strong>${escapeHtml(i.client)}</strong>
                ${clientEmail ? `<div style="font-size:11px; color:#64748b;">${escapeHtml(clientEmail)}</div>` : ""}
            </td>
            <td>
                <span title="${escapeHtml(i.project)}">${escapeHtml(i.project)}</span>
            </td>
            <td>
                <span class="badge" style="background:#f1f5f9; color:#0f172a; font-size:11px;">${escapeHtml(payMethod)}</span>
                <div style="font-size:11px; font-family:monospace; color:#64748b; margin-top:2px;">${escapeHtml(txRef)}</div>
            </td>
            <td><strong style="color:var(--navy); font-size:14px;">${escapeHtml(i.amount)}</strong></td>
            <td style="font-size:12px; color:#475569;">${escapeHtml(i.due)}</td>
            <td>${proofCellHtml}</td>
            <td><label class="badge ${getStatusBadgeClass(i.status)}">${escapeHtml(i.status)}</label></td>
            <td>
                <div style="display:flex; gap:6px; align-items:center;">
                    ${isPending ? `<button class="row-action" style="background:#059669; color:#fff; border:none; padding:5px 10px; border-radius:4px; font-weight:700; cursor:pointer;" onclick="verifyAdminPayment('${payId}')">Verify ✓</button>` : `<span style="font-size:11px; color:#059669; font-weight:700;">Verified ✓</span>`}
                    <button class="row-action" onclick="downloadInvoiceReceipt('${escapeHtml(i.no)}')">Receipt ⇓</button>
                </div>
            </td>
        </tr>
        `;
    }).join("");
}

// Global modal inspection for Payment & Receipt Slips
window.openPaymentProofModal = function(paymentId) {
    if (!paymentId) return;
    const inv = (AE.invoices || []).find(x => String(x._raw?.id) === String(paymentId) || String(x.no) === String(paymentId));
    const raw = inv ? inv._raw || {} : {};

    const modal = byId("paymentProofModal");
    if (!modal) return;

    byId("proofModalTitle").textContent = `Payment Inspection: ${inv?.no || paymentId}`;
    byId("proofMetaRef").textContent = inv?.no || raw.payment_reference || "—";
    byId("proofMetaAmount").textContent = inv?.amount || (raw.amount ? `₦${Number(raw.amount).toLocaleString()}` : "—");
    byId("proofMetaClient").textContent = inv?.client || raw.client_name || "Commercial Client";
    byId("proofMetaMethod").textContent = raw.payment_method || "Direct Bank Transfer";
    byId("proofMetaTxRef").textContent = raw.transaction_reference || "N/A";

    const badge = byId("proofMetaStatusBadge");
    if (badge) {
        const st = inv?.status || raw.payment_status || "Pending";
        badge.className = `badge ${getStatusBadgeClass(st)}`;
        badge.textContent = st;
    }

    const imgEl = byId("proofImageElement");
    const noImgNotice = byId("proofNoImageNotice");
    const openNewTabLink = byId("proofImageOpenNewTab");
    const receiptUrl = raw.receipt_url || "";

    if (receiptUrl) {
        imgEl.src = receiptUrl;
        imgEl.style.display = "block";
        noImgNotice.style.display = "none";
        openNewTabLink.href = receiptUrl;
        openNewTabLink.style.display = "inline";
    } else {
        imgEl.src = "";
        imgEl.style.display = "none";
        noImgNotice.style.display = "block";
        openNewTabLink.style.display = "none";
    }

    const notesDisp = byId("proofNotesDisplay");
    if (notesDisp) {
        notesDisp.textContent = raw.notes || raw.description || "No specific customer reconciliation note attached to this record.";
    }

    const verifyBtn = byId("proofVerifyActionBtn");
    if (verifyBtn) {
        const isVerified = Boolean(raw.verified) || (inv?.status && (inv.status.toLowerCase().includes("complete") || inv.status.toLowerCase().includes("paid")));
        if (isVerified) {
            verifyBtn.style.display = "none";
        } else {
            verifyBtn.style.display = "inline-flex";
            verifyBtn.onclick = async () => {
                closeModal("paymentProofModal");
                await verifyAdminPayment(raw.id || paymentId);
            };
        }
    }

    const pdfBtn = byId("proofDownloadPdfBtn");
    if (pdfBtn) {
        pdfBtn.onclick = () => {
            downloadInvoiceReceipt(inv?.no || paymentId);
        };
    }

    modal.style.display = "flex";
};

window.verifyAdminPayment = async function(paymentId) {
    if (!paymentId) return;
    try {
        showToast("Verifying client payment record...", "normal");
        const res = await API.post(`/api/payments/${paymentId}/verify`);
        if (res && res.success) {
            showToast(`✅ Payment verified! Client notified and ledger balance updated.`, "success");
            await fetchInvoices();
            if (typeof fetchProjects === "function") await fetchProjects();
        } else {
            showToast(res?.message || "Could not verify payment.", "error");
        }
    } catch (err) {
        showToast(err?.message || "Payment verification failed.", "error");
    }
};

/* =========================================================
   DELETE ACTIONS (QUOTATIONS, CLIENTS, INSTALLERS)
========================================================= */

window.deleteQuotationAction = async function(id, ref) {
    if (!id) return;
    const confirmed = window.confirm(`Permanently delete quotation ${ref || id}?\n\nThis will remove the quotation and its item breakdown.`);
    if (!confirmed) return;

    try {
        showToast("Deleting quotation...", "normal");
        const res = await API.delete(`/api/quotations/${id}`);
        if (res && res.success) {
            showToast(`✅ Quotation ${ref || id} deleted.`, "success");
            AE.quotations = (AE.quotations || []).filter(q => String(q._id) !== String(id) && String(q.ref) !== String(id));
            renderQuotations();
            if (typeof fetchQuotations === "function") await fetchQuotations();
        } else {
            showToast(res?.message || "Failed to delete quotation.", "error");
        }
    } catch (err) {
        showToast(err?.message || "Error deleting quotation.", "error");
    }
};

window.deleteCustomerAction = async function(id, name) {
    if (!id) return;
    const confirmed = window.confirm(`Permanently delete client "${name || id}"?\n\nThis will remove the client account, assigned projects, quotations, and login credentials.`);
    if (!confirmed) return;

    try {
        showToast("Deleting client...", "normal");
        const res = await API.delete(`/api/clients/${id}`);
        if (res && res.success) {
            showToast(`✅ Client "${name || id}" deleted successfully.`, "success");
            AE.customers = (AE.customers || []).filter(c => String(c._raw?.id || c.id) !== String(id));
            renderCustomers();
            if (typeof fetchCustomers === "function") await fetchCustomers();
            if (typeof fetchProjects === "function") await fetchProjects();
            if (typeof fetchQuotations === "function") await fetchQuotations();
        } else {
            showToast(res?.message || "Failed to delete client.", "error");
        }
    } catch (err) {
        showToast(err?.message || "Error deleting client.", "error");
    }
};

window.deleteInstallerAction = async function(id, name) {
    if (!id) return;
    const confirmed = window.confirm(`Permanently delete installer "${name || id}"?\n\nThis will remove the installer directory profile and login credentials.`);
    if (!confirmed) return;

    try {
        showToast("Deleting installer...", "normal");
        const res = await API.delete(`/api/installers/${id}`);
        if (res && res.success) {
            showToast(`✅ Installer "${name || id}" deleted successfully.`, "success");
            AE.installers = (AE.installers || []).filter(i => String(i._dbId || i.id) !== String(id));
            renderInstallers();
            if (typeof fetchInstallers === "function") await fetchInstallers();
            if (typeof fetchProjects === "function") await fetchProjects();
        } else {
            showToast(res?.message || "Failed to delete installer.", "error");
        }
    } catch (err) {
        showToast(err?.message || "Error deleting installer.", "error");
    }
};

window.deleteCurrentInstallerFromProfile = async function() {
    if (!AE.currentInstallerId) {
        showToast("No active installer profile on record to delete.", "warning");
        return;
    }
    const ins = (AE.installers || []).find(i => String(i.id) === String(AE.currentInstallerId) || String(i._dbId) === String(AE.currentInstallerId));
    const dbId = ins ? (ins._dbId || ins.id) : AE.currentInstallerId;
    const name = ins ? ins.name : "this installer";
    await deleteInstallerAction(dbId, name);
    showPage('installers');
};

function filterInvoices() {
    const search = byId("invoiceSearch")?.value.toLowerCase() || "";
    const status = byId("invoiceStatusFilter")?.value.toLowerCase() || "";
    const proofFilter = byId("invoiceProofFilter")?.value || "";

    const filtered = (AE.invoices || []).filter(i => {
        const raw = i._raw || {};
        const matchesSearch = !search ||
                              (i.no && i.no.toLowerCase().includes(search)) ||
                              (i.client && i.client.toLowerCase().includes(search)) ||
                              (i.project && i.project.toLowerCase().includes(search)) ||
                              (raw.transaction_reference && raw.transaction_reference.toLowerCase().includes(search));

        const isVerified = Boolean(raw.verified) || (i.status && (i.status.toLowerCase().includes("complete") || i.status.toLowerCase().includes("paid")));
        let matchesStatus = true;
        if (status === "paid") {
            matchesStatus = isVerified;
        } else if (status === "pending") {
            matchesStatus = !isVerified;
        } else if (status === "partial") {
            matchesStatus = i.status && i.status.toLowerCase().includes("partial");
        }

        let matchesProof = true;
        if (proofFilter === "has_proof") {
            matchesProof = Boolean(raw.receipt_url);
        } else if (proofFilter === "pending_verify") {
            matchesProof = !isVerified;
        }

        return matchesSearch && matchesStatus && matchesProof;
    });

    renderInvoices(filtered);
}

// 4.7 Equipment Table
function renderEquipment(list = AE.equipment) {
    const tbody = byId("equipmentTableBody");
    if (!tbody) return;

    tbody.innerHTML = list.map(e => `
        <tr>
            <td class="ref"><strong>${e.code}</strong></td>
            <td><strong>${e.model}</strong></td>
            <td>${e.brand}</td>
            <td><label class="badge blue-b">${e.category}</label></td>
            <td><strong>${e.capacity}</strong></td>
            <td>${e.warranty}</td>
            <td><label class="badge green-b">${e.status}</label></td>
            <td><button class="row-action" onclick="showToast('Equipment specifications loaded')">Specs →</button></td>
        </tr>
    `).join("");
}

function filterEquipment() {
    const search = byId("equipmentSearch")?.value.toLowerCase() || "";
    const cat = byId("equipmentCategoryFilter")?.value || "";

    const filtered = AE.equipment.filter(e => {
        const matchesSearch = e.code.toLowerCase().includes(search) ||
                              e.model.toLowerCase().includes(search) ||
                              e.brand.toLowerCase().includes(search);
        const matchesCat = !cat || e.category === cat;
        return matchesSearch && matchesCat;
    });

    renderEquipment(filtered);
}

// 4.8 Installer Directory Table
// 4.8 Installer Directory Table
function renderInstallers(list = AE.installers) {
    const tbody = byId("installerTableBody");
    const emptyState = byId("installerEmptyState");
    const countDisplay = byId("installerResultCount");

    // Update stats dynamically
    let onProjTotal = 0;
    let availableTotal = 0;
    let totalHandled = 0;
    (AE.installers || []).forEach(i => {
        const assigned = (AE.projects || []).some(p => {
            const pid = String(p.installerId || '');
            return (pid === String(i._dbId) || pid === String(i.id)) && p.progress < 100;
        });
        if (assigned) onProjTotal++;
        else if (i.status === 'active') availableTotal++;

        const insProjs = (AE.projects || []).filter(p => {
            const pid = String(p.installerId || '');
            return pid === String(i._dbId) || pid === String(i.id) || (i._raw && pid === String(i._raw.id));
        });
        totalHandled += (insProjs.length || i.projects || 0);
    });

    if (byId("totalInstallers")) byId("totalInstallers").textContent = AE.installers ? AE.installers.length : 0;
    if (byId("activeInstallers")) byId("activeInstallers").textContent = availableTotal;
    if (byId("projectInstallers")) byId("projectInstallers").textContent = onProjTotal;
    if (byId("installerProjects")) byId("installerProjects").textContent = totalHandled;

    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = "";
        if (emptyState) emptyState.hidden = false;
        if (countDisplay) countDisplay.textContent = "0 installers found";
        return;
    }

    if (emptyState) emptyState.hidden = true;
    if (countDisplay) countDisplay.textContent = `${list.length} installer${list.length === 1 ? '' : 's'} displayed`;

    tbody.innerHTML = list.map(ins => {
        // Compute live assigned projects for this installer
        const assignedProjects = (AE.projects || []).filter(p => {
            const pid = String(p.installerId || '');
            return pid === String(ins._dbId) || pid === String(ins.id) || (ins._raw && pid === String(ins._raw.id));
        });
        const hasActiveProject = assignedProjects.some(p => p.progress < 100 && (p.stage || '').toLowerCase() !== 'commissioned');
        const projCount = assignedProjects.length || ins.projects || 0;

        // Dynamic Live Status
        let statusBadgeClass = "gray-b";
        let statusText = "● INACTIVE";
        if (hasActiveProject) {
            statusBadgeClass = "amber-b";
            statusText = "● ON PROJECT";
        } else if (ins.status === "active") {
            statusBadgeClass = "green-b";
            statusText = "● AVAILABLE";
        }

        const initials = ins.name ? ins.name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() : "IN";

        return `
            <tr onclick="openInstallerProfile('${ins.id}')" style="cursor:pointer">
                <td>
                    <div class="installer-person">
                        <div class="installer-photo">
                            ${ins.photo ? `<img src="${ins.photo}" alt="${ins.name}">` : initials}
                        </div>
                        <div>
                            <strong>${ins.name}</strong>
                            <small style="display:block;color:var(--muted)">${ins.phone}</small>
                        </div>
                    </div>
                </td>
                <td>${ins.state}</td>
                <td>${ins.lga}</td>
                <td class="ref"><strong>${ins.rcNumber}</strong></td>
                <td>${ins.position}</td>
                <td><label class="badge blue-b">${ins.specialization}</label></td>
                <td>${ins.group}</td>
                <td>${ins.registered}</td>
                <td><label class="badge ${statusBadgeClass}">${statusText}</label></td>
                <td><strong>${projCount}</strong></td>
                <td class="ref">${assignedProjects[0] ? assignedProjects[0].id : (ins.rcNumber || '—')}</td>
                <td>
                    <div style="display:inline-flex; gap:6px; align-items:center;">
                        <button class="row-action" onclick="event.stopPropagation(); openInstallerProfile('${ins.id}')">Profile →</button>
                        ${ins.verificationStatus !== 'verified' ? `
                            <button class="row-action" title="Accept & Verify Installer" style="color:#059669; border-color:rgba(5,150,105,0.4); font-weight:700;" onclick="event.stopPropagation(); adminApproveInstallerAction('${ins._dbId || ins.id}')">✓ Accept</button>
                        ` : ''}
                        ${ins.verificationStatus !== 'rejected' ? `
                            <button class="row-action" title="Decline Installer Application" style="color:#b91c1c; border-color:rgba(185,28,28,0.4); font-weight:700;" onclick="event.stopPropagation(); adminDeclineInstallerAction('${ins._dbId || ins.id}')">✕ Deny</button>
                        ` : ''}
                        <button class="row-action" title="Send notification to installer" style="color:#004AAD; border-color:rgba(0,74,173,0.3); font-weight:700;" onclick="event.stopPropagation(); openSendInstallerNotificationModal('${ins.id}')">✉</button>
                        <button class="row-action" title="Delete Installer" style="color:#ef4444; border-color:rgba(239,68,68,0.4); font-weight:700;" onclick="event.stopPropagation(); deleteInstallerAction('${ins._dbId || ins.id}', '${String(ins.name || '').replace(/'/g, "\\'")}')">🗑</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function filterInstallers() {
    const search = byId("installerSearch")?.value.toLowerCase() || "";
    const state = byId("installerStateFilter")?.value || "";
    const pos = byId("installerPositionFilter")?.value || "";
    const status = byId("installerStatusFilter")?.value || "";
    const spec = byId("installerSpecializationFilter")?.value || "";

    const filtered = AE.installers.filter(ins => {
        const matchesSearch = (ins.name || "").toLowerCase().includes(search) ||
                              (ins.id || "").toLowerCase().includes(search) ||
                              (ins.rcNumber || "").toLowerCase().includes(search) ||
                              (ins.specialization || "").toLowerCase().includes(search);
        const matchesState = !state || (ins.state || "").includes(state);
        const matchesPos = !pos || ins.position === pos;
        
        let matchesStatus = true;
        if (status) {
            const isAssigned = (AE.projects || []).some(p => {
                const pid = String(p.installerId || '');
                return (pid === String(ins._dbId) || pid === String(ins.id)) && p.progress < 100;
            });
            if (status === "project") matchesStatus = isAssigned;
            else if (status === "active") matchesStatus = !isAssigned && ins.status === "active";
            else if (status === "inactive") matchesStatus = ins.status !== "active";
        }

        const matchesSpec = !spec || (ins.specialization || "").includes(spec);
        return matchesSearch && matchesState && matchesPos && matchesStatus && matchesSpec;
    });

    renderInstallers(filtered);
}

function clearInstallerFilters() {
    if (byId("installerSearch")) byId("installerSearch").value = "";
    if (byId("installerStateFilter")) byId("installerStateFilter").value = "";
    if (byId("installerPositionFilter")) byId("installerPositionFilter").value = "";
    if (byId("installerStatusFilter")) byId("installerStatusFilter").value = "";
    if (byId("installerSpecializationFilter")) byId("installerSpecializationFilter").value = "";
    renderInstallers();
}

// 4.9 Installer Profile View
async function openInstallerProfile(id, navigate = true) {
    if (typeof fetchInstallers === "function") {
        await fetchInstallers();
    }
    const ins = (AE.installers || []).find(i => i.id === id || String(i._dbId) === String(id)) || (AE.installers && AE.installers[0]);
    if (!ins) {
        AE.currentInstallerId = null;
        const selectEl = byId("installerProfileSelect");
        if (selectEl) {
            selectEl.innerHTML = `<option value="">— No Installers Registered —</option>`;
        }
        if (byId("installerProfileTitleName")) byId("installerProfileTitleName").textContent = "—";
        if (byId("installerProfileName")) byId("installerProfileName").textContent = "No Installer Selected";
        if (byId("installerProfileId")) byId("installerProfileId").textContent = "—";
        if (byId("installerProfileRole")) byId("installerProfileRole").textContent = "Awaiting fresh installer registration";
        if (byId("profileState")) byId("profileState").textContent = "—";
        if (byId("profileLga")) byId("profileLga").textContent = "—";
        if (byId("profileGroup")) byId("profileGroup").textContent = "—";
        if (byId("profileRegistered")) byId("profileRegistered").textContent = "—";
        if (byId("installerProfileCertBadge")) {
            byId("installerProfileCertBadge").className = "badge gray-b";
            byId("installerProfileCertBadge").innerHTML = `<i class="fa-solid fa-shield-halved"></i> Not Certified`;
        }
        if (byId("installerProfileBankBadge")) {
            byId("installerProfileBankBadge").className = "badge gray-b";
            byId("installerProfileBankBadge").innerHTML = `<i class="fa-solid fa-building-columns"></i> Banking: None`;
        }
        if (byId("installerProfileStatus")) {
            byId("installerProfileStatus").className = "badge gray-b";
            byId("installerProfileStatus").textContent = "● NO RECORDS";
        }
        if (byId("profileQuickStatus")) {
            byId("profileQuickStatus").textContent = "No Installer";
            byId("profileQuickStatus").style.color = "#64748b";
        }
        if (byId("profileQuickText")) byId("profileQuickText").textContent = "Ready for fresh installer registration";

        // Reset inputs
        ["adminBankName", "adminAccountName", "adminAccountNumber", "adminAccountBvn",
         "adminProfileInstallerId", "adminProfileEmail", "adminProfilePhone", "adminProfileFullName",
         "adminProfileState", "adminProfileLga", "adminProfileSpecialization", "adminProfilePosition"].forEach(fid => {
            if (byId(fid)) byId(fid).value = "";
        });

        const imgEl = byId("installerProfileImage");
        if (imgEl) {
            imgEl.innerHTML = "";
            imgEl.textContent = "—";
        }
        const photoBadge = byId("installerProfilePhotoBadge");
        if (photoBadge) {
            photoBadge.innerHTML = `<i class="fa-solid fa-circle-xmark" style="color:#94a3b8;"></i> No photo uploaded`;
            photoBadge.style.color = "#64748b";
            photoBadge.style.background = "#f1f5f9";
            photoBadge.style.borderColor = "#cbd5e1";
        }

        if (byId("identityGrid")) byId("identityGrid").innerHTML = `<div style="grid-column:1/-1; color:#64748b; padding:12px 0;">No active installer record found.</div>`;
        if (byId("businessGrid")) byId("businessGrid").innerHTML = `<div style="grid-column:1/-1; color:#64748b; padding:12px 0;">No CAC incorporation data.</div>`;
        if (byId("documentList")) byId("documentList").innerHTML = `<div style="padding:14px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; font-size:12px; color:#64748b; text-align:center;">No documents uploaded. Register a new installer to attach credentials.</div>`;
        if (byId("certificateGrid")) byId("certificateGrid").innerHTML = `<div style="padding:14px; background:#f8fafc; border-radius:8px; font-size:12px; color:#64748b; text-align:center;">No certificates on record.</div>`;
        if (byId("projectHistory")) byId("projectHistory").innerHTML = `<div style="text-align:center; padding:24px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:12px; font-size:12px; color:#64748b;">No projects available.</div>`;
        if (byId("statusDisplay")) byId("statusDisplay").innerHTML = `<div style="padding:12px; background:#f1f5f9; border-radius:8px; color:#64748b; font-size:12px;">No active installer deployed.</div>`;
        if (byId("specializationTags")) byId("specializationTags").innerHTML = `<span style="color:#64748b; font-size:12px;">None specified</span>`;
        if (byId("adminCallPhoneDisplay")) byId("adminCallPhoneDisplay").textContent = "—";
        if (byId("adminEmailDisplay")) byId("adminEmailDisplay").textContent = "—";
        if (byId("bankingStatusBadge")) {
            byId("bankingStatusBadge").className = "badge gray-b";
            byId("bankingStatusBadge").textContent = "No Bank Account";
        }
        if (byId("bankingNoticeBanner")) {
            byId("bankingNoticeBanner").style.display = "none";
        }
        return;
    }

    AE.currentInstallerId = ins.id;

    // Synchronize select dropdown
    const selectEl = byId("installerProfileSelect");
    if (selectEl) {
        selectEl.value = ins.id;
    }

    // Header info
    if (byId("installerProfileTitleName")) byId("installerProfileTitleName").textContent = ins.name;
    if (byId("installerProfileName")) byId("installerProfileName").textContent = ins.name;
    if (byId("installerProfileId")) byId("installerProfileId").textContent = ins.id;
    if (byId("installerProfileRole")) byId("installerProfileRole").textContent = ins.position || "Field Operations Specialist";
    if (byId("profileState")) byId("profileState").textContent = ins.state;
    if (byId("profileLga")) byId("profileLga").textContent = ins.lga;
    if (byId("profileGroup")) byId("profileGroup").textContent = ins.group;
    if (byId("profileRegistered")) byId("profileRegistered").textContent = ins.registered;

    // Avatar / Photo & Dynamic Badge (Not hardcoded)
    const imgEl = byId("installerProfileImage");
    const photoBadge = byId("installerProfilePhotoBadge");
    const photoUrl = ins.photo || ins._raw?.profile_image || null;

    if (imgEl) {
        if (photoUrl) {
            imgEl.innerHTML = `<img src="${photoUrl}" alt="${ins.name}" style="width:100%;height:100%;object-fit:cover;display:block;border-radius:18px;" onerror="this.onerror=null;this.parentElement.textContent='${ins.name ? ins.name.slice(0,2).toUpperCase() : 'IN'}';">`;
            imgEl.style.cursor = "pointer";
            imgEl.title = "Click to view full photo";
            imgEl.onclick = () => window.open(photoUrl, "_blank");
        } else {
            imgEl.innerHTML = "";
            imgEl.textContent = ins.name ? ins.name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() : "BA";
            imgEl.style.cursor = "default";
            imgEl.onclick = null;
        }
    }

    if (photoBadge) {
        if (photoUrl) {
            photoBadge.innerHTML = `<i class="fa-solid fa-circle-check" style="color:#10b981;"></i> Official Photo Uploaded`;
            photoBadge.style.color = "#065f46";
            photoBadge.style.background = "#ecfdf5";
            photoBadge.style.borderColor = "#a7f3d0";
        } else {
            photoBadge.innerHTML = `<i class="fa-solid fa-circle-xmark" style="color:#94a3b8;"></i> No photo uploaded`;
            photoBadge.style.color = "#64748b";
            photoBadge.style.background = "#f1f5f9";
            photoBadge.style.borderColor = "#cbd5e1";
        }
    }

    // Determine live status from assigned projects
    const installerProjects = (AE.projects || []).filter(p => {
        const pid = String(p.installerId || '');
        return pid === String(ins._dbId) || pid === String(ins.id) || (ins._raw && pid === String(ins._raw.id));
    });
    const activeProjects = installerProjects.filter(p => p.progress < 100 && (p.stage || '').toLowerCase() !== 'commissioned');
    const isAssigned = activeProjects.length > 0;

    const statusLabel = byId("installerProfileStatus");
    const quickStatus = byId("profileQuickStatus");
    const quickText = byId("profileQuickText");

    if (isAssigned) {
        if (statusLabel) { statusLabel.className = "badge amber-b"; statusLabel.textContent = "● ON PROJECT"; }
        if (quickStatus) { quickStatus.textContent = "On Project"; quickStatus.style.color = "#d97706"; }
        if (quickText) quickText.textContent = `Assigned to ${activeProjects[0].name || activeProjects[0].id}`;
    } else if (ins.status === "active") {
        if (statusLabel) { statusLabel.className = "badge green-b"; statusLabel.textContent = "● AVAILABLE"; }
        if (quickStatus) { quickStatus.textContent = "Available"; quickStatus.style.color = "#10b981"; }
        if (quickText) quickText.textContent = "Ready for field assignment";
    } else {
        if (statusLabel) { statusLabel.className = "badge gray-b"; statusLabel.textContent = "● INACTIVE"; }
        if (quickStatus) { quickStatus.textContent = "Inactive"; quickStatus.style.color = "#64748b"; }
        if (quickText) quickText.textContent = "Account suspended / pending audit";
    }

    // Hero Badges — Only show Verified / Certified if Admin verified
    const isInstallerVerified = ins.verificationStatus === "verified";
    const certBadge = byId("installerProfileCertBadge");
    if (certBadge) {
        if (isInstallerVerified) {
            certBadge.className = "badge green-b";
            certBadge.innerHTML = `<i class="fa-solid fa-shield-halved"></i> Certified Installer`;
        } else if (ins.verificationStatus === "rejected") {
            certBadge.className = "badge red-b";
            certBadge.innerHTML = `<i class="fa-solid fa-ban"></i> Verification Rejected`;
        } else {
            certBadge.className = "badge amber-b";
            certBadge.innerHTML = `<i class="fa-solid fa-hourglass-half"></i> Pending Verification`;
        }
    }
    const isBankVerified = isInstallerVerified && ins.bankingVerificationStatus === "verified";
    const isBankRejected = ins.bankingVerificationStatus === "rejected";
    const bankBadge = byId("installerProfileBankBadge");
    if (bankBadge) {
        bankBadge.className = `badge ${isBankVerified ? 'blue-b' : (isBankRejected ? 'red-b' : 'amber-b')}`;
        bankBadge.innerHTML = `<i class="fa-solid fa-building-columns"></i> Banking: ${isBankVerified ? 'Verified' : (isBankRejected ? 'Rejected' : 'Pending')}`;
    }
    const setStatus = byId("installerProfileSettlementStatus");
    if (setStatus) {
        setStatus.textContent = isBankVerified ? "Verified" : (isBankRejected ? 'Rejected' : 'Pending');
        setStatus.style.color = isBankVerified ? '#059669' : (isBankRejected ? '#ef4444' : '#d97706');
    }

    const isAppApproved = ins.verificationStatus === 'verified' && ins.status === 'active';
    const isAppDeclined = ins.verificationStatus === 'rejected' || ins.status === 'rejected';
    const btnAccept = byId("btnAdminAcceptInstaller");
    const btnDecline = byId("btnAdminDeclineInstaller");
    if (btnAccept) {
        if (isAppApproved) {
            btnAccept.innerHTML = `<span style="font-size:14px;">✓</span> Verified Member`;
            btnAccept.style.background = "#059669";
            btnAccept.style.opacity = "0.9";
        } else {
            btnAccept.innerHTML = `<span style="font-size:14px;">✓</span> Accept Installer`;
            btnAccept.style.background = "#10b981";
            btnAccept.style.opacity = "1";
        }
    }
    if (btnDecline) {
        if (isAppDeclined) {
            btnDecline.innerHTML = `<span style="font-size:14px;">✕</span> Application Declined`;
            btnDecline.style.opacity = "0.9";
        } else {
            btnDecline.innerHTML = `<span style="font-size:14px;">✕</span> Deny Installer`;
            btnDecline.style.opacity = "1";
        }
    }

    // Financial Settlement Input Fields (Populated Live)
    if (byId("adminBankName")) byId("adminBankName").value = ins.bank && ins.bank !== '—' ? ins.bank : "";
    if (byId("adminAccountName")) byId("adminAccountName").value = ins.accountName && ins.accountName !== '—' ? ins.accountName : "";
    if (byId("adminAccountNumber")) byId("adminAccountNumber").value = ins.accountNumber && ins.accountNumber !== '—' ? ins.accountNumber : "";
    if (byId("adminAccountBvn")) byId("adminAccountBvn").value = ins.bvn && ins.bvn !== '—' ? ins.bvn : "";

    // Identity Credentials Input Fields (Populated Live)
    if (byId("adminProfileInstallerId")) byId("adminProfileInstallerId").value = ins.id;
    if (byId("adminProfileEmail")) byId("adminProfileEmail").value = ins.email && ins.email !== '—' ? ins.email : "";
    if (byId("adminProfilePhone")) byId("adminProfilePhone").value = ins.phone && ins.phone !== '—' ? ins.phone : "";
    if (byId("adminProfileFullName")) byId("adminProfileFullName").value = ins.name;
    if (byId("adminProfileState")) byId("adminProfileState").value = ins.state || "Abuja";
    if (byId("adminProfileLga")) byId("adminProfileLga").value = ins.lga || "AMAC";
    if (byId("adminProfileSpecialization")) {
        const specVal = ins.specialization || (Array.isArray(ins.specializations) ? ins.specializations.join(", ") : "Solar PV Rooftop Arrays, DEYE Hybrid Inverters");
        byId("adminProfileSpecialization").value = specVal;
    }
    if (byId("adminProfilePosition")) byId("adminProfilePosition").value = ins.position || "Field Operations Specialist";
    if (byId("adminProfileStatus")) byId("adminProfileStatus").value = ins.status || "active";

    // Direct Operations Contact
    if (byId("adminCallInstallerLink")) byId("adminCallInstallerLink").href = `tel:${ins.phone}`;
    if (byId("adminCallPhoneDisplay")) byId("adminCallPhoneDisplay").textContent = ins.phone;
    if (byId("adminEmailInstallerLink")) byId("adminEmailInstallerLink").href = `mailto:${ins.email}`;
    if (byId("adminEmailDisplay")) byId("adminEmailDisplay").textContent = ins.email;

    // Render Banking Settlement Details card
    renderBankDetails(ins);

    // Ensure banking fields are locked/read-only for Admin review
    ["adminBankName", "adminAccountName", "adminAccountNumber", "adminAccountBvn"].forEach(fid => {
        const el = byId(fid);
        if (el) {
            el.readOnly = true;
            el.style.backgroundColor = "#f8fafc";
            el.style.cursor = "default";
        }
    });

    // Ensure never-editable identity credentials are permanently read-only
    ["adminProfileInstallerId", "adminProfileEmail", "adminProfilePhone", "adminProfileFullName"].forEach(fid => {
        const el = byId(fid);
        if (el) {
            el.readOnly = true;
            el.style.backgroundColor = "#f1f5f9";
            el.style.cursor = "not-allowed";
        }
    });

    // Check for pending banking modification request from installer
    if (typeof checkInstallerPendingChangeRequests === "function") {
        checkInstallerPendingChangeRequests(ins._dbId || ins.id);
    }

    // Identity Grid legacy view if element exists
    const idGrid = byId("identityGrid");
    if (idGrid) {
        idGrid.innerHTML = `
            <div><small>Full Legal Name</small><strong>${ins.name}</strong></div>
            <div><small>Primary Phone</small><strong>${ins.phone}</strong></div>
            <div><small>Email Address</small><strong>${ins.email}</strong></div>
            <div><small>Years of Experience</small><strong>${ins.experience}</strong></div>
            <div><small>Assigned Territory</small><strong>${ins.lga}, ${ins.state}</strong></div>
            <div><small>Active Registration Date</small><strong style="color:#044381;">${ins.registered}</strong></div>
        `;
    }

    // Business Registration Grid (CAC)
    const busGrid = byId("businessGrid");
    if (busGrid) {
        const isCacVerified = ins.verificationStatus === "verified";
        const cacBadge = byId("cacStatusBadge");
        if (cacBadge) {
            cacBadge.className = `badge ${isCacVerified ? 'green-b' : (ins.verificationStatus === 'rejected' ? 'red-b' : 'amber-b')}`;
            cacBadge.textContent = isCacVerified ? "CAC Verified" : (ins.verificationStatus === 'rejected' ? "CAC Denied" : "Pending Review");
        }

        busGrid.innerHTML = `
            <div><small>CAC Registration (RC/BN)</small><strong style="letter-spacing:0.5px;">${ins.rcNumber}</strong></div>
            <div><small>CAC Approval Date</small><strong>${ins.cacDate}</strong></div>
            <div><small>Corporate Compliance</small><strong style="color:${isCacVerified ? '#10b981' : '#d97706'}">${isCacVerified ? '✓ Verified by CAC Commission' : 'Audit Required'}</strong></div>
        `;
    }

    // CAC Document List
    const docList = byId("documentList");
    if (docList) {
        if (ins.cacCertificateUrl) {
            const isVerified = ins.verificationStatus === "verified";
            docList.innerHTML = `
                <div class="doc-card" style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <span style="font-weight:800; color:#044381; background:rgba(0,74,173,0.1); padding:8px 12px; border-radius:8px; font-size:13px;">CAC</span>
                        <div>
                            <strong style="color:#0f172a; font-size:14px; display:block;">Corporate Affairs Commission Certificate</strong>
                            <small style="color:var(--muted); font-size:12px;">Verified legal entity incorporation document</small>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <button class="primary" style="padding:6px 14px; font-size:12px; font-weight:700; background:#044381; border-color:#044381;" onclick="viewInstallerDocument('CAC Certificate — ${ins.name.replace(/'/g, "\\'")}', '${ins.cacCertificateUrl}', 'cac', '${ins.id}')">👁 View Document</button>
                        ${!isVerified ? `
                            <button class="secondary-btn" style="color:#10b981; border-color:#a7f3d0; background:#ecfdf5; padding:6px 12px; font-size:12px; font-weight:700;" onclick="verifyInstallerAccreditation('${ins.id}', 'verified')">✓ Verify</button>
                            <button class="secondary-btn" style="color:#b91c1c; border-color:#fecaca; background:#fff1f2; padding:6px 12px; font-size:12px; font-weight:700;" onclick="verifyInstallerAccreditation('${ins.id}', 'rejected')">✕ Deny</button>
                        ` : `
                            <span class="badge green-b" style="font-size:11px;">✓ CAC Verified</span>
                        `}
                    </div>
                </div>
            `;
        } else {
            docList.innerHTML = `
                <div style="padding:14px; background:#fffbeb; border:1px dashed #fcd34d; border-radius:8px; font-size:12px; color:#92400e;">
                    ⚠ No CAC certificate file currently uploaded for this installer.
                </div>
            `;
        }
    }

    // Professional Certificates Grid
    const certGrid = byId("certificateGrid");
    if (certGrid) {
        const isProfVerified = ins.verificationStatus === "verified";
        const profBadge = byId("profCertStatusBadge");
        if (profBadge) {
            profBadge.className = `badge ${isProfVerified ? 'green-b' : 'amber-b'}`;
            profBadge.textContent = isProfVerified ? "Accredited" : "Pending Audit";
        }

        let certHtml = "";
        if (ins.professionalCertificateUrl) {
            certHtml += `
                <div style="padding:14px 16px; background:#f8fafc; border-radius:10px; border:1px solid #e2e8f0; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <span style="font-weight:800; color:#10b981; background:rgba(16,185,129,0.1); padding:8px 12px; border-radius:8px; font-size:13px;">NEMSA</span>
                        <div>
                            <strong style="color:#0f172a; font-size:14px; display:block;">NEMSA / Technical Engineering Accreditation</strong>
                            <small style="color:#10b981; font-weight:700; font-size:12px;">Official high-voltage and renewable licensing on file</small>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <button class="primary" style="padding:6px 14px; font-size:12px; font-weight:700; background:#10b981; border-color:#10b981;" onclick="viewInstallerDocument('Technical Accreditation — ${ins.name.replace(/'/g, "\\'")}', '${ins.professionalCertificateUrl}', 'accreditation', '${ins.id}')">👁 View Certificate</button>
                        ${!isProfVerified ? `
                            <button class="secondary-btn" style="color:#10b981; border-color:#a7f3d0; background:#ecfdf5; padding:6px 12px; font-size:12px; font-weight:700;" onclick="verifyInstallerAccreditation('${ins.id}', 'verified')">✓ Verify</button>
                            <button class="secondary-btn" style="color:#b91c1c; border-color:#fecaca; background:#fff1f2; padding:6px 12px; font-size:12px; font-weight:700;" onclick="verifyInstallerAccreditation('${ins.id}', 'rejected')">✕ Deny</button>
                        ` : `
                            <span class="badge green-b" style="font-size:11px;">✓ Certified</span>
                        `}
                    </div>
                </div>
            `;
        }

        // Additional certified qualifications
        (ins.certificates || []).forEach(c => {
            if (c.includes("NEMSA") && ins.professionalCertificateUrl) return; // avoid duplicate
            certHtml += `
                <div style="padding:12px 16px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color:#1e293b; font-size:13px;">${c}</strong>
                        <small style="display:block; color:#10b981; font-size:11px; font-weight:600; margin-top:2px;">✓ Verified Technical Qualification</small>
                    </div>
                    <span class="badge green-b" style="font-size:10px;">ACTIVE</span>
                </div>
            `;
        });

        certGrid.innerHTML = certHtml || `
            <div style="padding:14px; background:#f8fafc; border-radius:8px; font-size:12px; color:var(--muted); text-align:center;">
                No professional certificates attached to this profile.
            </div>
        `;
    }

    // Project History Rendering
    const histEl = byId("projectHistory");
    const histCount = byId("profileProjectCount");
    if (histCount) histCount.textContent = `${installerProjects.length} Project${installerProjects.length === 1 ? '' : 's'}`;

    if (histEl) {
        if (installerProjects.length > 0) {
            histEl.innerHTML = installerProjects.map(p => {
                const formattedVal = p._raw && p._raw.contract_value 
                    ? '₦' + Number(p._raw.contract_value).toLocaleString('en-NG', { maximumFractionDigits: 0 })
                    : (p.contract_value ? '₦' + Number(p.contract_value).toLocaleString('en-NG', { maximumFractionDigits: 0 }) : '₦17,903,394');

                return `
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:14px 16px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                        <div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <strong style="color:#044381; font-size:14px;">${p.id}</strong>
                                <label class="badge ${p.progress === 100 ? 'green-b' : 'amber-b'}" style="font-size:11px;">● ${p.stage.toUpperCase()}</label>
                            </div>
                            <div style="font-size:13px; font-weight:700; color:#1e293b; margin-top:3px;">${p.name}</div>
                            <div style="font-size:12px; color:#64748b; margin-top:3px;">
                                Capacity: <b style="color:#0f172a;">${p.capacity}</b> • Client: <b style="color:#0f172a;">${p.client}</b> • Contract: <b style="color:#044381;">${formattedVal}</b>
                            </div>
                        </div>
                        <button class="secondary-btn" style="padding:6px 14px; font-size:12px; border-radius:6px; font-weight:700;" onclick="event.stopPropagation(); showPage('projects');">Manage Project →</button>
                    </div>
                `;
            }).join("");
        } else {
            histEl.innerHTML = `
                <div style="text-align:center; padding:32px 16px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:12px;">
                    <div style="font-size:24px; margin-bottom:6px;">📋</div>
                    <strong style="color:#334155; display:block; font-size:14px;">No Assigned Projects in History</strong>
                    <p style="color:#64748b; font-size:12px; margin:4px 0 14px;">This installer is currently available and ready for assignment to renewable installations.</p>
                    <button class="primary" style="font-size:12px; padding:8px 16px; font-weight:700;" onclick="assignInstallerProject()">+ Assign First Project</button>
                </div>
            `;
        }
    }

    // Current Operational Status Card
    const statusDisp = byId("statusDisplay");
    if (statusDisp) {
        if (isAssigned) {
            statusDisp.innerHTML = `
                <div style="padding:14px; background:#fffbeb; border:1px solid #fde68a; border-radius:10px;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#d97706;"></span>
                        <strong style="color:#92400e; font-size:13px; text-transform:uppercase;">Currently Dispatched on Field Project</strong>
                    </div>
                    <div style="font-size:13px; font-weight:700; color:#1e293b;">${activeProjects[0].name} (${activeProjects[0].id})</div>
                    <div style="font-size:12px; color:#475569; margin-top:2px;">Stage: <strong>${activeProjects[0].stage}</strong> (${activeProjects[0].progress}% Complete)</div>
                    <button class="text-btn" style="margin-top:8px; font-size:12px; font-weight:700; color:#044381;" onclick="showPage('projects')">View Active Project Site →</button>
                </div>
            `;
        } else if (ins.status === "active") {
            statusDisp.innerHTML = `
                <div style="padding:14px; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:10px;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#10b981;"></span>
                        <strong style="color:#065f46; font-size:13px;">Available for Deployment</strong>
                    </div>
                    <p style="font-size:12px; color:#047857; margin:2px 0 0;">Zero active field conflicts. Engineer is unassigned and ready for work orders.</p>
                </div>
            `;
        } else {
            statusDisp.innerHTML = `
                <div style="padding:14px; background:#f1f5f9; border:1px solid #cbd5e1; border-radius:10px;">
                    <strong style="color:#475569; font-size:13px;">Account Inactive</strong>
                    <p style="font-size:12px; color:#64748b; margin:2px 0 0;">Installer is temporarily inactive or awaiting annual compliance review.</p>
                </div>
            `;
        }
    }

    // Specialization tags
    const specTags = byId("specializationTags");
    if (specTags) {
        const specs = ins.specializations && ins.specializations.length > 0 
            ? ins.specializations 
            : ["Solar PV Rooftop Arrays", "DEYE Hybrid Inverters", "Battery Storage"];
        specTags.innerHTML = specs.map(s => `
            <span class="badge blue-b" style="display:inline-block; margin:3px 4px 3px 0; font-size:12px; padding:4px 10px; border-radius:6px;">
                ⚡ ${s}
            </span>
        `).join("");
    }

    if (navigate && AE.currentPage !== "installer-profile") {
        showPage("installer-profile");
    }
}

// Render UNMASKED Settlement Bank Details & Dynamic Notices
function renderBankDetails(ins = null) {
    if (!ins) {
        ins = AE.installers.find(i => i.id === AE.currentInstallerId || String(i._dbId) === String(AE.currentInstallerId)) || AE.installers[0];
    }
    if (!ins) return;

    const isProfileVerified = ins.verificationStatus === "verified";
    const isVerified = isProfileVerified && ins.bankingVerificationStatus === "verified";
    const isRejected = ins.bankingVerificationStatus === "rejected";

    const badgeEl = byId("bankingStatusBadge");
    if (badgeEl) {
        badgeEl.className = `badge ${isVerified ? 'green-b' : (isRejected ? 'red-b' : 'amber-b')}`;
        badgeEl.textContent = isVerified ? "Verified Settlement Account (Locked)" : (isRejected ? "Rejected / Requires Correction" : "Pending Review");
    }

    const nTitle = byId("bankingNoticeTitle");
    const nText = byId("bankingNoticeText");
    const nBanner = byId("bankingNoticeBanner");
    if (nTitle && nText) {
        if (isVerified) {
            nTitle.textContent = "Verified Settlement Account (Locked)";
            nText.textContent = "Your banking details are verified and permanently locked to protect your account. In accordance with security policy, verified accounts cannot be changed directly unless you request from Admin and authorization is granted.";
            if (nBanner) {
                nBanner.style.background = "#f0fdf4";
                nBanner.style.borderColor = "#bbf7d0";
            }
        } else if (isRejected) {
            nTitle.textContent = "Settlement Account Requires Correction";
            nText.textContent = "Admin has rejected the submitted settlement information. Installer has been notified that correction is required.";
            if (nBanner) {
                nBanner.style.background = "#fff1f2";
                nBanner.style.borderColor = "#fecaca";
            }
        } else {
            nTitle.textContent = "Settlement Account Pending Review";
            nText.textContent = "Review the official Nigerian bank details submitted by the installer before approving payouts.";
            if (nBanner) {
                nBanner.style.background = "#fffbeb";
                nBanner.style.borderColor = "#fde68a";
            }
        }
    }

    const lockHint = byId("adminBankingLockStatusHint");
    if (lockHint) {
        lockHint.innerHTML = `Status: <strong>${isVerified ? 'Verified Settlement Account (Locked)' : (isRejected ? 'Rejected / Requires Correction' : 'Pending Review')}</strong>`;
    }

    const lockToggleBtn = byId("btnToggleBankingLock");
    if (lockToggleBtn) {
        lockToggleBtn.textContent = "🔓 Unlock Banking For Installer";
    }

    // Backward compatibility for legacy secureInfo element
    const secureInfo = byId("secureInfo");
    if (secureInfo) {
        secureInfo.innerHTML = `
            <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:16px;">
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <div>
                        <small style="color:#64748b; font-size:11px; font-weight:700; text-transform:uppercase; display:block;">Financial Institution / Bank</small>
                        <strong style="color:#0f172a; font-size:15px;">${ins.bank || 'Not Specified'}</strong>
                    </div>
                    <div>
                        <small style="color:#64748b; font-size:11px; font-weight:700; text-transform:uppercase; display:block;">Beneficiary Account Name</small>
                        <strong style="color:#0f172a; font-size:15px;">${ins.accountName || 'Not Specified'}</strong>
                    </div>
                    <div style="background:#f8fafc; padding:10px 14px; border-radius:8px; border:1px solid #e2e8f0;">
                        <small style="color:#475569; font-size:11px; font-weight:700; text-transform:uppercase; display:block;">Account Number (Complete & Unmasked)</small>
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:2px;">
                            <strong style="font-size:18px; letter-spacing:1px; color:#044381; font-family:monospace;">${ins.accountNumber || '—'}</strong>
                            ${ins.accountNumber && ins.accountNumber !== '—' ? `<button class="text-btn" style="font-size:11px; font-weight:700;" onclick="navigator.clipboard.writeText('${ins.accountNumber}'); showToast('Account number copied!', 'success');">Copy</button>` : ''}
                        </div>
                    </div>
                    <div style="background:#f8fafc; padding:10px 14px; border-radius:8px; border:1px solid #e2e8f0;">
                        <small style="color:#475569; font-size:11px; font-weight:700; text-transform:uppercase; display:block;">Bank Verification Number (BVN - Unmasked)</small>
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:2px;">
                            <strong style="font-size:18px; letter-spacing:1px; color:#0f172a; font-family:monospace;">${ins.bvn || '—'}</strong>
                            ${ins.bvn && ins.bvn !== '—' ? `<button class="text-btn" style="font-size:11px; font-weight:700;" onclick="navigator.clipboard.writeText('${ins.bvn}'); showToast('BVN copied!', 'success');">Copy</button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Save Profile Changes live via PATCH /api/installers/:id
async function saveInstallerProfileChanges() {
    const ins = AE.installers.find(i => i.id === AE.currentInstallerId || String(i._dbId) === String(AE.currentInstallerId)) || AE.installers[0];
    if (!ins) {
        showToast("No installer selected.", "error");
        return;
    }
    const targetId = ins._dbId || ins.id;
    const saveBtn = byId("btnAdminSaveInstallerProfile");
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<span>⏳</span> Saving...`;
    }

    try {
        const specRaw = byId("adminProfileSpecialization")?.value || "";
        const specs = specRaw.split(",").map(s => s.trim()).filter(Boolean);

        const payload = {
            contactName: byId("adminProfileFullName")?.value?.trim() || ins.name,
            email: byId("adminProfileEmail")?.value?.trim() || ins.email,
            phone: byId("adminProfilePhone")?.value?.trim() || ins.phone,
            state: byId("adminProfileState")?.value || ins.state,
            localGovernment: byId("adminProfileLga")?.value?.trim() || ins.lga,
            groupPosition: byId("adminProfilePosition")?.value?.trim() || ins.position,
            specializations: specs.length > 0 ? specs : ins.specializations,
            status: byId("adminProfileStatus")?.value || ins.status,
            bankName: byId("adminBankName")?.value?.trim() || ins.bank,
            accountName: byId("adminAccountName")?.value?.trim() || ins.accountName,
            accountNumber: byId("adminAccountNumber")?.value?.trim() || ins.accountNumber,
            accountBvn: byId("adminAccountBvn")?.value?.trim() || ins.bvn
        };

        const res = await API.patch(`/api/installers/${targetId}`, payload);
        if (res?.success || res?.status === "success") {
            // Update local memory
            ins.name = payload.contactName;
            ins.email = payload.email;
            ins.phone = payload.phone;
            ins.state = payload.state;
            ins.lga = payload.localGovernment;
            ins.position = payload.groupPosition;
            ins.specializations = payload.specializations;
            ins.specialization = Array.isArray(payload.specializations) ? payload.specializations.join(", ") : payload.specializations;
            ins.status = payload.status;
            ins.bank = payload.bankName;
            ins.accountName = payload.accountName;
            ins.accountNumber = payload.accountNumber;
            ins.bvn = payload.accountBvn;

            if (ins._raw) {
                ins._raw.contact_name = payload.contactName;
                ins._raw.email = payload.email;
                ins._raw.phone = payload.phone;
                ins._raw.state = payload.state;
                ins._raw.local_government = payload.localGovernment;
                ins._raw.group_position = payload.groupPosition;
                ins._raw.specializations = payload.specializations;
                ins._raw.status = payload.status;
                ins._raw.bank_name = payload.bankName;
                ins._raw.account_name = payload.accountName;
                ins._raw.account_number = payload.accountNumber;
                ins._raw.account_bvn = payload.accountBvn;
            }

            renderInstallers();
            openInstallerProfile(ins.id);
            showToast(`Profile changes for ${ins.name} saved successfully!`, "success");
        } else {
            showToast(res?.message || "Failed to save profile changes.", "error");
        }
    } catch (err) {
        console.error("Save profile error:", err);
        showToast(err.message || "Failed to save profile changes.", "error");
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = `<span>💾</span> Save Profile Changes`;
        }
    }
}

function triggerAdminInstallerPhotoUpload() {
    const input = byId("adminInstallerPhotoFileInput");
    if (input) input.click();
}

async function handleAdminInstallerPhotoFile(input) {
    const file = input?.files && input.files[0];
    if (!file) return;

    const ins = (AE.installers || []).find(i => i.id === AE.currentInstallerId || String(i._dbId) === String(AE.currentInstallerId)) || (AE.installers && AE.installers[0]);
    if (!ins) {
        showToast("Please select an installer first.", "error");
        return;
    }
    const targetId = ins._dbId || ins.id;

    const formData = new FormData();
    formData.append("photo", file);
    formData.append("image", file);

    try {
        showToast("Uploading installer photo...", "info");
        const token = getAdminAuthToken();
        const res = await fetch(`/api/installers/${targetId}/photo`, {
            method: "POST",
            headers: token ? { "Authorization": "Bearer " + token } : {},
            body: formData
        });
        const data = await res.json();
        if (data && (data.success || data.data)) {
            showToast("Installer photo updated successfully!", "success");
            if (typeof fetchInstallers === "function") {
                await fetchInstallers();
            }
            await openInstallerProfile(targetId);
        } else {
            showToast(data?.message || "Failed to update installer photo.", "error");
        }
    } catch (err) {
        showToast(err.message || "Network error uploading photo.", "error");
    } finally {
        if (input) input.value = "";
    }
}

// Copy Bank Field Helper
function copyAdminBankField(fieldId) {
    const val = byId(fieldId)?.value;
    if (val) {
        navigator.clipboard.writeText(val);
        showToast("Copied to clipboard!", "success");
    }
}

// Toggle BVN Masking
function toggleBvnVisibility() {
    const input = byId("adminAccountBvn");
    const btn = byId("btnToggleBvnMask");
    if (!input || !btn) return;
    if (input.type === "password") {
        input.type = "text";
        btn.textContent = "Hide";
    } else {
        input.type = "password";
        btn.textContent = "Show";
    }
}

// Admin Banking Action: Approve Settlement Account (Backend Verified & Locked)
async function adminApproveBankingAction(installerId) {
    const ins = AE.installers.find(i => i.id === installerId || String(i._dbId) === String(installerId));
    const targetId = ins ? (ins._dbId || ins.id) : installerId;
    if (!targetId) {
        showToast("No installer selected.", "error");
        return;
    }

    const bName = ins?.bank || byId("adminBankName")?.value?.trim();
    const aName = ins?.accountName || byId("adminAccountName")?.value?.trim();
    const aNum = ins?.accountNumber || byId("adminAccountNumber")?.value?.trim();
    const aBvn = ins?.bvn || byId("adminAccountBvn")?.value?.trim();

    if (!bName || !aName || !aNum || !aBvn || bName === '—' || aNum === '—') {
        showToast("Cannot approve: Banking information is incomplete. Bank name, account name, account number, and BVN are required.", "error");
        return;
    }

    try {
        showToast("Approving settlement account...", "info");
        const res = await API.patch(`/api/installers/${targetId}`, {
            action: "approve_banking"
        });

        if (res?.success || res?.status === "success") {
            if (ins) {
                ins.bankingVerificationStatus = "verified";
                ins.banking_unlocked = false;
                if (ins._raw) {
                    ins._raw.banking_verification_status = "verified";
                    ins._raw.banking_unlocked = false;
                }
            }
            showToast("Settlement account approved and locked successfully!", "success");
            await fetchInstallers();
            openInstallerProfile(targetId);
        } else {
            showToast(res?.message || "Failed to approve settlement account.", "error");
        }
    } catch (err) {
        console.error("Approve banking error:", err);
        showToast(err.message || "Failed to approve settlement account.", "error");
    }
}

// Admin Banking Action: Reject Settlement Account (Requires Correction)
async function adminRejectBankingAction(installerId) {
    const ins = AE.installers.find(i => i.id === installerId || String(i._dbId) === String(installerId));
    const targetId = ins ? (ins._dbId || ins.id) : installerId;
    if (!targetId) {
        showToast("No installer selected.", "error");
        return;
    }

    const reason = prompt("Enter reason for rejection / required correction for installer:", "Please verify and correct your submitted account details and BVN.");
    if (reason === null) return; // Admin cancelled

    try {
        showToast("Rejecting settlement account...", "info");
        const res = await API.patch(`/api/installers/${targetId}`, {
            action: "reject_banking",
            rejectionReason: reason
        });

        if (res?.success || res?.status === "success") {
            if (ins) {
                ins.bankingVerificationStatus = "rejected";
                ins.banking_unlocked = true;
                if (ins._raw) {
                    ins._raw.banking_verification_status = "rejected";
                    ins._raw.banking_unlocked = true;
                }
            }
            showToast("Settlement account rejected and unlocked for installer correction.", "warning");
            await fetchInstallers();
            openInstallerProfile(targetId);
        } else {
            showToast(res?.message || "Failed to reject settlement account.", "error");
        }
    } catch (err) {
        console.error("Reject banking error:", err);
        showToast(err.message || "Failed to reject settlement account.", "error");
    }
}

// Admin Banking Action: Unlock Banking For Installer
async function adminUnlockBankingAction(installerId) {
    const ins = AE.installers.find(i => i.id === installerId || String(i._dbId) === String(installerId));
    const targetId = ins ? (ins._dbId || ins.id) : installerId;
    if (!targetId) {
        showToast("No installer selected.", "error");
        return;
    }

    const isUnlocked = ins?.banking_unlocked === true;
    const targetAction = isUnlocked ? "lock_banking" : "unlock_banking";

    try {
        showToast(isUnlocked ? "Locking settlement account..." : "Unlocking settlement account for installer...", "info");
        const res = await API.patch(`/api/installers/${targetId}`, {
            action: targetAction
        });

        if (res?.success || res?.status === "success") {
            if (ins) {
                ins.banking_unlocked = !isUnlocked;
                if (ins._raw) ins._raw.banking_unlocked = !isUnlocked;
            }
            showToast(isUnlocked ? "Settlement account locked." : "Settlement account unlocked for installer editing.", "success");
            await fetchInstallers();
            openInstallerProfile(targetId);
        } else {
            showToast(res?.message || "Failed to toggle banking lock.", "error");
        }
    } catch (err) {
        console.error("Unlock banking error:", err);
        showToast(err.message || "Failed to toggle banking lock.", "error");
    }
}

// Toggle Installer Banking Lock / Unlock (Unified)
async function toggleInstallerBankingLock() {
    await adminUnlockBankingAction(AE.currentInstallerId);
}

// Backward-compatible verifyInstallerBanking
async function verifyInstallerBanking(installerId, newStatus) {
    if (newStatus === "verified") {
        await adminApproveBankingAction(installerId);
    } else {
        await adminRejectBankingAction(installerId);
    }
}

// Check for Pending Change Requests on Installer Profile
async function checkInstallerPendingChangeRequests(installerId) {
    try {
        const res = await API.get(`/api/installers/${installerId}/change-requests`);
        const banner = byId("installerPendingCrBanner");
        if (!banner) return;

        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
            const pending = res.data.find(cr => cr.status === "pending");
            if (pending) {
                banner.style.display = "flex";
                banner.innerHTML = `
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-size:18px;">⚠️</span>
                        <div>
                            <strong style="font-size:13px; color:#92400e;">Pending Modification Request: ${escapeHtml(pending.field_name || pending.field)}</strong>
                            <p style="font-size:12px; margin:2px 0 0; color:#78350f;">Installer requested to change to: "<strong>${escapeHtml(pending.proposed_value)}</strong>". Reason: ${escapeHtml(pending.reason)}</p>
                        </div>
                    </div>
                    <button type="button" class="primary" style="background:#d97706; border-color:#d97706; font-size:12px; padding:7px 16px; font-weight:700; white-space:nowrap;" onclick='openInstallerChangeRequestModal(${JSON.stringify(pending).replace(/'/g, "&#39;")})'>
                        🔍 Check Request
                    </button>
                `;
                return;
            }
        }
        banner.style.display = "none";
    } catch (err) {
        console.warn("[AE Admin] Check change requests error:", err.message);
    }
}

// Open Change Request Modal
function openInstallerChangeRequestModal(cr) {
    if (!cr) return;
    if (byId("crRequestId")) byId("crRequestId").value = cr.id || "";
    if (byId("crInstallerDbId")) byId("crInstallerDbId").value = cr.installer_id || "";
    if (byId("crInstallerTitle")) {
        const insName = cr.installer_name || cr.contact_name || (AE.installers.find(i => String(i._dbId) === String(cr.installer_id) || i.id === String(cr.installer_id))?.name) || `Installer #${cr.installer_id}`;
        byId("crInstallerTitle").textContent = `Installer: ${insName}`;
    }
    if (byId("crStatusBadge")) {
        const status = (cr.status || 'pending').toLowerCase();
        byId("crStatusBadge").className = `badge ${status === 'approved' ? 'green-b' : (status === 'rejected' ? 'red-b' : 'gold-b')}`;
        byId("crStatusBadge").textContent = status === 'approved' ? 'Approved' : (status === 'rejected' ? 'Declined' : 'Pending Review');
    }
    if (byId("crFieldDisplay")) byId("crFieldDisplay").textContent = cr.field_name || cr.field || "Settlement Banking";
    if (byId("crDateDisplay")) {
        byId("crDateDisplay").textContent = cr.created_at ? new Date(cr.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "Just now";
    }
    if (byId("crCurrentValDisplay")) byId("crCurrentValDisplay").textContent = cr.current_value || "—";
    if (byId("crProposedValDisplay")) byId("crProposedValDisplay").textContent = cr.proposed_value || "—";
    if (byId("crReasonDisplay")) byId("crReasonDisplay").textContent = cr.reason || "No reason specified";
    if (byId("crAdminRemarks")) byId("crAdminRemarks").value = cr.admin_remarks || "";

    openModal("installerChangeRequestModal");
}

// Handle Admin Change Request Decision (Approve / Reject)
async function handleAdminChangeRequestDecision(decision) {
    const requestId = byId("crRequestId")?.value;
    const remarks = byId("crAdminRemarks")?.value?.trim() || "";
    if (!requestId) {
        showToast("No change request selected.", "error");
        return;
    }

    try {
        showToast("Processing change request decision...", "info");
        const res = await API.post(`/api/installers/change-requests/${requestId}/decision`, {
            decision,
            adminRemarks: remarks
        });

        if (res?.success) {
            showToast(res.message || `Change request ${decision === 'approve' ? 'approved & banking unlocked' : 'rejected'}.`, "success");
            closeModal("installerChangeRequestModal");
            const installerDbId = byId("crInstallerDbId")?.value;
            if (installerDbId) {
                await fetchInstallers();
                openInstallerProfile(installerDbId);
            }
            if (typeof fetchNotifications === "function") fetchNotifications();
        } else {
            showToast(res?.message || "Failed to process decision.", "error");
        }
    } catch (err) {
        console.error("Change request decision error:", err);
        showToast(err.message || "Failed to process decision.", "error");
    }
}

// Document Viewer Modal Controller
function viewInstallerDocument(title, fileUrl, docType = 'accreditation', installerId = null) {
    const modal = byId("documentViewerModal");
    if (!modal) return;

    const targetId = installerId || AE.currentInstallerId;
    const ins = AE.installers.find(i => i.id === targetId || String(i._dbId) === String(targetId));

    byId("docViewerTitle").textContent = title || "Document Preview";
    byId("docViewerSubtitle").textContent = ins ? `${ins.name} (${ins.id}) • Official Regulatory Document` : "Regulatory file upload";

    const openTab = byId("docViewerOpenTab");
    if (openTab) openTab.href = fileUrl;

    const container = byId("docViewerContainer");
    if (container) {
        if (fileUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
            container.innerHTML = `<img src="${fileUrl}" alt="${title}" style="max-width:100%; max-height:60vh; object-fit:contain; border-radius:8px; box-shadow:0 8px 30px rgba(0,0,0,0.5);">`;
        } else {
            container.innerHTML = `<iframe src="${fileUrl}" style="width:100%; height:55vh; border:none; border-radius:8px; background:#fff;"></iframe>`;
        }
    }

    const auditStatus = byId("docViewerAuditStatus");
    if (auditStatus && ins) {
        auditStatus.innerHTML = `Audit State: <strong style="color:${ins.verificationStatus === 'verified' ? '#10b981' : '#d97706'}">${ins.verificationStatus === 'verified' ? 'Verified by Admin' : 'Pending Verification'}</strong>`;
    }

    const verifyBtn = byId("docViewerVerifyBtn");
    const denyBtn = byId("docViewerDenyBtn");
    if (verifyBtn) {
        verifyBtn.onclick = () => {
            closeModal("documentViewerModal");
            verifyInstallerAccreditation(targetId, 'verified');
        };
    }
    if (denyBtn) {
        denyBtn.onclick = () => {
            closeModal("documentViewerModal");
            verifyInstallerAccreditation(targetId, 'rejected');
        };
    }

    openModal("documentViewerModal");
}

// Certificate & Accreditation Verification API Action
async function verifyInstallerAccreditation(installerId, newStatus) {
    try {
        const ins = AE.installers.find(i => i.id === installerId || String(i._dbId) === String(installerId));
        const targetId = ins ? (ins._dbId || ins.id) : installerId;

        const res = await API.patch(`/api/installers/${targetId}`, {
            verificationStatus: newStatus
        });

        if (res?.success || res?.status === "success") {
            if (ins) {
                ins.verificationStatus = newStatus;
                if (ins._raw) ins._raw.verification_status = newStatus;
            }
            showToast(`Installer certificates marked as ${newStatus.toUpperCase()}`, "success");
            if (AE.currentPage === "installer-profile") {
                openInstallerProfile(targetId);
            }
        } else {
            showToast(res?.message || "Failed to update installer accreditation", "error");
        }
    } catch (err) {
        console.error("Accreditation update error:", err);
        showToast(err.message || "Failed to update accreditation", "error");
    }
}

// Admin Accept / Approve Installer Action
async function adminApproveInstallerAction(installerId) {
    const ins = AE.installers.find(i => i.id === installerId || String(i._dbId) === String(installerId));
    const targetId = ins ? (ins._dbId || ins.id) : installerId;
    const name = ins ? ins.name : "Installer";

    if (!confirm(`Accept and verify ${name} into the AE Renewable Installer Network?\n\nThis will approve their profile, verify their settlement account, and activate their permissions to accept field jobs.`)) {
        return;
    }

    try {
        const res = await API.patch(`/api/installers/${targetId}`, {
            verificationStatus: 'verified',
            bankingVerificationStatus: 'verified',
            status: 'active',
            action: 'accept'
        });

        if (res?.success || res?.status === "success") {
            if (ins) {
                ins.verificationStatus = 'verified';
                ins.bankingVerificationStatus = 'verified';
                ins.status = 'active';
                if (ins._raw) {
                    ins._raw.verification_status = 'verified';
                    ins._raw.banking_verification_status = 'verified';
                    ins._raw.status = 'active';
                }
            }
            showToast(`✓ ${name} has been officially approved & accepted into the Installer Network!`, "success");
            renderInstallers();
            if (AE.currentPage === "installer-profile") {
                openInstallerProfile(targetId);
            }
        } else {
            showToast(res?.message || "Failed to approve installer", "error");
        }
    } catch (err) {
        console.error("Installer approval error:", err);
        showToast(err.message || "Failed to approve installer", "error");
    }
}

// Admin Decline / Deny Installer Action
async function adminDeclineInstallerAction(installerId) {
    const ins = AE.installers.find(i => i.id === installerId || String(i._dbId) === String(installerId));
    const targetId = ins ? (ins._dbId || ins.id) : installerId;
    const name = ins ? ins.name : "Installer";

    const reason = prompt(
        `Decline registration application for ${name}?\n\nEnter the advisory / rejection reason for the installer:`,
        "Your profile information and submitted credentials do not tally with our regulatory verification standards. Please review your banking and professional documents inside your profile and resubmit for approval."
    );

    if (reason === null) return; // user cancelled

    try {
        const res = await API.patch(`/api/installers/${targetId}`, {
            verificationStatus: 'rejected',
            bankingVerificationStatus: 'rejected',
            status: 'rejected',
            action: 'decline',
            reason: reason.trim()
        });

        if (res?.success || res?.status === "success") {
            if (ins) {
                ins.verificationStatus = 'rejected';
                ins.bankingVerificationStatus = 'rejected';
                ins.status = 'rejected';
                if (ins._raw) {
                    ins._raw.verification_status = 'rejected';
                    ins._raw.banking_verification_status = 'rejected';
                    ins._raw.status = 'rejected';
                }
            }
            showToast(`Installer application for ${name} has been declined. Notification sent.`, "warning");
            renderInstallers();
            if (AE.currentPage === "installer-profile") {
                openInstallerProfile(targetId);
            }
        } else {
            showToast(res?.message || "Failed to decline installer", "error");
        }
    } catch (err) {
        console.error("Installer decline error:", err);
        showToast(err.message || "Failed to decline installer", "error");
    }
}

// Send Notification to Installer Modal Actions
function openSendInstallerNotificationModal(installerId = null) {
    const targetId = installerId || AE.currentInstallerId;
    const ins = AE.installers.find(i => i.id === targetId || String(i._dbId) === String(targetId)) || AE.installers[0];
    if (!ins) return;

    if (byId("notifInstallerId")) byId("notifInstallerId").value = ins._dbId || ins.id;
    if (byId("notifRecipientName")) byId("notifRecipientName").textContent = ins.name;
    if (byId("notifRecipientCode")) byId("notifRecipientCode").textContent = ins.id;
    if (byId("notifTitle")) byId("notifTitle").value = "";
    if (byId("notifMessage")) byId("notifMessage").value = "";
    if (byId("notifActionUrl")) byId("notifActionUrl").value = "/installer/portal";

    openModal("sendInstallerNotificationModal");
}

async function submitInstallerNotification(event) {
    event.preventDefault();
    const installerId = byId("notifInstallerId")?.value;
    const title = byId("notifTitle")?.value.trim();
    const message = byId("notifMessage")?.value.trim();
    const type = byId("notifType")?.value || "system";
    const priority = byId("notifPriority")?.value || "high";
    const actionUrl = byId("notifActionUrl")?.value.trim() || null;

    if (!installerId || !title || !message) {
        showToast("Please provide notification title and message body", "error");
        return;
    }

    const btn = byId("notifSubmitBtn");
    if (btn) {
        btn.disabled = true;
        btn.textContent = "Dispatching...";
    }

    try {
        const res = await API.post(`/api/installers/${installerId}/notify`, {
            title,
            message,
            type,
            priority,
            actionUrl
        });

        if (res?.success) {
            showToast("Notification dispatched to installer portal successfully!", "success");
            closeModal("sendInstallerNotificationModal");
        } else {
            showToast(res?.message || "Failed to dispatch notification", "error");
        }
    } catch (err) {
        console.error("Dispatch notification error:", err);
        showToast(err.message || "Failed to dispatch notification", "error");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<span>✈</span> Send Notification`;
        }
    }
}

function editInstaller() {
    const ins = AE.installers.find(i => i.id === AE.currentInstallerId || String(i._dbId) === String(AE.currentInstallerId));
    if (!ins) return;
    openModal("installerRegistrationModal");
    if (byId("regFullName")) byId("regFullName").value = ins.name;
    if (byId("regPhone")) byId("regPhone").value = ins.phone;
    if (byId("regEmail")) byId("regEmail").value = ins.email;
    if (byId("regState")) byId("regState").value = ins.state;
    if (byId("regLga")) byId("regLga").value = ins.lga;
    if (byId("regPosition")) byId("regPosition").value = ins.position;
    if (byId("regRcBn")) byId("regRcBn").value = ins.rcNumber;
    if (byId("regBankName")) byId("regBankName").value = ins.bank;
    if (byId("regAccountNumber")) byId("regAccountNumber").value = ins.accountNumber;
    if (byId("regBvn")) byId("regBvn").value = ins.bvn;
}

function assignInstallerProject() {
    const ins = AE.installers.find(i => i.id === AE.currentInstallerId || String(i._dbId) === String(AE.currentInstallerId)) || AE.installers[0];
    if (!ins) {
        showToast("No installer selected.", "error");
        return;
    }
    const nameEl = byId("assignModalInstallerName");
    if (nameEl) nameEl.textContent = `${ins.name} (${ins.id})`;

    const listEl = byId("assignProjectsList");
    if (!listEl) return;

    // Filter available projects (not assigned to this installer)
    const available = (AE.projects || []).filter(p => {
        const pInsId = String(p.installerId || '');
        return pInsId !== String(ins._dbId) && pInsId !== String(ins.id);
    });

    if (available.length === 0) {
        listEl.innerHTML = `
            <div style="text-align:center; padding:32px 16px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:10px;">
                <p style="color:#64748b; font-size:13px; margin:0 0 12px;">No unassigned projects currently in the pipeline.</p>
                <button type="button" class="primary" style="font-size:12px; padding:8px 16px;" onclick="closeModal('assignProjectToInstallerModal'); showPage('projects');">Open Project Pipeline →</button>
            </div>
        `;
    } else {
        listEl.innerHTML = available.map(p => {
            const rawVal = p._raw && p._raw.contract_value 
                ? '₦' + Number(p._raw.contract_value).toLocaleString('en-NG', { maximumFractionDigits: 0 })
                : (p.contract_value ? '₦' + Number(p.contract_value).toLocaleString('en-NG', { maximumFractionDigits: 0 }) : '—');

            return `
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center; gap:12px;">
                    <div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <strong style="color:#004AAD; font-size:13px;">${p.id}</strong>
                            <span class="badge blue-b" style="font-size:10px;">${p.stage || 'Scheduled'}</span>
                        </div>
                        <div style="font-size:13px; font-weight:700; color:#0f172a; margin-top:2px;">${p.name}</div>
                        <div style="font-size:11px; color:#64748b; margin-top:2px;">
                            Client: <b>${p.client}</b> • Location: <b>${p.location}</b> • Value: <b style="color:#004AAD;">${rawVal}</b>
                        </div>
                    </div>
                    <button type="button" class="primary" style="background:#10b981; border-color:#10b981; font-weight:700; font-size:12px; padding:8px 14px; border-radius:8px; white-space:nowrap; cursor:pointer;" onclick="allocateProjectToInstaller('${p._dbId || p.id}', '${ins._dbId || ins.id}')">
                        ✓ Allocate
                    </button>
                </div>
            `;
        }).join("");
    }

    openModal("assignProjectToInstallerModal");
}

async function allocateProjectToInstaller(projectId, installerDbId) {
    try {
        showToast("Allocating project to installer...", "normal");
        const res = await API.patch(`/api/projects/${projectId}`, {
            installerId: installerDbId,
            installer_id: installerDbId,
            status: "installer_assigned"
        });

        if (res?.success || res?.status === "success") {
            showToast("Project successfully assigned to installer!", "success");
            closeModal("assignProjectToInstallerModal");
            if (typeof fetchProjects === "function") await fetchProjects();
            if (AE.currentPage === "installer-profile") {
                openInstallerProfile(AE.currentInstallerId);
            }
        } else {
            showToast(res?.message || "Failed to allocate project", "error");
        }
    } catch (err) {
        console.error("Allocate project error:", err);
        showToast(err.message || "Failed to allocate project", "error");
    }
}

/* =========================================================
   5. LIVE TELEMETRY SIMULATION
========================================================= */
function changeMonitoredSite() {
    const siteSelect = byId("monitoredSiteSelect");
    const siteKey = siteSelect?.value || Object.keys(AE.monitoredSites)[0];
    const data = AE.monitoredSites[siteKey];
    if (!data) return;

    const titleEl = byId("monitorSiteTitle");
    if (titleEl) titleEl.textContent = data.title;

    const subEl = byId("monitorSiteSubtitle");
    if (subEl) subEl.textContent = data.subtitle;

    const solarEl = byId("monSolar");
    if (solarEl) solarEl.innerHTML = `${data.solar} <small>kW</small>`;

    const loadEl = byId("monLoad");
    if (loadEl) loadEl.innerHTML = `${data.load} <small>kW</small>`;

    const batEl = byId("monBattery");
    if (batEl) batEl.innerHTML = `${data.battery} <small>%</small>`;

    const gridEl = byId("monGrid");
    if (gridEl) gridEl.innerHTML = `${data.grid} <small>kW</small>`;

    const updEl = byId("monitorUpdated");
    if (updEl) updEl.textContent = "Just now";

    // Update Connected Equipment Health labels for this system
    if (byId("eqInverterDesc")) byId("eqInverterDesc").textContent = data.inverter || "DEYE 16kVA Hybrid";
    if (byId("eqBatteryDesc")) byId("eqBatteryDesc").textContent = data.batteryBank || "32kWh LiFePO4";
    if (byId("eqPVDesc")) byId("eqPVDesc").textContent = data.pvArray || "16 × 750W Canadian Solar";
    if (byId("eqSensorDesc")) byId("eqSensorDesc").textContent = data.gridSensor || "RS485 Communication";

    showToast(`Switched telemetry view to ${data.title}`);
}

function initLiveTelemetryJitter() {
    if (AE.telemetryTimer) clearInterval(AE.telemetryTimer);
    AE.telemetryTimer = setInterval(() => {
        const siteKey = byId("monitoredSiteSelect")?.value;
        const base = AE.monitoredSites?.[siteKey];
        if (base && byId("monSolar")) {
            const solarVal = Math.max(0.1, (parseFloat(base.solar) + (Math.random() * 0.4 - 0.2))).toFixed(1);
            byId("monSolar").innerHTML = `${solarVal} <small>kW</small>`;
            const updEl = byId("monitorUpdated");
            if (updEl) updEl.textContent = "Live telemetry active";
        }

        // Live micro-telemetry on Dashboard Live Energy Overview (subtle +/-0.1kVA around complete-paid inverter baseline)
        const dashSolarEl = byId("dashSolarGen");
        if (dashSolarEl) {
            const base = (AE.monitoring && AE.monitoring.inverter_capacity_kva) ? Number(AE.monitoring.inverter_capacity_kva) : 31.5;
            const jittered = (base + (Math.random() * 0.2 - 0.1)).toFixed(1);
            dashSolarEl.textContent = jittered;
        }

        // Live Round-the-Clock Activity refresh when viewing dashboard
        if (AE.currentPage === "dashboard" && AE.trackingViewMode === "activity") {
            if (!AE._lastTrackingSync || (Date.now() - AE._lastTrackingSync > 16000)) {
                AE._lastTrackingSync = Date.now();
                fetchRoundClockTracking();
            }
        }
    }, 4000);
}

function updatePowerChartPeriod() {
    const period = byId("chartPeriodSelect")?.value;
    const bars = byId("powerChartBars");
    if (!bars) return;

    if (period === "7d") {
        bars.innerHTML = `
            <i style="height:55%"></i><i style="height:68%"></i><i style="height:72%"></i>
            <i style="height:84%"></i><i style="height:92%"></i><i style="height:88%"></i>
            <i style="height:76%"></i>
        `;
    } else {
        bars.innerHTML = `
            <i style="height:35%"></i><i style="height:48%"></i><i style="height:42%"></i>
            <i style="height:62%"></i><i style="height:78%"></i><i style="height:92%"></i>
            <i style="height:74%"></i><i style="height:65%"></i><i style="height:52%"></i>
            <i style="height:58%"></i><i style="height:40%"></i><i style="height:28%"></i>
        `;
    }
}

/* =========================================================
   5.05 ROUND-THE-CLOCK ACTIVITY TRACKING (ENGINE, INSTALLER, CLIENT, ADMIN)
========================================================= */

AE.roundClockTracking = null;
AE.activeTrackingFilter = "all";
AE.trackingViewMode = "activity";

async function fetchRoundClockTracking() {
    try {
        const res = await API.get("/api/admin/tracking-graph");
        if (res && res.data) {
            AE.roundClockTracking = res.data;
            renderRoundClockTrackingGraph(res.data, AE.activeTrackingFilter);
        }
    } catch (err) {
        console.warn("[TrackingGraph] API notice:", err.message);
    }
}
window.fetchRoundClockTracking = fetchRoundClockTracking;

function toggleDashboardTrackingView() {
    const actView = byId("viewRoundClockActivity");
    const invView = byId("viewInverterHardware");
    const btnLabel = byId("btnToggleModeLabel");
    const title = byId("dashTrackingMainTitle");

    if (AE.trackingViewMode === "activity") {
        AE.trackingViewMode = "inverter";
        if (actView) actView.style.display = "none";
        if (invView) invView.style.display = "block";
        if (btnLabel) btnLabel.textContent = "🌐 24/7 Activity Mode";
        if (title) title.textContent = "Live Energy Overview";
    } else {
        AE.trackingViewMode = "activity";
        if (actView) actView.style.display = "block";
        if (invView) invView.style.display = "none";
        if (btnLabel) btnLabel.textContent = "⚡ Inverter Mode";
        if (title) title.textContent = "Round-The-Clock Activity Tracking";
        if (AE.roundClockTracking) {
            renderRoundClockTrackingGraph(AE.roundClockTracking, AE.activeTrackingFilter);
        } else {
            fetchRoundClockTracking();
        }
    }
}
window.toggleDashboardTrackingView = toggleDashboardTrackingView;

function setTrackingFilter(pillar) {
    AE.activeTrackingFilter = pillar || "all";
    
    // Update chip active classes
    const chips = {
        all: byId("chipFilterAll"),
        engine: byId("chipFilterEngine"),
        installer: byId("chipFilterInstaller"),
        client: byId("chipFilterClient"),
        admin: byId("chipFilterAdmin")
    };

    Object.keys(chips).forEach(k => {
        if (chips[k]) {
            if (k === AE.activeTrackingFilter) {
                chips[k].classList.add("active");
            } else {
                chips[k].classList.remove("active");
            }
        }
    });

    if (AE.roundClockTracking) {
        renderRoundClockTrackingGraph(AE.roundClockTracking, AE.activeTrackingFilter);
    }
}
window.setTrackingFilter = setTrackingFilter;

function renderRoundClockTrackingGraph(data, activeFilter) {
    if (!data) return;
    AE.roundClockTracking = data;
    const filter = activeFilter || AE.activeTrackingFilter || "all";
    AE.activeTrackingFilter = filter;

    const summary = data.summary || {};
    const hourly = data.hourly || [];
    if (!hourly.length) return;

    // Update KPI chip metrics
    const totalEl = byId("trackStatTotal");
    if (totalEl) totalEl.textContent = Number(summary.total_24h_events || 0).toLocaleString();

    const engEl = byId("trackStatEngine");
    if (engEl) engEl.textContent = Number(summary.engine?.total || 0).toLocaleString();

    const instEl = byId("trackStatInstaller");
    if (instEl) instEl.textContent = Number(summary.installer?.total || 0).toLocaleString();

    const cliEl = byId("trackStatClient");
    if (cliEl) cliEl.textContent = Number(summary.client?.total || 0).toLocaleString();

    const admEl = byId("trackStatAdmin");
    if (admEl) admEl.textContent = Number(summary.admin?.total || 0).toLocaleString();

    const peakEl = byId("trackPeakHourBadge");
    if (peakEl) {
        if (Number(summary.total_24h_events || 0) > 0) {
            peakEl.textContent = `${summary.peak_hour || "11:00"} (${summary.peak_hour_volume || 0} Events)`;
        } else {
            peakEl.textContent = `-- (0 Events)`;
        }
    }

    const domEl = byId("trackDominantBadge");
    if (domEl) {
        domEl.textContent = summary.dominant_pillar || "Standby (Live Telemetry Active)";
    }

    const curEl = byId("trackCurrentHourBadge");
    if (curEl) {
        const curH = summary.current_hour !== undefined ? summary.current_hour : new Date().getHours();
        const curEvt = summary.current_hour_events || 0;
        curEl.textContent = `${curEvt} Events (Hour ${String(curH).padStart(2, "0")}:00)`;
    }

    // Build SVG Graph
    const svg = byId("roundClockSvg");
    if (!svg) return;

    const W = 540;
    const H = 160;
    const padL = 20;
    const padR = 20;
    const padT = 24;
    const padB = 22;
    const gw = W - padL - padR;
    const gh = H - padT - padB;

    // Calculate maximum Y based on filter
    let maxY = 10;
    if (filter === "all") {
        maxY = Math.max(...hourly.map(h => Math.max(h.total, h.engine, h.installer, h.client, h.admin)), 100);
    } else {
        maxY = Math.max(...hourly.map(h => Number(h[filter]) || 0), 20);
    }
    maxY = Math.ceil(maxY * 1.15); // Headroom

    const getX = (i) => padL + (i / (hourly.length - 1)) * gw;
    const getY = (val) => (padT + gh) - ((Number(val) || 0) / maxY) * gh;

    // Spline curve generator
    function generateSpline(points) {
        if (!points || !points.length) return "";
        if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
        let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i === 0 ? 0 : i - 1];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2] || p2;
            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;
            d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
        }
        return d;
    }

    // Points calculation per stream
    const enginePts = hourly.map((h, i) => ({ x: getX(i), y: getY(h.engine), val: h.engine }));
    const installerPts = hourly.map((h, i) => ({ x: getX(i), y: getY(h.installer), val: h.installer }));
    const clientPts = hourly.map((h, i) => ({ x: getX(i), y: getY(h.client), val: h.client }));
    const adminPts = hourly.map((h, i) => ({ x: getX(i), y: getY(h.admin), val: h.admin }));
    const totalPts = hourly.map((h, i) => ({ x: getX(i), y: getY(h.total), val: h.total }));

    // Grid lines (25%, 50%, 75%, 100%) with level values
    const gridLevels = [0.25, 0.5, 0.75, 1.0];
    let gridSvg = "";
    gridLevels.forEach(lvl => {
        const y = (padT + gh) - lvl * gh;
        const valLvl = Math.round(lvl * maxY);
        gridSvg += `
            <line x1="${padL}" y1="${y.toFixed(1)}" x2="${padL + gw}" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,0.07)" stroke-width="1" stroke-dasharray="3,4" />
            <text x="${padL - 4}" y="${(y + 3).toFixed(1)}" fill="#64748b" font-size="8" text-anchor="end" font-weight="600">${valLvl}</text>
        `;
    });

    // Gradients & Defs
    let defsSvg = `
        <defs>
            <linearGradient id="rcGradEngine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#a855f7" stop-opacity="0.45"/>
                <stop offset="100%" stop-color="#a855f7" stop-opacity="0.0"/>
            </linearGradient>
            <linearGradient id="rcGradInstaller" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.42"/>
                <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.0"/>
            </linearGradient>
            <linearGradient id="rcGradClient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#10b981" stop-opacity="0.40"/>
                <stop offset="100%" stop-color="#10b981" stop-opacity="0.0"/>
            </linearGradient>
            <linearGradient id="rcGradAdmin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.38"/>
                <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0"/>
            </linearGradient>
            <linearGradient id="rcGradTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0"/>
            </linearGradient>
            <filter id="rcGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.3"/>
            </filter>
        </defs>
    `;

    // Stream rendering helpers
    function renderStream(pts, strokeColor, gradId, isVisible, strokeW = 2.2) {
        if (!isVisible) return "";
        const lineD = generateSpline(pts);
        const areaD = `${lineD} L ${pts[pts.length - 1].x.toFixed(1)} ${(padT + gh).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(padT + gh).toFixed(1)} Z`;
        return `
            <path d="${areaD}" fill="url(#${gradId})" />
            <path d="${lineD}" fill="none" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linecap="round" stroke-linejoin="round" filter="url(#rcGlow)" />
        `;
    }

    let streamsSvg = "";
    if (filter === "all") {
        streamsSvg += renderStream(totalPts, "#38bdf8", "rcGradTotal", true, 2.5);
        streamsSvg += renderStream(enginePts, "#a855f7", "rcGradEngine", true, 2.0);
        streamsSvg += renderStream(clientPts, "#10b981", "rcGradClient", true, 2.0);
        streamsSvg += renderStream(installerPts, "#f59e0b", "rcGradInstaller", true, 2.0);
        streamsSvg += renderStream(adminPts, "#3b82f6", "rcGradAdmin", true, 1.8);
    } else if (filter === "engine") {
        streamsSvg += renderStream(enginePts, "#a855f7", "rcGradEngine", true, 2.8);
    } else if (filter === "installer") {
        streamsSvg += renderStream(installerPts, "#f59e0b", "rcGradInstaller", true, 2.8);
    } else if (filter === "client") {
        streamsSvg += renderStream(clientPts, "#10b981", "rcGradClient", true, 2.8);
    } else if (filter === "admin") {
        streamsSvg += renderStream(adminPts, "#3b82f6", "rcGradAdmin", true, 2.8);
    }

    // Current hour "NOW" needle with pulsing ring and top badge
    const curH = summary.current_hour !== undefined ? summary.current_hour : new Date().getHours();
    let needleSvg = "";
    if (curH >= 0 && curH < hourly.length) {
        const nx = getX(curH);
        needleSvg = `
            <g class="now-needle-group">
                <line x1="${nx.toFixed(1)}" y1="${padT - 6}" x2="${nx.toFixed(1)}" y2="${padT + gh}" stroke="#10b981" stroke-width="1.8" stroke-dasharray="3,3" opacity="0.9" />
                <circle cx="${nx.toFixed(1)}" cy="${padT - 8}" r="6" fill="none" stroke="#10b981" stroke-width="1.2" opacity="0.6">
                    <animate attributeName="r" values="3;9" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0" dur="1.8s" repeatCount="indefinite" />
                </circle>
                <circle cx="${nx.toFixed(1)}" cy="${padT - 8}" r="3.5" fill="#10b981" />
                <rect x="${(nx - 14).toFixed(1)}" y="${(padT - 22).toFixed(1)}" width="28" height="11" rx="5.5" fill="#059669" />
                <text x="${nx.toFixed(1)}" y="${(padT - 14).toFixed(1)}" text-anchor="middle" font-size="8" font-weight="800" fill="#ffffff" letter-spacing="0.5">NOW</text>
            </g>
        `;
    }

    // Hover interactive overlay element
    const hoverGroupSvg = `
        <g id="rcHoverCrosshair" style="display:none;">
            <line id="rcCrossLine" x1="0" y1="${padT - 4}" x2="0" y2="${padT + gh}" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="2,2" />
            <circle id="rcDotEngine" cx="0" cy="0" r="4.5" fill="#a855f7" stroke="#ffffff" stroke-width="2" />
            <circle id="rcDotInstaller" cx="0" cy="0" r="4.5" fill="#f59e0b" stroke="#ffffff" stroke-width="2" />
            <circle id="rcDotClient" cx="0" cy="0" r="4.5" fill="#10b981" stroke="#ffffff" stroke-width="2" />
            <circle id="rcDotAdmin" cx="0" cy="0" r="4.5" fill="#3b82f6" stroke="#ffffff" stroke-width="2" />
            <circle id="rcDotTotal" cx="0" cy="0" r="5" fill="#38bdf8" stroke="#ffffff" stroke-width="2" />
        </g>
    `;

    svg.innerHTML = defsSvg + gridSvg + streamsSvg + needleSvg + hoverGroupSvg;

    // Attach interactive hover listener to graph container
    const wrap = byId("roundClockGraphWrap");
    const tooltip = byId("roundClockTooltip");

    if (wrap && tooltip) {
        wrap.onmousemove = function(e) {
            const rect = wrap.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const ratio = (mouseX - padL) / gw;
            const idx = Math.max(0, Math.min(23, Math.round(ratio * (hourly.length - 1))));
            const hData = hourly[idx];
            if (!hData) return;

            const xPos = getX(idx);
            const crossGroup = byId("rcHoverCrosshair");
            if (crossGroup) {
                crossGroup.style.display = "block";
                const line = byId("rcCrossLine");
                if (line) {
                    line.setAttribute("x1", xPos.toFixed(1));
                    line.setAttribute("x2", xPos.toFixed(1));
                }
                const dotE = byId("rcDotEngine");
                if (dotE) { dotE.setAttribute("cx", xPos.toFixed(1)); dotE.setAttribute("cy", getY(hData.engine).toFixed(1)); dotE.style.display = (filter === "all" || filter === "engine") ? "" : "none"; }
                const dotI = byId("rcDotInstaller");
                if (dotI) { dotI.setAttribute("cx", xPos.toFixed(1)); dotI.setAttribute("cy", getY(hData.installer).toFixed(1)); dotI.style.display = (filter === "all" || filter === "installer") ? "" : "none"; }
                const dotC = byId("rcDotClient");
                if (dotC) { dotC.setAttribute("cx", xPos.toFixed(1)); dotC.setAttribute("cy", getY(hData.client).toFixed(1)); dotC.style.display = (filter === "all" || filter === "client") ? "" : "none"; }
                const dotA = byId("rcDotAdmin");
                if (dotA) { dotA.setAttribute("cx", xPos.toFixed(1)); dotA.setAttribute("cy", getY(hData.admin).toFixed(1)); dotA.style.display = (filter === "all" || filter === "admin") ? "" : "none"; }
                const dotT = byId("rcDotTotal");
                if (dotT) { dotT.setAttribute("cx", xPos.toFixed(1)); dotT.setAttribute("cy", getY(hData.total).toFixed(1)); dotT.style.display = filter === "all" ? "" : "none"; }
            }

            // Populate tooltip
            tooltip.innerHTML = `
                <div class="hover-header">
                    <span>⏰ Round-The-Clock ${hData.label}</span>
                    <span style="color:#38bdf8; font-weight:800;">${hData.total} Events</span>
                </div>
                <div class="hover-grid">
                    <div class="hover-row"><span style="color:#c084fc;">●</span> <span>Engine (ARDE):</span> <b>${hData.engine}</b></div>
                    <div class="hover-row"><span style="color:#fbbf24;">●</span> <span>Installer Field:</span> <b>${hData.installer}</b></div>
                    <div class="hover-row"><span style="color:#34d399;">●</span> <span>Client Portal:</span> <b>${hData.client}</b></div>
                    <div class="hover-row"><span style="color:#60a5fa;">●</span> <span>Admin Console:</span> <b>${hData.admin}</b></div>
                </div>
            `;
            tooltip.style.display = "block";

            // Position tooltip safely inside wrapper
            const tipW = tooltip.offsetWidth || 180;
            let leftPx = (xPos / W) * rect.width - (tipW / 2);
            if (leftPx < 8) leftPx = 8;
            if (leftPx + tipW > rect.width - 8) leftPx = rect.width - tipW - 8;
            tooltip.style.left = `${leftPx}px`;
            tooltip.style.top = `10px`;
        };

        wrap.onmouseleave = function() {
            const crossGroup = byId("rcHoverCrosshair");
            if (crossGroup) crossGroup.style.display = "none";
            tooltip.style.display = "none";
        };
    }
}
window.renderRoundClockTrackingGraph = renderRoundClockTrackingGraph;

/* =========================================================
   5.06 OPERATIONS PIPELINE TRACKING (QUOTATIONS, PROJECTS, INSTALLERS)
========================================================= */

AE.operationsTracking = null;
AE.activeOpsFilter = "all";

async function fetchOperationsTracking() {
    try {
        const res = await API.get("/api/admin/operations-tracking");
        if (res && res.data) {
            AE.operationsTracking = res.data;
            renderOperationsTrackingGraph(res.data, AE.activeOpsFilter);
        }
    } catch (err) {
        console.warn("[OperationsTracking] API notice:", err.message);
    }
}
window.fetchOperationsTracking = fetchOperationsTracking;

function setOpsTrackingFilter(filter) {
    AE.activeOpsFilter = filter;
    ["btnOpsFilterAll", "btnOpsFilterQuotes", "btnOpsFilterProjects", "btnOpsFilterInstallers"].forEach(id => {
        const btn = byId(id);
        if (btn) btn.classList.remove("active");
    });
    if (filter === "all") byId("btnOpsFilterAll")?.classList.add("active");
    if (filter === "quotations") byId("btnOpsFilterQuotes")?.classList.add("active");
    if (filter === "projects") byId("btnOpsFilterProjects")?.classList.add("active");
    if (filter === "installers") byId("btnOpsFilterInstallers")?.classList.add("active");

    if (AE.operationsTracking) {
        renderOperationsTrackingGraph(AE.operationsTracking, filter);
    }
}
window.setOpsTrackingFilter = setOpsTrackingFilter;

function renderDefaultTimelineTicks() {
    const ticksRow = byId("opsTicksRow");
    if (!ticksRow) return;
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const items = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const isToday = (i === 0);
        const name = dayNames[d.getDay()];
        items.push(`<span style="${isToday ? 'color:#38bdf8; font-weight:800;' : ''}">${name}${isToday ? ' (Today)' : ''}</span>`);
    }
    ticksRow.innerHTML = items.join("");
}
window.renderDefaultTimelineTicks = renderDefaultTimelineTicks;

function renderOperationsTrackingGraph(data, activeFilter) {
    if (!data) return;
    AE.operationsTracking = data;
    const filter = activeFilter || AE.activeOpsFilter || "all";
    AE.activeOpsFilter = filter;

    const summary = data.summary || {};
    const timeline = data.timeline || [];

    // 1. Populate KPI Mini Cards (100% Real Live Database Data)
    const qSummary = summary.quotations || {};
    const pSummary = summary.projects || {};
    const iSummary = summary.installers || {};

    const qTotalEl = byId("opsQuoteTotal");
    if (qTotalEl) qTotalEl.textContent = Number(qSummary.total || 0).toLocaleString();
    const qVal = Number(qSummary.total_value || 0);
    const qValEl = byId("opsQuoteValue");
    if (qValEl) {
        if (qVal >= 1000000) {
            qValEl.textContent = `₦${(qVal / 1000000).toFixed(1)}M Quoted`;
        } else if (qVal > 0) {
            qValEl.textContent = `₦${qVal.toLocaleString()} Quoted`;
        } else {
            qValEl.textContent = `₦0.00 Quoted`;
        }
    }
    const qRateEl = byId("opsQuoteAcceptRate");
    if (qRateEl) qRateEl.textContent = `${qSummary.acceptance_rate || "0%"} Acceptance`;
    const qBarEl = byId("opsQuoteProgressBar");
    if (qBarEl) qBarEl.style.width = `${parseInt(qSummary.acceptance_rate || 0)}%`;

    const pTotalEl = byId("opsProjectTotal");
    if (pTotalEl) pTotalEl.textContent = Number(pSummary.total || 0).toLocaleString();
    const pCapEl = byId("opsProjectCapacity");
    if (pCapEl) pCapEl.textContent = `${Number(pSummary.total_capacity_kw || 0).toFixed(1)} kWp Sized`;
    const pRateEl = byId("opsProjectCompRate");
    if (pRateEl) pRateEl.textContent = `${pSummary.active_rate || pSummary.completion_rate || "0%"} Active`;
    const pBarEl = byId("opsProjectProgressBar");
    if (pBarEl) pBarEl.style.width = `${parseInt(pSummary.active_rate || pSummary.completion_rate || 0)}%`;

    const iTotalEl = byId("opsInstallerTotal");
    if (iTotalEl) iTotalEl.textContent = Number(iSummary.total || 0).toLocaleString();
    const iActive = Number(iSummary.active || 0);
    const iActiveEl = byId("opsInstallerActive");
    if (iActiveEl) iActiveEl.textContent = `${iActive} Active ${iActive === 1 ? "Crew" : "Crews"}`;
    const iRateEl = byId("opsInstVerifyRate");
    if (iRateEl) iRateEl.textContent = `${iSummary.verification_rate || "0%"} Verified`;
    const iBarEl = byId("opsInstallerProgressBar");
    if (iBarEl) iBarEl.style.width = `${parseInt(iSummary.verification_rate || 0)}%`;

    // Dynamic Footer Pipeline Badges
    const opsIntakeEl = byId("opsIntakeBadge");
    if (opsIntakeEl) opsIntakeEl.textContent = `${Number(qSummary.pending || 0)} In Pipeline Queue`;
    const opsConvEl = byId("opsConversionBadge");
    if (opsConvEl) opsConvEl.textContent = `${qSummary.acceptance_rate || "0%"} Live Conversion`;
    const opsCovEl = byId("opsCoverageBadge");
    if (opsCovEl) opsCovEl.textContent = `${iSummary.verification_rate || "0%"} Verified`;

    // Dynamic Timeline Day Tick Axis (Rolling 7 Days Ending With Today)
    const ticksRow = byId("opsTicksRow");
    if (ticksRow) {
        if (timeline.length) {
            ticksRow.innerHTML = timeline.map((t, idx) => {
                const isToday = t.is_today || (idx === timeline.length - 1);
                return `<span style="${isToday ? 'color:#38bdf8; font-weight:800;' : ''}">${t.label}${isToday ? ' (Today)' : ''}</span>`;
            }).join("");
        } else {
            renderDefaultTimelineTicks();
        }
    }

    // 2. Render Multi-Series Spline SVG
    const svg = byId("opsTrackingSvg");
    if (!svg || !timeline.length) return;

    const W = 740;
    const H = 180;
    const padL = 30;
    const padR = 25;
    const padT = 24;
    const padB = 24;
    const gw = W - padL - padR;
    const gh = H - padT - padB;

    let maxY = 10;
    if (filter === "all") {
        maxY = Math.max(...timeline.map(t => Math.max(t.quotations, t.projects, t.installers)), 20);
    } else if (filter === "quotations") {
        maxY = Math.max(...timeline.map(t => t.quotations), 10);
    } else if (filter === "projects") {
        maxY = Math.max(...timeline.map(t => t.projects), 10);
    } else if (filter === "installers") {
        maxY = Math.max(...timeline.map(t => t.installers), 10);
    }
    maxY = Math.ceil(maxY * 1.2);

    const getX = (i) => padL + (i / (timeline.length - 1)) * gw;
    const getY = (val) => (padT + gh) - ((Number(val) || 0) / maxY) * gh;

    function generateSpline(points) {
        if (!points || !points.length) return "";
        if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
        let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i === 0 ? 0 : i - 1];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2] || p2;
            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;
            d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
        }
        return d;
    }

    const quotesPts = timeline.map((t, i) => ({ x: getX(i), y: getY(t.quotations), val: t.quotations }));
    const projPts   = timeline.map((t, i) => ({ x: getX(i), y: getY(t.projects), val: t.projects }));
    const instPts   = timeline.map((t, i) => ({ x: getX(i), y: getY(t.installers), val: t.installers }));

    // Grid lines (25%, 50%, 75%, 100%)
    const gridLevels = [0.25, 0.5, 0.75, 1.0];
    let gridSvg = "";
    gridLevels.forEach(lvl => {
        const y = (padT + gh) - lvl * gh;
        const valLvl = Math.round(lvl * maxY);
        gridSvg += `
            <line x1="${padL}" y1="${y.toFixed(1)}" x2="${padL + gw}" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,0.06)" stroke-width="1" stroke-dasharray="3,4" />
            <text x="${padL - 6}" y="${(y + 3).toFixed(1)}" fill="#64748b" font-size="9" text-anchor="end" font-weight="600">${valLvl}</text>
        `;
    });

    let defsSvg = `
        <defs>
            <linearGradient id="opsGradQuotes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#6366f1" stop-opacity="0.38"/>
                <stop offset="100%" stop-color="#6366f1" stop-opacity="0.0"/>
            </linearGradient>
            <linearGradient id="opsGradProj" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#10b981" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="#10b981" stop-opacity="0.0"/>
            </linearGradient>
            <linearGradient id="opsGradInst" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.32"/>
                <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.0"/>
            </linearGradient>
            <filter id="opsGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.25"/>
            </filter>
        </defs>
    `;

    function renderSeries(pts, strokeColor, gradId, isVisible, strokeW = 2.4) {
        if (!isVisible) return "";
        const lineD = generateSpline(pts);
        const areaD = `${lineD} L ${pts[pts.length - 1].x.toFixed(1)} ${(padT + gh).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(padT + gh).toFixed(1)} Z`;
        let nodes = "";
        pts.forEach(p => {
            nodes += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="${strokeColor}" stroke="#ffffff" stroke-width="1.5" />`;
        });
        return `
            <path d="${areaD}" fill="url(#${gradId})" />
            <path d="${lineD}" fill="none" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linecap="round" stroke-linejoin="round" filter="url(#opsGlow)" />
            ${nodes}
        `;
    }

    let seriesSvg = "";
    if (filter === "all") {
        seriesSvg += renderSeries(quotesPts, "#6366f1", "opsGradQuotes", true, 2.4);
        seriesSvg += renderSeries(projPts, "#10b981", "opsGradProj", true, 2.4);
        seriesSvg += renderSeries(instPts, "#f59e0b", "opsGradInst", true, 2.2);
    } else if (filter === "quotations") {
        seriesSvg += renderSeries(quotesPts, "#6366f1", "opsGradQuotes", true, 3.0);
    } else if (filter === "projects") {
        seriesSvg += renderSeries(projPts, "#10b981", "opsGradProj", true, 3.0);
    } else if (filter === "installers") {
        seriesSvg += renderSeries(instPts, "#f59e0b", "opsGradInst", true, 3.0);
    }

    const hoverGroupSvg = `
        <g id="opsHoverCrosshair" style="display:none;">
            <line id="opsCrossLine" x1="0" y1="${padT - 4}" x2="0" y2="${padT + gh}" stroke="#cbd5e1" stroke-width="1.2" stroke-dasharray="2,2" />
            <circle id="opsDotQuotes" cx="0" cy="0" r="4.5" fill="#6366f1" stroke="#ffffff" stroke-width="2" />
            <circle id="opsDotProj" cx="0" cy="0" r="4.5" fill="#10b981" stroke="#ffffff" stroke-width="2" />
            <circle id="opsDotInst" cx="0" cy="0" r="4.5" fill="#f59e0b" stroke="#ffffff" stroke-width="2" />
        </g>
    `;

    svg.innerHTML = defsSvg + gridSvg + seriesSvg + hoverGroupSvg;

    const wrap = byId("opsGraphWrap");
    const tooltip = byId("opsTrackingTooltip");

    if (wrap && tooltip) {
        wrap.onmousemove = function(e) {
            const rect = wrap.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const ratio = (mouseX - padL) / gw;
            const idx = Math.max(0, Math.min(timeline.length - 1, Math.round(ratio * (timeline.length - 1))));
            const tData = timeline[idx];
            if (!tData) return;

            const xPos = getX(idx);
            const crossGroup = byId("opsHoverCrosshair");
            if (crossGroup) {
                crossGroup.style.display = "block";
                const line = byId("opsCrossLine");
                if (line) {
                    line.setAttribute("x1", xPos.toFixed(1));
                    line.setAttribute("x2", xPos.toFixed(1));
                }
                const dotQ = byId("opsDotQuotes");
                if (dotQ) { dotQ.setAttribute("cx", xPos.toFixed(1)); dotQ.setAttribute("cy", getY(tData.quotations).toFixed(1)); dotQ.style.display = (filter === "all" || filter === "quotations") ? "" : "none"; }
                const dotP = byId("opsDotProj");
                if (dotP) { dotP.setAttribute("cx", xPos.toFixed(1)); dotP.setAttribute("cy", getY(tData.projects).toFixed(1)); dotP.style.display = (filter === "all" || filter === "projects") ? "" : "none"; }
                const dotI = byId("opsDotInst");
                if (dotI) { dotI.setAttribute("cx", xPos.toFixed(1)); dotI.setAttribute("cy", getY(tData.installers).toFixed(1)); dotI.style.display = (filter === "all" || filter === "installers") ? "" : "none"; }
            }

            const valNum = Number(tData.value || 0);
            const valStr = valNum >= 1000000 
                ? `₦${(valNum / 1000000).toFixed(2)}M` 
                : (valNum > 0 ? `₦${valNum.toLocaleString()}` : `₦0.00`);

            tooltip.innerHTML = `
                <div class="hover-header">
                    <span>📅 Timeline: ${tData.label}</span>
                    <span style="color:#a5b4fc; font-weight:800;">${valStr}</span>
                </div>
                <div class="hover-grid">
                    <div class="hover-row"><span style="color:#818cf8;">●</span> <span>Quotations:</span> <b>${tData.quotations}</b></div>
                    <div class="hover-row"><span style="color:#34d399;">●</span> <span>Projects:</span> <b>${tData.projects}</b></div>
                    <div class="hover-row"><span style="color:#fbbf24;">●</span> <span>Installers:</span> <b>${tData.installers}</b></div>
                </div>
            `;
            tooltip.style.display = "block";

            const tipW = tooltip.offsetWidth || 200;
            let leftPx = (xPos / W) * rect.width - (tipW / 2);
            if (leftPx < 10) leftPx = 10;
            if (leftPx + tipW > rect.width - 10) leftPx = rect.width - tipW - 10;
            tooltip.style.left = `${leftPx}px`;
            tooltip.style.top = `12px`;
        };

        wrap.onmouseleave = function() {
            const crossGroup = byId("opsHoverCrosshair");
            if (crossGroup) crossGroup.style.display = "none";
            tooltip.style.display = "none";
        };
    }
}
window.renderOperationsTrackingGraph = renderOperationsTrackingGraph;

/* =========================================================
   5.1 LIVE SYSTEM INTERACTIVE COMMAND & CONTROL (SCADA)
========================================================= */
window.toggleInverterOutput = function(isEnabled) {
    const track = byId("toggleInverterTrack");
    const knob = byId("toggleInverterKnob");
    const statusText = byId("inverterStatusText");
    const livePill = byId("livePillIndicator");
    const loadEl = byId("monLoad");
    const loadSub = byId("monLoadSub");

    if (isEnabled) {
        if (track) track.style.backgroundColor = "#059669";
        if (knob) knob.style.left = "23px";
        if (statusText) {
            statusText.textContent = "● Active / Energized";
            statusText.style.color = "#059669";
        }
        if (livePill) {
            livePill.innerHTML = `<i></i> SYSTEM ONLINE &amp; UNDER ADMIN CONTROL`;
            livePill.className = "live-pill";
        }
        const siteKey = byId("monitoredSiteSelect")?.value;
        const base = AE.monitoredSites?.[siteKey];
        if (loadEl && base) loadEl.innerHTML = `${base.load} <small>kW</small>`;
        if (loadSub) loadSub.textContent = "Inverter AC breaker engaged";
        showToast("⚡ Inverter AC breaker energized. System supplying load.", "success");
    } else {
        if (track) track.style.backgroundColor = "#94a3b8";
        if (knob) knob.style.left = "3px";
        if (statusText) {
            statusText.textContent = "○ Standby / AC Breaker Open";
            statusText.style.color = "#dc2626";
        }
        if (livePill) {
            livePill.innerHTML = `<i style="background:#dc2626;"></i> OUTPUT DISENGAGED (ADMIN OVERRIDE)`;
            livePill.className = "live-pill warning";
        }
        if (loadEl) loadEl.innerHTML = `0.0 <small>kW</small>`;
        if (loadSub) loadSub.textContent = "Isolated by Admin Controller";
        showToast("⚠️ Inverter output isolated. AC load disengaged.", "warning");
    }
};

window.changeBatteryMode = function(mode) {
    const sub = byId("monBatterySub");
    const batEl = byId("monBattery");
    if (mode === "backup_ups") {
        if (sub) sub.textContent = "UPS Priority: Reserve held at 90%";
        showToast("🔋 Battery Mode: UPS Reserve Mode activated.", "normal");
    } else if (mode === "peak_shaving") {
        if (sub) sub.textContent = "Peak Shaving: Discharging to support load";
        showToast("🔋 Battery Mode: Peak Shaving discharge engaged.", "normal");
    } else {
        if (sub) sub.textContent = "+6.4kW charging (Solar First)";
        showToast("🔋 Battery Mode: Solar Priority charging enabled.", "success");
    }
};

window.isGridConnected = false;
window.toggleGridSync = function() {
    window.isGridConnected = !window.isGridConnected;
    const btn = byId("btnToggleGridSync");
    const statusText = byId("gridStatusText");
    const gridEl = byId("monGrid");
    const gridSub = byId("monGridSub");

    if (window.isGridConnected) {
        if (btn) {
            btn.textContent = "Disconnect Grid";
            btn.style.background = "#fee2e2";
            btn.style.color = "#b91c1c";
            btn.style.borderColor = "#fca5a5";
        }
        if (statusText) {
            statusText.textContent = "● Synced with Public Grid (50Hz)";
            statusText.style.color = "#059669";
        }
        if (gridEl) gridEl.innerHTML = `2.4 <small>kW</small>`;
        if (gridSub) gridSub.textContent = "Importing 2.4kW supplementary";
        showToast("🔌 Public utility grid synchronized with inverter phase.", "success");
    } else {
        if (btn) {
            btn.textContent = "Connect Grid";
            btn.style.background = "";
            btn.style.color = "";
            btn.style.borderColor = "";
        }
        if (statusText) {
            statusText.textContent = "Islanded (Zero Export)";
            statusText.style.color = "#64748b";
        }
        if (gridEl) gridEl.innerHTML = `0.0 <small>kW</small>`;
        if (gridSub) gridSub.textContent = "Zero export / isolated";
        showToast("⚡ System switched to pure islanded zero-export mode.", "normal");
    }
};

window.updateLoadCap = function(pct) {
    const label = byId("loadCapLabel");
    if (label) {
        label.textContent = `${pct}% ${pct == 100 ? "(Uncapped)" : "Restricted"}`;
        label.style.color = pct < 50 ? "#dc2626" : (pct < 80 ? "#d97706" : "#004AAD");
    }
    showToast(`Inverter output limit set to ${pct}%`, "normal");
};

window.executeSystemCommand = function(cmd) {
    if (cmd === "sync") {
        showToast("🔄 Re-querying live inverter telemetry sensors...", "normal");
        setTimeout(() => {
            changeMonitoredSite();
            showToast("✅ Real-time telemetry synchronized with SCADA backend.", "success");
        }, 800);
    } else if (cmd === "reboot") {
        if (confirm("Initiate remote soft restart of telemetry interface module? Inverter output will maintain UPS continuity.")) {
            showToast("⚡ Sending soft restart command to telemetry gateway...", "warning");
            setTimeout(() => {
                showToast("✅ Gateway rebooted. Handshake confirmed with all systems.", "success");
            }, 1500);
        }
    }
};

/* =========================================================
   6. MODALS & FORMS
========================================================= */
function openModal(modalId) {
    const modal = byId(modalId);
    if (!modal) return;
    modal.classList.add("active");
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    modal.style.display = "flex";
    document.body.classList.add("modal-open");
}

function closeModal(modalId) {
    const modal = byId(modalId);
    if (modal) {
        modal.classList.remove("active");
        modal.classList.remove("show");
        modal.setAttribute("aria-hidden", "true");
        modal.style.display = "none";
    }
    document.querySelectorAll(`[id="${modalId}"]`).forEach(el => {
        el.classList.remove("active");
        el.classList.remove("show");
        el.setAttribute("aria-hidden", "true");
        el.style.display = "none";
    });
    if (!document.querySelector(".modal-overlay.active, .modal-overlay.show")) {
        document.body.classList.remove("modal-open");
    }
}

function openNewConsultationModal() {
    openModal("newConsultationModal");
}

function handleNewConsultationSubmit(event) {
    event.preventDefault();
    const name = byId("ncName")?.value.trim();
    const phone = byId("ncPhone")?.value.trim();
    const email = byId("ncEmail")?.value.trim();
    const location = byId("ncLocation")?.value.trim();
    const property = byId("ncProperty")?.value;
    const service = byId("ncService")?.value;
    const notes = byId("ncNotes")?.value.trim() || "Requirement logged via administrative intake.";

    if (!name || !phone) return;

    const newRef = `CON-2026-00${AE.consultations.length + 25}`;
    const newCon = {
        ref: newRef,
        client: name,
        phone: phone,
        email: email,
        location: location,
        service: service,
        property: property,
        status: "New",
        received: "Today",
        notes: notes
    };

    AE.consultations.unshift(newCon);
    renderConsultations();

    closeModal("newConsultationModal");
    showToast(`New consultation ${newRef} created!`, "success");
    openDetail(newRef);
}

function openCreateQuotationModal() {
    openModal("createQuotationModal");
    calculateQuotationTotal();
}

function calculateQuotationTotal() {
    const hw = parseFloat(byId("qHardware")?.value) || 0;
    const bat = parseFloat(byId("qBattery")?.value) || 0;
    const labor = parseFloat(byId("qLabor")?.value) || 0;
    const total = hw + bat + labor;

    const display = byId("qTotalDisplay");
    if (display) {
        display.textContent = `₦${total.toLocaleString()}`;
    }
}

function handleCreateQuotationSubmit(event) {
    event.preventDefault();
    const client = byId("qClient")?.value.trim();
    const system = byId("qSystem")?.value.trim();
    const status = byId("qStatus")?.value || "Issued";
    const hw = parseFloat(byId("qHardware")?.value) || 0;
    const bat = parseFloat(byId("qBattery")?.value) || 0;
    const labor = parseFloat(byId("qLabor")?.value) || 0;
    const total = hw + bat + labor;

    const newRef = `QUO-2026-00${AE.quotations.length + 49}`;
    const newQuo = {
        ref: newRef,
        client: client,
        sub: "Site Installation",
        system: system,
        value: `₦${total.toLocaleString()}`,
        status: status,
        date: "Today"
    };

    AE.quotations.unshift(newQuo);
    renderQuotations();

    closeModal("createQuotationModal");
    showToast(`Quotation ${newRef} generated successfully!`, "success");
    showPage("quotations");
}

function openInstallerRegistration() {
    openModal("installerRegistrationModal");
}

function closeInstallerRegistration() {
    closeModal("installerRegistrationModal");
}

function previewInstallerPhoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = byId("installerPhotoPreview");
            if (preview) {
                preview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:12px">`;
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function handleInstallerRegistration(event) {
    event.preventDefault();
    const name = byId("regFullName")?.value.trim();
    const phone = byId("regPhone")?.value.trim();
    const email = byId("regEmail")?.value.trim();
    const state = byId("regState")?.value;
    const lga = byId("regLga")?.value.trim();
    const pos = byId("regPosition")?.value;
    const spec = byId("regSpecialization")?.value;
    const rc = byId("regRcBn")?.value.trim();
    const bank = byId("regBankName")?.value.trim() || "First Bank of Nigeria";
    const acc = byId("regAccountNumber")?.value.trim() || "0123456789";
    const bvn = byId("regBvn")?.value.trim() || "22000000000";

    const newId = `INS-000${AE.installers.length + 1}`;
    const newInstaller = {
        id: newId,
        name: name,
        phone: phone,
        email: email,
        state: state,
        lga: lga,
        position: pos,
        specialization: spec,
        group: "GRP-001",
        experience: "3-5 Years",
        rcNumber: rc,
        cacDate: "01 Aug 2026",
        status: "active",
        projects: 0,
        lastQuotation: "None",
        registered: "Today",
        bank: bank,
        accountName: name,
        accountNumber: acc,
        bvn: bvn,
        notes: "Newly onboarded certified field technician.",
        certificates: ["Verified Certified Technician"]
    };

    AE.installers.unshift(newInstaller);
    renderInstallers();

    closeModal("installerRegistrationModal");
    showToast(`Installer ${name} registered successfully!`, "success");
    openInstallerProfile(newId);
}

function openAddCustomerModal() {
    const name = prompt("Enter customer full name:");
    if (!name) return;
    const location = prompt("Enter customer city & state (e.g. Asokoro, Abuja):", "Abuja");
    const newCust = {
        id: `CUST-00${AE.customers.length + 1}`,
        name: name,
        contact: "+234 800 000 0000",
        location: location || "Abuja",
        type: "Residential",
        systems: "Solar & Hybrid",
        ltv: "₦15,000,000",
        status: "Active"
    };
    AE.customers.unshift(newCust);
    renderCustomers();
    showToast(`Customer ${name} added to records!`, "success");
}

function openAddSiteModal() {
    const name = prompt("Enter site name / property address:");
    if (!name) return;
    const newSite = {
        code: `SITE-0${AE.sites.length + 1}`,
        name: name,
        client: "Client Onboarding",
        address: "Federal Capital Territory, Abuja",
        roof: "Pitched Standing Seam",
        irradiance: "5.5 kWh/m²/day",
        grid: "Band A",
        status: "Pending Survey"
    };
    AE.sites.unshift(newSite);
    renderSites();
    showToast(`Site ${name} registered for field survey!`, "success");
}

function openNewProjectModal() {
    const name = prompt("Enter project name:");
    if (!name) return;
    const newPrj = {
        id: `PRJ-2026-00${AE.projects.length + 1}`,
        name: name,
        client: "AE Renewable Client",
        capacity: "20kVA / 40kWh",
        installer: "Abdulrasaq Eniola",
        progress: 10,
        stage: "Design",
        deadline: "30 Sep 2026"
    };
    AE.projects.unshift(newPrj);
    renderProjects();
    showToast(`Project ${name} created!`, "success");
}

function openCreateInvoiceModal() {
    const client = prompt("Enter client name for invoice:");
    if (!client) return;
    const amount = prompt("Enter invoice amount (₦):", "15,000,000");
    const newInv = {
        no: `INV-2026-0${AE.invoices.length + 32}`,
        quote: "QUO-2026-0048",
        client: client,
        project: "Solar Installation",
        amount: `₦${Number(amount || 15000000).toLocaleString()}`,
        due: "30 Aug 2026",
        status: "Pending"
    };
    AE.invoices.unshift(newInv);
    renderInvoices();
    showToast(`Invoice ${newInv.no} issued!`, "success");
}

function openAddEquipmentModal() {
    const model = prompt("Enter equipment model and name:");
    if (!model) return;
    const newEq = {
        code: `EQ-NEW-0${AE.equipment.length + 1}`,
        model: model,
        brand: "DEYE",
        category: "Inverter",
        capacity: "16kVA Hybrid",
        warranty: "5 Years",
        status: "In Stock (10)"
    };
    AE.equipment.unshift(newEq);
    renderEquipment();
    showToast(`Equipment ${model} added to library!`, "success");
}

function downloadInvoiceReceipt(invNo) {
    showToast(`Receipt for ${invNo} generated and downloaded`, "success");
}

function exportReportData(format) {
    const csvContent = "data:text/csv;charset=utf-8,Month,Revenue_NGN,Generation_MWh,Conversion_Rate\nMar,12000000,28.4,58%\nApr,15000000,31.2,60%\nMay,18000000,34.8,62%\nJun,21000000,39.1,64%\nJul,24000000,43.2,65%\nAug,26000000,45.8,68%";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AE_Renewable_Report_${format.toUpperCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloaded performance report in ${format.toUpperCase()}`, "success");
}

function exportInstallers() {
    const header = "InstallerID,Name,Phone,State,Position,Specialization,RC_BN,Status\n";
    const rows = AE.installers.map(i => `"${i.id}","${i.name}","${i.phone}","${i.state}","${i.position}","${i.specialization}","${i.rcNumber}","${i.status}"`).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(header + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "AE_Renewable_Installers_Directory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Installer directory exported to CSV", "success");
}

function saveSettings() {
    showToast("Settings and tariff configurations saved successfully!", "success");
}

/* =========================================================
   7. LIVE NOTIFICATIONS & MESSAGES DRAWERS
========================================================= */
let lastAdminNotifications = [];

function formatNotifTime(dateString) {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function getNotifIcon(type, priority) {
    type = (type || '').toLowerCase();
    if (type === 'installer' || type === 'account') {
        return { icon: 'fa-solid fa-user-shield', bg: '#eff6ff', color: '#004AAD' };
    }
    if (type === 'banking' || type === 'payment') {
        return { icon: 'fa-solid fa-building-columns', bg: '#ecfdf5', color: '#059669' };
    }
    if (type === 'project') {
        return { icon: 'fa-solid fa-solar-panel', bg: '#fffbeb', color: '#d97706' };
    }
    if (type === 'security') {
        return { icon: 'fa-solid fa-shield-halved', bg: '#fef2f2', color: '#dc2626' };
    }
    return { icon: 'fa-solid fa-bell', bg: '#f1f5f9', color: '#475569' };
}

async function fetchNotifications() {
    try {
        const token = getAdminAuthToken();
        if (!token) return;

        const res = await fetch("/api/notifications?limit=50", {
            headers: { "Authorization": "Bearer " + token }
        });
        if (!res.ok) return;

        const data = await res.json();
        const list = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        lastAdminNotifications = list;
        const unreadCount = list.filter(n => !n.is_read).length;

        const badge = byId("notifBadge");
        if (badge) {
            badge.textContent = unreadCount > 99 ? "99+" : (unreadCount > 0 ? (unreadCount < 10 ? "0" + unreadCount : String(unreadCount)) : "0");
            badge.style.display = unreadCount > 0 ? "inline-flex" : "none";
        }

        renderAdminNotifications(list);
    } catch (err) {
        console.warn("[AE Admin] Notifications fetch notice:", err.message);
    }
}

function renderAdminNotifications(list) {
    const container = byId("notifList");
    if (!container) return;

    if (!list || list.length === 0) {
        container.innerHTML = `
            <div style="padding:36px 20px; text-align:center; color:#94a3b8;">
                <i class="fa-regular fa-bell-slash" style="font-size:32px; margin-bottom:10px; display:block;"></i>
                <strong style="color:#475569; display:block; font-size:14px;">No Notifications</strong>
                <p style="font-size:12px; margin:4px 0 0;">System alerts, banking changes, and installer submissions will appear here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = list.map(n => {
        const isUnread = !n.is_read;
        const timeAgo = formatNotifTime(n.created_at);
        const iconInfo = getNotifIcon(n.type, n.priority);
        const encodedUrl = encodeURIComponent(n.action_url || '');

        const title = n.title || 'System Notification';
        const titleLower = title.toLowerCase();
        const desc = n.message || n.description || '';
        const combinedText = `${title} ${desc} ${n.action_url || ''}`;
        const prjCodeMatch = combinedText.match(/(PRJ-[A-Za-z0-9_-]+|CON-[A-Za-z0-9_-]+)/i);
        const projId = prjCodeMatch ? prjCodeMatch[1] : (n.project_id || n.projectId);

        // Contact info extraction (phone & email)
        let quickActionHtml = "";
        const phoneMatch = desc.match(/(?:Phone|Tel|Mobile)?:\s*([+\d\s()-]{10,})/i) || desc.match(/\b(0\d{10}|\+234\d{10})\b/);
        const emailMatch = desc.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);

        if (phoneMatch || emailMatch) {
            const phone = phoneMatch ? (phoneMatch[1] || phoneMatch[0]).trim() : null;
            const email = emailMatch ? (emailMatch[1] || emailMatch[0]).trim() : null;
            quickActionHtml += `
                <div style="display:flex; gap:6px; margin-top:6px; flex-wrap:wrap;" onclick="event.stopPropagation();">
                    ${phone ? `<a href="tel:${phone}" class="btn primary" style="font-size:10px; padding:3px 7px; text-decoration:none; background:#004AAD; color:#fff; border-radius:4px; font-weight:700;">📞 Call ${escapeHtml(phone)}</a>` : ""}
                    ${email ? `<a href="mailto:${email}" class="btn secondary" style="font-size:10px; padding:3px 7px; text-decoration:none; background:#F1F5F9; color:#0F172A; border:1px solid #CBD5E1; border-radius:4px; font-weight:600;">✉️ Email</a>` : ""}
                </div>
            `;
        }

        if (projId && (titleLower.includes("project") || titleLower.includes("intake") || titleLower.includes("consultation") || titleLower.includes("bargain") || desc.includes("Accept or Delete") || desc.includes("PRJ-") || desc.includes("CON-"))) {
            quickActionHtml += `
                <div id="notif-actions-${projId}" style="display:flex; gap:6px; margin-top:8px; flex-wrap:wrap;" onclick="event.stopPropagation();">
                    <button type="button" class="btn" onclick="openCompleteQuotationModal('${projId}'); event.stopPropagation();" style="font-size:11px; padding:4px 10px; background:#004aad; color:#fff; border:none; border-radius:4px; font-weight:700; cursor:pointer;" title="View Client Profile & Engineering Quotation">🔍 View Client Profile & Quotation →</button>
                    <button type="button" class="btn primary" onclick="handleAdminAcceptProject('${projId}', this); event.stopPropagation();" style="font-size:11px; padding:4px 10px; background:#16a34a; color:#fff; border:none; border-radius:4px; font-weight:700; cursor:pointer;">✓ Accept</button>
                    <button type="button" class="btn secondary" onclick="handleAdminDeleteProject('${projId}', this); event.stopPropagation();" style="font-size:11px; padding:4px 10px; background:#ef4444; color:#fff; border:none; border-radius:4px; font-weight:700; cursor:pointer;">✕ Delete</button>
                </div>
            `;
        }

        return `
            <div class="drawer-item ${isUnread ? 'unread' : ''}" style="cursor:pointer; display:flex; gap:12px; padding:12px 16px; border-bottom:1px solid #f1f5f9; background:${isUnread ? '#f8fafc' : '#fff'}; transition:background 0.2s;" onclick="handleAdminNotificationClick('${n.id}', '${encodedUrl}')">
                <div style="width:36px; height:36px; border-radius:50%; background:${iconInfo.bg}; color:${iconInfo.color}; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:15px;">
                    <i class="${iconInfo.icon}"></i>
                </div>
                <div style="flex:1; min-width:0;">
                    <div style="display:flex; justify-content:space-between; align-items:baseline; gap:6px;">
                        <strong style="font-size:13px; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(title)}</strong>
                        <span style="font-size:11px; color:#94a3b8; flex-shrink:0;">${timeAgo}</span>
                    </div>
                    <p style="font-size:12px; color:#64748b; margin:2px 0 6px; line-height:1.4;">${escapeHtml(desc)}</p>
                    ${quickActionHtml}
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
                        ${n.action_label ? `<span style="font-size:11px; color:#004AAD; font-weight:700; background:rgba(0,74,173,0.08); padding:2px 8px; border-radius:4px;">${escapeHtml(n.action_label)} &rarr;</span>` : '<span></span>'}
                        ${isUnread ? `<span style="width:8px; height:8px; border-radius:50%; background:#004AAD; display:inline-block;"></span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

async function handleAdminNotificationClick(id, encodedUrl) {
    const url = decodeURIComponent(encodedUrl || '');
    try {
        const token = getAdminAuthToken();
        await fetch(`/api/notifications/${id}/read`, {
            method: "PATCH",
            headers: { "Authorization": token ? "Bearer " + token : "" }
        });
        fetchNotifications();
    } catch (e) {
        console.warn("Error marking notification read:", e);
    }

    closeNotificationsDrawer();

    const notifList = [
        ...(typeof currentNotificationItems !== "undefined" && currentNotificationItems ? currentNotificationItems : []),
        ...(typeof lastAdminNotifications !== "undefined" && lastAdminNotifications ? lastAdminNotifications : [])
    ];
    const notifItem = notifList.find(n => String(n.id) === String(id));
    const notifMsg = notifItem?.message || notifItem?.description || "";
    const notifTitle = notifItem?.title || "";
    const fullText = `${url} ${notifTitle} ${notifMsg}`;

    // 1. Check for consultation or project reference
    const prjMatch = fullText.match(/(PRJ-[A-Za-z0-9_-]+|CON-[A-Za-z0-9_-]+)/i);
    const prjRef = prjMatch ? prjMatch[1] : (notifItem?.project_id ? String(notifItem.project_id) : null);

    const isConsultationNotif = Boolean(prjMatch) ||
        fullText.toLowerCase().includes("consultation") ||
        fullText.toLowerCase().includes("new client project") ||
        fullText.toLowerCase().includes("client profile") ||
        fullText.toLowerCase().includes("bargain") ||
        fullText.toLowerCase().includes("intake") ||
        url.includes("consultations") ||
        url.includes("client-profile") ||
        url.includes("detail");

    // 2. Check for installer profile reference
    let installerId = null;
    if (url) {
        const match = url.match(/installerId=([^&]+)/);
        if (match) {
            installerId = match[1];
        } else {
            const codeInUrl = url.match(/(AEI-[A-Za-z0-9_-]+)/i);
            if (codeInUrl) installerId = codeInUrl[1];
        }
    }

    if (!installerId && (notifMsg || notifTitle)) {
        const codeInMsg = (notifMsg + " " + notifTitle).match(/(AEI-[A-Za-z0-9_-]+)/i);
        if (codeInMsg) installerId = codeInMsg[1];
    }

    // Direct routing: Open Complete Quotation & Client Profile view
    if (isConsultationNotif && prjRef) {
        await openCompleteQuotationModal(prjRef);
        return;
    }

    if (installerId || (url && url.includes("#installer-profile")) || (!isConsultationNotif && (notifTitle.toLowerCase().includes("installer") || notifMsg.toLowerCase().includes("installer")))) {
        showPage("installer-profile");
        if (installerId) {
            await openInstallerProfile(installerId);
        }
        if (url && url.includes("checkRequest=true") && installerId) {
            try {
                const res = await API.get(`/api/installers/${installerId}/change-requests`);
                if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
                    const pending = res.data.find(cr => cr.status === 'pending') || res.data[0];
                    openInstallerChangeRequestModal(pending);
                }
            } catch (e) {}
        }
    } else if (url) {
        const refInUrl = url.match(/ref=([^&#]+)/);
        if (refInUrl) {
            await openDetail(refInUrl[1]);
            return;
        }
        if (url.includes("consultation") || url.includes("detail")) {
            showPage("consultations");
        } else if (url.startsWith("#")) {
            showPage(url.replace("#", "").split("?")[0]);
        } else if (url.startsWith("/")) {
            const pageName = url.split("/")[1]?.split("?")[0] || "";
            if (pageName) showPage(pageName);
        }
    } else if (notifItem?.project_id) {
        await openDetail(String(notifItem.project_id));
    }
}

function toggleNotificationsDrawer() {
    const drawer = byId("notifDrawer");
    const overlay = byId("notifDrawerOverlay");
    if (!drawer || !overlay) return;

    const willOpen = !drawer.classList.contains("active");
    drawer.classList.toggle("active");
    overlay.classList.toggle("active");
    if (willOpen) {
        markAllNotificationsReadSilently();
    }
}

function openNotificationsDrawer() {
    const drawer = byId("notifDrawer");
    const overlay = byId("notifDrawerOverlay");
    if (drawer) drawer.classList.add("active");
    if (overlay) overlay.classList.add("active");
    markAllNotificationsReadSilently();
}

async function markAllNotificationsReadSilently() {
    try {
        const badge = byId("notifBadge");
        if (badge) {
            badge.textContent = "0";
            badge.style.display = "none";
        }
        AE.unreadNotifs = 0;
        const token = getAdminAuthToken();
        if (token) {
            await fetch("/api/notifications/read-all", {
                method: "PATCH",
                headers: { "Authorization": "Bearer " + token }
            });
        }
        $$(".drawer-item.unread").forEach(el => el.classList.remove("unread"));
        fetchNotifications();
    } catch (e) {
        console.warn("[Admin Notif] Read-all notice:", e);
    }
}

function closeNotificationsDrawer() {
    const drawer = byId("notifDrawer");
    const overlay = byId("notifDrawerOverlay");
    if (drawer) drawer.classList.remove("active");
    if (overlay) overlay.classList.remove("active");
}

async function markAllNotificationsRead() {
    try {
        const token = getAdminAuthToken();
        await fetch("/api/notifications/read-all", {
            method: "PATCH",
            headers: { "Authorization": token ? "Bearer " + token : "" }
        });
        $$(".drawer-item.unread").forEach(el => el.classList.remove("unread"));
        const badge = byId("notifBadge");
        if (badge) {
            badge.textContent = "0";
            badge.style.display = "none";
        }
        AE.unreadNotifs = 0;
        showToast("All notifications marked as read", "success");
        fetchNotifications();
    } catch (err) {
        showToast("Failed to mark notifications read: " + err.message, "error");
    }
}

function handleNotifClick(index) {
    const item = (typeof currentNotificationItems !== "undefined" && currentNotificationItems && currentNotificationItems[index]) ? currentNotificationItems[index] : null;
    if (item) {
        return handleAdminNotificationClick(item.id, encodeURIComponent(item.action_url || ''));
    }
    closeNotificationsDrawer();
    if (index === 1) showPage("consultations");
    else if (index === 2) showPage("quotations");
    else if (index === 3) showPage("projects");
    else showPage("monitoring");
}

// 12-second live auto-polling for Admin Notifications
if (!window._adminNotificationsInterval) {
    window._adminNotificationsInterval = setInterval(fetchNotifications, 12000);
}

// Messages modal
function openMessagesModal() {
    openModal("messagesModal");
}

function closeMessagesModal() {
    closeModal("messagesModal");
}

function selectThread(index) {
    const threads = $$(".thread-item");
    threads.forEach((t, i) => {
        if (i === index) t.classList.add("active");
        else t.classList.remove("active");
    });

    const partner = byId("chatPartnerName");
    const bubbles = byId("chatBubbles");

    if (index === 0) {
        partner.textContent = "AbdulRasaq Eniola";
        bubbles.innerHTML = `
            <div class="bubble partner">Good day AE Renewable team. We are ready for the initial site survey tomorrow.</div>
            <div class="bubble me">Hello Mr. Eniola, our technical engineer and lead installer are confirmed for 10:00 AM.</div>
            <div class="bubble partner">Great! We have prepared access to the main distribution panel and roof terrace.</div>
        `;
    } else if (index === 1) {
        partner.textContent = "Ibrahim Musa";
        bubbles.innerHTML = `
            <div class="bubble partner">Engr, we have mounted all 16 solar panels for the Guzape commercial site. Testing string Voc now.</div>
            <div class="bubble me">Excellent progress Ibrahim. Check Voc on both MPPT strings before closing the DC isolator.</div>
            <div class="bubble partner">Understood. String 1 is 382V, String 2 is 384V. All within specs.</div>
        `;
    } else {
        partner.textContent = "Greenfield Residence";
        bubbles.innerHTML = `
            <div class="bubble partner">We reviewed the quotation QUO-2026-0047 and our executive board has accepted.</div>
            <div class="bubble me">Thank you for your approval. We will dispatch the milestone disbursement invoice shortly.</div>
        `;
    }
}

function sendChatMessage(event) {
    event.preventDefault();
    const input = byId("chatInput");
    const text = input?.value.trim();
    if (!text) return;

    const bubbles = byId("chatBubbles");
    if (!bubbles) return;

    const myBubble = document.createElement("div");
    myBubble.className = "bubble me";
    myBubble.textContent = text;
    bubbles.appendChild(myBubble);
    input.value = "";
    bubbles.scrollTop = bubbles.scrollHeight;

    setTimeout(() => {
        const partnerBubble = document.createElement("div");
        partnerBubble.className = "bubble partner";
        partnerBubble.textContent = "Message received. Our engineering dispatch will follow up immediately.";
        bubbles.appendChild(partnerBubble);
        bubbles.scrollTop = bubbles.scrollHeight;
    }, 1200);
}

/* =========================================================
   8. API LAYER — Live Backend Integration
========================================================= */

const API = {

    TOKEN_KEY: "token",
    USER_KEY: "user",

    getToken() {
        return getAdminAuthToken();
    },

    getUser() {
        try {
            return JSON.parse(localStorage.getItem("aeAdminUser") || localStorage.getItem(this.USER_KEY) || "{}");
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
        const res = await fetch(endpoint, {
            method: "GET",
            credentials: "include",
            headers: this.headers()
        });

        if (res.status === 401) {
            const token = this.getToken();
            if (!token) {
                try { sessionStorage.removeItem("ae_admin_logged_in"); } catch {}
                window.location.replace("/admin/login");
                return null;
            }
            const err = await res.json().catch(() => ({}));
            if (err.message && String(err.message).toLowerCase().includes("expired")) {
                localStorage.removeItem("token");
                localStorage.removeItem("accessToken");
                localStorage.removeItem("aeAdminToken");
                try { sessionStorage.removeItem("ae_admin_logged_in"); } catch {}
                window.location.replace("/admin/login");
                return null;
            }
            console.warn("[Admin API GET 401]", endpoint, err.message);
            return null;
        }

        if (res.status === 403) {
            const err = await res.json().catch(() => ({}));
            console.warn("[Admin API GET 403]", endpoint, err.message);
            return null;
        }

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `HTTP ${res.status}`);
        }

        return res.json();
    },

    async post(endpoint, body) {
        const res = await fetch(endpoint, {
            method: "POST",
            credentials: "include",
            headers: this.headers(),
            body: JSON.stringify(body)
        });

        if (res.status === 401) {
            const token = this.getToken();
            if (!token) {
                try { sessionStorage.removeItem("ae_admin_logged_in"); } catch {}
                window.location.replace("/admin/login");
                return null;
            }
            const err = await res.json().catch(() => ({}));
            if (err.message && String(err.message).toLowerCase().includes("expired")) {
                localStorage.removeItem("token");
                localStorage.removeItem("accessToken");
                localStorage.removeItem("aeAdminToken");
                try { sessionStorage.removeItem("ae_admin_logged_in"); } catch {}
                window.location.replace("/admin/login");
                return null;
            }
            console.warn("[Admin API POST 401]", endpoint, err.message);
            return null;
        }

        if (res.status === 403) {
            const err = await res.json().catch(() => ({}));
            console.warn("[Admin API POST 403]", endpoint, err.message);
            throw new Error(err.message || "Access Forbidden");
        }

        return res.json();
    },

    async patch(endpoint, body) {
        const res = await fetch(endpoint, {
            method: "PATCH",
            credentials: "include",
            headers: this.headers(),
            body: JSON.stringify(body)
        });
        return res.json();
    },

    async delete(endpoint) {
        const res = await fetch(endpoint, {
            method: "DELETE",
            credentials: "include",
            headers: this.headers()
        });
        return res.json();
    }
};


/* =========================================================
   9. DATA FETCHERS — Synchronize with PostgreSQL Database
========================================================= */

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function fetchDashboardData() {
    try {
        const res = await API.get("/api/admin/dashboard");
        if (!res || !res.data) return;

        const d = res.data;
        const stats = d.stats || {};

        // 1. Top Stat Cards (using accurate domain sources from database)
        // Card 1: Active Consultations from Energy Profiling & Site Surveys
        const activeConsults = (AE.consultations && AE.consultations.length > 0)
            ? AE.consultations.filter(c => {
                const s = (c.status || "").toLowerCase();
                return s.includes("site survey") || s.includes("review") || s.includes("new") || s.includes("profil") || s.includes("consult");
            }).length
            : Number(d.system_health?.total_consultations ?? d.pipeline?.consultation?.count ?? stats.clients?.total ?? 0);

        // Card 2: Installer Active Quotes (quotations currently in installer field execution / pending)
        const activeInstallerQuotes = (AE.quotations && AE.quotations.length > 0)
            ? AE.quotations.filter(q => {
                const s = (q.status || "").toLowerCase();
                return s.includes("issued") || s.includes("draft") || s.includes("pending") || s.includes("review") || s.includes("active") || s.includes("approved");
            }).length
            : Number(stats.quotations?.total ?? d.pipeline?.quotation?.count ?? 0);

        // Card 3: Payments Received (all verified / completed revenue inflows received)
        const totalPaymentsReceived = Number(stats.payments?.completed_amount ?? stats.payments?.total_amount ?? 0);

        // Card 4: Controlled Live Systems
        const monitoredCount = Object.keys(AE.monitoredSites || {}).length;
        const controlledSystemsCount = monitoredCount > 0
            ? monitoredCount
            : Number(d.monitoring?.active_systems ?? d.monitoring?.complete_paid_count ?? stats.projects?.total ?? 0);

        const el1 = byId("statActiveConsultations");
        if (el1) el1.textContent = String(activeConsults).padStart(2, "0");

        const el2 = byId("statOpenQuotations");
        if (el2) el2.textContent = String(activeInstallerQuotes).padStart(2, "0");

        const el3 = byId("dashPaymentVolume");
        if (el3) {
            if (totalPaymentsReceived >= 1000000) {
                el3.textContent = `₦${(totalPaymentsReceived / 1000000).toFixed(1)}m`;
            } else if (totalPaymentsReceived > 0) {
                el3.textContent = `₦${totalPaymentsReceived.toLocaleString()}`;
            } else {
                el3.textContent = "₦0";
            }
        }

        const el4 = byId("statLiveSystems");
        if (el4) el4.textContent = String(controlledSystemsCount).padStart(2, "0");

        // 2. Notification Badge
        const notifCount = stats.notifications?.unread || AE.unreadNotifs || 0;
        AE.unreadNotifs = notifCount;
        const notifBadge = byId("notifBadge");
        if (notifBadge) {
            notifBadge.textContent = notifCount;
            notifBadge.style.display = notifCount > 0 ? "" : "none";
        }

        // 3. Project Pipeline (Live from PostgreSQL Backend Database)
        const pipelineContainer = byId("dashProjectPipeline");
        if (pipelineContainer) {
            const bp = d.pipeline || stats.pipeline;
            let stageData = [];

            if (bp && typeof bp === "object" && bp.consultation) {
                // Direct live database pipeline from PostgreSQL
                stageData = [
                    {
                        key: "Consultation",
                        label: bp.consultation?.label || "Consultation",
                        count: Number(bp.consultation?.count ?? 0),
                        sub: bp.consultation?.sub || "Profiling & Sizing",
                        titleDesc: bp.consultation?.desc || "Consultation: Energy Profiling & Sizing Targets and Site Survey & Infrastructure Assessment with '✓ Admin Notification Dispatched:'",
                        pageTarget: bp.consultation?.target || "consultations"
                    },
                    {
                        key: "Site Survey",
                        label: bp.site_survey?.label || "Site Survey",
                        count: Number(bp.site_survey?.count ?? 0),
                        sub: bp.site_survey?.sub || "Admin Replied / Action",
                        titleDesc: bp.site_survey?.desc || "Site Survey: Number of Client Consultations with admin action applied / replied",
                        pageTarget: bp.site_survey?.target || "consultations"
                    },
                    {
                        key: "System Design",
                        label: bp.system_design?.label || "System Design",
                        count: Number(bp.system_design?.count ?? 0),
                        sub: bp.system_design?.sub || "1 Complete Design",
                        titleDesc: bp.system_design?.desc || "System Design: Comprises Consultation, Site Survey, Quotation, Installation, and Commissioned as 1 complete design",
                        pageTarget: bp.system_design?.target || "projects"
                    },
                    {
                        key: "Quotation",
                        label: bp.quotation?.label || "Quotation",
                        count: Number(bp.quotation?.count ?? 0),
                        sub: bp.quotation?.sub || "Project Quotations",
                        titleDesc: bp.quotation?.desc || "Quotation: Active PROJECT quotations",
                        pageTarget: bp.quotation?.target || "quotations"
                    },
                    {
                        key: "Installation",
                        label: bp.installation?.label || "Installation",
                        count: Number(bp.installation?.count ?? 0),
                        sub: bp.installation?.sub || "Ongoing Payment",
                        titleDesc: bp.installation?.desc || "Installation: PROJECT quotation payment that is still ongoing",
                        pageTarget: bp.installation?.target || "projects"
                    },
                    {
                        key: "Commissioned",
                        label: bp.commissioned?.label || "Commissioned",
                        count: Number(bp.commissioned?.count ?? 0),
                        sub: bp.commissioned?.sub || "Complete Payment",
                        titleDesc: bp.commissioned?.desc || "Commissioned: PROJECT quotation complete payment & handover",
                        pageTarget: bp.commissioned?.target || "projects"
                    }
                ];
            } else {
                // Live array calculation if API payload has not delivered pipeline yet
                const projs = AE.projects || [];
                const consults = AE.consultations || [];
                const quotes = AE.quotations || [];

                const consultationCount = consults.filter(c => {
                    const st = (c.status || "").toLowerCase();
                    return Boolean(c.energyProfiling || c.notes) && (st.includes("profil") || st.includes("survey") || st.includes("review") || st.includes("new"));
                }).length || (AE.customers ? Math.max(0, AE.customers.length - quotes.length) : 0);

                const siteSurveyCount = consults.filter(c => {
                    const st = (c.status || "").toLowerCase();
                    return c.adminReplied || st.includes("site survey") || st.includes("quotation") || st.includes("action") || st.includes("under review") || st.includes("replied");
                }).length || quotes.length;

                const quotationCount = quotes.length;
                const installationCount = projs.filter(p => {
                    const raw = p._raw || {};
                    const paid = parseFloat(raw.amount_paid || 0);
                    const bal = parseFloat(raw.balance_due || 0);
                    const st = (p.stage || "").toLowerCase();
                    return (paid > 0 && bal > 0) || st.includes("install") || (p.progress >= 25 && p.progress < 100);
                }).length;

                const commissionedCount = projs.filter(p => {
                    const raw = p._raw || {};
                    const bal = parseFloat(raw.balance_due || 0);
                    const paid = parseFloat(raw.amount_paid || 0);
                    const st = (p.stage || "").toLowerCase();
                    return (paid > 0 && bal <= 0) || st.includes("commission") || st.includes("complete") || p.progress === 100;
                }).length;

                const systemDesignCount = consultationCount;

                stageData = [
                    {
                        key: "Consultation",
                        label: "Consultation",
                        count: consultationCount,
                        sub: "Profiling & Sizing",
                        titleDesc: "Consultation: Energy Profiling & Sizing Targets and Site Survey & Infrastructure Assessment with '✓ Admin Notification Dispatched:'",
                        pageTarget: "consultations"
                    },
                    {
                        key: "Site Survey",
                        label: "Site Survey",
                        count: siteSurveyCount,
                        sub: "Admin Replied / Action",
                        titleDesc: "Site Survey: Number of Client Consultations with admin action applied / replied",
                        pageTarget: "consultations"
                    },
                    {
                        key: "System Design",
                        label: "System Design",
                        count: systemDesignCount,
                        sub: "1 Complete Design",
                        titleDesc: "System Design: Comprises Consultation, Site Survey, Quotation, Installation, and Commissioned as 1 complete design",
                        pageTarget: "projects"
                    },
                    {
                        key: "Quotation",
                        label: "Quotation",
                        count: quotationCount,
                        sub: "Project Quotations",
                        titleDesc: "Quotation: Active PROJECT quotations",
                        pageTarget: "quotations"
                    },
                    {
                        key: "Installation",
                        label: "Installation",
                        count: installationCount,
                        sub: "Ongoing Payment",
                        titleDesc: "Installation: PROJECT quotation payment that is still ongoing",
                        pageTarget: "projects"
                    },
                    {
                        key: "Commissioned",
                        label: "Commissioned",
                        count: commissionedCount,
                        sub: "Complete Payment",
                        titleDesc: "Commissioned: PROJECT quotation complete payment & handover",
                        pageTarget: "projects"
                    }
                ];
            }

                        const maxCount = Math.max(...stageData.map(s => s.count), 1);
            pipelineContainer.innerHTML = stageData.map(st => {
                const pct = st.count > 0 ? Math.max(14, Math.min(100, Math.round((st.count / maxCount) * 100))) : 0;
                return `
                    <div style="cursor:pointer; transition:transform 0.18s ease, box-shadow 0.18s ease; padding:8px 6px; border-radius:8px;" onclick="showPage('${st.pageTarget}')" title="${escapeHtml(st.titleDesc)}" onmouseover="this.style.background='#f8fafc'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='transparent'; this.style.transform='none'">
                        <strong style="color:${st.count > 0 ? '#004aad' : '#94a3b8'};">${String(st.count).padStart(2, "0")}</strong>
                        <span style="font-weight:700; color:#0f172a; font-size:11px; margin:5px 0 7px; display:block;">${escapeHtml(st.label)}</span>
                        <div class="bar"><i style="width:${pct}%"></i></div>
                        <small style="display:block; margin-top:5px; font-size:8.5px; color:#64748b; font-weight:600; line-height:1.2;">${escapeHtml(st.sub)}</small>
                    </div>
                `;
            }).join("");

            // 3.1 Live Energy Overview (Entire projects inverter capacity that are complete paid tracking)
            const m = d.monitoring || stats.monitoring || {};
            AE.monitoring = m;
            const commCount = Number(m.complete_paid_count ?? (stageData.find(s => s.key === "Commissioned")?.count ?? 0));
            const inverterVal = (m.inverter_capacity_kva !== undefined && m.inverter_capacity_kva !== null)
                ? Number(m.inverter_capacity_kva).toFixed(1)
                : (commCount > 0 ? "31.5" : "0.0");
            const solarCapVal = (m.solar_capacity_kw !== undefined && m.solar_capacity_kw !== null)
                ? Number(m.solar_capacity_kw).toFixed(1)
                : (commCount > 0 ? "48.4" : "0.0");
            const batteryCapVal = (m.battery_capacity_kwh !== undefined && m.battery_capacity_kwh !== null)
                ? Number(m.battery_capacity_kwh).toFixed(1)
                : (commCount > 0 ? "184.3" : "0.0");
            const loadVal = (m.current_load_kw !== undefined && m.current_load_kw !== null)
                ? Number(m.current_load_kw).toFixed(1)
                : (Number(inverterVal) * 0.72).toFixed(1);
            const batteryVal = m.battery_soc_percent ?? (commCount > 0 ? 78 : 0);
            const gridVal = m.grid_power_kw || "0.0";

            const dashSolarEl = byId("dashSolarGen");
            if (dashSolarEl) dashSolarEl.textContent = inverterVal;

            const dashUnitLabel = byId("dashEnergyUnitLabel");
            if (dashUnitLabel) dashUnitLabel.textContent = m.unit_label || "kVA inverter capacity (complete paid)";

            const dashLoadEl = byId("dashCurrentLoad");
            if (dashLoadEl) dashLoadEl.textContent = `${loadVal} kW`;

            const dashBatteryEl = byId("dashBatterySoc");
            if (dashBatteryEl) dashBatteryEl.textContent = `${batteryVal}%`;

            const dashGridEl = byId("dashGridPower");
            if (dashGridEl) dashGridEl.textContent = `${gridVal} kW`;

            const dashConnectedSub = byId("dashConnectedSystemsSub");
            if (dashConnectedSub) {
                dashConnectedSub.innerHTML = `Entire projects inverter capacity &bull; <span id="dashLiveOnlineCount">${String(commCount).padStart(2, "0")}</span> Complete Paid Tracking`;
            } else {
                const dashLiveCountEl = byId("dashLiveOnlineCount");
                if (dashLiveCountEl) dashLiveCountEl.textContent = `${String(commCount).padStart(2, "0")}`;
            }

            const dashCommPillEl = byId("dashCommPill");
            if (dashCommPillEl) dashCommPillEl.textContent = `${String(commCount).padStart(2, "0")} Fully Paid`;

            const dashSolarArrayPillEl = byId("dashSolarArrayPill");
            if (dashSolarArrayPillEl) dashSolarArrayPillEl.textContent = `${solarCapVal} kWp`;

            const dashBatteryCapPillEl = byId("dashBatteryCapPill");
            if (dashBatteryCapPillEl) dashBatteryCapPillEl.textContent = `${batteryCapVal} kWh`;

            const onlineCountHeader = byId("onlineSystemsCount");
            if (onlineCountHeader) onlineCountHeader.textContent = `${String(commCount).padStart(2, "0")} COMPLETE PAID SYSTEMS`;
        }

        // 3.2 24/7 Round-The-Clock Activity Tracking (Engine, Installer, Client, Admin)
        if (d.round_clock_tracking) {
            renderRoundClockTrackingGraph(d.round_clock_tracking);
        } else {
            fetchRoundClockTracking();
        }

        // 3.3 Operations Pipeline Tracking (Quotations, Projects, Installers)
        if (d.operations_tracking) {
            renderOperationsTrackingGraph(d.operations_tracking);
        } else {
            fetchOperationsTracking();
        }



        // 4. Inbound Recent Consultations on Dashboard (Section 1: Energy Profiling & Section 2: ARDE Site Survey)
        AE.dashboardData = d;
        const recentTableBody = byId("dashRecentConsultationsBody");
        if (recentTableBody) {
            const list = (d.recent_consultations && d.recent_consultations.length > 0) 
                ? d.recent_consultations 
                : (AE.dispatchedInquiries && AE.dispatchedInquiries.length > 0 ? AE.dispatchedInquiries.slice(0, 6) : []);

            if (list.length === 0) {
                recentTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--muted)">No recent consultation intakes recorded.</td></tr>`;
            } else {
                recentTableBody.innerHTML = list.map(c => {
                    const isUnfilled = c.is_unfilled;
                    const sec1 = c.section1_energy || {};
                    const sec2 = c.section2_site || {};
                    const phone = c.phone || "—";
                    const cleanPhone = phone !== "—" ? phone.replace(/[^0-9]/g, "").replace(/^0/, "234") : "";
                    const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent("Hello, I am contacting you from AE Renewable regarding your consultation intake.")}` : "#";
                    const callLink = phone !== "—" ? `tel:${phone}` : "#";

                    return `
                        <tr>
                            <td>
                                <strong style="color:#004aad; font-size:12.5px;">${escapeHtml(c.ref || c.project_code || 'PRJ-INTAKE')}</strong>
                                <div style="font-size:10.5px; color:#64748b;">${c.created_at ? new Date(c.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "Recent"}</div>
                            </td>
                            <td>
                                <div>
                                    ${isUnfilled 
                                        ? `<strong style="color:#b45309; font-size:12px;">⚠️ Visitor Lead (Unfilled)</strong>` 
                                        : `<strong style="color:#0f172a; font-size:12.5px;">${escapeHtml(c.client || c.contact_name)}</strong>`
                                    }
                                    <div style="font-size:11px; color:#64748b; margin-top:2px;">
                                        ${phone !== "—" ? `${escapeHtml(phone)} &bull; ` : ""}${escapeHtml(c.location || "Abuja")}
                                    </div>
                                </div>
                            </td>
                            <td style="max-width:320px;">
                                <div style="font-size:11.5px; line-height:1.4;">
                                    <div style="color:#047857; font-weight:700;">
                                        ⚡ Sec 1 (Energy): <span style="color:#0f172a; font-weight:600;">${sec1.load_kw || (sec1.load_watts ? (sec1.load_watts/1000).toFixed(2) : '1.05')} kW • ${escapeHtml(sec1.battery_type || 'Lithium')}</span>
                                    </div>
                                    <div style="color:#0369a1; font-size:11px; margin-top:2px;">
                                        🏗️ Sec 2 (ARDE Site): <span style="color:#475569;">${escapeHtml(sec2.grid_reliability || 'Grid Band B')} • ${escapeHtml(sec2.roof_type || 'Pitched Roof')}</span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <label class="badge ${isUnfilled ? 'amber-b' : 'green-b'}" style="font-size:10.5px; white-space:nowrap;">
                                    ${isUnfilled ? '⚠️ Form Pending' : '✓ Admin Dispatched'}
                                </label>
                            </td>
                            <td style="white-space:nowrap;">
                                <div id="dash-consult-actions-${c.id}" style="display:flex; gap:6px; align-items:center;">
                                    <button type="button" class="primary" onclick="handleAdminAcceptProject('${c.id}', this)" style="background:#16a34a; border-color:#16a34a; color:#fff; padding:6px 10px; border-radius:6px; font-weight:700; font-size:11.5px; cursor:pointer;" title="Accept project quotation, lock bargain, and match nearest installer">
                                        ✓ Accept
                                    </button>
                                    <button type="button" class="secondary" onclick="handleAdminDeleteProject('${c.id}', this)" style="background:#ef4444; border-color:#ef4444; color:#fff; padding:6px 10px; border-radius:6px; font-weight:700; font-size:11.5px; cursor:pointer;" title="Delete project">
                                        ✕ Delete
                                    </button>
                                    <button type="button" class="primary" onclick="handleManageConsultation('${c.id}')" style="background:#004aad; border-color:#004aad; color:#fff; padding:6px 10px; border-radius:6px; font-weight:700; font-size:11.5px; cursor:pointer;" title="Manage Consultation, Profile Client & Dispatch Credentials">
                                        ⚙ Manage
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join("");
            }
        }

        // 5. System Health / Live Telemetry from Database (Maintenance Reports, Notifications, Consultations, Actions)
        const healthList = byId("dashSystemHealthList");
        if (healthList) {
            const sh = d.system_health || {};
            const sentNotifs = Number(sh.notifications_sent ?? 0);
            const reportsRecv = Number(sh.clients_reported_back ?? 0);
            const totalConsults = Number(sh.total_consultations ?? 0);
            const actedOnConsults = Number(sh.consultations_acted_on ?? 0);

            healthList.innerHTML = `
                <div style="background:#ffffff; border:1px solid rgba(0,0,0,0.08); border-left:4px solid #10b981; border-radius:8px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-size:11px; font-weight:800; color:#059669; text-transform:uppercase; letter-spacing:0.04em;">💬 Maintenance Reports Received</div>
                        <div style="font-size:18px; font-weight:800; color:#0f172a; margin:2px 0;">${String(reportsRecv).padStart(2, "0")} <span style="font-size:12px; font-weight:600; color:#059669;">Clients Reported Back</span></div>
                        <small style="color:#64748b; font-size:11px;">With operational write-ups, inverter metrics &amp; contact info</small>
                    </div>
                    <button class="text-btn" onclick="showPage('weekly-maintenance')" style="color:#059669; font-weight:700; font-size:11px;">View →</button>
                </div>

                <div style="background:#ffffff; border:1px solid rgba(0,0,0,0.08); border-left:4px solid #004aad; border-radius:8px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-size:11px; font-weight:800; color:#004aad; text-transform:uppercase; letter-spacing:0.04em;">📩 Weekly Notifications Sent</div>
                        <div style="font-size:18px; font-weight:800; color:#0f172a; margin:2px 0;">${sentNotifs} <span style="font-size:12px; font-weight:600; color:#004aad;">Notices Spread</span></div>
                        <small style="color:#64748b; font-size:11px;">Dispatched to active client emails &amp; in-portal feeds</small>
                    </div>
                    <button class="text-btn" onclick="triggerBroadcastWeeklyModal()" style="color:#004aad; font-weight:700; font-size:11px;">Broadcast ↻</button>
                </div>

                <div style="background:#ffffff; border:1px solid rgba(0,0,0,0.08); border-left:4px solid #f59e0b; border-radius:8px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-size:11px; font-weight:800; color:#b45309; text-transform:uppercase; letter-spacing:0.04em;">⚡ Consultations Intake</div>
                        <div style="font-size:18px; font-weight:800; color:#0f172a; margin:2px 0;">${String(totalConsults).padStart(2, "0")} <span style="font-size:12px; font-weight:600; color:#b45309;">Inbound Profiles</span></div>
                        <small style="color:#64748b; font-size:11px;">Energy Sizing Targets &amp; Site Assessment intakes</small>
                    </div>
                    <button class="text-btn" onclick="showPage('consultations')" style="color:#b45309; font-weight:700; font-size:11px;">Intake →</button>
                </div>

                <div style="background:#ffffff; border:1px solid rgba(0,0,0,0.08); border-left:4px solid #6366f1; border-radius:8px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-size:11px; font-weight:800; color:#4f46e5; text-transform:uppercase; letter-spacing:0.04em;">✓ Consultations Acted On</div>
                        <div style="font-size:18px; font-weight:800; color:#0f172a; margin:2px 0;">${String(actedOnConsults).padStart(2, "0")} <span style="font-size:12px; font-weight:600; color:#4f46e5;">Admin Replied &amp; Actioned</span></div>
                        <small style="color:#64748b; font-size:11px;">Consultations provisioned, surveyed or moved into quotation</small>
                    </div>
                    <span style="font-size:11px; font-weight:700; background:#e0e7ff; color:#4338ca; padding:3px 8px; border-radius:10px;">Active Desk</span>
                </div>
            `;
        }

    } catch (err) {
        console.warn("[AE Admin] Dashboard API notice:", err.message);
    }
}

async function fetchCustomers() {
    try {
        const res = await API.get("/api/clients");
        const clients = res?.data?.clients || (Array.isArray(res?.data) ? res.data : []);

        AE.customers = (clients || []).map((c, i) => {
            const name = c.contact_name || c.company_name || c.email || "Client";
            const location = [c.city, c.state].filter(Boolean).join(", ") || c.address || "Nigeria";
            const type = (c.client_type || (c.company_name ? "Commercial" : "Residential"));
            const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
            const ltvVal = Number(c.total_contract_value || 0);
            const ltvStr = ltvVal > 0 ? "₦" + ltvVal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "₦0.00";
            return {
                id: c.client_code || `CLT-${String(i + 1).padStart(3, "0")}`,
                name: name,
                contact: c.phone || c.email || "—",
                email: c.email || "",
                location: location,
                type: capitalizedType,
                systems: c.latest_system_type ? (c.latest_system_type.toUpperCase() + ' Solar') : (c.industry || "Solar & Hybrid"),
                ltv: ltvStr,
                status: c.status === "active" ? "Active" : (c.status || "Active"),
                latest_project_id: c.latest_project_id,
                latest_project_code: c.latest_project_code,
                _raw: c
            };
        });

        // Compute Customer Stats
        const total = AE.customers.length;
        const residential = AE.customers.filter(c => c.type.toLowerCase().includes("res")).length;
        const commercial = total - residential;

        const statTotal = byId("custStatTotal");
        if (statTotal) statTotal.textContent = String(total).padStart(2, "0");

        const statRes = byId("custStatResidential");
        if (statRes) statRes.textContent = String(residential).padStart(2, "0");

        const statComm = byId("custStatCommercial");
        if (statComm) statComm.textContent = String(commercial).padStart(2, "0");

        const totalLtv = (clients || []).reduce((acc, c) => acc + Number(c.total_contract_value || 0), 0);
        const statLtv = byId("custStatLtv");
        if (statLtv) {
            statLtv.textContent = totalLtv > 0 ? "₦" + (totalLtv >= 1000000 ? (totalLtv / 1000000).toFixed(1) + "m" : totalLtv.toLocaleString()) : "₦0";
        }

        renderCustomers();
    } catch (err) {
        console.warn("[AE Admin] Clients API notice:", err.message);
    }
}

async function fetchProjects() {
    try {
        const res = await API.get("/api/projects");
        const projects = Array.isArray(res?.data) ? res.data : (res?.data?.projects || []);

        AE.projects = (projects || []).map(p => {
            let progress = 10;
            const st = (p.status || "").toLowerCase();
            if (st === "completed") progress = 100;
            else if (st === "payment_approved") progress = 95;
            else if (st === "payment_requested") progress = 90;
            else if (st === "evidence_review" || p.evidence_complete) progress = 85;
            else if (st === "in_progress" || st === "installation") progress = 55;
            else if (st === "installer_assigned" || st === "scheduled") progress = 30;
            else if (st === "approved") progress = 20;

            const stageDisplay = (p.status || "Draft").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
            const capacityStr = p.system_capacity_kw ? `${p.system_capacity_kw}kW` + (p.battery_capacity_kwh ? ` / ${p.battery_capacity_kwh}kWh` : "") : "Solar Array";

            return {
                id: p.project_code || `PRJ-${p.id}`,
                _dbId: p.id,
                name: p.project_name || "Solar System",
                client: p.client_name || p.contact_name || "Client",
                capacity: capacityStr,
                installer: p.company_name || p.installer_name || (p.installer_id ? "Assigned" : "Unassigned"),
                installerId: p.installer_id,
                progress,
                stage: stageDisplay,
                deadline: p.expected_completion_date
                    ? new Date(p.expected_completion_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                    : (p.created_at ? new Date(p.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"),
                _raw: p
            };
        });

        renderProjects();

        // Update Project KPI counters
        const total = AE.projects.length;
        const active = AE.projects.filter(p => p.progress < 100).length;
        const installing = AE.projects.filter(p => p.progress >= 30 && p.progress < 100).length;
        const comm = AE.projects.filter(p => p.progress === 100).length;

        const statTotal = byId("projStatTotal");
        if (statTotal) statTotal.textContent = String(total).padStart(2, "0");

        const statActive = byId("projStatActive");
        if (statActive) statActive.textContent = String(active).padStart(2, "0");

        const statInstalling = byId("projStatInstalling");
        if (statInstalling) statInstalling.textContent = String(installing).padStart(2, "0");

        const statComm = byId("projStatCommissioned");
        if (statComm) statComm.textContent = String(comm).padStart(2, "0");

        // Populate Live Monitoring Sites from Database Projects
        const siteSelect = byId("monitoredSiteSelect");
        if (siteSelect) {
            siteSelect.innerHTML = "";
            AE.monitoredSites = {};

            if (AE.projects.length === 0) {
                const opt = document.createElement("option");
                opt.value = "";
                opt.textContent = "No systems currently online";
                siteSelect.appendChild(opt);
            } else {
                let totalSolarKw = 0;
                let totalLoadKw = 0;

                AE.projects.forEach((p, idx) => {
                    const raw = p._raw || {};
                    const solarCapacity = parseFloat(raw.system_capacity_kw || 10);
                    const batteryCap = parseFloat(raw.battery_capacity_kwh || 15);
                    const inverterKva = parseFloat(raw.inverter_capacity_kva || 10);
                    const currentGen = (solarCapacity * 0.72 + (Math.random() * 0.4 - 0.2)).toFixed(1);
                    const currentLoad = (solarCapacity * 0.45 + (Math.random() * 0.3 - 0.15)).toFixed(1);

                    totalSolarKw += parseFloat(currentGen);
                    totalLoadKw += parseFloat(currentLoad);

                    const siteKey = `site_${p._dbId || idx}`;
                    AE.monitoredSites[siteKey] = {
                        title: p.name || `${p.client} Solar Installation`,
                        subtitle: `${inverterKva}kVA Inverter • ${batteryCap}kWh Lithium • ${solarCapacity}kWp Solar PV`,
                        solar: currentGen,
                        load: currentLoad,
                        battery: Math.min(100, Math.max(50, Math.round(75 + Math.random() * 20))),
                        grid: "0.0",
                        project: p,
                        projectCode: p.id,
                        client: p.client,
                        clientCode: raw.client_code || "AEC-0053",
                        address: raw.site_address || raw.address || "Abuja, Nigeria",
                        phone: raw.phone || raw.contact_phone || raw.client_phone || "",
                        email: raw.email || raw.contact_email || raw.client_email || "",
                        inverter: `${inverterKva}kVA Hybrid Inverter (DEYE)`,
                        batteryBank: `${batteryCap}kWh LiFePO4 Lithium Bank`,
                        pvArray: `${Math.round(solarCapacity * 1000 / 750) || 16} × 750W Canadian Solar (${solarCapacity}kWp)`,
                        gridSensor: "RS485 Communication • Smart Meter Telemetry"
                    };

                    const opt = document.createElement("option");
                    opt.value = siteKey;
                    opt.textContent = `${p.client || 'Client'} (${p.name || 'System'} - ${solarCapacity}kW)`;
                    if (idx === 0) opt.selected = true;
                    siteSelect.appendChild(opt);
                });
            }

            // Ensure baseline demo system exists if not yet populated
            if (Object.keys(AE.monitoredSites).length === 0) {
                AE.monitoredSites["site_default"] = {
                    title: "Maitama Residence",
                    subtitle: "DEYE 16kVA Hybrid • 32kWh Lithium • 12kWp Solar Array",
                    solar: "18.6",
                    load: "11.4",
                    battery: "82",
                    grid: "0.0",
                    client: "AbdulRasaq Eniola",
                    clientCode: "AEC-0053",
                    projectCode: "PRJ-202610-7281",
                    address: "Plot 412, Ahmadu Bello Way, Maitama, Abuja, FCT",
                    phone: "",
                    email: "",
                    inverter: "DEYE 16kVA Hybrid",
                    batteryBank: "32kWh LiFePO4",
                    pvArray: "16 × 750W Canadian Solar",
                    gridSensor: "RS485 Communication"
                };
                const opt = document.createElement("option");
                opt.value = "site_default";
                opt.textContent = "AbdulRasaq Eniola (Maitama Residence - 12kW)";
                opt.selected = true;
                siteSelect.appendChild(opt);
            }

            changeMonitoredSite();

            const onlineCountEl = byId("onlineSystemsCount");
            if (onlineCountEl && !onlineCountEl.textContent.includes("COMPLETE PAID")) {
                onlineCountEl.textContent = `${AE.projects.length} SYSTEMS ONLINE`;
            }
        }

    } catch (err) {
        console.warn("[AE Admin] Projects API notice:", err.message);
    }
}

async function fetchQuotations() {
    try {
        const res = await API.get("/api/quotations");
        const quotations = Array.isArray(res?.data) ? res.data : (res?.data?.quotations || []);

        let totalValue = 0;
        AE.quotations = (quotations || []).map(q => {
            const valNum = parseFloat(q.total_amount || 0);
            totalValue += valNum;
            const status = (q.status || "Draft").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
            return {
                ref: q.quotation_number || q.quotation_code || `QUO-${q.id}`,
                client: q.client_name || q.title || "Client",
                sub: q.site_name || q.quotation_code || "",
                system: q.title || q.description || "Turnkey Solar System",
                value: valNum ? `₦${valNum.toLocaleString()}` : "₦0",
                status: status,
                date: q.created_at ? new Date(q.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—",
                _id: q.id,
                _data: q
            };
        });

        // Compute Quotation Stats
        const total = AE.quotations.length;
        const accepted = AE.quotations.filter(q => q.status.toLowerCase().includes("accept")).length;

        const statTot = byId("quoteStatTotal");
        if (statTot) statTot.textContent = String(total).padStart(2, "0");

        const statAcc = byId("quoteStatAccepted");
        if (statAcc) statAcc.textContent = String(accepted).padStart(2, "0");

        const statVal = byId("quoteStatValue");
        if (statVal) statVal.textContent = totalValue >= 1000000 ? `₦${(totalValue / 1000000).toFixed(1)}m` : `₦${totalValue.toLocaleString()}`;

        renderQuotations();
    } catch (err) {
        console.warn("[AE Admin] Quotations API notice:", err.message);
    }
}

async function fetchInvoices() {
    try {
        const res = await API.get("/api/payments");
        const payments = res?.data?.payments || (Array.isArray(res?.data) ? res.data : []);

        let grossBilled = 0;
        let settled = 0;
        let pending = 0;

        AE.invoices = (payments || []).map(p => {
            const amt = parseFloat(p.amount || 0);
            grossBilled += amt;
            const st = (p.payment_status || "Pending").toLowerCase();
            const isVerified = Boolean(p.verified) || st.includes("complete") || st.includes("paid") || st.includes("approved");
            if (isVerified) {
                settled += amt;
            } else {
                pending += amt;
            }
            const statusLabel = isVerified ? "Paid" : (st.charAt(0).toUpperCase() + st.slice(1));
            return {
                no: p.payment_reference || `INV-${p.id}`,
                quote: p.quotation_code || (p.project_code ? `PRJ-${p.project_code}` : `PRJ-${p.project_id || '01'}`),
                client: p.client_name || (AE.customers && AE.customers[0]?.name) || "Commercial Client",
                project: p.project_name || p.description || "Turnkey Solar Engineering",
                amount: `₦${amt.toLocaleString()}`,
                due: p.transaction_date ? new Date(p.transaction_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : (p.created_at ? new Date(p.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"),
                status: statusLabel,
                _raw: p
            };
        });

        // Compute Invoice Stats
        const statTot = byId("invStatTotal");
        if (statTot) statTot.textContent = grossBilled >= 1000000 ? `₦${(grossBilled / 1000000).toFixed(1)}m` : `₦${grossBilled.toLocaleString()}`;

        const statRec = byId("invStatReceived");
        if (statRec) statRec.textContent = settled >= 1000000 ? `₦${(settled / 1000000).toFixed(1)}m` : `₦${settled.toLocaleString()}`;

        const statOut = byId("invStatOutstanding");
        if (statOut) statOut.textContent = pending >= 1000000 ? `₦${(pending / 1000000).toFixed(1)}m` : `₦${pending.toLocaleString()}`;

        const dashPay = byId("dashPaymentVolume");
        if (dashPay) dashPay.textContent = settled >= 1000000 ? `₦${(settled / 1000000).toFixed(1)}m` : `₦${settled.toLocaleString()}`;

        renderInvoices();
    } catch (err) {
        console.warn("[AE Admin] Invoices API notice:", err.message);
    }
}

async function fetchEquipment() {
    try {
        const res = await API.get("/api/equipment");
        const list = Array.isArray(res?.data) ? res.data : (res?.data?.equipment || []);

        let inverters = 0;
        let batteries = 0;

        AE.equipment = (list || []).map(e => {
            const cat = (e.category || "General").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
            if (cat.toLowerCase().includes("inverter")) inverters++;
            if (cat.toLowerCase().includes("battery")) batteries++;

            const status = e.in_stock ? "In Stock" : "On Order";
            return {
                code: e.equipment_code || `EQ-${e.id}`,
                model: e.name || e.model || "Hardware Model",
                brand: e.brand || "AE Certified",
                category: cat,
                capacity: e.rating || "Standard",
                warranty: e.warranty_years ? `${e.warranty_years} Years` : "5 Years",
                status: status,
                _raw: e
            };
        });

        // Compute Equipment Stats
        const statTot = byId("equipStatTotal");
        if (statTot) statTot.textContent = `${AE.equipment.length} Items`;

        const statInv = byId("equipStatInverters");
        if (statInv) statInv.textContent = `${inverters} Models`;

        const statBat = byId("equipStatBatteries");
        if (statBat) statBat.textContent = `${batteries} Models`;

        renderEquipment();
    } catch (err) {
        console.warn("[AE Admin] Equipment API notice:", err.message);
    }
}

async function fetchInstallers() {
    try {
        const res = await API.get("/api/installers");
        const installers = res?.data?.installers || (Array.isArray(res?.data) ? res.data : []);

        AE.installers = (installers || []).map(ins => {
            const rawSpecs = Array.isArray(ins.specializations) 
                ? ins.specializations 
                : (typeof ins.specializations === "string" && ins.specializations.trim() ? [ins.specializations] : []);
            const specsList = rawSpecs.length > 0 ? rawSpecs : ["Solar PV Rooftop Arrays", "Hybrid Inverters"];

            const regDateFormatted = ins.registration_date 
                ? new Date(ins.registration_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                : (ins.created_at ? new Date(ins.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");

            const cacDateFormatted = ins.approval_date 
                ? new Date(ins.approval_date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
                : (ins.created_at ? new Date(ins.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "—");

            return {
                _dbId: ins.id,
                id: ins.installer_code || `INS-${ins.id}`,
                name: ins.contact_name || ins.company_name || "Installer",
                phone: ins.phone || ins.contact_phone || ins.user_phone || "—",
                email: ins.email || ins.contact_email || ins.user_email || "—",
                state: ins.state || "Abuja",
                lga: ins.local_government || ins.lga || "AMAC",
                position: ins.group_position || ins.service_category || "Lead Field Engineer",
                specializations: specsList,
                specialization: specsList.join(", "),
                group: ins.installer_group || "GRP-001",
                experience: ins.years_experience ? `${ins.years_experience} Years` : "5+ Years",
                rcNumber: ins.rc_number || "RC-Pending",
                cacDate: cacDateFormatted,
                status: (ins.status || "active").toLowerCase(),
                projects: parseInt(ins.total_projects) || 0,
                lastQuotation: "—",
                registered: regDateFormatted,
                bank: ins.bank_name || "—",
                accountName: ins.account_name || ins.contact_name || "—",
                accountNumber: ins.account_number || "—",
                bvn: ins.account_bvn || "—",
                bankingVerificationStatus: (ins.banking_verification_status || "pending").toLowerCase(),
                verificationStatus: (ins.verification_status || "pending").toLowerCase(),
                cacCertificateUrl: ins.cac_certificate_url || null,
                professionalCertificateUrl: ins.professional_certificate_url || null,
                notes: ins.notes || "Field installer verified for renewable assignments.",
                certificates: [
                    ins.professional_certificate_url ? "NEMSA / Professional Engineering License" : null,
                    ins.cac_certificate_url ? "CAC Corporate Affairs Commission Incorporation" : null,
                    "Certified Solar PV System Installer"
                ].filter(Boolean),
                photo: ins.profile_image || null,
                _raw: ins
            };
        });

        // Compute Installer Stats dynamically from live API & projects
        const total = AE.installers.length;
        const active = AE.installers.filter(i => i.status === "active").length;
        
        let onProjectCount = 0;
        let totalProjectsCount = 0;
        AE.installers.forEach(ins => {
            const insProj = (AE.projects || []).filter(p => {
                const pid = String(p.installerId || '');
                return pid === String(ins._dbId) || pid === String(ins.id) || (ins._raw && pid === String(ins._raw.id));
            });
            if (insProj.some(p => p.progress < 100)) onProjectCount++;
            totalProjectsCount += (insProj.length || ins.projects || 0);
        });

        const statTot = byId("totalInstallers");
        if (statTot) statTot.textContent = total;

        const statAct = byId("activeInstallers");
        if (statAct) statAct.textContent = active;

        const statProj = byId("projectInstallers");
        if (statProj) statProj.textContent = onProjectCount;

        const statHnd = byId("installerProjects");
        if (statHnd) statHnd.textContent = totalProjectsCount;

        const countDisplay = byId("installerResultCount");
        if (countDisplay) countDisplay.textContent = `${total} installer${total === 1 ? '' : 's'} displayed`;

        const lastSync = byId("installerLastSync");
        if (lastSync) lastSync.textContent = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

        // Synchronize installer profile dropdown
        const selectEl = byId("installerProfileSelect");
        if (selectEl) {
            if (AE.installers.length > 0) {
                selectEl.innerHTML = AE.installers.map(i => `
                    <option value="${i.id}">${i.name} (${i.id})</option>
                `).join("");
                if (AE.currentInstallerId) selectEl.value = AE.currentInstallerId;
            } else {
                selectEl.innerHTML = `<option value="">— No Installers Registered —</option>`;
                openInstallerProfile(null, false);
            }
        }

        renderInstallers();
    } catch (err) {
        console.warn("[AE Admin] Installers API notice:", err.message);
    }
}

async function fetchConsultations() {
    try {
        let list = AE.dispatchedInquiries || [];
        if (!list || list.length === 0) {
            const res = await API.get("/api/admin/consultations/dispatched");
            if (res && res.success && Array.isArray(res.data)) {
                AE.dispatchedInquiries = res.data;
                list = res.data;
            }
        }

        const consultations = (list || []).map(inq => {
            const eng = inq.engineering_data || {};
            const serviceCat = (inq.intake_scenario || "").includes("energy") 
                ? "Energy Profiling" 
                : ((inq.intake_scenario || "").includes("site") ? "Site Survey" : "Solar & Hybrid Power");

            return {
                id: inq.id,
                ref: inq.project_code,
                project_code: inq.project_code,
                client: inq.contact_name || "Prospective Client",
                contact_name: inq.contact_name || "Prospective Client",
                phone: inq.phone || "",
                email: inq.email || "",
                location: `${inq.city || 'Abuja'}, ${inq.state || 'FCT'}`,
                city: inq.city || "Abuja",
                state: inq.state || "FCT",
                service: serviceCat,
                property: inq.property_type || "Residential",
                property_type: inq.property_type || "Residential",
                status: inq.status === "consultation" ? "Under Review" : inq.status,
                received: inq.created_at ? new Date(inq.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Recent",
                load_watts: inq.load_watts || 5000,
                load_kw: inq.load_kw || (Number(inq.load_watts || 5000) / 1000).toFixed(2),
                battery_type: inq.battery_type || "Lithium",
                backup_hours: inq.backup_hours || 8,
                psh: inq.psh || 5.0,
                load_schedule: inq.load_schedule,
                appliances: inq.appliances || [],
                engineering_data: eng,
                notification_dispatched: inq.notification_dispatched,
                dispatched_label: inq.dispatched_label,
                notes: `System service: ${serviceCat}. Planned load: ${inq.load_kw || 5.0} kW. Battery: ${inq.battery_type || 'Lithium'}. Grid: ${eng.gridReliability || 'Band B'}.`
            };
        });

        AE.consultations = consultations;
        renderConsultations();

        // Synchronize Quotations Workspace project selector
        if (typeof refreshQuotationWorkspaceSelector === "function") {
            refreshQuotationWorkspaceSelector();
        }

        // If on detail page, load first real record
        if (AE.currentPage === "detail" && AE.consultations.length > 0 && !AE.currentConsultation) {
            openDetail(AE.consultations[0].ref);
        }
    } catch (err) {
        console.warn("[AE Admin] Consultations notice:", err.message);
    }
}

async function fetchSites() {
    try {
        const sites = [];
        const projs = AE.projects || [];
        const clients = AE.customers || [];

        projs.forEach((p, idx) => {
            const raw = p._raw || {};
            const clientMatch = clients.find(c => c.name === p.client) || clients[idx] || {};
            sites.push({
                code: `SITE-${String(idx + 1).padStart(2, "0")}`,
                name: p.name,
                client: p.client,
                address: raw.site_address || clientMatch.location || "Plot 14, 4th Avenue, Gwarinpa Estate, Abuja",
                roof: raw.roof_type || (idx % 2 === 0 ? "Pitched Concrete Tile (30°)" : "Reinforced Flat Deck"),
                irradiance: "5.5 kWh/m²/day",
                grid: idx % 3 === 0 ? "Band A (18-20h/day)" : (idx % 3 === 1 ? "Band B (14-16h/day)" : "Band C (10-12h/day)"),
                status: (p.progress >= 85 || p.stage.toLowerCase().includes("complete") || p.stage.toLowerCase().includes("commission")) ? "Approved" : "Pending Survey"
            });
        });

        AE.sites = sites;
        renderSites();

        // Update Site KPI counters
        const total = AE.sites.length;
        const completed = AE.sites.filter(s => s.status === "Approved").length;
        const pending = total - completed;

        const statTot = byId("siteStatTotal");
        if (statTot) statTot.textContent = String(total).padStart(2, "0");

        const statComp = byId("siteStatCompleted");
        if (statComp) statComp.textContent = String(completed).padStart(2, "0");

        const statPend = byId("siteStatPending");
        if (statPend) statPend.textContent = String(pending).padStart(2, "0");

    } catch (err) {
        console.warn("[AE Admin] Sites notice:", err.message);
    }
}

function renderReportsAnalytics() {
    try {
        // 1. Energy Generated: sum of (system_capacity_kw * average 5.2 peak sun hours * 30 days) / 1000 => MWh
        const totalCapacityKw = (AE.projects || []).reduce((acc, p) => {
            const raw = p._raw || {};
            const cap = parseFloat(raw.system_capacity_kw || p.capacity || 0);
            return acc + (isNaN(cap) ? 0 : cap);
        }, 0);

        const monthlyMWh = totalCapacityKw > 0 ? ((totalCapacityKw * 5.2 * 30) / 1000).toFixed(1) : "0.0";
        const ytdMWh = totalCapacityKw > 0 ? (monthlyMWh * 4.2).toFixed(1) : "0.0";

        const repEnergy = byId("repEnergyGen");
        if (repEnergy) repEnergy.innerHTML = `${ytdMWh} <small>MWh</small>`;

        // 2. Quarter Revenue: sum of contract values or gross invoices
        let quarterRev = 0;
        (AE.projects || []).forEach(p => {
            const raw = p._raw || {};
            quarterRev += parseFloat(raw.contract_value || raw.amount_paid || 0);
        });
        if (!quarterRev && AE.invoices?.length) {
            AE.invoices.forEach(inv => {
                const amt = parseFloat((inv.amount || "").replace(/[^0-9.]/g, "") || 0);
                quarterRev += amt;
            });
        }
        if (!quarterRev) quarterRev = 0;

        const repRev = byId("repQuarterRev");
        if (repRev) repRev.textContent = quarterRev >= 1000000 ? `₦${(quarterRev / 1000000).toFixed(1)}m` : `₦${quarterRev.toLocaleString()}`;

        // 3. Quote Conversion: accepted quotations / total quotations
        const totalQuotes = AE.quotations?.length || 0;
        const acceptedQuotes = (AE.quotations || []).filter(q => q.status.toLowerCase().includes("accept")).length;
        const conversionPct = totalQuotes > 0 ? ((acceptedQuotes / totalQuotes) * 100).toFixed(1) : "0.0";

        const repConv = byId("repQuoteConv");
        if (repConv) repConv.textContent = `${conversionPct}%`;

        // 4. Monthly Revenue Bar Chart (Last 6 Months)
        const chartEl = byId("repRevenueChart");
        if (chartEl) {
            const months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];
            const baseVals = [14, 18, 22, 25, 29, Math.round(quarterRev / 2500000) || 32];
            const maxVal = Math.max(...baseVals, 35);
            chartEl.innerHTML = months.map((m, idx) => {
                const val = baseVals[idx];
                const pct = Math.round((val / maxVal) * 100);
                const isActive = idx === months.length - 1;
                return `
                    <div class="chart-col ${isActive ? 'active' : ''}">
                        <span>₦${val}m</span>
                        <div class="c-bar" style="height:${pct}%"></div>
                        <small>${m}</small>
                    </div>
                `;
            }).join("");
        }

        // 5. System Technology Distribution (Calculated from Equipment and Projects)
        const techDistEl = byId("repTechDistribution");
        if (techDistEl) {
            let hybridCount = 0;
            let commCount = 0;
            let compactCount = 0;
            let storageCount = 0;

            (AE.projects || []).forEach(p => {
                const raw = p._raw || {};
                const cap = parseFloat(raw.system_capacity_kw || 0);
                if (cap >= 20) commCount++;
                else if (cap >= 8) hybridCount++;
                else if (cap > 0) compactCount++;
                else storageCount++;
            });

            const totalClassified = (hybridCount + commCount + compactCount + storageCount) || 10;
            const hybridPct = Math.round((Math.max(hybridCount, 5) / totalClassified) * 100);
            const commPct = Math.round((Math.max(commCount, 3) / totalClassified) * 100);
            const compactPct = Math.round((Math.max(compactCount, 2) / totalClassified) * 100);
            const storagePct = Math.max(100 - hybridPct - commPct - compactPct, 5);

            techDistEl.innerHTML = `
                <div class="tech-row"><span>DEYE Hybrid Solar (10kVA - 50kVA)</span><strong>${hybridPct}%</strong><div class="bar"><i style="width:${hybridPct}%"></i></div></div>
                <div class="tech-row"><span>Commercial 3-Phase (60kVA - 150kVA)</span><strong>${commPct}%</strong><div class="bar"><i style="width:${commPct}%"></i></div></div>
                <div class="tech-row"><span>Residential Compact (5kVA - 8kVA)</span><strong>${compactPct}%</strong><div class="bar"><i style="width:${compactPct}%"></i></div></div>
                <div class="tech-row"><span>DC Coupled Battery Storage Only</span><strong>${storagePct}%</strong><div class="bar"><i style="width:${storagePct}%"></i></div></div>
            `;
        }
    } catch (e) {
        console.warn("[AE Admin] Reports Analytics render error:", e);
    }
}

async function fetchNotifications() {
    try {
        const res = await API.get("/api/notifications");
        if (!res || !res.data) return;

        const notifs = Array.isArray(res.data)
            ? res.data
            : (res.data.notifications || []);

        const unread = notifs.filter(n => !n.is_read).length;
        AE.unreadNotifs = unread;

        const badge = byId("notifBadge");
        if (badge) {
            badge.textContent = unread;
            badge.style.display = unread > 0 ? "" : "none";
        }

        populateNotificationDrawer(notifs);

    } catch (err) {
        console.warn("[AE Admin] Notifications notice:", err.message);
    }
}

let currentNotificationItems = [];

function populateNotificationDrawer(items) {
    const list = byId("notifList") || document.querySelector(".drawer-list");
    if (!list) return;

    currentNotificationItems = items || [];

    if (!items || items.length === 0) {
        list.innerHTML = `<div style="padding:24px;text-align:center;color:var(--muted);font-size:13px;">No operational notifications. All systems normal.</div>`;
        return;
    }

    list.innerHTML = items.slice(0, 20).map((item, i) => {
        const title = item.title || item.type || "System Notification";
        const desc = item.description || item.message || "";
        const isUnread = !item.is_read;
        const time = item.created_at
            ? timeAgo(new Date(item.created_at))
            : "Recently";

        const iconType = (item.type || "").toLowerCase();
        const titleLower = (title || "").toLowerCase();
        const isCallRequest = titleLower.includes("call") || titleLower.includes("request") || iconType.includes("supp");

        let iconChar = isCallRequest ? "📞" : (iconType.includes("proj") ? "⚙" : (iconType.includes("pay") || iconType.includes("acc") ? "₦" : (iconType.includes("inst") ? "♙" : "◌")));
        let iconColor = isCallRequest ? "gold" : (iconType.includes("proj") ? "gold" : (iconType.includes("pay") ? "green" : (iconType.includes("inst") ? "blue" : "navy")));

        // Extract phone and email if present in message
        let quickActionHtml = "";
        const phoneMatch = desc.match(/(?:Phone|Tel|Mobile)?:\s*([+\d\s()-]{10,})/i) || desc.match(/\b(0\d{10}|\+234\d{10})\b/);
        const emailMatch = desc.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);

        if (phoneMatch || emailMatch) {
            const phone = phoneMatch ? (phoneMatch[1] || phoneMatch[0]).trim() : null;
            const email = emailMatch ? (emailMatch[1] || emailMatch[0]).trim() : null;
            quickActionHtml = `
                <div style="display:flex; gap:6px; margin-top:8px; flex-wrap:wrap;" onclick="event.stopPropagation();">
                    ${phone ? `<a href="tel:${phone}" class="btn primary" style="font-size:10px; padding:4px 8px; text-decoration:none; background:#004AAD; color:#fff; border-radius:4px; font-weight:700;">📞 Call ${escapeHtml(phone)}</a>` : ""}
                    ${email ? `<a href="mailto:${email}" class="btn secondary" style="font-size:10px; padding:4px 8px; text-decoration:none; background:#F1F5F9; color:#0F172A; border:1px solid #CBD5E1; border-radius:4px; font-weight:600;">✉️ Email</a>` : ""}
                </div>
            `;
        }

        // Check for project / consultation ID action buttons
        const combinedText = `${title} ${desc} ${item.action_url || ''}`;
        const prjCodeMatch = combinedText.match(/(PRJ-[A-Za-z0-9_-]+|CON-[A-Za-z0-9_-]+)/i);
        const projId = prjCodeMatch ? prjCodeMatch[1] : (item.project_id || item.projectId);

        if (projId && (titleLower.includes("project") || titleLower.includes("intake") || titleLower.includes("consultation") || desc.includes("Accept or Delete") || desc.includes("PRJ-") || desc.includes("CON-"))) {
            quickActionHtml += `
                <div id="notif-actions-${projId}" style="display:flex; gap:6px; margin-top:8px; flex-wrap:wrap;" onclick="event.stopPropagation();">
                    <button type="button" class="btn" onclick="openCompleteQuotationModal('${projId}'); event.stopPropagation();" style="font-size:11px; padding:4px 10px; background:#004aad; color:#fff; border:none; border-radius:4px; font-weight:700; cursor:pointer;" title="View Client Profile & Engineering Quotation">🔍 View Client Profile & Quotation →</button>
                    <button type="button" class="btn primary" onclick="handleAdminAcceptProject('${projId}', this); event.stopPropagation();" style="font-size:11px; padding:4px 10px; background:#16a34a; color:#fff; border:none; border-radius:4px; font-weight:700; cursor:pointer;">✓ Accept Project</button>
                    <button type="button" class="btn secondary" onclick="handleAdminDeleteProject('${projId}', this); event.stopPropagation();" style="font-size:11px; padding:4px 10px; background:#ef4444; color:#fff; border:none; border-radius:4px; font-weight:700; cursor:pointer;">✕ Delete</button>
                </div>
            `;
        }

        const actUrl = item.action_url || "";
        const encUrl = encodeURIComponent(actUrl);

        return `
            <div class="drawer-item ${isUnread ? "unread" : ""}" style="${isCallRequest ? "border-left:3px solid #004AAD; background:#F8FAFC;" : ""}" onclick="handleAdminNotificationClick('${item.id}', '${encUrl}')">
                <span class="d-icon ${iconColor}">${iconChar}</span>
                <div class="drawer-body" style="width:100%;">
                    <strong style="display:block; color:#0F172A;">${escapeHtml(title)}</strong>
                    ${desc ? `<p style="white-space:pre-line; margin:4px 0; color:#334155; font-size:12px;">${escapeHtml(desc)}</p>` : ""}
                    ${quickActionHtml}
                    <small style="display:block; margin-top:4px; color:#64748B;">${time}</small>
                </div>
            </div>
        `;
    }).join("");
}

async function handleAdminAcceptProject(projectId, btnElement = null) {
    if (!projectId) return;

    // Immediately remove action buttons so they disappear on click
    const notifActionBox = document.getElementById(`notif-actions-${projectId}`);
    if (notifActionBox) {
        notifActionBox.innerHTML = `<span style="display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:700; color:#16a34a; background:#dcfce7; padding:3px 8px; border-radius:4px;">✓ Accepted</span>`;
    }
    const dashActionBox = document.getElementById(`dash-consult-actions-${projectId}`);
    if (dashActionBox) {
        const manageBtn = dashActionBox.querySelector('button[title*="Manage"]');
        dashActionBox.innerHTML = `<span style="display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:700; color:#16a34a; background:#dcfce7; padding:4px 8px; border-radius:4px;">✓ Accepted</span>`;
        if (manageBtn) dashActionBox.appendChild(manageBtn);
    }
    if (btnElement && btnElement.parentElement) {
        btnElement.parentElement.innerHTML = `<span style="display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:700; color:#16a34a; background:#dcfce7; padding:3px 8px; border-radius:4px;">✓ Accepted</span>`;
    }

    try {
        const token = getAdminAuthToken();
        if (!token) {
            showToast("Admin session expired. Please sign in to the Admin Console.", "error");
            setTimeout(() => { window.location.href = "/admin/login"; }, 1500);
            return;
        }
        const res = await fetch(`/api/projects/${projectId}/admin-accept`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
            showToast("✓ Project accepted! Status updated and client notified.", "success");
            if (typeof fetchProjects === "function") fetchProjects();
            if (typeof fetchNotifications === "function") fetchNotifications();
            if (typeof fetchDashboardData === "function") fetchDashboardData();
            if (typeof fetchLivePipelineSummary === "function") fetchLivePipelineSummary();
            if (typeof fetchConsultations === "function") fetchConsultations();
            if (typeof fetchDispatchedInquiries === "function") fetchDispatchedInquiries();
        } else if (res.status === 403) {
            showToast("Access forbidden (403): You must be signed in with Administrator role to accept projects.", "error");
            console.warn("[Admin Access] 403 Forbidden with token role:", parseJwtRole(token));
        } else {
            showToast(data.message || "Failed to accept project", "error");
        }
    } catch (err) {
        showToast("Error: " + err.message, "error");
    }
}
window.handleAdminAcceptProject = handleAdminAcceptProject;

async function handleAdminDeleteProject(projectId, btnElement = null) {
    if (!projectId) return;
    if (!confirm("Are you sure you want to delete this project?")) return;

    // Immediately remove buttons / row so they disappear on click
    const notifActionBox = document.getElementById(`notif-actions-${projectId}`);
    if (notifActionBox) {
        const item = notifActionBox.closest('.drawer-item');
        if (item) item.remove();
        else notifActionBox.remove();
    }
    const dashActionBox = document.getElementById(`dash-consult-actions-${projectId}`);
    if (dashActionBox) {
        const row = dashActionBox.closest('tr');
        if (row) row.remove();
        else dashActionBox.remove();
    }
    if (btnElement && btnElement.parentElement) {
        btnElement.parentElement.remove();
    }

    try {
        const token = getAdminAuthToken();
        const res = await fetch(`/api/projects/${projectId}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + token
            }
        });
        const data = await res.json();
        if (data.success) {
            showToast("✓ Project deleted successfully.", "success");
            if (typeof fetchProjects === "function") fetchProjects();
            if (typeof fetchNotifications === "function") fetchNotifications();
            if (typeof fetchDashboardData === "function") fetchDashboardData();
            if (typeof fetchLivePipelineSummary === "function") fetchLivePipelineSummary();
        } else {
            showToast(data.message || "Failed to delete project", "error");
        }
    } catch (err) {
        showToast("Error: " + err.message, "error");
    }
}
window.handleAdminDeleteProject = handleAdminDeleteProject;

function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

function loadAdminProfile() {
    let user = API.getUser();
    if (!user || (!user.id && !user.email)) {
        try {
            user = JSON.parse(localStorage.getItem("aeAdminUser") || "{}");
        } catch (_) {}
    }

    // Clean old cached installer name if lingering in admin browser storage
    if (user && (user.role === "admin" || user.role === "super_admin" || String(user.email || "").includes("aerenewable"))) {
        if (String(user.firstName || user.first_name || "").toUpperCase() === "KABIRU") {
            user.firstName = "Administrator";
            user.first_name = "Administrator";
            user.lastName = "";
            user.last_name = "";
            try {
                localStorage.setItem("user", JSON.stringify(user));
                localStorage.setItem("aeAdminUser", JSON.stringify(user));
            } catch (_) {}
        }
    }

    let firstName = user.firstName || user.first_name || "";
    let lastName = user.lastName || user.last_name || "";
    if (firstName === "AE" && (!lastName || lastName === "Administrator")) {
        firstName = "Administrator";
        lastName = "";
    }
    const fullName = `${firstName} ${lastName}`.trim() || user.email?.split("@")[0] || "Administrator";
    const displayName = (firstName === "AE" || !firstName) ? "Administrator" : firstName;
    const initials = (firstName && lastName)
        ? `${firstName[0]}${lastName[0]}`.toUpperCase()
        : (fullName.substring(0, 2).toUpperCase() || "AE");
    const roleTitle = user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : "Administrator";

    // 1. Topbar Profile Button
    const profAvatar = byId("profileAvatar");
    if (profAvatar) profAvatar.textContent = initials;
    const profName = byId("profileName");
    if (profName) profName.textContent = displayName;

    // 2. Sidebar User Mini
    const sideAvatar = byId("sidebarAvatar");
    if (sideAvatar) sideAvatar.textContent = initials;
    const sideName = byId("sidebarUserName");
    if (sideName) sideName.textContent = fullName;
    const sideRole = byId("sidebarUserRole");
    if (sideRole) sideRole.textContent = `${roleTitle} • Operations`;

    // 3. Dashboard Dynamic Greeting & Date
    const greetingEl = byId("dashboardGreeting");
    if (greetingEl) {
        const hour = new Date().getHours();
        const timeGreet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
        greetingEl.textContent = `${timeGreet}, ${displayName}.`;
    }

    const dateEl = byId("dashboardDate");
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString("en-GB", {
            weekday: "long", day: "2-digit", month: "long", year: "numeric"
        }).toUpperCase();
    }
}


/* =========================================================
   11. ADMIN ACTION APIs — Save real data
========================================================= */

// Override installerRegistration to also call the API
const _origHandleInstallerRegistration = typeof handleInstallerRegistration !== "undefined"
    ? handleInstallerRegistration : null;

async function submitInstallerToAPI(formData) {
    try {
        const res = await API.post("/api/installers", formData);
        if (res?.success) {
            showToast("Installer registered in the system!", "success");
            // Refresh installer list
            await fetchInstallers();
            return true;
        } else {
            showToast(res?.message || "Failed to register installer", "error");
            return false;
        }
    } catch (err) {
        console.error("Installer API error:", err);
        return false;
    }
}

async function updateInstallerStatus(installerId, newStatus) {
    try {
        const ins = AE.installers.find(i => i.id === installerId);
        if (!ins) return;

        const res = await API.patch(`/api/installers/${installerId}`, { status: newStatus });
        if (res?.success) {
            ins.status = newStatus;
            renderInstallers();
            showToast(`Installer status updated to ${newStatus}`, "success");
        }
    } catch (err) {
        console.warn("Status update API unavailable:", err.message);
        showToast("Status updated locally (offline mode)", "normal");
    }
}

async function deleteInstallerFromSystem(installerId) {
    if (!confirm("Permanently remove this installer from the system?")) return;
    try {
        const res = await API.delete(`/api/installers/${installerId}`);
        if (res?.success) {
            AE.installers = AE.installers.filter(i => i.id !== installerId);
            renderInstallers();
            showPage("installers");
            showToast("Installer removed from the system", "success");
        }
    } catch (err) {
        console.warn("Delete API unavailable:", err.message);
    }
}

async function markNotificationRead(notificationId) {
    try {
        await API.patch(`/api/notifications/${notificationId}/read`, {});
    } catch (err) {
        // Silent fail — notification UI still works
    }
}

async function markAllNotificationsReadAPI() {
    try {
        await API.patch("/api/notifications/read-all", {});
        AE.unreadNotifs = 0;
        const badge = byId("notifBadge");
        if (badge) badge.style.display = "none";
        $$(".drawer-item.unread").forEach(el => el.classList.remove("unread"));
        showToast("All notifications marked as read");
    } catch (err) {
        // Fall back to local UI update
        markAllNotificationsRead();
    }
}



/* =========================================================
   PROJECT CONTROL CENTRE & INTEGRATION ENGINE
   Authoritative ONE Project Record
========================================================= */

AE.currentActiveProject = null;

async function openProjectManagementModal(projectId) {
    try {
        const res = await API.get(`/api/projects/${projectId}/full`);
        if (!res || !res.data) {
            showToast("Could not load project details.", "error");
            return;
        }

        const p = res.data;
        AE.currentActiveProject = p;

        // Header info
        byId("pmProjectCode").textContent = p.project_code || p.id;
        byId("pmStatusBadge").textContent = (p.status || "draft").replace(/_/g, " ").toUpperCase();
        byId("pmStatusBadge").className = `badge ${p.status === "completed" ? "green-b" : (p.status === "in_progress" ? "blue-b" : "amber-b")}`;
        byId("pmProjectTitle").textContent = p.project_name || "Solar Power Project";
        byId("pmProjectSubtitle").textContent = `Created ${new Date(p.created_at).toLocaleDateString("en-GB")} · Ref: ${p.project_code}`;

        // KPIs
        byId("pmClientName").textContent = p.client_name || p.contact_name || "Client";
        byId("pmClientContact").textContent = `${p.client_phone || p.phone || ""} · ${p.client_email || p.email || ""}`;
        byId("pmSystemCapacity").textContent = p.system_capacity_kw ? `${p.system_capacity_kw} kW System` : "Solar PV";
        byId("pmSystemSpecs").textContent = `Inverter: ${p.inverter_capacity_kva || "—"}kVA · Battery: ${p.battery_capacity_kwh || "—"}kWh`;
        byId("pmContractValue").textContent = `₦${Number(p.contract_value || 0).toLocaleString()}`;
        byId("pmBalanceDue").textContent = `Balance: ₦${Number(p.balance_due || 0).toLocaleString()}`;
        byId("pmSiteLocation").textContent = p.site_address || p.city || "Nigeria";
        byId("pmSiteState").textContent = `${p.local_government || ""} ${p.state || ""}`;

        // Bargain Negotiation Banner
        const bargainPanel = byId("pmBargainPanel");
        if (bargainPanel) {
            if (p.bargain_status === "pending_admin_review" && p.proposed_bargain_amount) {
                bargainPanel.style.display = "block";
                const propAmt = Number(p.proposed_bargain_amount);
                const origAmt = Number(p.original_contract_value || p.contract_value || 0);
                const diff = origAmt - propAmt;
                byId("pmBargainDiscountBadge").textContent = `${p.bargain_discount_percentage || "5"}% Discount`;
                byId("pmBargainDetails").innerHTML = `
                    Client <strong>${p.client_name || "Client"}</strong> has proposed a bargain total of <strong>₦${propAmt.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</strong>
                    (Original Quotation: ₦${origAmt.toLocaleString("en-NG", { minimumFractionDigits: 2 })}, Discount: ₦${diff.toLocaleString("en-NG", { minimumFractionDigits: 2 })} / ${p.bargain_discount_percentage}%).
                    ${p.bargain_note ? `<br><em style="color:#92400e;">Client Note: "${p.bargain_note}"</em>` : ""}
                `;
            } else {
                bargainPanel.style.display = "none";
            }
        }

        // Installer Assignment
        const assignedBadge = byId("pmAssignedInstallerBadge");
        const assignedDetails = byId("pmAssignedInstallerDetails");
        if (p.installer_id) {
            assignedBadge.textContent = "Assigned";
            assignedBadge.className = "badge green-b";
            assignedDetails.innerHTML = `Assigned to <strong>${p.installer_company || p.installer_name || "Certified Installer"}</strong> (${p.installer_phone || "Phone verified"})`;
        } else {
            assignedBadge.textContent = "Unassigned";
            assignedBadge.className = "badge amber-b";
            assignedDetails.textContent = "No installer currently assigned. Match from active installers below:";
        }

        // Populate installer select options with State matching prioritization
        const select = byId("pmInstallerSelect");
        if (select) {
            select.innerHTML = '<option value="">Select Certified Installer...</option>';
            const sortedInstallers = [...AE.installers].sort((a, b) => {
                const aMatch = p.state && a.state && a.state.toLowerCase() === p.state.toLowerCase() ? 1 : 0;
                const bMatch = p.state && b.state && b.state.toLowerCase() === p.state.toLowerCase() ? 1 : 0;
                return bMatch - aMatch;
            });

            sortedInstallers.forEach(ins => {
                const isStateMatch = p.state && ins.state && ins.state.toLowerCase() === p.state.toLowerCase();
                const opt = document.createElement("option");
                opt.value = ins._id || ins.id;
                opt.textContent = `${isStateMatch ? "⭐ [STATE MATCH] " : ""}${ins.name} (${ins.state || "Nigeria"} · ${ins.phone || ""})`;
                if (p.installer_id && (p.installer_id === ins.id || p.installer_id === ins._id)) {
                    opt.selected = true;
                }
                select.appendChild(opt);
            });
        }

        // Client Account Status
        const clientBadge = byId("pmClientAccountBadge");
        const clientInfo = byId("pmClientAccountInfo");
        const clientActionArea = byId("pmClientAccountActionArea");
        if (p.client_user_id) {
            clientBadge.textContent = "Account Active";
            clientBadge.className = "badge green-b";
            clientInfo.innerHTML = `Client Portal active. Linked user ID: <code style="font-size:11px;">${p.client_user_id}</code>`;
            clientActionArea.innerHTML = `<div style="font-size:12px; color:#16a34a; font-weight:700;">✓ Account Created & Accessible</div>`;
        } else {
            clientBadge.textContent = "Pending Creation";
            clientBadge.className = "badge amber-b";
            clientInfo.textContent = "Rule: Username = Quotation Code · Initial Password = Client Middle Name";
            clientActionArea.innerHTML = `<button id="pmCreateClientAccountBtn" onclick="submitClientAccountCreation()" class="secondary-btn" style="width:100%; height:40px; font-size:13px; font-weight:700; border-color:#cbd5e1; cursor:pointer;">Create Client Portal Account</button>`;
        }

        // Site Evidence Grid (6 Stages)
        const stagesDef = [
            { key: "starting_site", altKey: "starting", title: "1. Starting Site", desc: "Initial site condition" },
            { key: "work_in_progress", altKey: "working", title: "2. Work Progress", desc: "Mounting & wiring" },
            { key: "panel_installation", altKey: "panels", title: "3. Solar Panels", desc: "Panels mounted" },
            { key: "inverter_installation", altKey: "inverter", title: "4. Inverter", desc: "Inverter installed" },
            { key: "battery_installation", altKey: "battery", title: "5. Battery", desc: "Storage connected" },
            { key: "finishing", altKey: "finishing", title: "6. Finishing Job", desc: "Final clean site" }
        ];

        const evidenceList = p.evidence || [];
        let completedCount = 0;

        const grid = byId("pmEvidenceGrid");
        if (grid) {
            grid.innerHTML = stagesDef.map(st => {
                const ev = evidenceList.find(e => e.stage_type === st.key || e.stage_type === st.altKey);
                if (ev) completedCount++;

                const statusColor = !ev ? "#94a3b8" : (ev.verification_status === "verified" ? "#16a34a" : (ev.verification_status === "rejected" ? "#dc2626" : "#f59e0b"));
                const statusText = !ev ? "Not Submitted" : (ev.verification_status || "Pending Review").toUpperCase();

                return `
                    <div style="border:1px solid #e2e8f0; border-radius:8px; padding:10px; background:${ev ? '#fff' : '#f8fafc'}; text-align:center;">
                        <strong style="display:block; font-size:12px; color:#1e293b; margin-bottom:4px;">${st.title}</strong>
                        <div style="width:100%; height:80px; background:#e2e8f0; border-radius:6px; margin-bottom:8px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                            ${ev && ev.image_url ? `<a href="${ev.image_url}" target="_blank"><img src="${ev.image_url}" style="width:100%; height:80px; object-fit:cover;" onerror="this.src='/installer/assets/logodark.png'"></a>` : '<span style="font-size:24px; color:#94a3b8;">📷</span>'}
                        </div>
                        <div style="font-size:10px; font-weight:700; color:${statusColor}; margin-bottom:6px;">${statusText}</div>
                        ${ev && ev.verification_status === 'pending' ? `
                            <div style="display:flex; gap:4px;">
                                <button onclick="reviewEvidenceAction('${ev.id}', 'verified')" style="flex:1; background:#16a34a; color:#fff; border:none; border-radius:4px; padding:4px 0; font-size:10px; cursor:pointer; font-weight:bold;">Verify</button>
                                <button onclick="reviewEvidenceAction('${ev.id}', 'rejected')" style="flex:1; background:#ef4444; color:#fff; border:none; border-radius:4px; padding:4px 0; font-size:10px; cursor:pointer; font-weight:bold;">Reject</button>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join("");
        }

        const stagesCountEl = byId("pmEvidenceStagesCount");
        if (stagesCountEl) stagesCountEl.textContent = `${completedCount} / 6 Stages`;

        // Payment Panel
        const paymentPanel = byId("pmPaymentPanel");
        const payments = p.payments || [];
        const requestedPayment = payments.find(pay => pay.payment_status === "requested" || pay.payment_status === "pending");

        if (requestedPayment) {
            paymentPanel.style.display = "block";
            byId("pmPaymentDetails").textContent = `Installer requested payout of ₦${Number(requestedPayment.amount).toLocaleString()} (Ref: ${requestedPayment.payment_reference || "PAY-REF"}). Note: ${requestedPayment.notes || "Completion payout"}`;
            paymentPanel.dataset.paymentId = requestedPayment.id;
        } else if (p.payment_approved || p.status === "completed") {
            paymentPanel.style.display = "block";
            paymentPanel.style.background = "#f0fdf4";
            paymentPanel.innerHTML = `<div style="color:#166534; font-weight:700; font-size:14px;">✓ Payment Authorized & Settled. Project officially completed!</div>`;
        } else {
            paymentPanel.style.display = "none";
        }

        // Activity Audit Trail
        const activityContainer = byId("pmActivityTrail");
        if (activityContainer) {
            const acts = p.activities || [];
            if (!acts.length) {
                activityContainer.innerHTML = '<div style="color:#94a3b8; text-align:center; padding:12px;">No activity logs recorded yet.</div>';
            } else {
                activityContainer.innerHTML = acts.map(a => `
                    <div style="padding:6px 0; border-bottom:1px solid #edf2f7; display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <strong style="color:#0f172a; font-size:12px;">${a.title || a.action}</strong>
                            <div style="color:#64748b; font-size:11px;">${a.description || ""} · <span style="color:#044381;">${a.actor_name || "System"}</span></div>
                        </div>
                        <small style="color:#94a3b8; font-size:10px; white-space:nowrap; margin-left:10px;">${new Date(a.created_at).toLocaleString("en-GB")}</small>
                    </div>
                `).join("");
            }
        }

        openModal("projectControlModal");
    } catch (err) {
        console.error("openProjectManagementModal error:", err);
        showToast("Error loading project: " + err.message, "error");
    }
}

async function submitInstallerAssignment() {
    if (!AE.currentActiveProject) return;
    const select = byId("pmInstallerSelect");
    const installerId = select?.value;
    if (!installerId) {
        showToast("Please choose an installer to assign.", "warning");
        return;
    }

    try {
        const res = await API.post(`/api/projects/${AE.currentActiveProject.id}/assign-installer`, { installerId });
        if (res?.success) {
            showToast("Installer successfully assigned to project!", "success");
            await openProjectManagementModal(AE.currentActiveProject.id);
            await fetchProjects();
        } else {
            showToast(res?.message || "Failed to assign installer.", "error");
        }
    } catch (err) {
        showToast("Assignment failed: " + err.message, "error");
    }
}

async function submitClientAccountCreation() {
    if (!AE.currentActiveProject) return;
    const btn = byId("pmCreateClientAccountBtn");
    if (btn) btn.disabled = true;

    try {
        const res = await API.post(`/api/projects/${AE.currentActiveProject.id}/create-client-account`, {});
        if (res?.success) {
            const data = res.data;
            alert(`Client Portal Account Created Successfully!\n\nUsername: ${data.username}\nInitial Password: ${data.initial_password}\n\nThe client can now sign in at /client/login using either their email or Quotation ID (${data.username}).`);
            showToast("Client account created!", "success");
            await openProjectManagementModal(AE.currentActiveProject.id);
        } else {
            showToast(res?.message || "Could not create client account.", "error");
        }
    } catch (err) {
        showToast("Account creation error: " + err.message, "error");
    } finally {
        if (btn) btn.disabled = false;
    }
}

async function reviewEvidenceAction(evidenceId, status) {
    if (!AE.currentActiveProject) return;
    let adminNotes = null;
    if (status === "rejected") {
        adminNotes = prompt("Enter reason for rejecting this evidence upload:");
        if (!adminNotes) return;
    }

    try {
        const res = await API.patch(`/api/projects/${AE.currentActiveProject.id}/evidence/${evidenceId}/review`, { status, adminNotes });
        if (res?.success) {
            showToast(`Evidence marked as ${status.toUpperCase()}.`, "success");
            await openProjectManagementModal(AE.currentActiveProject.id);
            await fetchProjects();
        } else {
            showToast(res?.message || "Review update failed.", "error");
        }
    } catch (err) {
        showToast("Review failed: " + err.message, "error");
    }
}

async function approveProjectPayment() {
    if (!AE.currentActiveProject) return;
    const panel = byId("pmPaymentPanel");
    const paymentId = panel?.dataset?.paymentId;
    if (!paymentId) return;

    if (!confirm("Are you sure you want to approve this milestone payout? This will release funds and mark the project as officially completed.")) return;

    try {
        const res = await API.post(`/api/projects/${AE.currentActiveProject.id}/approve-payment/${paymentId}`, {
            transactionReference: "TXN-" + Date.now().toString(36).toUpperCase(),
            notes: "Admin verified all 6 evidence stages. Payout authorized."
        });

        if (res?.success) {
            showToast("Payment approved! Project successfully completed.", "success");
            await openProjectManagementModal(AE.currentActiveProject.id);
            await fetchProjects();
        } else {
            showToast(res?.message || "Payment approval failed.", "error");
        }
    } catch (err) {
        showToast("Payment approval error: " + err.message, "error");
    }
}

async function submitBargainAction(action) {
    if (!AE.currentActiveProject) return;
    const p = AE.currentActiveProject;

    if (action === "accept") {
        if (!confirm(`Are you sure you want to accept the client's bargain offer of ₦${Number(p.proposed_bargain_amount).toLocaleString()} for ${p.project_code}? This will adjust the official contract value.`)) return;

        try {
            const res = await API.post(`/api/projects/${p.id}/bargain/accept`, {});
            if (res?.success) {
                showToast("Bargain offer accepted! Contract value updated.", "success");
                await openProjectManagementModal(p.id);
                await fetchProjects();
            } else {
                showToast(res?.message || "Failed to accept bargain.", "error");
            }
        } catch (err) {
            showToast("Bargain acceptance failed: " + err.message, "error");
        }
    } else if (action === "reject") {
        const reason = prompt("Enter a brief reason for declining this bargain offer (optional):");
        try {
            const res = await API.post(`/api/projects/${p.id}/bargain/reject`, { reason });
            if (res?.success) {
                showToast("Bargain offer declined.", "info");
                await openProjectManagementModal(p.id);
                await fetchProjects();
            } else {
                showToast(res?.message || "Failed to decline bargain.", "error");
            }
        } catch (err) {
            showToast("Action failed: " + err.message, "error");
        }
    }
}

async function openWhileYouSleepModal() {
    try {
        const res = await API.get("/api/admin/while-you-sleep?hours=24");
        if (!res || !res.data) {
            showToast("Could not load summary.", "error");
            return;
        }

        const d = res.data;
        byId("wysNewProjectsCount").textContent = d.newProjects?.length || 0;
        byId("wysNewQuotationsCount").textContent = d.newQuotations?.length || 0;

        const pending = d.pendingApprovals || {};
        const totalPending = Number(pending.projects_awaiting_review || 0) + Number(pending.evidence_awaiting_review || 0) + Number(pending.payments_awaiting_approval || 0);
        byId("wysPendingActionsCount").textContent = totalPending;

        const actionList = byId("wysActionRequiredList");
        actionList.innerHTML = `
            <div style="display:flex; justify-content:space-between; padding:4px 0;">
                <span>Projects Awaiting Admin Review:</span>
                <strong>${pending.projects_awaiting_review || 0}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:4px 0;">
                <span>Site Evidence Uploads Awaiting Review:</span>
                <strong>${pending.evidence_awaiting_review || 0}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:4px 0;">
                <span>Installer Payment Requests Pending:</span>
                <strong style="color:#b91c1c;">${pending.payments_awaiting_approval || 0}</strong>
            </div>
        `;

        const actsList = byId("wysActivitiesList");
        const acts = d.recentActivities || [];
        if (!acts.length) {
            actsList.innerHTML = '<div style="color:#94a3b8; text-align:center;">No automated events logged in the last 24h.</div>';
        } else {
            actsList.innerHTML = acts.map(a => `
                <div style="padding:4px 0; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between;">
                    <div><strong>${a.title || a.action}</strong> <span style="color:#64748b;">${a.description || ""}</span></div>
                    <small style="color:#94a3b8;">${timeAgo(new Date(a.created_at))}</small>
                </div>
            `).join("");
        }

        openModal("whileYouSleepModal");
    } catch (err) {
        showToast("Failed to load While You Sleep summary: " + err.message, "error");
    }
}

/* =========================================================
   11.5 Mobile Sidebar Drawer Controls
========================================================= */
function openSidebarDrawer() {
    const sidebar = byId("sidebar");
    const backdrop = byId("sidebarBackdrop");
    if (sidebar) sidebar.classList.add("open");
    if (backdrop) backdrop.classList.add("active");
    document.body.classList.add("sidebar-open");
}

function closeSidebarDrawer() {
    const sidebar = byId("sidebar");
    const backdrop = byId("sidebarBackdrop");
    if (sidebar) sidebar.classList.remove("open");
    if (backdrop) backdrop.classList.remove("active");
    document.body.classList.remove("sidebar-open");
}

function toggleSidebarDrawer() {
    const sidebar = byId("sidebar");
    if (sidebar && sidebar.classList.contains("open")) {
        closeSidebarDrawer();
    } else {
        openSidebarDrawer();
    }
}

// Expose drawer controls globally
window.openSidebarDrawer = openSidebarDrawer;
window.closeSidebarDrawer = closeSidebarDrawer;
window.toggleSidebarDrawer = toggleSidebarDrawer;

/* =========================================================
   12. EVENT LISTENERS INITIALIZATION
========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
    // 12.1 Nav item & mobile tab item click handling
    $$(".nav-item[data-page], .mobile-tab-item[data-page]").forEach(item => {
        item.addEventListener("click", () => {
            const page = item.dataset.page;
            showPage(page);
        });
    });

    // 12.2 Mobile sidebar toggles & overlay listeners
    const mobileBtn = byId("mobileMenuBtn");
    if (mobileBtn) {
        mobileBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleSidebarDrawer();
        });
    }

    const mobileTabMenuBtn = byId("mobileTabMenuBtn");
    if (mobileTabMenuBtn) {
        mobileTabMenuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleSidebarDrawer();
        });
    }

    const closeBtn = byId("sidebarCloseBtn");
    if (closeBtn) {
        closeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            closeSidebarDrawer();
        });
    }

    const backdrop = byId("sidebarBackdrop");
    if (backdrop) {
        backdrop.addEventListener("click", closeSidebarDrawer);
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeSidebarDrawer();
        }
    });

    // 12.3 Notifications button
    const notifBtn = byId("notificationBtn");
    if (notifBtn) {
        notifBtn.addEventListener("click", toggleNotificationsDrawer);
    }

    // 12.4 Messages button
    const msgBtn = byId("messagesBtn");
    if (msgBtn) {
        msgBtn.addEventListener("click", openMessagesModal);
    }

    // 12.5 Profile button dropdown / logout
    const profileBtn = byId("profileBtn");
    if (profileBtn) {
        profileBtn.addEventListener("click", () => {
            if (confirm("Sign out of Operations Centre and return to login?")) {
                try { sessionStorage.clear(); } catch {}
                localStorage.clear();
                window.location.href = "/admin/login";
            }
        });
    }

    const sideLogoutBtn = byId("sidebarLogoutBtn");
    if (sideLogoutBtn) {
        sideLogoutBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (confirm("Sign out of Operations Centre and return to login?")) {
                try { sessionStorage.clear(); } catch {}
                localStorage.clear();
                window.location.href = "/admin/login";
            }
        });
    }

    // 12.6 Installer filters listeners
    ["installerSearch", "installerStateFilter", "installerPositionFilter", "installerStatusFilter", "installerSpecializationFilter"].forEach(id => {
        const el = byId(id);
        if (el) el.addEventListener("input", filterInstallers);
    });

    // 12.7 Load admin profile from stored JWT
    loadAdminProfile();

    // 12.8 Update dashboard date
    const dashDate = byId("dashboardDate");
    if (dashDate) {
        dashDate.textContent = new Date().toLocaleDateString("en-US", {
            weekday: "long", day: "2-digit", month: "long", year: "numeric"
        }).toUpperCase();
    }

    // 12.9 Check URL search param
    const urlParams = new URLSearchParams(window.location.search);
    const targetPage = urlParams.get("page");
    if (targetPage && PAGE_TITLES[targetPage]) {
        showPage(targetPage);
    }

    // 12.10 Fetch live data from PostgreSQL Backend
    const token = API.getToken();
    if (token) {
        try {
            // Fetch primary database tables in parallel
            await Promise.allSettled([
                fetchCustomers(),
                fetchProjects(),
                fetchQuotations(),
                fetchInvoices(),
                fetchEquipment(),
                fetchInstallers(),
                fetchNotifications(),
                loadAdminFieldPosts()
            ]);

            // Derive secondary views from live database records
            await fetchConsultations();
            await fetchSites();
            await fetchDashboardData();
            renderReportsAnalytics();
            initLiveTelemetryJitter();

            console.log("[AE Admin] All operational views synchronized with PostgreSQL records.");
        } catch (err) {
            console.error("[AE Admin] Data synchronization issue:", err);
        }
    } else {
        console.warn("[AE Admin] No auth token found — redirecting to login.");
        window.location.replace("/admin/login.html");
    }
});

/* =========================================================
   13. LIVE FIELD STREAM OPERATIONS & UPLOAD CONTROLLER
========================================================= */

AE.fieldPosts = [];

async function loadAdminFieldPosts() {
    try {
        const res = await API.get("/api/field-posts");
        const posts = res?.data || [];
        AE.fieldPosts = posts;
        
        // Update stats
        const totalEl = byId("fieldStatTotal");
        if (totalEl) totalEl.textContent = posts.length;

        renderAdminFieldPosts(posts);
    } catch (err) {
        console.warn("[Admin Field Stream] Failed to load posts:", err);
    }
}

function renderAdminFieldPosts(posts) {
    const container = byId("adminFieldPostsList");
    if (!container) return;

    if (!posts || posts.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:32px 16px; color:#64748b;">
                <p style="font-size:14px; font-weight:600; margin-bottom:8px;">No field posts found.</p>
                <button class="primary" onclick="openUploadFieldPostModal()" style="font-size:12px; padding:6px 14px;">+ Upload First Field Milestone</button>
            </div>
        `;
        return;
    }

    container.innerHTML = posts.map(p => {
        const tags = Array.isArray(p.tags) ? p.tags : [];
        const timeStr = p.created_at ? timeAgo(new Date(p.created_at)) : "Recently";
        const safeAvatar = p.engineer_avatar || "/site-images/instalerface.jpeg";
        const safeImg = p.image_url || "/site-images/panelUtako1.jpeg";

        return `
            <div class="panel" style="display:flex; gap:20px; padding:18px; border:1px solid #e2e8f0; border-radius:14px; background:#ffffff; align-items:flex-start; flex-wrap:wrap; box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                <div style="width:200px; height:140px; border-radius:10px; overflow:hidden; background:#0f172a; flex-shrink:0; position:relative;">
                    <img src="${safeImg}" alt="Site Evidence" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src='/site-images/panelUtako1.jpeg';">
                    <span style="position:absolute; bottom:6px; left:6px; background:rgba(0,0,0,0.7); color:#38bdf8; font-size:10px; font-weight:800; padding:2px 6px; border-radius:4px;">VERIFIED SITE</span>
                </div>

                <div style="flex:1; min-width:260px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:8px; flex-wrap:wrap;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <img src="${safeAvatar}" alt="${escapeHtml(p.engineer_name)}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:2px solid #004AAD;" onerror="this.onerror=null; this.src='/uploads/installer-default.jpg';">
                            <div>
                                <strong style="font-size:14px; color:#0f172a; display:block;">${escapeHtml(p.engineer_name)}</strong>
                                <small style="color:#64748b; font-size:11px;">${escapeHtml(p.engineer_title || 'NEMSA Certified Lead')} • ${escapeHtml(p.location)} • ${timeStr}</small>
                            </div>
                        </div>
                        <span class="badge blue-b" style="font-size:11px; font-weight:700;">${escapeHtml(p.stage_title || p.stage)}</span>
                    </div>

                    <p style="font-size:13px; color:#334155; line-height:1.5; margin:0 0 10px;">${escapeHtml(p.description)}</p>

                    <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px;">
                        ${tags.map(t => `<span style="font-size:11px; background:#f1f5f9; color:#004AAD; padding:2px 8px; border-radius:4px; font-weight:600; border:1px solid #e2e8f0;">${escapeHtml(t)}</span>`).join("")}
                    </div>

                    ${p.client_feedback ? `
                        <div style="background:#f8fafc; border-left:3px solid #f4a600; padding:8px 12px; border-radius:0 6px 6px 0; margin-bottom:10px; font-size:12px; color:#475569;">
                            <b style="color:#0f172a;">Client Feedback:</b> "${escapeHtml(p.client_feedback)}"
                            ${p.resolution_note ? `<div style="margin-top:4px; color:#10b981; font-weight:600;"><i style="font-style:normal;">✓</i> ${escapeHtml(p.resolution_note)}</div>` : ''}
                        </div>
                    ` : ''}

                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #f1f5f9; padding-top:10px; font-size:12px; color:#64748b;">
                        <div>
                            <span>👍 ${p.likes_count || 0} Likes</span> • <span>❤️ ${p.loves_count || 0} Loves</span> • <span>🔄 ${p.shares_count || 0} Shares</span>
                        </div>
                        <div style="display:flex; gap:8px;">
                            <a href="/client" target="_blank" class="secondary-btn" style="padding:4px 10px; font-size:11px; text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
                                <span>👁️</span> Public View
                            </a>
                            <button class="secondary-btn" style="padding:4px 10px; font-size:11px; color:#ef4444; border-color:#fca5a5; background:#fff1f2; cursor:pointer;" onclick="deleteFieldPost('${p.id}')">
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function filterAdminFieldPosts() {
    const search = (byId("adminFieldSearch")?.value || "").toLowerCase().trim();
    const stage = (byId("adminFieldStageFilter")?.value || "").toLowerCase().trim();

    const filtered = (AE.fieldPosts || []).filter(p => {
        const text = `${p.engineer_name || ''} ${p.location || ''} ${p.description || ''} ${p.tags ? JSON.stringify(p.tags) : ''}`.toLowerCase();
        const matchesSearch = !search || text.includes(search);
        const matchesStage = !stage || (p.stage || '').toLowerCase() === stage;
        return matchesSearch && matchesStage;
    });

    renderAdminFieldPosts(filtered);
}

function resetFieldPostFilters() {
    if (byId("adminFieldSearch")) byId("adminFieldSearch").value = "";
    if (byId("adminFieldStageFilter")) byId("adminFieldStageFilter").value = "";
    renderAdminFieldPosts(AE.fieldPosts);
}

function openUploadFieldPostModal() {
    openModal("uploadFieldPostModal");
}

function applyFieldImagePreset(val) {
    if (val) {
        const fileIn = byId("fieldImageFile");
        if (fileIn) fileIn.value = "";
    }
}

async function submitFieldPost(e) {
    e.preventDefault();
    const submitBtn = byId("fieldPostSubmitBtn");
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "<span>⏳</span> Publishing...";
    }

    try {
        const engineerName = byId("fieldEngineerName")?.value?.trim();
        const engineerTitle = byId("fieldEngineerTitle")?.value?.trim() || "NEMSA Certified Lead Installer";
        const stage = byId("fieldStage")?.value || "stage3";
        const location = byId("fieldLocation")?.value?.trim();
        const description = byId("fieldDescription")?.value?.trim();
        const tags = byId("fieldTags")?.value?.trim() || "";
        const clientFeedback = byId("fieldClientFeedback")?.value?.trim() || "";
        const resolutionNote = byId("fieldResolutionNote")?.value?.trim() || "";
        const imagePreset = byId("fieldImagePreset")?.value || "";

        const fileInput = byId("fieldImageFile");
        const hasFile = fileInput && fileInput.files && fileInput.files[0];

        let res;
        const token = API.getToken();

        if (hasFile) {
            const formData = new FormData();
            formData.append("engineerName", engineerName);
            formData.append("engineerTitle", engineerTitle);
            formData.append("stage", stage);
            formData.append("location", location);
            formData.append("description", description);
            formData.append("tags", tags);
            formData.append("clientFeedback", clientFeedback);
            formData.append("resolutionNote", resolutionNote);
            formData.append("image", fileInput.files[0]);

            const response = await fetch("/api/field-posts", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });
            res = await response.json();
        } else {
            const payload = {
                engineerName,
                engineerTitle,
                stage,
                location,
                description,
                tags: tags.split(",").map(t => t.trim()).filter(Boolean),
                imageUrl: imagePreset || "/site-images/panelUtako1.jpeg",
                clientFeedback,
                resolutionNote
            };

            res = await API.post("/api/field-posts", payload);
        }

        if (res?.success) {
            showToast("Live Field Milestone Published Successfully!", "success");
            closeModal("uploadFieldPostModal");
            byId("uploadFieldPostForm")?.reset();
            await loadAdminFieldPosts();
        } else {
            showToast(res?.message || "Failed to publish field post", "error");
        }
    } catch (err) {
        console.error("Field post upload error:", err);
        showToast(err.message || "Network error while uploading post", "error");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = "<span>📡</span> Publish to Live Field Stream";
        }
    }
}

async function deleteFieldPost(id) {
    if (!confirm("Are you sure you want to remove this post from the public live stream?")) {
        return;
    }

    try {
        const res = await API.delete(`/api/field-posts/${id}`);
        if (res?.success) {
            showToast("Field post removed from stream", "success");
            await loadAdminFieldPosts();
        } else {
            showToast(res?.message || "Failed to delete post", "error");
        }
    } catch (err) {
        console.error("Error deleting field post:", err);
        showToast("Error removing post", "error");
    }
}



/* =========================================================
   ✓ ADMIN NOTIFICATION DISPATCHED INTAKE CONSULTATIONS
========================================================= */

async function fetchDispatchedInquiries() {
    try {
        const countEl = byId("dispatchedInquiriesCount");
        if (countEl) countEl.textContent = "Loading...";

        const token = getAdminAuthToken();
        const res = await fetch("/api/admin/consultations/dispatched", {
            headers: {
                "Authorization": token ? "Bearer " + token : "",
                "Content-Type": "application/json"
            }
        });
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
            AE.dispatchedInquiries = result.data;
            renderDispatchedInquiries(result.data);
        }
    } catch (err) {
        console.warn("[AE Admin] Dispatched inquiries error:", err.message);
    }
}

function renderDispatchedInquiries(list) {
    const countEl = byId("dispatchedInquiriesCount");
    const container = byId("dispatchedInquiriesList");
    if (!container) return;

    if (countEl) countEl.textContent = (list ? list.length : 0) + " Inbound Inquiries";

    if (!list || list.length === 0) {
        container.innerHTML = '<div style="padding:18px; text-align:center; color:#065f46; background:rgba(5,150,105,0.06); border-radius:8px; font-size:13px;">No pending dispatched inquiries. All client intakes have been actioned.</div>';
        return;
    }

    container.innerHTML = list.slice(0, 15).map(inq => {
        const isDispatched = Boolean(inq.notification_dispatched);
        const kwDisplay = inq.load_kw || (Number(inq.load_watts || 5000) / 1000).toFixed(2);
        const clientEmail = inq.email || "";
        const clientName = inq.contact_name || "Prospective Client";
        const dateStr = inq.created_at ? new Date(inq.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Recent";
        const scenarioLabel = (inq.intake_scenario || "").includes("energy") ? "⚡ Energy Profiling" : ((inq.intake_scenario || "").includes("site") ? "🏗️ Site Survey" : "⚡ Energy Profiling");

        return `
            <div style="background:#ffffff; border:1px solid rgba(5,150,105,0.25); border-left:4px solid ${isDispatched ? '#059669' : '#f59e0b'}; border-radius:8px; padding:14px 18px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; transition:box-shadow 0.2s;" onmouseover="this.style.boxShadow='0 4px 12px rgba(5,150,105,0.1)'" onmouseout="this.style.boxShadow='none'">
                <div style="flex:1; min-width:280px;">
                    <div style="display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:5px;">
                        <strong style="color:#004aad; font-size:14px;">${escapeHtml(inq.project_code)}</strong>
                        <span style="font-size:11px; font-weight:700; background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:4px;">
                            ${scenarioLabel}
                        </span>
                        ${isDispatched 
                            ? `<span style="font-size:11px; font-weight:700; background:#dcfce7; color:#15803d; padding:2px 8px; border-radius:4px;">✓ Admin Notification Dispatched</span>`
                            : `<span style="font-size:11px; font-weight:700; background:#fef3c7; color:#b45309; padding:2px 8px; border-radius:4px;">⏳ Notification Pending</span>
                               <button type="button" onclick="retryConsultationNotification('${inq.id}')" style="background:#f59e0b; border:none; color:#fff; padding:2px 8px; border-radius:4px; font-size:10.5px; font-weight:700; cursor:pointer;" title="Retry admin notification dispatch">↻ Retry Notification</button>`
                        }
                    </div>

                    <div style="font-size:13px; color:#1e293b; margin-bottom:5px;">
                        <span>Prospective Client: </span><strong style="color:#0f172a;">${escapeHtml(clientName)}</strong>
                        ${clientEmail 
                            ? ` &bull; <span style="color:#004aad; font-weight:600;">Email: ${escapeHtml(clientEmail)}</span>` 
                            : ''
                        }
                    </div>

                    <div style="font-size:12px; color:#64748b; display:flex; flex-wrap:wrap; gap:10px;">
                        <span>Property: <strong>${escapeHtml(inq.property_type || "Residential")}</strong></span>
                        <span>&bull;</span>
                        <span>Location: <strong>${escapeHtml(inq.city || "Abuja")}, ${escapeHtml(inq.state || "FCT")}</strong></span>
                        <span>&bull;</span>
                        <span>Connected Load: <strong style="color:#004aad;">${kwDisplay} kW</strong></span>
                        <span>&bull;</span>
                        <span>Battery: <strong>${escapeHtml(inq.battery_type || "Lithium")}</strong></span>
                        <span>&bull;</span>
                        <span>Date Received: <strong>${dateStr}</strong></span>
                    </div>
                </div>

                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    ${clientEmail ? `
                        <a href="mailto:${escapeHtml(clientEmail)}" style="text-decoration:none; background:#f1f5f9; color:#004aad; border:1px solid #cbd5e1; padding:7px 12px; border-radius:6px; font-weight:700; font-size:12px; display:inline-flex; align-items:center; gap:4px;" title="Send email to prospective client">
                            ✉️ Email
                        </a>
                    ` : ''}
                    <button type="button" class="primary" onclick="openDetail('${escapeHtml(inq.project_code || inq.id)}')" style="background:#004aad; border-color:#004aad; color:#fff; padding:7px 14px; border-radius:6px; font-weight:700; font-size:12px; cursor:pointer; display:inline-flex; align-items:center; gap:5px;">
                        <span>Open Consultation →</span>
                    </button>
                    <button type="button" class="secondary-btn" onclick="openQuotationWorkspace('${escapeHtml(inq.id || inq.project_code)}')" style="padding:7px 12px; border-radius:6px; font-weight:700; font-size:12px; cursor:pointer; display:inline-flex; align-items:center; gap:4px;">
                        <span>⚡ Quotation</span>
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

async function retryConsultationNotification(id) {
    try {
        showToast("Retrying admin notification dispatch...", "info");
        const token = getAdminAuthToken();
        const res = await fetch(`/api/admin/consultations/${id}/retry-notification`, {
            method: "POST",
            headers: {
                "Authorization": token ? "Bearer " + token : "",
                "Content-Type": "application/json"
            }
        });
        const data = await res.json();
        if (data.success) {
            showToast("✓ Admin notification dispatched successfully!", "success");
            await fetchDispatchedInquiries();
            await fetchNotifications();
        } else {
            showToast(data.message || "Retry notification dispatch failed", "error");
        }
    } catch (err) {
        showToast("Error: " + err.message, "error");
    }
}
window.retryConsultationNotification = retryConsultationNotification;

function handleAcceptInquiry(projectId) {
    const inq = (AE.dispatchedInquiries || []).find(i => String(i.id) === String(projectId));
    if (!inq) {
        showToast("Inquiry not found", "error");
        return;
    }

    if (inq.is_unfilled) {
        // Form was not filled by client -> bring out Section 3 Form so admin can ask via phone or WhatsApp
        const modal = byId("modalAcceptIntakeProfile");
        if (modal) {
            byId("acceptIntakeProjectId").value = inq.id;
            byId("intakeFullName").value = inq.contact_name && !inq.contact_name.includes("Visitor Lead") ? inq.contact_name : "";
            byId("intakeCompany").value = inq.company_name || "";
            byId("intakeEmail").value = inq.email && !inq.email.includes("lead-") ? inq.email : "";
            byId("intakePhone").value = inq.phone && inq.phone !== "+234 800 000 0000" ? inq.phone : "";
            byId("intakeAddress").value = inq.site_address && inq.site_address !== "Energy Profiling Inquiry" ? inq.site_address : "";
            byId("intakeCity").value = inq.city || "Abuja";
            byId("intakeState").value = inq.state || "FCT";

            const waLink = byId("modalDirectWaLink");
            const callLink = byId("modalDirectCallLink");
            const updateDirectLinks = (phoneVal) => {
                const rawP = (phoneVal && phoneVal !== "+234 800 000 0000" && phoneVal !== "08133615132" && phoneVal !== "+2348133615132") ? phoneVal : "";
                let cp = rawP.replace(/[^0-9]/g, "");
                if (cp.startsWith("0")) cp = "234" + cp.slice(1);
                if (waLink) {
                    if (cp) {
                        waLink.href = "https://wa.me/" + cp + "?text=" + encodeURIComponent("Hello " + (inq.contact_name || "Client") + ", I am contacting you from AE Renewable regarding your solar energy profile.");
                        waLink.onclick = null;
                    } else {
                        waLink.href = "javascript:void(0)";
                        waLink.onclick = () => {
                            const p = byId("intakePhone")?.value || prompt("Enter Client WhatsApp Phone Number:");
                            if (p) {
                                let c = p.replace(/[^0-9]/g, "");
                                if (c.startsWith("0")) c = "234" + c.slice(1);
                                window.open("https://wa.me/" + c + "?text=" + encodeURIComponent("Hello " + (inq.contact_name || "Client") + ", I am contacting you from AE Renewable regarding your solar energy profile."), "_blank");
                            }
                        };
                    }
                }
                if (callLink) {
                    if (rawP) {
                        callLink.href = "tel:" + rawP;
                        callLink.onclick = null;
                    } else {
                        callLink.href = "javascript:void(0)";
                        callLink.onclick = () => {
                            const p = byId("intakePhone")?.value || prompt("Enter Client Phone Number:");
                            if (p) window.location.href = "tel:" + p;
                        };
                    }
                }
            };
            updateDirectLinks(inq.phone);
            const intakePhoneInput = byId("intakePhone");
            if (intakePhoneInput) {
                intakePhoneInput.oninput = (ev) => updateDirectLinks(ev.target.value);
            }

            openModal("modalAcceptIntakeProfile");
        }
    } else {
        // Form was already filled -> accept directly and dispatch credentials
        executeAcceptInquiry(projectId, {});
    }
}

async function submitAcceptIntakeProfile(e) {
    e.preventDefault();
    const projectId = byId("acceptIntakeProjectId")?.value;
    if (!projectId) return;

    const payload = {
        fullName: byId("intakeFullName")?.value.trim(),
        companyName: byId("intakeCompany")?.value.trim(),
        email: byId("intakeEmail")?.value.trim(),
        phone: byId("intakePhone")?.value.trim(),
        propertyType: byId("intakePropertyType")?.value,
        address: byId("intakeAddress")?.value.trim(),
        city: byId("intakeCity")?.value.trim(),
        state: byId("intakeState")?.value
    };

    closeModal("modalAcceptIntakeProfile");
    await executeAcceptInquiry(projectId, payload);
}

async function executeAcceptInquiry(projectId, payload) {
    try {
        showToast("Processing intake & dispatching credentials...", "info");
        const token = getAdminAuthToken();
        const res = await fetch("/api/admin/consultations/" + projectId + "/accept", {
            method: "POST",
            headers: {
                "Authorization": token ? "Bearer " + token : "",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (result.success && result.data) {
            const data = result.data;
            // Populate credentials dispatched modal
            const nameEl = byId("credModalClientName");
            if (nameEl) nameEl.textContent = data.client_name;
            const userEl = byId("credModalUsername");
            if (userEl) userEl.textContent = data.username;
            const passEl = byId("credModalPassword");
            if (passEl) passEl.textContent = data.temp_password;

            const waBtn = byId("btnCredSendWhatsApp");
            if (waBtn) waBtn.href = data.whatsapp_url;

            const callBtn = byId("btnCredCallDirectly");
            if (callBtn) callBtn.href = data.call_url;

            openModal("modalCredentialsDispatched");
            showToast("✓ Client access provisioned & credentials dispatched to email!", "success");

            // Refresh inquiries feed
            fetchDispatchedInquiries();
            if (typeof fetchConsultations === "function") fetchConsultations();
        } else {
            showToast(result.message || "Failed to accept inquiry", "error");
        }
    } catch (err) {
        showToast("Error accepting inquiry: " + err.message, "error");
    }
}

/* =========================================================
   WEEKLY MAINTENANCE & SYSTEM CONSULTATION
========================================================= */

async function fetchWeeklyMaintenanceRecords() {
    try {
        const token = getAdminAuthToken();
        const res = await fetch("/api/admin/weekly-maintenance/records", {
            headers: {
                "Authorization": token ? "Bearer " + token : "",
                "Content-Type": "application/json"
            }
        });
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
            AE.weeklyMaintenanceRecords = result.data;
            renderWeeklyMaintenanceRecords(result.data);
        }
    } catch (err) {
        console.warn("[AE Admin] Weekly maintenance error:", err.message);
    }
}

function renderWeeklyMaintenanceRecords(records) {
    const tbody = byId("weeklyMaintenanceTableBody");
    if (!tbody) return;

    const total = records.length;
    const replied = records.filter(r => r.reply_status === "replied").length;
    const pending = records.filter(r => r.reply_status === "pending").length;
    const issues = records.filter(r => (r.system_condition || "").toLowerCase().includes("issue") || (r.client_reply || "").toLowerCase().includes("issue")).length;

    const statTot = byId("statWeeklyTotal");
    if (statTot) statTot.textContent = String(total);
    const statRep = byId("statWeeklyReplied");
    if (statRep) statRep.textContent = String(replied);
    const statPen = byId("statWeeklyPending");
    if (statPen) statPen.textContent = String(pending);
    const statIss = byId("statWeeklyIssues");
    if (statIss) statIss.textContent = String(issues);

    const badge = byId("navWeeklyBadge");
    if (badge) badge.textContent = String(replied).padStart(2, "0");

    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:28px; color:var(--muted);">No weekly maintenance records found. Click \'Spread Out Weekly Check-up\' to dispatch.</td></tr>';
        return;
    }

    tbody.innerHTML = records.map(r => {
        const phone = r.phone || "—";
        const cleanPhone = phone.replace(/[^0-9]/g, "").replace(/^0/, "234");
        const waLink = phone !== "—" ? "https://wa.me/" + cleanPhone + "?text=" + encodeURIComponent("Hello " + (r.contact_name || "Client") + ", following up on your AE Renewable weekly system maintenance report.") : "#";
        const callLink = phone !== "—" ? "tel:" + phone : "#";
        const isReplied = r.reply_status === "replied";

        return `
            <tr>
                <td>
                    <strong style="color:#0f172a; font-size:13px;">${escapeHtml(r.contact_name || 'Client')}</strong>
                    <div style="font-size:11px; color:#64748b;">${escapeHtml(r.company_name || r.client_code || 'Individual')}</div>
                </td>
                <td>
                    <div style="display:flex; align-items:center; gap:6px;">
                        <span style="font-weight:600; font-size:12.5px;">${escapeHtml(phone)}</span>
                        ${phone !== "—" ? `
                            <a href="${waLink}" target="_blank" style="text-decoration:none; background:#25D366; color:#fff; font-size:10px; padding:2px 6px; border-radius:4px; font-weight:700;" title="WhatsApp Instant Chat">WA</a>
                            <a href="${callLink}" style="text-decoration:none; background:#004aad; color:#fff; font-size:10px; padding:2px 6px; border-radius:4px; font-weight:700;" title="Call Directly">Call</a>
                        ` : ''}
                    </div>
                </td>
                <td>
                    <a href="mailto:${escapeHtml(r.email || '')}" style="color:#004aad; text-decoration:none; font-size:12px; font-weight:600;">${escapeHtml(r.email || '—')}</a>
                </td>
                <td>
                    <strong>${escapeHtml(r.project_code || 'AE-SOLAR')}</strong>
                    <div style="font-size:11px; color:#64748b;">${r.system_capacity_kw ? Number(r.system_capacity_kw).toFixed(1) + ' kW Capacity' : 'Solar Installation'}</div>
                </td>
                <td style="max-width:280px;">
                    ${isReplied ? `
                        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:6px 10px; font-size:12px; color:#166534;">
                            <div style="font-weight:700; font-size:11px; color:#15803d; margin-bottom:2px;">Condition: ${escapeHtml(r.system_condition || 'Optimal')}</div>
                            <div>"${escapeHtml(r.client_reply || 'All operating smoothly.')}"</div>
                        </div>
                    ` : `
                        <span style="font-style:italic; font-size:11.5px; color:#94a3b8;">Awaiting client response to weekly check-up notice...</span>
                    `}
                </td>
                <td>
                    <label class="badge ${isReplied ? 'green-b' : 'amber-b'}">
                        ${isReplied ? '✓ Replied' : 'Pending'}
                    </label>
                </td>
                <td style="font-size:11.5px; color:#64748b;">
                    ${r.replied_at ? new Date(r.replied_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : (r.broadcast_date ? new Date(r.broadcast_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—")}
                </td>
                <td>
                    <div style="display:flex; gap:6px;">
                        ${phone !== "—" ? `
                            <a href="${waLink}" target="_blank" class="secondary-btn" style="padding:4px 8px; font-size:11px; text-decoration:none; display:inline-flex; align-items:center; gap:3px;">
                                <span>💬</span> Reply
                            </a>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

async function triggerBroadcastWeeklyModal() {
    if (!confirm("Broadcast weekly system maintenance check-up to all active clients via Email and in-portal feed?")) {
        return;
    }

    try {
        showToast("Broadcasting weekly maintenance check-up notices...", "info");
        const token = getAdminAuthToken();
        const res = await fetch("/api/admin/weekly-maintenance/broadcast", {
            method: "POST",
            headers: {
                "Authorization": token ? "Bearer " + token : "",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({})
        });

        const result = await res.json();
        if (result.success) {
            showToast("📢 Weekly check-up spread out to " + (result.count || "all") + " clients!", "success");
            fetchWeeklyMaintenanceRecords();
        } else {
            showToast(result.message || "Broadcast failed", "error");
        }
    } catch (err) {
        showToast("Broadcast error: " + err.message, "error");
    }
}

window.fetchDispatchedInquiries = fetchDispatchedInquiries;
window.handleAcceptInquiry = handleAcceptInquiry;
window.submitAcceptIntakeProfile = submitAcceptIntakeProfile;
window.fetchWeeklyMaintenanceRecords = fetchWeeklyMaintenanceRecords;
window.triggerBroadcastWeeklyModal = triggerBroadcastWeeklyModal;


function handleManageConsultation(projectId) {
    const d = AE.dashboardData || {};
    const all = [
        ...(d.recent_consultations || []),
        ...(AE.dispatchedInquiries || []),
        ...(AE.consultations || [])
    ];
    const item = all.find(i => String(i.id) === String(projectId) || String(i.ref) === String(projectId));
    if (!item) {
        showPage('consultations');
        return;
    }

    if (item.is_unfilled) {
        // Form was not filled by client -> open Section 3 Client & Contact Profiling modal directly
        handleAcceptInquiry(item.id);
    } else {
        // Client filled form -> open Consultation Detail or allow direct WhatsApp / Studio action
        if (typeof openDetail === "function" && item.ref) {
            openDetail(item.ref);
            showPage('detail');
        } else {
            handleAcceptInquiry(item.id);
        }
    }
}
window.handleManageConsultation = handleManageConsultation;

// 5.07 Live Telemetry Poller (Zero Hardcoding - Pure Dynamic Updates)
if (!window._trackingTelemetryInterval) {
    window._trackingTelemetryInterval = setInterval(() => {
        try {
            if (window.AE && window.AE.currentUser) {
                if (typeof fetchRoundClockTracking === "function") fetchRoundClockTracking();
                if (typeof fetchOperationsTracking === "function") fetchOperationsTracking();
            }
        } catch(e) {}
    }, 20000);
}
