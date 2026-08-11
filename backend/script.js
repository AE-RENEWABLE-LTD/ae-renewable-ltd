

/* =========================================================
   AE RENEWABLE LTD
   ARDE V1.0
   BACKEND UI CONTROLLER
   ---------------------------------------------------------
   Installer Directory
   Installer Registration
   Installer Profile
   Vital Information Security
   Search / Filters
   CSV Export
   Navigation
   Monitoring Demo
   Toast Notifications
   Responsive Support
========================================================= */


/* =========================================================
   1. GLOBAL STATE
========================================================= */

const AE = {
    installers: [],
    currentInstallerId: null,
    vitalUnlocked: false,
    vitalTimer: null,
    monitoringTimer: null,
    toastTimer: null,
    mobileBreakpoint: 720,
    vitalPasscode: "12345"
};


/* =========================================================
   2. SAMPLE INSTALLER DATA
========================================================= */

AE.installers = [

    {
        id: "INS-0001",
        name: "Abdulrasaq Eniola",
        phone: "08133615132",
        email: "AERenewablesolution@gmail.com",

        state: "FCT Abuja",
        lga: "AMAC",

        position: "Lead Installer",
        specialization: "Solar & Hybrid Systems",
        group: "AE Renewable Core",
        experience: "8 Years",

        rcNumber: "RC 1234567",
        cacDate: "14 March 2023",

        status: "Active",
        availability: "Available",

        projects: 24,
        lastQuotation: "AE-20260806-001",

        registrationDate: "06 Aug 2026",

        bank: "GTBank",
        accountName: "Abdulrasaq Eniola Abdulquodry",
        accountNumber: "********9012",
        bvn: "********321",

        notes:
            "Lead technical installer and system commissioning specialist.",

        certificates: [
            "Solar PV Installation Certificate",
            "Electrical Installation Certificate"
        ],

        projectsHistory: [

            {
                reference: "PRJ-2026-001",
                client: "Residential Client",
                location: "Guzape, Abuja",
                quotation: "AE-20260806-001",
                assignment: "06 Aug 2026",
                completion: "08 Aug 2026",
                status: "Completed",
                images: 18,
                workImages: 12
            },

            {
                reference: "PRJ-2026-002",
                client: "Commercial Client",
                location: "Maitama, Abuja",
                quotation: "AE-20260801-004",
                assignment: "01 Aug 2026",
                completion: "04 Aug 2026",
                status: "Completed",
                images: 24,
                workImages: 17
            }

        ],

        photo: null
    },


    {
        id: "INS-0002",
        name: "Ibrahim Musa",
        phone: "08000000001",
        email: "ibrahim@example.com",

        state: "Nasarawa",
        lga: "Keffi",

        position: "Solar Installer",
        specialization: "Solar PV Installation",
        group: "Field Team A",
        experience: "5 Years",

        rcNumber: "RC 2456812",
        cacDate: "22 May 2024",

        status: "Active",
        availability: "On Project",

        projects: 17,
        lastQuotation: "AE-20260729-003",

        registrationDate: "29 Jul 2026",

        bank: "Access Bank",
        accountName: "Ibrahim Musa",
        accountNumber: "********4421",
        bvn: "********782",

        notes:
            "Experienced residential PV installer.",

        certificates: [
            "Solar Installation Certificate"
        ],

        projectsHistory: [],

        photo: null
    },


    {
        id: "INS-0003",
        name: "David John",
        phone: "08000000002",
        email: "david@example.com",

        state: "FCT Abuja",
        lga: "AMAC",

        position: "Electrical Installer",
        specialization: "Electrical Engineering",
        group: "Field Team B",
        experience: "6 Years",

        rcNumber: "BN 5567821",
        cacDate: "12 January 2024",

        status: "Active",
        availability: "Available",

        projects: 12,
        lastQuotation: "AE-20260722-002",

        registrationDate: "22 Jul 2026",

        bank: "UBA",
        accountName: "David John",
        accountNumber: "********7761",
        bvn: "********451",

        notes:
            "Electrical installation and protection systems specialist.",

        certificates: [
            "Electrical Engineering Certificate"
        ],

        projectsHistory: [],

        photo: null
    }

];


/* =========================================================
   3. DOM HELPERS
========================================================= */

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

const $$ = (selector, parent = document) =>
    Array.from(parent.querySelectorAll(selector));


function byId(id) {
    return document.getElementById(id);
}


function exists(element) {
    return element !== null && element !== undefined;
}


/* =========================================================
   4. HTML SECURITY
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function getInitials(name) {

    if (!name) return "IN";

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(word => word.charAt(0))
        .join("")
        .toUpperCase();
}


/* =========================================================
   5. TOAST
========================================================= */

