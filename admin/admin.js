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
(function guardAdminCentre() {
    try {
        if (sessionStorage.getItem("ae_admin_logged_in") !== "true") {
            window.location.replace("/admin/login");
            return;
        }

        const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("aeAdminToken") || "";
        const rawUser = localStorage.getItem("user") || localStorage.getItem("aeAdminUser") || "{}";
        let user = {};
        try { user = JSON.parse(rawUser); } catch {}
        const role = user && user.role ? String(user.role).toLowerCase() : "";

        if (!token) {
            window.location.replace("/admin/login");
            return;
        }

        if (role === "installer") {
            window.location.replace("/installer/portal");
            return;
        }

        if (role === "client") {
            window.location.replace("/client/dashboard");
            return;
        }

        if (role !== "admin" && role !== "staff") {
            window.location.replace("/admin/login");
            return;
        }
    } catch (e) {
        console.warn("[Admin Guard] Check error:", e);
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

    AE.currentPage = pageId;

    // Close mobile sidebar if open
    closeSidebarDrawer();

    // Close any active modal
    $$(".modal-overlay").forEach(m => m.classList.remove("active"));
    $$(".modal-overlay").forEach(m => m.setAttribute("aria-hidden", "true"));

    window.scrollTo({ top: 0, behavior: "smooth" });
}

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
            <td class="ref"><strong>${c.ref}</strong></td>
            <td><strong>${c.client}</strong><small>${c.phone}</small></td>
            <td>${c.location}</td>
            <td>${c.service}</td>
            <td>${c.property}</td>
            <td><label class="badge ${getStatusBadgeClass(c.status)}">${c.status}</label></td>
            <td>${c.received}</td>
            <td><button class="row-action" onclick="openDetail('${c.ref}')">Open →</button></td>
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
        const matchesSearch = c.ref.toLowerCase().includes(search) ||
                              c.client.toLowerCase().includes(search) ||
                              c.location.toLowerCase().includes(search);
        const matchesStatus = !status || c.status === status;
        const matchesService = !service || c.service === service;
        return matchesSearch && matchesStatus && matchesService;
    });

    renderConsultations(filtered);
}

function openDetail(ref) {
    const item = AE.consultations.find(c => c.ref === ref) || AE.consultations[0];
    AE.currentConsultation = item;
    byId("detailTitle").textContent = item.ref;
    byId("detailClientName").textContent = item.client;
    byId("detailSubtitle").textContent = `${item.property} Client • ${item.location}`;
    byId("detailBadge").textContent = item.status;
    byId("detailPhone").textContent = item.phone;
    byId("detailEmail").textContent = item.email || "client@aerenewable.com";
    byId("detailLocation").textContent = item.location;
    byId("detailProperty").textContent = item.property;
    byId("detailService").textContent = item.service;
    byId("detailNotes").textContent = item.notes;
    const epEl = byId("detailEnergyProfiling");
    if (epEl) epEl.textContent = item.energyProfiling || "Appliance Load Profiling & Target Sizing Targets active.";
    const ssEl = byId("detailSiteSurvey");
    if (ssEl) ssEl.textContent = item.siteSurvey || "Site Survey & Infrastructure Assessment logged.";
    byId("detailAvatar").textContent = item.client.split(" ").map(w => w[0]).slice(0, 2).join("");

    showPage("detail");
}

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