function showToast(message, type = "normal") {

    const toast = byId("toast");

    if (!toast) {
        console.log(`[${type}] ${message}`);
        return;
    }

    clearTimeout(AE.toastTimer);

    toast.className = "toast";

    if (type === "success") {
        toast.classList.add("success");
    }

    if (type === "error") {
        toast.classList.add("error");
    }

    if (type === "warning") {
        toast.classList.add("warning");
    }

    toast.textContent = message;

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    AE.toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


/* =========================================================
   6. PAGE NAVIGATION
========================================================= */

const PAGE_NAMES = {

    dashboard: "Dashboard",
    consultations: "Consultations",
    detail: "Consultation Detail",
    customers: "Customers",
    sites: "Sites",
    projects: "Projects",
    quotations: "Quotations",
    invoices: "Invoices",
    reports: "Reports",
    monitoring: "Live Monitoring",
    equipment: "Equipment",
    installers: "Installers",
    installerProfile: "Installer Profile",
    settings: "Settings"

};


function showPage(pageName) {

    const pages = $$(".page");
    const navItems = $$(".nav-item");

    const target = byId(`page-${pageName}`);

    if (!target) {

        console.warn(
            `AE Backend: page-${pageName} does not exist.`
        );

        return;
    }

    pages.forEach(page => {
        page.classList.remove("active");
    });

    target.classList.add("active");

    navItems.forEach(item => {

        item.classList.remove("active");

        if (item.dataset.page === pageName) {
            item.classList.add("active");
        }

    });

    updateBreadcrumb(pageName);

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function updateBreadcrumb(pageName) {

    const breadcrumb = byId("breadcrumb");

    if (!breadcrumb) return;

    breadcrumb.textContent =
        PAGE_NAMES[pageName] ||
        pageName
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, letter => letter.toUpperCase());
}


function setupNavigation() {

    $$(".nav-item").forEach(item => {

        item.addEventListener("click", () => {

            const page =
                item.dataset.page;

            if (!page) return;

            showPage(page);

        });

    });

}


/* =========================================================
   7. CONSULTATION
========================================================= */

function openDetail(reference) {

    const title = byId("detailTitle");

    if (title && reference) {
        title.textContent = reference;
    }

    showPage("detail");
}


function applyConsultationFilters() {

    const page = byId("page-consultations");

    if (!page) return;

    const input =
        $("#search input", page);

    const search =
        input
            ? input.value.toLowerCase().trim()
            : "";

    const selects =
        $$(".filter-row select", page);

    const status =
        selects[0]
            ? selects[0].value.toLowerCase()
            : "all statuses";

    const service =
        selects[1]
            ? selects[1].value.toLowerCase()
            : "all services";

    $$("tbody tr", page).forEach(row => {

        const text =
            row.textContent.toLowerCase();

        const searchMatch =
            !search ||
            text.includes(search);

        const statusMatch =
            status === "all statuses" ||
            text.includes(status);

        const serviceMatch =
            service === "all services" ||
            text.includes(service);

        row.style.display =
            searchMatch &&
            statusMatch &&
            serviceMatch
                ? ""
                : "none";

    });
}


function setupConsultations() {

    const page =
        byId("page-consultations");

    if (!page) return;

    const input =
        $("#search input", page);

    if (input) {
        input.addEventListener(
            "input",
            applyConsultationFilters
        );
    }

    $$(".filter-row select", page)
        .forEach(select => {

            select.addEventListener(
                "change",
                applyConsultationFilters
            );

        });

}


/* =========================================================
   8. INSTALLER UTILITIES
========================================================= */

function generateInstallerID() {

    let highest = 0;

    AE.installers.forEach(installer => {

        const match =
            String(installer.id || "")
                .match(/INS-(\d+)/i);

        if (match) {

            highest =
                Math.max(
                    highest,
                    Number(match[1])
                );

        }

    });

    return `INS-${String(
        highest + 1
    ).padStart(4, "0")}`;
}


function getStatusClass(status) {

    const value =
        String(status || "")
            .toLowerCase()
            .trim();

    if (
        value === "active" ||
        value === "available" ||
        value === "completed"
    ) {
        return "green-b";
    }

    if (
        value === "on project" ||
        value === "pending"
    ) {
        return "amber-b";
    }

    if (
        value === "inactive" ||
        value === "suspended"
    ) {
        return "purple-b";
    }

    return "blue-b";
}


/* =========================================================
   9. INSTALLER STATISTICS
========================================================= */

function updateInstallerStats(list = AE.installers) {

    const total =
        byId("installerTotal");

    const active =
        byId("installerActive");

    const onProject =
        byId("installerOnProject");

    const projects =
        byId("installerProjects");


    if (total) {
        total.textContent =
            list.length;
    }


    if (active) {

        active.textContent =
            list.filter(
                installer =>
                    String(installer.status)
                        .toLowerCase() === "active"
            ).length;

    }


    if (onProject) {

        onProject.textContent =
            list.filter(
                installer =>
                    String(installer.availability)
                        .toLowerCase() === "on project"
            ).length;

    }


    if (projects) {

        projects.textContent =
            list.reduce(
                (totalProjects, installer) =>
                    totalProjects +
                    Number(installer.projects || 0),
                0
            );

    }

}


/* =========================================================
   10. INSTALLER DIRECTORY
========================================================= */

function renderInstallerDirectory(
    list = AE.installers
) {

    const tbody =
        $("#page-installers tbody");

    if (!tbody) {
        console.warn(
            "AE Backend: installer table body not found."
        );
        return;
    }


    if (!list.length) {

        tbody.innerHTML = `

            <tr>

                <td colspan="10">

                    <div class="empty-page">

                        <div class="empty-icon">
                            ⌕
                        </div>

                        <h2>
                            No installers found
                        </h2>

                        <p>
                            No installer matches
                            your search or filters.
                        </p>

                    </div>

                </td>

            </tr>

        `;

        updateInstallerStats([]);

        return;
    }


    tbody.innerHTML =
        list.map(installer => {

            const initials =
                installer.initials ||
                getInitials(installer.name);

            return `

                <tr>

                    <td>

                        <div class="installer-table-person">

                            <div class="avatar">

                                ${
                                    installer.photo

                                    ? `
                                        <img
                                            src="${escapeHTML(installer.photo)}"
                                            alt="${escapeHTML(installer.name)}"
                                        >
                                    `

                                    : escapeHTML(initials)
                                }

                            </div>

                            <div>

                                <strong>
                                    ${escapeHTML(
                                        installer.name
                                    )}
                                </strong>

                                <small>
                                    ${escapeHTML(
                                        installer.id
                                    )}
                                </small>

                            </div>

                        </div>

                    </td>


                    <td>

                        <span>
                            ${escapeHTML(
                                installer.phone || "—"
                            )}
                        </span>

                        <small>
                            ${escapeHTML(
                                installer.email || "—"
                            )}
                        </small>

                    </td>


                    <td>

                        <span>
                            ${escapeHTML(
                                installer.position || "—"
                            )}
                        </span>

                        <small>
                            ${escapeHTML(
                                installer.state || "—"
                            )}
                        </small>

                    </td>


                    <td>

                        <span class="badge blue-b">

                            ${escapeHTML(
                                installer.specialization || "—"
                            )}

                        </span>

                    </td>


                    <td>
                        ${escapeHTML(
                            installer.rcNumber || "—"
                        )}
                    </td>


                    <td>
                        ${escapeHTML(
                            installer.group || "—"
                        )}
                    </td>


                    <td>
                        ${escapeHTML(
                            installer.registrationDate || "—"
                        )}
                    </td>


                    <td>

                        <strong>
                            ${Number(
                                installer.projects || 0
                            )}
                        </strong>

                        <small>
                            projects
                        </small>

                    </td>


                    <td>

                        <span class="badge ${getStatusClass(
                            installer.availability ||
                            installer.status
                        )}">

                            ${escapeHTML(
                                installer.availability ||
                                installer.status
                            )}

                        </span>

                    </td>


                    <td>

                        <button
                            type="button"
                            class="row-action"
                            data-installer-id="${escapeHTML(
                                installer.id
                            )}"
                        >
                            Open Profile
                        </button>

                    </td>

                </tr>

            `;

        }).join("");


    updateInstallerStats(list);
}


/* =========================================================
   11. INSTALLER FILTERING
========================================================= */

function getFilterValue(id) {

    const element = byId(id);

    if (!element) return "all";

    return String(
        element.value || "all"
    )
        .trim()
        .toLowerCase();
}


function applyInstallerFilters() {

    const searchInput =
        byId("installerSearch");

    const search =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const state =
        getFilterValue(
            "installerStateFilter"
        );

    const position =
        getFilterValue(
            "installerPositionFilter"
        );

    const status =
        getFilterValue(
            "installerStatusFilter"
        );

    const specialization =
        getFilterValue(
            "installerSpecializationFilter"
        );


    const filtered =
        AE.installers.filter(installer => {

            const searchable = [

                installer.id,
                installer.name,
                installer.phone,
                installer.email,
                installer.state,
                installer.lga,
                installer.position,
                installer.specialization,
                installer.group,
                installer.rcNumber

            ]
                .join(" ")
                .toLowerCase();


            const searchMatch =
                !search ||
                searchable.includes(search);


            const stateMatch =
                state === "all" ||
                !state ||
                String(installer.state)
                    .toLowerCase() === state;


            const positionMatch =
                position === "all" ||
                !position ||
                String(installer.position)
                    .toLowerCase() === position;


            const statusMatch =
                status === "all" ||
                !status ||
                String(installer.status)
                    .toLowerCase() === status;


            const specializationMatch =
                specialization === "all" ||
                !specialization ||
                String(installer.specialization)
                    .toLowerCase() === specialization;


            return (
                searchMatch &&
                stateMatch &&
                positionMatch &&
                statusMatch &&
                specializationMatch
            );

        });


    renderInstallerDirectory(
        filtered
    );
}


function setupInstallerFilters() {

    const ids = [

        "installerSearch",
        "installerStateFilter",
        "installerPositionFilter",
        "installerStatusFilter",
        "installerSpecializationFilter"

    ];


    ids.forEach(id => {

        const element = byId(id);

        if (!element) return;

        element.addEventListener(
            "input",
            applyInstallerFilters
        );

        element.addEventListener(
            "change",
            applyInstallerFilters
        );

    });

}


/* =========================================================
   12. INSTALLER PROFILE
========================================================= */

function getCurrentInstaller() {

    return AE.installers.find(
        installer =>
            installer.id ===
            AE.currentInstallerId
    ) || null;
}


function openInstallerProfile(id) {

    const installer =
        AE.installers.find(
            item => item.id === id
        );


    if (!installer) {

        showToast(
            "Installer profile not found.",
            "error"
        );

        return;
    }


    if (!byId("page-installerProfile")) {

        showToast(
            "Installer Profile page is missing from the HTML.",
            "error"
        );

        return;
    }


    AE.currentInstallerId =
        installer.id;

    lockVitalInformation(false);

    renderInstallerProfile(
        installer
    );

    showPage(
        "installerProfile"
    );
}


function setText(id, value) {

    const element = byId(id);

    if (element) {
        element.textContent =
            value || "—";
    }

}


function renderInstallerProfile(
    installer
) {

    setText(
        "installerProfileName",
        installer.name
    );

    setText(
        "installerProfileId",
        installer.id
    );

    setText(
        "installerProfilePosition",
        installer.position
    );

    setText(
        "installerProfilePhone",
        installer.phone
    );

    setText(
        "installerProfileEmail",
        installer.email
    );

    setText(
        "installerProfileState",
        installer.state
    );

    setText(
        "installerProfileSpecialization",
        installer.specialization
    );

    setText(
        "installerProfileGroup",
        installer.group
    );

    setText(
        "installerProfileExperience",
        installer.experience
    );

    setText(
        "installerProfileRC",
        installer.rcNumber
    );

    setText(
        "installerProfileCACDate",
        installer.cacDate
    );

    setText(
        "installerProfileRegistrationDate",
        installer.registrationDate
    );

    setText(
        "installerProfileProjects",
        installer.projects || 0
    );

    setText(
        "installerProfileQuotation",
        installer.lastQuotation
    );


    const avatar =
        byId("installerProfileAvatar");


    if (avatar) {

        if (installer.photo) {

            avatar.innerHTML = `

                <img
                    src="${escapeHTML(
                        installer.photo
                    )}"
                    alt="${escapeHTML(
                        installer.name
                    )}"
                >

            `;

        } else {

            avatar.textContent =
                getInitials(
                    installer.name
                );

        }

    }


    const status =
        byId("installerProfileStatus");


    if (status) {

        status.textContent =
            installer.status;

        status.className =
            `badge ${getStatusClass(
                installer.status
            )}`;

    }


    renderInstallerNotes(
        installer
    );

    renderInstallerCertificates(
        installer
    );

    renderInstallerProjects(
        installer
    );

    renderInstallerBanking(
        installer
    );
}


/* =========================================================
   13. INSTALLER NOTES
========================================================= */

function renderInstallerNotes(
    installer
) {

    const element =
        byId("installerProfileNotes") ||
        byId("installerNotes");

    if (!element) return;

    element.textContent =
        installer.notes ||
        "No notes available.";

}


/* =========================================================
   14. CERTIFICATES
========================================================= */

function renderInstallerCertificates(
    installer
) {

    const container =
        byId("installerCertificates");

    if (!container) return;


    const certificates =
        Array.isArray(
            installer.certificates
        )
            ? installer.certificates
            : [];


    if (!certificates.length) {

        container.innerHTML = `
            <p>
                No certificates uploaded.
            </p>
        `;

        return;
    }


    container.innerHTML =
        certificates.map(certificate => `

            <div class="certificate-item">

                <span>✓</span>

                <strong>
                    ${escapeHTML(
                        certificate
                    )}
                </strong>

            </div>

        `).join("");
}


/* =========================================================
   15. INSTALLER PROJECT HISTORY
========================================================= */

function renderInstallerProjects(
    installer
) {

    const tbody =
        $("#installerProjectHistory tbody");

    if (!tbody) return;


    const projects =
        Array.isArray(
            installer.projectsHistory
        )
            ? installer.projectsHistory
            : [];


    if (!projects.length) {

        tbody.innerHTML = `

            <tr>

                <td colspan="9">

                    <div class="empty-page">

                        <div class="empty-icon">
                            ◫
                        </div>

                        <h2>
                            No project history
                        </h2>

                        <p>
                            Projects assigned to this
                            installer will appear here.
                        </p>

                    </div>

                </td>

            </tr>

        `;

        return;
    }


    tbody.innerHTML =
        projects.map(project => `

            <tr>

                <td>
                    <strong>
                        ${escapeHTML(
                            project.reference
                        )}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(
                        project.client
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        project.location
                    )}
                </td>

                <td>
                    <span class="ref">
                        ${escapeHTML(
                            project.quotation
                        )}
                    </span>
                </td>

                <td>
                    ${escapeHTML(
                        project.assignment
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        project.completion
                    )}
                </td>

                <td>

                    <span class="badge ${getStatusClass(
                        project.status
                    )}">

                        ${escapeHTML(
                            project.status
                        )}

                    </span>

                </td>

                <td>
                    ${Number(
                        project.images || 0
                    )}
                </td>

                <td>
                    ${Number(
                        project.workImages || 0
                    )}
                </td>

            </tr>

        `).join("");
}


/* =========================================================
   16. VITAL INFORMATION SECURITY
========================================================= */

function updateVitalButton() {

    const button =
        $("[data-action='unlock-vitals'], [data-action='lock-vitals']");

    if (!button) return;


    if (AE.vitalUnlocked) {

        button.textContent =
            "🔓 Lock Vital Information";

        button.dataset.action =
            "lock-vitals";

    } else {

        button.textContent =
            "🔒 Access Vital Information";

        button.dataset.action =
            "unlock-vitals";

    }

}


function renderInstallerBanking(
    installer
) {

    const accountName =
        byId("installerBankAccountName");

    const bank =
        byId("installerBankName");

    const accountNumber =
        byId("installerBankAccountNumber");

    const bvn =
        byId("installerBVN");


    if (!AE.vitalUnlocked) {

        if (accountName)
            accountName.textContent =
                "••••••••••••";

        if (bank)
            bank.textContent =
                "••••••••";

        if (accountNumber)
            accountNumber.textContent =
                "••••••••••••";

        if (bvn)
            bvn.textContent =
                "••••••••";

        updateVitalButton();

        return;
    }


    if (accountName)
        accountName.textContent =
            installer.accountName || "—";

    if (bank)
        bank.textContent =
            installer.bank || "—";

    if (accountNumber)
        accountNumber.textContent =
            installer.accountNumber || "—";

    if (bvn)
        bvn.textContent =
            installer.bvn || "—";


    updateVitalButton();
}


function unlockVitalInformation() {

    const installer =
        getCurrentInstaller();


    if (!installer) {

        showToast(
            "Open an installer profile first.",
            "warning"
        );

        return;
    }


    const entered =
        window.prompt(
            "Enter installer vital-information passcode:"
        );


    if (entered === null) {
        return;
    }


    if (
        String(entered).trim() !==
        AE.vitalPasscode
    ) {

        AE.vitalUnlocked = false;

        renderInstallerBanking(
            installer
        );

        showToast(
            "Access denied. Incorrect passcode.",
            "error"
        );

        return;
    }


    AE.vitalUnlocked = true;

    renderInstallerBanking(
        installer
    );

    showToast(
        "Vital information unlocked.",
        "success"
    );


    startVitalAutoLock();
}


function lockVitalInformation(
    notify = false
) {

    AE.vitalUnlocked = false;

    clearTimeout(
        AE.vitalTimer
    );


    const installer =
        getCurrentInstaller();


    if (installer) {

        renderInstallerBanking(
            installer
        );

    } else {

        updateVitalButton();

    }


    if (notify) {

        showToast(
            "Vital information locked.",
            "success"
        );

    }
}


function startVitalAutoLock() {

    clearTimeout(
        AE.vitalTimer
    );


    AE.vitalTimer =
        setTimeout(() => {

            lockVitalInformation();

            showToast(
                "Vital information automatically locked.",
                "warning"
            );

        }, 60000);
}


/* =========================================================
   17. INSTALLER REGISTRATION MODAL
========================================================= */

function getInstallerModal() {

    return byId(
        "installerRegistrationModal"
    );

}


function openInstallerRegistration() {

    const modal =
        getInstallerModal();

    if (!modal) {

        showToast(
            "Installer registration modal is missing.",
            "error"
        );

        return;
    }


    const form =
        byId(
            "installerRegistrationForm"
        );


    if (form) {
        form.reset();
    }


    setInstallerID();

    clearInstallerPhoto();


    modal.classList.add("show");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";
}


function closeInstallerRegistration() {

    const modal =
        getInstallerModal();

    if (!modal) return;


    modal.classList.remove(
        "show"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";
}


function setInstallerID() {

    const field =
        byId("installerId");

    if (field) {

        field.value =
            generateInstallerID();

    }
}


/* =========================================================
   18. PHOTO UPLOAD
========================================================= */

function clearInstallerPhoto() {

    const input =
        byId("installerPhoto");

    const preview =
        byId("installerPhotoPreview");


    if (input) {
        input.value = "";
    }


    if (preview) {

        preview.innerHTML =
            "👤";

    }

}


function handleInstallerPhoto(
    event
) {

    const file =
        event.target.files &&
        event.target.files[0];


    if (!file) return;


    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        showToast(
            "Please select a valid image.",
            "error"
        );

        event.target.value = "";

        return;
    }


    const maxSize =
        10 * 1024 * 1024;


    if (file.size > maxSize) {

        showToast(
            "Image is larger than 10MB.",
            "error"
        );

        event.target.value = "";

        return;
    }


    const preview =
        byId(
            "installerPhotoPreview"
        );


    if (!preview) return;


    const reader =
        new FileReader();


    reader.onload =
        event => {

            preview.innerHTML = `

                <img
                    src="${event.target.result}"
                    alt="Installer photo preview"
                >

            `;

        };


    reader.readAsDataURL(
        file
    );

}


/* =========================================================
   19. REGISTRATION FORM
========================================================= */

function getFormValue(
    formData,
    name
) {

    return String(
        formData.get(name) || ""
    ).trim();

}


function handleInstallerRegistration(
    event
) {

    event.preventDefault();


    const form =
        event.currentTarget;


    if (!form) return;


    const formData =
        new FormData(form);


    const name =
        getFormValue(
            formData,
            "fullName"
        );


    if (!name) {

        showToast(
            "Installer full name is required.",
            "error"
        );

        return;
    }


    const photoInput =
        byId("installerPhoto");


    const photoFile =
        photoInput &&
        photoInput.files &&
        photoInput.files[0];


    const installer = {

        id:
            getFormValue(
                formData,
                "installerId"
            ) ||
            generateInstallerID(),

        name,

        initials:
            getInitials(name),

        phone:
            getFormValue(
                formData,
                "phone"
            ),

        email:
            getFormValue(
                formData,
                "email"
            ),

        state:
            getFormValue(
                formData,
                "state"
            ),

        lga:
            getFormValue(
                formData,
                "lga"
            ),

        position:
            getFormValue(
                formData,
                "position"
            ),

        specialization:
            getFormValue(
                formData,
                "specialization"
            ),

        group:
            getFormValue(
                formData,
                "group"
            ),

        experience:
            getFormValue(
                formData,
                "experience"
            ),

        rcNumber:
            getFormValue(
                formData,
                "rcNumber"
            ),

        cacDate:
            getFormValue(
                formData,
                "cacDate"
            ),

        status:
            formData.has("status")
                ? "Active"
                : "Inactive",

        availability:
            "Available",

        projects: 0,

        lastQuotation: "—",

        registrationDate:
            new Date()
                .toLocaleDateString(
                    "en-GB",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    }
                ),

        bank:
            getFormValue(
                formData,
                "bank"
            ),

        accountName:
            getFormValue(
                formData,
                "accountName"
            ) ||
            name,

        accountNumber:
            getFormValue(
                formData,
                "accountNumber"
            ),

        bvn:
            getFormValue(
                formData,
                "bvn"
            ),

        notes:
            getFormValue(
                formData,
                "notes"
            ),

        certificates: [],

        projectsHistory: [],

        photo:
            photoFile
                ? URL.createObjectURL(
                    photoFile
                )
                : null

    };


    /* -----------------------------------------------------
       Certificate files
    ----------------------------------------------------- */

    $$("#installerRegistrationForm input[type='file']")
        .forEach(input => {

            if (
                input ===
                photoInput
            ) {
                return;
            }


            if (
                input.files &&
                input.files[0]
            ) {

                installer.certificates.push(
                    input.files[0].name
                );

            }

        });


    AE.installers.push(
        installer
    );


    renderInstallerDirectory(
        AE.installers
    );


    closeInstallerRegistration();

    showPage(
        "installers"
    );


    showToast(
        `${installer.name} registered successfully.`,
        "success"
    );


    form.reset();

    setInstallerID();

    clearInstallerPhoto();
}


/* =========================================================
   20. CSV EXPORT
========================================================= */

function csvEscape(value) {

    const text =
        String(value ?? "");


    if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
    ) {

        return `"${text.replace(
            /"/g,
            '""'
        )}"`;

    }


    return text;
}


function exportInstallersCSV() {

    if (!AE.installers.length) {

        showToast(
            "No installers available for export.",
            "warning"
        );

        return;
    }


    const headers = [

        "Installer ID",
        "Name",
        "Phone",
        "Email",
        "State",
        "LGA",
        "Position",
        "Specialization",
        "Group",
        "Experience",
        "RC/BN",
        "CAC Date",
        "Status",
        "Availability",
        "Projects",
        "Last Quotation",
        "Registration Date"

    ];


    const rows =
        AE.installers.map(installer => [

            installer.id,
            installer.name,
            installer.phone,
            installer.email,
            installer.state,
            installer.lga,
            installer.position,
            installer.specialization,
            installer.group,
            installer.experience,
            installer.rcNumber,
            installer.cacDate,
            installer.status,
            installer.availability,
            installer.projects,
            installer.lastQuotation,
            installer.registrationDate

        ]);


    const csv =
        [headers, ...rows]
            .map(row =>
                row
                    .map(csvEscape)
                    .join(",")
            )
            .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href = url;

    link.download =
        "AE-Renewable-Installer-Directory.csv";


    document.body.appendChild(
        link
    );


    link.click();

    link.remove();


    URL.revokeObjectURL(
        url
    );


    showToast(
        "Installer directory exported successfully.",
        "success"
    );
}