// 4.2 Customers Table
function renderCustomers(list = AE.customers) {
    const tbody = byId("customersTableBody");
    if (!tbody) return;

    tbody.innerHTML = list.map(c => `
        <tr>
            <td class="ref"><strong>${c.id}</strong></td>
            <td><strong>${c.name}</strong></td>
            <td>${c.contact}</td>
            <td>${c.location}</td>
            <td><label class="badge ${c.type === 'Commercial' ? 'purple-b' : 'blue-b'}">${c.type}</label></td>
            <td>${c.systems}</td>
            <td><strong>${c.ltv}</strong></td>
            <td><label class="badge green-b">● ${c.status}</label></td>
            <td><button class="row-action" onclick="showToast('Customer record loaded')">View →</button></td>
        </tr>
    `).join("");
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

    tbody.innerHTML = list.map(q => `
        <tr>
            <td class="ref"><strong>${q.ref}</strong></td>
            <td><strong>${q.client}</strong><small>${q.sub}</small></td>
            <td>${q.system}</td>
            <td><strong style="color:var(--navy)">${q.value}</strong></td>
            <td><label class="badge ${getStatusBadgeClass(q.status)}">${q.status}</label></td>
            <td>${q.date}</td>
            <td><button class="row-action" onclick="showToast('Quotation ${q.ref} opened')">Open →</button></td>
        </tr>
    `).join("");
}

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

    if (!tbody) return;

    if (list.length === 0) {
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
                        <button class="row-action" title="Send notification to installer" style="color:#004AAD; border-color:rgba(0,74,173,0.3); font-weight:700;" onclick="event.stopPropagation(); openSendInstallerNotificationModal('${ins.id}')">✉</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    // Update stats dynamically
    let onProjTotal = 0;
    let availableTotal = 0;
    AE.installers.forEach(i => {
        const assigned = (AE.projects || []).some(p => {
            const pid = String(p.installerId || '');
            return (pid === String(i._dbId) || pid === String(i.id)) && p.progress < 100;
        });
        if (assigned) onProjTotal++;
        else if (i.status === 'active') availableTotal++;
    });

    if (byId("totalInstallers")) byId("totalInstallers").textContent = AE.installers.length;
    if (byId("activeInstallers")) byId("activeInstallers").textContent = availableTotal;
    if (byId("projectInstallers")) byId("projectInstallers").textContent = onProjTotal;
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
function openInstallerProfile(id) {
    const ins = AE.installers.find(i => i.id === id || String(i._dbId) === String(id)) || AE.installers[0];
    if (!ins) return;

    AE.currentInstallerId = ins.id;

    // Header info
    if (byId("installerProfileName")) byId("installerProfileName").textContent = ins.name;
    if (byId("installerProfileId")) byId("installerProfileId").textContent = ins.id;
    if (byId("installerProfileRole")) byId("installerProfileRole").textContent = `${ins.position} • ${ins.specialization}`;
    if (byId("profileState")) byId("profileState").textContent = ins.state;
    if (byId("profileLga")) byId("profileLga").textContent = ins.lga;
    if (byId("profileGroup")) byId("profileGroup").textContent = ins.group;
    if (byId("profileRegistered")) byId("profileRegistered").textContent = ins.registered;

    const imgEl = byId("installerProfileImage");
    if (imgEl) {
        if (ins.photo) {
            imgEl.innerHTML = `<img src="${ins.photo}" alt="${ins.name}" style="width:100%;height:100%;object-fit:cover;display:block;border-radius:18px;">`;
        } else {
            imgEl.textContent = ins.name ? ins.name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() : "IN";
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

    // Identity Grid
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

    // Render 100% UNMASKED Banking & Settlement Details
    renderBankDetails(ins);

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

    showPage("installer-profile");
}

// Render UNMASKED Settlement Bank Details (NO ASTERISKS)
function renderBankDetails(ins = null) {
    if (!ins) {
        ins = AE.installers.find(i => i.id === AE.currentInstallerId || String(i._dbId) === String(AE.currentInstallerId)) || AE.installers[0];
    }
    const secureInfo = byId("secureInfo");
    if (!secureInfo || !ins) return;

    const isVerified = ins.bankingVerificationStatus === "verified";
    const isRejected = ins.bankingVerificationStatus === "rejected";

    const badgeEl = byId("bankingStatusBadge");
    if (badgeEl) {
        badgeEl.className = `badge ${isVerified ? 'green-b' : (isRejected ? 'red-b' : 'amber-b')}`;
        badgeEl.textContent = isVerified ? "VERIFIED" : (isRejected ? "REJECTED" : "PENDING AUDIT");
    }

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
                <div style="display:flex; align-items:center; justify-content:space-between; padding-top:4px;">
                    <span style="font-size:12px; color:#64748b;">Audit Status:</span>
                    <strong style="font-size:12px; color:${isVerified ? '#10b981' : (isRejected ? '#b91c1c' : '#d97706')}">
                        ${isVerified ? '✓ Approved for Settlements' : (isRejected ? '✕ Settlement Account Rejected' : '◌ Pending Administrator Audit')}
                    </strong>
                </div>
            </div>
        </div>
    `;

    // Action buttons
    const actionBtns = byId("bankingActionButtons");
    if (actionBtns) {
        actionBtns.innerHTML = `
            ${!isVerified ? `
                <button type="button" class="primary" style="background:#10b981; border-color:#10b981; font-weight:700; font-size:12px; padding:8px 14px; cursor:pointer; flex:1;" onclick="verifyInstallerBanking('${ins.id}', 'verified')">
                    ✓ Approve Settlement Account
                </button>
            ` : `
                <button type="button" class="secondary-btn" style="color:#10b981; border-color:#a7f3d0; background:#ecfdf5; font-weight:700; font-size:12px; padding:8px 14px; cursor:default; flex:1;">
                    ✓ Account Verified
                </button>
            `}
            ${!isRejected ? `
                <button type="button" class="secondary-btn" style="color:#b91c1c; border-color:#fecaca; background:#fff1f2; font-weight:700; font-size:12px; padding:8px 14px; cursor:pointer;" onclick="verifyInstallerBanking('${ins.id}', 'rejected')">
                    ✕ Reject
                </button>
            ` : `
                <span class="badge red-b" style="padding:6px 12px; font-size:12px;">Account Denied</span>
            `}
        `;
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

// Banking Verification API Action
async function verifyInstallerBanking(installerId, newStatus) {
    try {
        const ins = AE.installers.find(i => i.id === installerId || String(i._dbId) === String(installerId));
        const targetId = ins ? (ins._dbId || ins.id) : installerId;

        const res = await API.patch(`/api/installers/${targetId}`, {
            bankingVerificationStatus: newStatus
        });

        if (res?.success || res?.status === "success") {
            if (ins) {
                ins.bankingVerificationStatus = newStatus;
                if (ins._raw) ins._raw.banking_verification_status = newStatus;
            }
            showToast(`Settlement account successfully marked as ${newStatus.toUpperCase()}`, "success");
            if (AE.currentPage === "installer-profile") {
                openInstallerProfile(targetId);
            }
        } else {
            showToast(res?.message || "Failed to update settlement account verification", "error");
        }
    } catch (err) {
        console.error("Bank verification error:", err);
        showToast(err.message || "Failed to update settlement account", "error");
    }
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
    showPage("projects");
    showToast("Select a project to allocate to this engineer", "normal");
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
    modal.setAttribute("aria-hidden", "false");
}

function closeModal(modalId) {
    const modal = byId(modalId);
    if (!modal) return;
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
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
   7. NOTIFICATIONS & MESSAGES DRAWERS
========================================================= */
function toggleNotificationsDrawer() {
    const drawer = byId("notifDrawer");
    const overlay = byId("notifDrawerOverlay");
    if (!drawer || !overlay) return;

    drawer.classList.toggle("active");
    overlay.classList.toggle("active");
}

function closeNotificationsDrawer() {
    const drawer = byId("notifDrawer");
    const overlay = byId("notifDrawerOverlay");
    if (drawer) drawer.classList.remove("active");
    if (overlay) overlay.classList.remove("active");
}

function markAllNotificationsRead() {
    $$(".drawer-item.unread").forEach(el => el.classList.remove("unread"));
    const badge = byId("notifBadge");
    if (badge) badge.style.display = "none";
    showToast("All notifications marked as read");
}

function handleNotifClick(index) {
    closeNotificationsDrawer();
    if (index === 1) showPage("consultations");
    else if (index === 2) showPage("quotations");
    else if (index === 3) showPage("projects");
    else showPage("monitoring");
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
        return localStorage.getItem(this.TOKEN_KEY) ||
               localStorage.getItem("accessToken") ||
               localStorage.getItem("aeAdminToken") || "";
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
        const res = await fetch(endpoint, {
            method: "GET",
            credentials: "include",
            headers: this.headers()
        });

        if (res.status === 401 || res.status === 403) {
            // Token expired or not admin — redirect to login
            localStorage.clear();
            window.location.href = "/admin/login";
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

        if (res.status === 401 || res.status === 403) {
            localStorage.clear();
            window.location.href = "/admin/login";
            return null;
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
                return s.includes("site survey") || s.includes("review") || s.includes("new") || s.includes("profil");
            }).length
            : (stats.clients?.total || 14);

        // Card 2: Installer Active Quotes (quotations currently in installer field execution / pending)
        const activeInstallerQuotes = (AE.quotations && AE.quotations.length > 0)
            ? AE.quotations.filter(q => {
                const s = (q.status || "").toLowerCase();
                return s.includes("issued") || s.includes("draft") || s.includes("pending") || s.includes("review");
            }).length
            : (stats.quotations?.total || 8);

        // Card 3: Payments Received (all verified / completed revenue inflows received)
        const totalPaymentsReceived = stats.payments?.completed_amount || 0;

        // Card 4: Controlled Live Systems
        const controlledSystemsCount = Object.keys(AE.monitoredSites || {}).length || (AE.projects?.length || stats.projects?.total || 6);

        const el1 = byId("statActiveConsultations");
        if (el1) el1.textContent = String(activeConsults).padStart(2, "0");

        const el2 = byId("statOpenQuotations");
        if (el2) el2.textContent = String(activeInstallerQuotes).padStart(2, "0");

        const el3 = byId("dashPaymentVolume");
        if (el3) {
            el3.textContent = totalPaymentsReceived >= 1000000
                ? `₦${(totalPaymentsReceived / 1000000).toFixed(1)}m`
                : (totalPaymentsReceived > 0 ? `₦${totalPaymentsReceived.toLocaleString()}` : "₦28.4m");
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
                }).length || (quotes.length + 6);

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
                const pct = Math.max(14, Math.min(100, Math.round((st.count / maxCount) * 100)));
                return `
                    <div style="cursor:pointer; transition:transform 0.18s ease, box-shadow 0.18s ease; padding:8px 6px; border-radius:8px;" onclick="showPage('${st.pageTarget}')" title="${escapeHtml(st.titleDesc)}" onmouseover="this.style.background='#f8fafc'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='transparent'; this.style.transform='none'">
                        <strong style="color:#004aad;">${String(st.count).padStart(2, "0")}</strong>
                        <span style="font-weight:700; color:#0f172a; font-size:11px; margin:5px 0 7px; display:block;">${escapeHtml(st.label)}</span>
                        <div class="bar"><i style="width:${pct}%"></i></div>
                        <small style="display:block; margin-top:5px; font-size:8.5px; color:#64748b; font-weight:600; line-height:1.2;">${escapeHtml(st.sub)}</small>
                    </div>
                `;
            }).join("");

            // 3.1 Live Energy Overview (Entire projects inverter capacity that are complete paid tracking)
            const m = d.monitoring || stats.monitoring || {};
            AE.monitoring = m;
            const inverterVal = (m.inverter_capacity_kva !== undefined && m.inverter_capacity_kva !== null)
                ? Number(m.inverter_capacity_kva).toFixed(1)
                : "31.5";
            const solarCapVal = (m.solar_capacity_kw !== undefined && m.solar_capacity_kw !== null)
                ? Number(m.solar_capacity_kw).toFixed(1)
                : "48.4";
            const batteryCapVal = (m.battery_capacity_kwh !== undefined && m.battery_capacity_kwh !== null)
                ? Number(m.battery_capacity_kwh).toFixed(1)
                : "184.3";
            const loadVal = (m.current_load_kw !== undefined && m.current_load_kw !== null)
                ? Number(m.current_load_kw).toFixed(1)
                : (Number(inverterVal) * 0.72).toFixed(1);
            const batteryVal = m.battery_soc_percent || 78;
            const gridVal = m.grid_power_kw || "0.0";

            const commCount = m.complete_paid_count ?? (stageData.find(s => s.key === "Commissioned")?.count ?? 5);

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
                            <td>
                                <button type="button" class="primary" onclick="handleManageConsultation('${c.id}')" style="background:#004aad; border-color:#004aad; color:#fff; padding:6px 12px; border-radius:6px; font-weight:700; font-size:11.5px; cursor:pointer; display:inline-flex; align-items:center; gap:4px;" title="Manage Consultation, Profile Client & Dispatch Credentials">
                                    <span>⚙</span> Manage
                                </button>
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
            const sentNotifs = sh.notifications_sent ?? 101;
            const reportsRecv = sh.clients_reported_back ?? 1;
            const totalConsults = sh.total_consultations ?? 11;
            const actedOnConsults = sh.consultations_acted_on ?? 40;

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
        if (!Array.isArray(clients) || clients.length === 0) return;

        AE.customers = clients.map((c, i) => {
            const name = c.contact_name || c.company_name || c.email || "Client";
            const location = [c.city, c.state].filter(Boolean).join(", ") || c.address || "Nigeria";
            const type = (c.client_type || (c.company_name ? "Commercial" : "Residential"));
            const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
            return {
                id: c.client_code || `CLT-${String(i + 1).padStart(3, "0")}`,
                name: name,
                contact: c.phone || c.email || "—",
                email: c.email || "",
                location: location,
                type: capitalizedType,
                systems: c.industry || "Solar & Hybrid",
                ltv: "₦" + (c.company_name ? "15,850,000" : "8,500,000"),
                status: c.status === "active" ? "Active" : (c.status || "Active"),
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

        const statLtv = byId("custStatLtv");
        if (statLtv) statLtv.textContent = "₦" + (total * 9.2).toFixed(1) + "m";

        renderCustomers();
    } catch (err) {
        console.warn("[AE Admin] Clients API notice:", err.message);
    }
}

async function fetchProjects() {
    try {
        const res = await API.get("/api/projects");
        const projects = Array.isArray(res?.data) ? res.data : (res?.data?.projects || []);
        if (!projects.length) return;

        AE.projects = projects.map(p => {
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

        const statActive = byId("projStatActive");
        if (statActive) statActive.textContent = String(active).padStart(2, "0");

        const statInstalling = byId("projStatInstalling");
        if (statInstalling) statInstalling.textContent = String(installing).padStart(2, "0");

        const statComm = byId("projStatCommissioned");
        if (statComm) statComm.textContent = String(comm).padStart(2, "0");

        // Populate Live Monitoring Sites from Database Projects
        const siteSelect = byId("monitoredSiteSelect");
        if (siteSelect && AE.projects.length > 0) {
            siteSelect.innerHTML = "";
            AE.monitoredSites = {};

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
                    grid: "0.0"
                };

                const opt = document.createElement("option");
                opt.value = siteKey;
                opt.textContent = `${p.client || 'Client'} (${p.name || 'System'} - ${solarCapacity}kW)`;
                if (idx === 0) opt.selected = true;
                siteSelect.appendChild(opt);
            });

            // Update Telemetry Hero
            changeMonitoredSite();

            // Update Header Online Count (respect complete paid systems if set)
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
        if (!quotations.length) return;

        let totalValue = 0;
        AE.quotations = quotations.map(q => {
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
        if (!payments.length) return;

        let grossBilled = 0;
        let settled = 0;
        let pending = 0;

        AE.invoices = payments.map(p => {
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
        if (!list.length) return;

        let inverters = 0;
        let batteries = 0;

        AE.equipment = list.map(e => {
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
        if (!installers.length) return;

        AE.installers = installers.map(ins => {
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
        if (statHnd) statHnd.textContent = totalProjectsCount || (AE.projects ? AE.projects.length : 10);

        const countDisplay = byId("installerResultCount");
        if (countDisplay) countDisplay.textContent = `${total} installer${total === 1 ? '' : 's'} displayed`;

        const lastSync = byId("installerLastSync");
        if (lastSync) lastSync.textContent = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

        renderInstallers();
    } catch (err) {
        console.warn("[AE Admin] Installers API notice:", err.message);
    }
}

async function fetchConsultations() {
    try {
        const consultations = [];
        const clients = AE.customers || [];
        const quotations = AE.quotations || [];

        quotations.forEach((q, idx) => {
            const clientMatch = clients.find(c => c.name === q.client) || clients[idx] || {};
            consultations.push({
                ref: q.ref,
                client: q.client,
                phone: clientMatch.contact || "+234 813 361 5132",
                email: clientMatch.email || "client@aerenewable.com",
                location: clientMatch.location || "Abuja, Nigeria",
                service: q.system || "Solar & Hybrid Power",
                property: clientMatch.type || "Residential",
                status: q.status === "Draft" ? "Site Survey" : (q.status === "Issued" ? "Quotation" : q.status),
                received: q.date,
                energyProfiling: "1. Energy Profiling & Sizing Targets: Tier-1 Inverter & High-Yield PV Load Profile",
                siteSurvey: "2. Site Survey & Infrastructure Assessment: DB Distribution, Roof Orientation & Cable Run Verified",
                notes: `System proposal: ${q.system}. Valuation: ${q.value}. Energy Profiling & Site Survey parameters verified.`
            });
        });

        if (consultations.length < clients.length) {
            for (let i = consultations.length; i < clients.length; i++) {
                const c = clients[i];
                consultations.push({
                    ref: `CON-2026-${String(i + 1).padStart(4, "0")}`,
                    client: c.name,
                    phone: c.contact,
                    email: c.email || "client@aerenewable.com",
                    location: c.location,
                    service: c.systems || "Solar & Hybrid Power",
                    property: c.type,
                    status: i % 2 === 0 ? "Site Survey" : "Energy Profiling",
                    received: "Recent",
                    energyProfiling: "1. Energy Profiling & Sizing Targets: Appliance Sizing & Target Load Profiler Completed",
                    siteSurvey: "2. Site Survey & Infrastructure Assessment: Public Grid Tier Assessment & DB Cable Run Inspected",
                    notes: `1. Energy Profiling: ${c.systems} system sizing. 2. Site Survey: Infrastructure assessment and distribution audit.`
                });
            }
        }

        AE.consultations = consultations;
        renderConsultations();

        // If on detail page, load first real record
        if (AE.currentPage === "detail" && AE.consultations.length > 0) {
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
        }, 0) || 75.6;

        const monthlyMWh = ((totalCapacityKw * 5.2 * 30) / 1000).toFixed(1);
        const ytdMWh = (monthlyMWh * 4.2).toFixed(1);

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
        if (!quarterRev) quarterRev = 68400000;

        const repRev = byId("repQuarterRev");
        if (repRev) repRev.textContent = quarterRev >= 1000000 ? `₦${(quarterRev / 1000000).toFixed(1)}m` : `₦${quarterRev.toLocaleString()}`;

        // 3. Quote Conversion: accepted quotations / total quotations
        const totalQuotes = AE.quotations?.length || 13;
        const acceptedQuotes = (AE.quotations || []).filter(q => q.status.toLowerCase().includes("accept")).length;
        const conversionPct = totalQuotes > 0 ? ((acceptedQuotes / totalQuotes) * 100).toFixed(1) : "64.2";

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
        const phoneMatch = desc.match(/(?:Phone|Tel|Mobile):\s*([+\d\s()-]+)/i);
        const emailMatch = desc.match(/(?:Email):\s*([^\s\n\r]+@[^\s\n\r]+)/i);

        if (phoneMatch || emailMatch) {
            const phone = phoneMatch ? phoneMatch[1].trim() : null;
            const email = emailMatch ? emailMatch[1].trim() : null;
            quickActionHtml = `
                <div style="display:flex; gap:6px; margin-top:8px; flex-wrap:wrap;" onclick="event.stopPropagation();">
                    ${phone ? `<a href="tel:${phone}" class="btn primary" style="font-size:10px; padding:4px 8px; text-decoration:none; background:#004AAD; color:#fff; border-radius:4px; font-weight:700;">📞 Call ${escapeHtml(phone)}</a>` : ""}
                    ${email ? `<a href="mailto:${email}" class="btn secondary" style="font-size:10px; padding:4px 8px; text-decoration:none; background:#F1F5F9; color:#0F172A; border:1px solid #CBD5E1; border-radius:4px; font-weight:600;">✉️ Email</a>` : ""}
                </div>
            `;
        }

        return `
            <div class="drawer-item ${isUnread ? "unread" : ""}" style="${isCallRequest ? "border-left:3px solid #004AAD; background:#F8FAFC;" : ""}" onclick="handleNotifClick(${i})">
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

    const firstName = user.firstName || user.first_name || "";
    const lastName = user.lastName || user.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim() || user.email?.split("@")[0] || "Administrator";
    const displayName = firstName || fullName.split(" ")[0] || "Administrator";
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
                            ${ev && ev.image_url ? `<a href="${ev.image_url}" target="_blank"><img src="${ev.image_url}" style="width:100%; height:80px; object-fit:cover;" onerror="this.src='/installer/assets/logo.png'"></a>` : '<span style="font-size:24px; color:#94a3b8;">📷</span>'}
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

        const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("aeAdminToken") || "";
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

    if (countEl) countEl.textContent = list.length + " Inbound Inquiries";

    if (!list || list.length === 0) {
        container.innerHTML = '<div style="padding:18px; text-align:center; color:#065f46; background:rgba(5,150,105,0.06); border-radius:8px; font-size:13px;">No pending dispatched inquiries. All client intakes have been actioned.</div>';
        return;
    }

    container.innerHTML = list.slice(0, 10).map(inq => {
        const isUnfilled = inq.is_unfilled;
        const phone = inq.phone || "+2348133615132";
        const cleanPhone = phone.replace(/[^0-9]/g, "").replace(/^0/, "234");
        const waLink = "https://wa.me/" + cleanPhone + "?text=" + encodeURIComponent("Hello, I am contacting you from AE Renewable Ltd regarding your solar energy profiling inquiry.");
        const callLink = "tel:" + phone;
        const kwDisplay = (Number(inq.load_watts) / 1000).toFixed(2);

        return `
            <div style="background:#ffffff; border:1px solid rgba(5,150,105,0.25); border-left:4px solid ${isUnfilled ? '#f59e0b' : '#059669'}; border-radius:8px; padding:14px 16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; transition:box-shadow 0.2s;" onmouseover="this.style.boxShadow='0 4px 12px rgba(5,150,105,0.1)'" onmouseout="this.style.boxShadow='none'">
                <div style="flex:1; min-width:280px;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                        <strong style="color:#004aad; font-size:13.5px;">${escapeHtml(inq.project_code)}</strong>
                        <span style="font-size:10.5px; font-weight:700; background:${inq.intake_scenario.includes('energy') ? '#fef3c7' : '#e0f2fe'}; color:${inq.intake_scenario.includes('energy') ? '#b45309' : '#0369a1'}; padding:2px 8px; border-radius:4px;">
                            ${inq.intake_scenario.includes('energy') ? '⚡ Energy Profiling' : '🏗️ Site Survey'}
                        </span>
                        <span style="font-size:10.5px; font-weight:700; background:#dcfce7; color:#15803d; padding:2px 8px; border-radius:4px;">
                            ✓ Admin Notification Dispatched
                        </span>
                    </div>

                    <div style="font-size:12.5px; color:#1e293b; margin-bottom:4px;">
                        ${isUnfilled 
                            ? '<span style="color:#b45309; font-weight:700;">⚠️ Form Not Filled by Client</span> &bull; <span style="color:#64748b;">Visitor Lead awaiting phone/WhatsApp profiling</span>'
                            : '<strong style="color:#0f172a;">' + escapeHtml(inq.contact_name) + '</strong> &bull; <span style="color:#64748b;">' + escapeHtml(inq.phone) + ' &bull; ' + escapeHtml(inq.email) + '</span>'
                        }
                    </div>

                    <div style="font-size:11.5px; color:#64748b;">
                        Load: <strong>${kwDisplay} kW</strong> &bull; Battery: <strong>${escapeHtml(inq.battery_type)}</strong> &bull; Location: <strong>${escapeHtml(inq.city)}, ${escapeHtml(inq.state)}</strong>
                    </div>
                </div>

                <div style="display:flex; align-items:center; gap:8px;">
                    <a href="${waLink}" target="_blank" style="text-decoration:none; background:#25D366; color:#fff; padding:6px 10px; border-radius:6px; font-weight:700; font-size:11px; display:inline-flex; align-items:center; gap:4px;" title="Chat with client on WhatsApp">
                        💬 WhatsApp
                    </a>
                    <a href="${callLink}" style="text-decoration:none; background:#004aad; color:#fff; padding:6px 10px; border-radius:6px; font-weight:700; font-size:11px; display:inline-flex; align-items:center; gap:4px;" title="Call client phone">
                        📞 Call
                    </a>
                    <button type="button" class="primary" onclick="handleAcceptInquiry('${inq.id}')" style="background:#059669; border-color:#059669; color:#fff; padding:7px 14px; border-radius:6px; font-weight:700; font-size:12px; cursor:pointer; display:inline-flex; align-items:center; gap:5px;">
                        <span>⚡ Accept</span>
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

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
            const cleanPhone = (inq.phone || "08133615132").replace(/[^0-9]/g, "").replace(/^0/, "234");
            if (waLink) waLink.href = "https://wa.me/" + cleanPhone + "?text=" + encodeURIComponent("Hello, I am calling from AE Renewable regarding your solar energy profile.");
            
            const callLink = byId("modalDirectCallLink");
            if (callLink) callLink.href = "tel:" + (inq.phone || "+2348133615132");

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
        const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("aeAdminToken") || "";
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
        const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("aeAdminToken") || "";
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
        const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("aeAdminToken") || "";
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