/* =========================================================
   21. MONITORING DEMO
========================================================= */

function randomNumber(
    min,
    max,
    decimals = 1
) {

    const number =
        Math.random() *
        (max - min) +
        min;

    return Number(
        number.toFixed(decimals)
    );
}


function updateMonitoringValues() {

    const dashboardSolar =
        $(
            "#page-dashboard .energy-number strong"
        );


    if (dashboardSolar) {

        dashboardSolar.textContent =
            randomNumber(
                41.5,
                44.8
            );

    }


    const stats =
        $$(
            "#page-monitoring .monitor-stats strong"
        );


    if (stats.length >= 4) {

        stats[0].innerHTML =
            `${randomNumber(
                17.5,
                19.8
            )} <small>kW</small>`;


        stats[1].innerHTML =
            `${randomNumber(
                10.4,
                12.8
            )} <small>kW</small>`;


        stats[2].innerHTML =
            `${randomNumber(
                79,
                86,
                0
            )} <small>%</small>`;


        stats[3].innerHTML =
            `0.0 <small>kW</small>`;

    }

}


function startMonitoring() {

    clearInterval(
        AE.monitoringTimer
    );


    updateMonitoringValues();


    AE.monitoringTimer =
        setInterval(
            updateMonitoringValues,
            3000
        );
}


function setSystemStatus(
    status
) {

    const element =
        $(
            "#page-monitoring .live-pill"
        );


    if (!element) return;


    const statuses = {

        online: {
            text: "SYSTEM ONLINE",
            background: "#eaf8f0",
            color: "#008000"
        },

        warning: {
            text: "SYSTEM ATTENTION",
            background: "#fff5db",
            color: "#996500"
        },

        offline: {
            text: "SYSTEM OFFLINE",
            background: "#fdecec",
            color: "#b42318"
        }

    };


    const config =
        statuses[
            String(status).toLowerCase()
        ];


    if (!config) return;


    element.innerHTML =
        `<i></i> ${config.text}`;


    element.style.background =
        config.background;

    element.style.color =
        config.color;
}


/* =========================================================
   22. INSTALLER MODAL EVENTS
========================================================= */

function setupInstallerModal() {

    const modal =
        getInstallerModal();


    if (!modal) return;


    const form =
        byId(
            "installerRegistrationForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            handleInstallerRegistration
        );

    }


    const close =
        $(".modal-close", modal);


    if (close) {

        close.addEventListener(
            "click",
            closeInstallerRegistration
        );

    }


    const cancel =
        byId(
            "cancelInstallerRegistration"
        );


    if (cancel) {

        cancel.addEventListener(
            "click",
            closeInstallerRegistration
        );

    }


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeInstallerRegistration();

            }

        }
    );


    const photo =
        byId(
            "installerPhoto"
        );


    if (photo) {

        photo.addEventListener(
            "change",
            handleInstallerPhoto
        );

    }


    $$("#installerRegistrationForm input[type='file']")
        .forEach(input => {

            input.addEventListener(
                "change",
                () => validateFileInput(input)
            );

        });

}


function validateFileInput(
    input
) {

    const file =
        input.files &&
        input.files[0];


    if (!file) return;


    const maxSize =
        10 * 1024 * 1024;


    if (file.size > maxSize) {

        showToast(
            "File is too large. Maximum size is 10MB.",
            "error"
        );

        input.value = "";

        return;
    }


    const label =
        input.closest(
            ".document-upload"
        );


    if (label) {

        const small =
            $("small", label);

        if (small) {
            small.textContent =
                file.name;
        }

    }

}


/* =========================================================
   23. GLOBAL CLICK EVENTS
========================================================= */

function setupGlobalClicks() {

    document.addEventListener(
        "click",
        event => {

            /* Installer profile */

            const profileButton =
                event.target.closest(
                    "[data-installer-id]"
                );


            if (profileButton) {

                const id =
                    profileButton.dataset.installerId;

                if (id) {
                    openInstallerProfile(id);
                }

                return;
            }


            /* Register installer */

            const register =
                event.target.closest(
                    "[data-action='register-installer']"
                );


            if (register) {

                openInstallerRegistration();

                return;
            }


            /* Export */

            const exportButton =
                event.target.closest(
                    "[data-action='export-installers']"
                );


            if (exportButton) {

                exportInstallersCSV();

                return;
            }


            /* Unlock */

            const unlock =
                event.target.closest(
                    "[data-action='unlock-vitals']"
                );


            if (unlock) {

                unlockVitalInformation();

                return;
            }


            /* Lock */

            const lock =
                event.target.closest(
                    "[data-action='lock-vitals']"
                );


            if (lock) {

                lockVitalInformation(true);

                return;
            }


            /* Back */

            const back =
                event.target.closest(
                    "[data-back]"
                );


            if (back) {

                const page =
                    back.dataset.back;

                if (page) {

                    lockVitalInformation();

                    showPage(page);

                }

                return;
            }


            /* Generic backend actions */

            const button =
                event.target.closest(
                    "button"
                );


            if (!button) return;


            const text =
                button.textContent
                    .trim()
                    .toLowerCase();


            const backendActions = [

                "new consultation",
                "add customer",
                "add site",
                "new project",
                "create quotation",
                "add equipment"

            ];


            const matched =
                backendActions.some(
                    action =>
                        text.includes(action)
                );


            if (matched) {

                showToast(
                    "This module is ready for backend connection.",
                    "normal"
                );

            }

        }
    );

}


/* =========================================================
   24. HEADER BUTTONS
========================================================= */

function setupHeaderButtons() {

    const notification =
        $(".icon-btn[title='Notifications']");


    if (notification) {

        notification.addEventListener(
            "click",
            () => {

                showToast(
                    "3 notifications available.",
                    "normal"
                );

            }
        );

    }


    const messages =
        $(".icon-btn[title='Messages']");


    if (messages) {

        messages.addEventListener(
            "click",
            () => {

                showToast(
                    "No new messages.",
                    "normal"
                );

            }
        );

    }


    const profile =
        $(".profile");


    if (profile) {

        profile.addEventListener(
            "click",
            () => {

                showToast(
                    "Administrator profile menu.",
                    "normal"
                );

            }
        );

    }

}


/* =========================================================
   25. RESPONSIVE SUPPORT
========================================================= */

function handleResize() {

    const mobile =
        window.innerWidth <=
        AE.mobileBreakpoint;


    document.body.classList.toggle(
        "mobile-layout",
        mobile
    );

}


function setupResponsive() {

    handleResize();

    window.addEventListener(
        "resize",
        handleResize
    );

}


/* =========================================================
   26. SECURITY
========================================================= */

function setupSecurity() {

    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                document.hidden
            ) {

                lockVitalInformation();

            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Escape"
            ) {
                return;
            }


            const modal =
                getInstallerModal();


            if (
                modal &&
                modal.classList.contains(
                    "show"
                )
            ) {

                closeInstallerRegistration();

            }

        }
    );

}


/* =========================================================
   27. INITIALISE
========================================================= */

function initialiseAEBackend() {

    console.log(
        "AE Renewable ARDE Backend initialising..."
    );


    setupNavigation();

    setupConsultations();

    setupInstallerFilters();

    setupInstallerModal();

    setupGlobalClicks();

    setupHeaderButtons();

    setupResponsive();

    setupSecurity();


    renderInstallerDirectory(
        AE.installers
    );


    setInstallerID();

    lockVitalInformation();

    startMonitoring();


    showPage(
        "dashboard"
    );


    console.log(
        "AE Renewable ARDE Backend ready."
    );

}


/* =========================================================
   28. START APPLICATION
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialiseAEBackend
    );

} else {

    initialiseAEBackend();

}


/* =========================================================
   29. GLOBAL API
   Allows existing inline HTML onclick handlers
   to continue working.
========================================================= */

window.showPage =
    showPage;

window.openDetail =
    openDetail;

window.showToast =
    showToast;

window.setSystemStatus =
    setSystemStatus;

window.openInstallerRegistration =
    openInstallerRegistration;

window.closeInstallerRegistration =
    closeInstallerRegistration;

window.openInstallerProfile =
    openInstallerProfile;

window.renderInstallerDirectory =
    renderInstallerDirectory;

window.applyInstallerFilters =
    applyInstallerFilters;

window.exportInstallersCSV =
    exportInstallersCSV;

window.unlockVitalInformation =
    unlockVitalInformation;

window.lockVitalInformation =
    lockVitalInformation;

window.setInstallerID =
    setInstallerID;

window.AE =
    AE;

